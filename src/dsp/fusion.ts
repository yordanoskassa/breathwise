/**
 * Every ~second the engine asks: which cells are breathing, and at what rate?
 *
 * 1. Each cell's band-passed trace gets a power spectrum.
 * 2. Cells vote for a dominant frequency, weighted by how peaky (periodic)
 *    their spectrum is — flat, noisy cells barely count.
 * 3. Cells that agree with the winning frequency are fused with PCA into one
 *    clean respiration waveform. PCA also sorts out sign: an edge moving up
 *    brightens one cell and darkens its neighbour.
 */
import { bandBins, bandPeak, interpolatePeak, nextPow2, powerSpectrum } from './spectrum.ts';

export type FusionConfig = {
  sampleRate: number;
  lowHz: number;
  highHz: number;
  maxCells: number;
};

export type CellStat = { freq: number; concentration: number; std: number };

export type FusionResult = {
  /** Dominant breathing frequency (Hz) of the fused signal, or 0 if none. */
  freq: number;
  /** Periodicity of the fused signal, 0..1. Drives lock-on and confidence. */
  quality: number;
  /** Per-cell stream weight (0 for unused cells), sign-aligned. */
  weights: Float64Array;
  /** Per-cell "is breathing here" strength, 0..1 — the heatmap. */
  heat: Float64Array;
  selected: number[];
};

const MIN_STD = 0.03;

export function analyzeCells(
  traces: Float64Array[],
  cfg: FusionConfig,
  prevWeights: Float64Array | null,
): FusionResult {
  const cells = traces.length;
  const n = traces[0]?.length ?? 0;
  const empty: FusionResult = {
    freq: 0,
    quality: 0,
    weights: new Float64Array(cells),
    heat: new Float64Array(cells),
    selected: [],
  };
  if (n < 16) return empty;

  const size = nextPow2(Math.max(256, n * 2));
  const { lo, hi, hzPerBin } = bandBins(size, cfg.sampleRate, cfg.lowHz, cfg.highHz);
  const votes = new Float64Array(hi + 1);
  const stats: (CellStat | null)[] = new Array(cells).fill(null);

  for (let c = 0; c < cells; c++) {
    const std = stdOf(traces[c]);
    if (std < MIN_STD) continue;
    const p = powerSpectrum(traces[c], size);
    const peak = bandPeak(p, lo, hi, hzPerBin);
    stats[c] = { freq: peak.freq, concentration: peak.concentration, std };
    if (peak.bandPower <= 0) continue;
    const w = (peak.concentration * peak.concentration) / peak.bandPower;
    for (let k = lo; k <= hi; k++) votes[k] += w * p[k];
  }

  let best = lo;
  for (let k = lo; k <= hi; k++) if (votes[k] > votes[best]) best = k;
  if (votes[best] <= 0) return empty;
  // A breath that isn't a pure sine puts energy at 2×f. If half the winning
  // frequency is also strongly voted, the real rate is the lower one.
  const halfBin = Math.round(best / 2);
  if (halfBin >= lo && maxAround(votes, halfBin, 1) >= 0.6 * votes[best]) best = halfBin;
  const target = interpolatePeak(votes, best) * hzPerBin;
  // Real breathing makes many cells agree on one frequency; sensor noise
  // scatters its votes across the band. Gate lock-on on that agreement.
  let voteTotal = 0;
  let voteNear = 0;
  for (let k = lo; k <= hi; k++) {
    voteTotal += votes[k];
    if (Math.abs(k - best) <= 2) voteNear += votes[k];
  }
  const agreement = voteTotal > 0 ? voteNear / voteTotal : 0;

  const tolerance = Math.max(0.06, target * 0.12);
  const candidates: number[] = [];
  for (let c = 0; c < cells; c++) {
    const s = stats[c];
    if (!s || s.concentration < 0.22) continue;
    if (Math.abs(s.freq - target) <= tolerance) candidates.push(c);
  }
  candidates.sort((a, b) => stats[b]!.concentration - stats[a]!.concentration);
  const selected = candidates.slice(0, cfg.maxCells);

  const heat = new Float64Array(cells);
  for (let c = 0; c < cells; c++) {
    const s = stats[c];
    if (!s) continue;
    const agree = Math.abs(s.freq - target) <= tolerance ? 1 : 0.25;
    heat[c] = clamp01((s.concentration - 0.12) / 0.55) * agree;
  }
  if (selected.length === 0) return { ...empty, heat };

  // Z-normalise the chosen cells, then PCA → one fused respiration trace.
  const z = selected.map((c) => zNormalize(traces[c]));
  const v = firstPrincipalComponent(z);
  const fused = new Float64Array(n);
  for (let k = 0; k < z.length; k++) {
    const zk = z[k];
    for (let i = 0; i < n; i++) fused[i] += v[k] * zk[i];
  }
  const fusedStd = stdOf(fused) || 1;

  const weights = new Float64Array(cells);
  for (let k = 0; k < selected.length; k++) {
    const c = selected[k];
    weights[c] = v[k] / (stats[c]!.std * fusedStd);
  }
  if (prevWeights && dot(weights, prevWeights) < 0) {
    for (let c = 0; c < cells; c++) weights[c] = -weights[c];
  }

  const fusedPeak = bandPeak(powerSpectrum(fused, size), lo, hi, hzPerBin);
  let maxAbs = 0;
  for (const x of v) maxAbs = Math.max(maxAbs, Math.abs(x));
  for (let k = 0; k < selected.length; k++) {
    const c = selected[k];
    heat[c] = Math.max(heat[c], 0.45 + 0.55 * (Math.abs(v[k]) / (maxAbs || 1)));
  }

  return {
    freq: fusedPeak.freq,
    quality:
      fusedPeak.concentration *
      Math.min(1, selected.length / 3) *
      clamp01((agreement - 0.3) / 0.3),
    weights,
    heat,
    selected,
  };
}

/** Power iteration on the (implicit) covariance of z-normalised rows. */
export function firstPrincipalComponent(rows: Float64Array[]): Float64Array {
  const k = rows.length;
  const n = rows[0].length;
  const cov = new Float64Array(k * k);
  for (let a = 0; a < k; a++) {
    for (let b = a; b < k; b++) {
      let s = 0;
      const ra = rows[a];
      const rb = rows[b];
      for (let i = 0; i < n; i++) s += ra[i] * rb[i];
      cov[a * k + b] = s / n;
      cov[b * k + a] = s / n;
    }
  }
  let v = new Float64Array(k).fill(1 / Math.sqrt(k));
  // Seed with the strongest row's correlations so sign is stable.
  for (let j = 0; j < k; j++) v[j] = cov[j] || 1e-6;
  for (let iter = 0; iter < 40; iter++) {
    const next = new Float64Array(k);
    for (let a = 0; a < k; a++) {
      let s = 0;
      for (let b = 0; b < k; b++) s += cov[a * k + b] * v[b];
      next[a] = s;
    }
    const norm = Math.hypot(...next) || 1;
    for (let a = 0; a < k; a++) next[a] /= norm;
    v = next;
  }
  return v;
}

export function stdOf(x: ArrayLike<number>): number {
  const n = x.length;
  if (n === 0) return 0;
  let m = 0;
  for (let i = 0; i < n; i++) m += x[i];
  m /= n;
  let s = 0;
  for (let i = 0; i < n; i++) s += (x[i] - m) * (x[i] - m);
  return Math.sqrt(s / n);
}

function zNormalize(x: Float64Array): Float64Array {
  const n = x.length;
  let m = 0;
  for (let i = 0; i < n; i++) m += x[i];
  m /= n;
  const sd = stdOf(x) || 1;
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) out[i] = (x[i] - m) / sd;
  return out;
}

function maxAround(x: Float64Array, k: number, r: number): number {
  let m = 0;
  for (let i = Math.max(0, k - r); i <= Math.min(x.length - 1, k + r); i++) m = Math.max(m, x[i]);
  return m;
}

function dot(a: Float64Array, b: Float64Array): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}
