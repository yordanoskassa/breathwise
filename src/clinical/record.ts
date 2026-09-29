import type { SessionResult } from '@/dsp/session';
import { type Measurement, uid } from '@/store/app';

import { classify, type DangerSign } from './who';

/** Halve the sample rate by averaging pairs — plenty for a chart. */
function downsample(values: number[], factor: number): number[] {
  const out: number[] = [];
  for (let i = 0; i + factor <= values.length; i += factor) {
    let s = 0;
    for (let k = 0; k < factor; k++) s += values[i + k];
    out.push(Math.round((s / factor) * 1000) / 1000);
  }
  return out;
}

export function fromCamera(
  r: SessionResult,
  opts: { childId: string | null; ageMonths: number; verifyTaps: number | null },
): Measurement {
  const factor = 1;
  return {
    id: uid(),
    childId: opts.childId,
    ageMonths: opts.ageMonths,
    at: Date.now(),
    rate: r.rate,
    method: 'camera',
    tone: classify(r.rate, opts.ageMonths).tone,
    confidence: r.confidence,
    confidenceLabel: r.confidenceLabel,
    corrected: r.corrected,
    countedBreaths: r.countedBreaths,
    countedSeconds: r.countedSeconds,
    wave: downsample(r.wave, factor),
    waveRate: r.waveRate / factor,
    breathTimes: r.breathTimes,
    verifyTaps: opts.verifyTaps,
    signs: [],
    saved: false,
  };
}

export function fromTaps(
  taps: number[],
  seconds: number,
  opts: { childId: string | null; ageMonths: number },
): Measurement {
  const rate = Math.round((taps.length / Math.max(seconds, 1)) * 60);
  return {
    id: uid(),
    childId: opts.childId,
    ageMonths: opts.ageMonths,
    at: Date.now(),
    rate,
    method: 'tap',
    tone: classify(rate, opts.ageMonths).tone,
    confidence: null,
    confidenceLabel: null,
    corrected: false,
    countedBreaths: taps.length,
    countedSeconds: seconds,
    wave: [],
    waveRate: 5,
    breathTimes: taps,
    verifyTaps: null,
    signs: [],
    saved: false,
  };
}

export function reclassify(m: Measurement, signs: DangerSign[]): Measurement {
  return { ...m, signs, tone: classify(m.rate, m.ageMonths, signs).tone };
}
