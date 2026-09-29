/**
 * One measurement, WHO-style: find the breathing, then count breaths over 60
 * seconds of *valid* time. The clock pauses while the child wriggles or the
 * signal drops out, instead of silently counting garbage.
 */
import { BreathEngine, type EngineConfig } from './engine.ts';
import { bandBins, bandPeak, nextPow2, powerSpectrum } from './spectrum.ts';

export type SessionPhase = 'searching' | 'counting' | 'done';
export type PauseReason = 'motion' | 'signal' | null;

export type SessionSnapshot = {
  phase: SessionPhase;
  locked: boolean;
  motion: boolean;
  pauseReason: PauseReason;
  /** Valid counting seconds so far. */
  counted: number;
  target: number;
  breaths: number;
  /** Live spectral estimate, breaths/min (null before first analysis). */
  liveRate: number | null;
  quality: number;
  searchSeconds: number;
  heat: Float64Array;
  /** Most recent fused samples for the live waveform (oldest first). */
  wave: number[];
  /** Indices into `wave` where breaths were detected. */
  waveBreaths: number[];
};

export type SessionResult = {
  rate: number;
  countedBreaths: number;
  countedSeconds: number;
  spectralRate: number;
  ibiRate: number | null;
  confidence: number;
  confidenceLabel: 'high' | 'medium' | 'low';
  corrected: boolean;
  motionFraction: number;
  /** Fused waveform over the counting window at `waveRate` Hz. */
  wave: number[];
  waveRate: number;
  /** Breath times in seconds from the start of `wave`. */
  breathTimes: number[];
};

const WAVE_SECONDS = 10;

export class MeasureSession {
  readonly engine: BreathEngine;
  readonly target: number;
  private phase: SessionPhase = 'searching';
  private counted = 0;
  private breaths = 0;
  private searchSeconds = 0;
  private qualitySum = 0;
  private qualityN = 0;
  private motionSamples = 0;
  private totalSamples = 0;
  private rec: number[] = [];
  private recT: number[] = [];
  private recBreathIdx: number[] = [];
  private wave: number[] = [];
  private waveT: number[] = [];
  private waveBreathT: number[] = [];

  constructor(cells: number, target = 60, overrides: Partial<EngineConfig> = {}) {
    this.engine = new BreathEngine(cells, overrides);
    this.target = target;
  }

  /** Returns true for each call that produced a newly counted breath. */
  pushFrame(t: number, grid: ArrayLike<number>): { newBreath: boolean } {
    if (this.phase === 'done') return { newBreath: false };
    const upd = this.engine.pushFrame(t, grid);
    const dt = 1 / this.engine.cfg.sampleRate;
    let newBreath = false;

    for (const s of upd.samples) {
      this.wave.push(s.value);
      this.waveT.push(s.t);
      if (this.phase === 'searching') {
        this.searchSeconds += dt;
        if (s.locked) this.phase = 'counting';
      }
      if (this.phase === 'counting') {
        this.totalSamples++;
        if (s.motion) this.motionSamples++;
        if (s.locked && !s.motion) {
          this.counted += dt;
          this.rec.push(s.value);
          this.recT.push(s.t);
          this.qualitySum += this.engine.quality;
          this.qualityN++;
        }
        if (this.counted >= this.target) this.phase = 'done';
      }
    }
    const maxWave = WAVE_SECONDS * this.engine.cfg.sampleRate;
    if (this.wave.length > maxWave) {
      const drop = this.wave.length - maxWave;
      this.wave.splice(0, drop);
      this.waveT.splice(0, drop);
    }

    for (const b of upd.breaths) {
      this.waveBreathT.push(b.t);
      if (this.phase !== 'searching' && this.recT.length > 0 && b.t >= this.recT[0]) {
        this.breaths++;
        this.recBreathIdx.push(nearestIndex(this.recT, b.t));
        newBreath = true;
      }
    }
    const oldest = this.waveT[0] ?? 0;
    while (this.waveBreathT.length && this.waveBreathT[0] < oldest) this.waveBreathT.shift();
    return { newBreath };
  }

  snapshot(): SessionSnapshot {
    const e = this.engine;
    const pauseReason: PauseReason =
      this.phase !== 'counting' ? null : e.motion ? 'motion' : !e.locked ? 'signal' : null;
    return {
      phase: this.phase,
      locked: e.locked,
      motion: e.motion,
      pauseReason,
      counted: Math.min(this.counted, this.target),
      target: this.target,
      breaths: this.breaths,
      liveRate: e.freq > 0 ? e.freq * 60 : null,
      quality: e.quality,
      searchSeconds: this.searchSeconds,
      heat: e.heat,
      wave: this.wave.slice(),
      waveBreaths: this.waveBreathT.map((t) => nearestIndex(this.waveT, t)),
    };
  }

  result(): SessionResult {
    const fs = this.engine.cfg.sampleRate;
    const seconds = Math.max(this.counted, 1e-6);
    const countRate = (this.breaths / seconds) * 60;

    const size = nextPow2(Math.max(1024, this.rec.length * 4));
    const { lo, hi, hzPerBin } = bandBins(size, fs, this.engine.cfg.lowHz, this.engine.cfg.highHz);
    const peak = this.rec.length > 16 ? bandPeak(powerSpectrum(this.rec, size), lo, hi, hzPerBin) : null;
    const spectralRate = peak ? peak.freq * 60 : countRate;

    const ibis: number[] = [];
    for (let i = 1; i < this.recBreathIdx.length; i++) {
      const gap = this.recT[this.recBreathIdx[i]] - this.recT[this.recBreathIdx[i - 1]];
      const idxGap = this.recBreathIdx[i] - this.recBreathIdx[i - 1];
      if (Math.abs(gap - idxGap / fs) < 0.25) ibis.push(gap); // skip across pauses
    }
    const ibiRate = ibis.length >= 3 ? 60 / median(ibis) : null;

    const agreement = spectralRate > 0 ? 1 - Math.abs(countRate - spectralRate) / spectralRate : 0;
    let rate = countRate;
    let corrected = false;
    if (agreement < 0.85 && ibiRate && Math.abs(ibiRate - spectralRate) / spectralRate < 0.1) {
      rate = spectralRate;
      corrected = true;
    }
    const motionFraction = this.totalSamples ? this.motionSamples / this.totalSamples : 0;
    const avgQuality = this.qualityN ? this.qualitySum / this.qualityN : 0;
    const agreeScore = clamp01((Math.max(agreement, corrected ? 0.9 : 0) - 0.75) / 0.2);
    const confidence = clamp01((0.45 * clamp01(avgQuality / 0.7) + 0.55 * agreeScore) * (1 - 0.5 * motionFraction));

    return {
      rate: Math.round(rate),
      countedBreaths: this.breaths,
      countedSeconds: this.counted,
      spectralRate,
      ibiRate,
      confidence,
      confidenceLabel: confidence >= 0.7 ? 'high' : confidence >= 0.45 ? 'medium' : 'low',
      corrected,
      motionFraction,
      wave: this.rec.slice(),
      waveRate: fs,
      breathTimes: this.recBreathIdx.map((i) => i / fs),
    };
  }
}

/** Result for a manual tap count (WHO standard fallback). */
export function tapResult(tapTimes: number[], seconds: number): Pick<SessionResult, 'rate' | 'countedBreaths' | 'countedSeconds'> {
  return {
    rate: Math.round((tapTimes.length / Math.max(seconds, 1e-6)) * 60),
    countedBreaths: tapTimes.length,
    countedSeconds: seconds,
  };
}

function nearestIndex(times: number[], t: number): number {
  let lo = 0;
  let hi = times.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (times[mid] < t) lo = mid + 1;
    else hi = mid;
  }
  if (lo > 0 && Math.abs(times[lo - 1] - t) < Math.abs(times[lo] - t)) return lo - 1;
  return lo;
}

function median(values: number[]): number {
  const s = values.slice().sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : 0.5 * (s[m - 1] + s[m]);
}

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}
