/**
 * Streaming core: raw grid frames in → uniformly-sampled, band-passed cell
 * traces → periodic fusion/lock-on → fused respiration samples + breaths out.
 */
import { BandPassBank } from './filters.ts';
import { analyzeCells } from './fusion.ts';
import { type Breath, PeakTracker } from './peaks.ts';

export type EngineConfig = {
  cells: number;
  sampleRate: number;
  lowHz: number;
  highHz: number;
  windowSec: number;
  warmupSec: number;
  analyzeEverySec: number;
  maxCells: number;
  lockQuality: number;
  unlockQuality: number;
};

export const DEFAULT_ENGINE_CONFIG: Omit<EngineConfig, 'cells'> = {
  sampleRate: 10,
  lowHz: 0.13,
  highHz: 1.8,
  windowSec: 16,
  warmupSec: 6,
  analyzeEverySec: 1,
  maxCells: 16,
  lockQuality: 0.42,
  unlockQuality: 0.2,
};

export type EngineSample = { t: number; value: number; motion: boolean; locked: boolean };
export type EngineUpdate = { samples: EngineSample[]; breaths: Breath[] };

const MOTION_HOLD_SEC = 0.8;

export class BreathEngine {
  readonly cfg: EngineConfig;
  locked = false;
  /** Smoothed breathing frequency in Hz (0 until first analysis). */
  freq = 0;
  quality = 0;
  motion = false;
  heat: Float64Array;

  private filters: BandPassBank;
  private ring: Float64Array;
  private ringLen: number;
  private head = 0;
  private filled = 0;
  private weights: Float64Array;
  private selected: number[] = [];
  private peaks = new PeakTracker();
  private sinceAnalysis = 0;
  private goodRuns = 0;
  private badRuns = 0;

  private lastRaw: Float64Array | null = null;
  private lastRawT = 0;
  private nextSampleT = 0;
  private motionUntil = -Infinity;
  private settleUntil = -Infinity;
  private motionBaseline = -1;
  private filtered: Float64Array;
  private scratch: Float64Array;
  private diffs: number[];
  private normalized: Float64Array;
  private meanLevel = -1;
  private meanT = 0;

  constructor(cells: number, overrides: Partial<EngineConfig> = {}) {
    this.cfg = { ...DEFAULT_ENGINE_CONFIG, cells, ...overrides };
    const c = this.cfg;
    this.filters = new BandPassBank(cells, c.lowHz, c.highHz, c.sampleRate);
    this.ringLen = Math.round(c.windowSec * c.sampleRate);
    this.ring = new Float64Array(cells * this.ringLen);
    this.weights = new Float64Array(cells);
    this.heat = new Float64Array(cells);
    this.filtered = new Float64Array(cells);
    this.scratch = new Float64Array(cells);
    this.diffs = new Array(cells).fill(0);
    this.normalized = new Float64Array(cells);
  }

  /** Feed one camera frame's grid. `t` is in seconds (any origin). */
  pushFrame(t: number, rawGrid: ArrayLike<number>): EngineUpdate {
    const out: EngineUpdate = { samples: [], breaths: [] };
    const cells = this.cfg.cells;
    const grid = this.normalizeIllumination(t, rawGrid);
    if (!this.lastRaw || t - this.lastRawT > 1.5 || t <= this.lastRawT) {
      this.restart(t, grid);
      return out;
    }

    const wasMotion = this.motion;
    this.detectMotion(t, grid);
    if (wasMotion && !this.motion) {
      // Scene may have shifted: restart filters at the new brightness levels
      // so the step doesn't ring through the high-pass for seconds, and keep
      // the clock paused for about one breath while the detector re-syncs.
      this.filters.resetAll(grid);
      this.peaks.reset();
      this.settleUntil = t + Math.max(1.2, this.freq > 0 ? 1 / this.freq : 0);
    }

    const dt = 1 / this.cfg.sampleRate;
    const prev = this.lastRaw;
    const span = t - this.lastRawT;
    while (this.nextSampleT <= t) {
      const a = (this.nextSampleT - this.lastRawT) / span;
      for (let c = 0; c < cells; c++) this.scratch[c] = prev[c] + a * (grid[c] - prev[c]);
      this.processSample(this.nextSampleT, this.scratch, out);
      this.nextSampleT += dt;
    }
    for (let c = 0; c < cells; c++) prev[c] = grid[c];
    this.lastRawT = t;
    return out;
  }

  /**
   * Divide out slow whole-frame brightness drift (auto-exposure, dusk) using
   * a ~4 s moving average of the frame mean. Using the instantaneous mean
   * would leak the breathing rhythm itself into every cell whenever the
   * chest fills a large part of the frame. Sudden jumps are left to the
   * motion gate.
   */
  private normalizeIllumination(t: number, grid: ArrayLike<number>): Float64Array {
    const out = this.normalized;
    let mean = 0;
    for (let c = 0; c < this.cfg.cells; c++) mean += grid[c];
    mean /= this.cfg.cells;
    if (this.meanLevel < 0 || t <= this.meanT || t - this.meanT > 1.5) {
      this.meanLevel = mean;
    } else {
      this.meanLevel += Math.min(1, (t - this.meanT) / 4) * (mean - this.meanLevel);
    }
    this.meanT = t;
    const k = this.meanLevel > 1 ? 128 / this.meanLevel : 1;
    for (let c = 0; c < this.cfg.cells; c++) out[c] = grid[c] * k;
    return out;
  }

  private restart(t: number, grid: ArrayLike<number>): void {
    this.lastRaw = Float64Array.from(grid as ArrayLike<number>);
    this.lastRawT = t;
    this.nextSampleT = t;
    this.filters.resetAll(grid);
    this.peaks.reset();
    this.motionUntil = -Infinity;
    this.motion = false;
  }

  private detectMotion(t: number, grid: ArrayLike<number>): void {
    const prev = this.lastRaw!;
    for (let c = 0; c < this.cfg.cells; c++) this.diffs[c] = Math.abs(grid[c] - prev[c]);
    // Breathing moves a handful of cells; a bump or a wriggle moves most of
    // them, so the median cell change is a robust whole-scene motion score.
    const d = median(this.diffs);
    if (this.motionBaseline < 0) this.motionBaseline = d;
    const threshold = Math.max(1.2, 4 * this.motionBaseline);
    if (d > threshold) this.motionUntil = t + MOTION_HOLD_SEC;
    else this.motionBaseline = 0.95 * this.motionBaseline + 0.05 * d;
    this.motion = t < this.motionUntil;
  }

  private processSample(t: number, raw: Float64Array, out: EngineUpdate): void {
    const cells = this.cfg.cells;
    const paused = this.motion || t < this.settleUntil;
    if (this.motion) {
      this.filtered.fill(0);
    } else {
      this.filters.process(raw, this.filtered);
    }
    const base = this.head;
    for (let c = 0; c < cells; c++) this.ring[c * this.ringLen + base] = this.filtered[c];
    this.head = (this.head + 1) % this.ringLen;
    this.filled = Math.min(this.filled + 1, this.ringLen);

    let value = 0;
    for (const c of this.selected) value += this.weights[c] * this.filtered[c];
    out.samples.push({ t, value, motion: paused, locked: this.locked });

    if (this.locked && !this.motion && this.freq > 0) {
      const b = this.peaks.update(t, value, 1 / this.freq);
      if (b && !paused) out.breaths.push(b);
    }

    this.sinceAnalysis++;
    const due = this.sinceAnalysis >= this.cfg.analyzeEverySec * this.cfg.sampleRate;
    if (due && this.filled >= this.cfg.warmupSec * this.cfg.sampleRate) {
      this.sinceAnalysis = 0;
      this.analyze();
    }
  }

  private analyze(): void {
    const { cells } = this.cfg;
    const n = this.filled;
    const traces: Float64Array[] = new Array(cells);
    const start = (this.head - n + this.ringLen) % this.ringLen;
    for (let c = 0; c < cells; c++) {
      const tr = new Float64Array(n);
      const off = c * this.ringLen;
      for (let i = 0; i < n; i++) tr[i] = this.ring[off + ((start + i) % this.ringLen)];
      traces[c] = tr;
    }
    const r = analyzeCells(traces, this.cfg, this.weights);
    this.weights = r.weights;
    this.selected = r.selected;
    this.quality = this.quality === 0 ? r.quality : 0.5 * this.quality + 0.5 * r.quality;
    if (r.freq > 0) {
      const jump = this.freq > 0 && Math.abs(r.freq - this.freq) / this.freq > 0.25;
      this.freq = this.freq === 0 || jump ? r.freq : 0.6 * this.freq + 0.4 * r.freq;
    }
    for (let c = 0; c < cells; c++) this.heat[c] = 0.4 * this.heat[c] + 0.6 * r.heat[c];

    if (r.quality >= this.cfg.lockQuality) {
      this.goodRuns++;
      this.badRuns = 0;
    } else if (r.quality < this.cfg.unlockQuality) {
      this.badRuns++;
      this.goodRuns = 0;
    }
    if (!this.locked && this.goodRuns >= 2) {
      this.locked = true;
      this.peaks.reset();
    } else if (this.locked && this.badRuns >= 4) {
      this.locked = false;
    }
  }
}

function median(values: number[]): number {
  const s = values.slice().sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : 0.5 * (s[m - 1] + s[m]);
}
