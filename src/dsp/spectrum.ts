/**
 * Spectral helpers: detrend + Hann window + radix-2 FFT → power spectrum,
 * and peak statistics restricted to the breathing band.
 */

export function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

/** In-place iterative radix-2 FFT. `re`/`im` length must be a power of two. */
export function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      let t = re[i];
      re[i] = re[j];
      re[j] = t;
      t = im[i];
      im[i] = im[j];
      im[j] = t;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      const half = len >> 1;
      for (let k = 0; k < half; k++) {
        const ar = re[i + k + half] * cr - im[i + k + half] * ci;
        const ai = re[i + k + half] * ci + im[i + k + half] * cr;
        re[i + k + half] = re[i + k] - ar;
        im[i + k + half] = im[i + k] - ai;
        re[i + k] += ar;
        im[i + k] += ai;
        const nr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = nr;
      }
    }
  }
}

/** Removes the least-squares line so slow drift doesn't leak into the band. */
export function detrend(x: ArrayLike<number>): Float64Array {
  const n = x.length;
  const out = new Float64Array(n);
  if (n < 2) return out;
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < n; i++) {
    sx += i;
    sy += x[i];
    sxx += i * i;
    sxy += i * x[i];
  }
  const denom = n * sxx - sx * sx;
  const slope = denom === 0 ? 0 : (n * sxy - sx * sy) / denom;
  const icpt = (sy - slope * sx) / n;
  for (let i = 0; i < n; i++) out[i] = x[i] - (icpt + slope * i);
  return out;
}

/** Power spectrum (bins 0..N/2) of a detrended, Hann-windowed, zero-padded signal. */
export function powerSpectrum(x: ArrayLike<number>, fftSize: number): Float64Array {
  const n = x.length;
  const d = detrend(x);
  const re = new Float64Array(fftSize);
  const im = new Float64Array(fftSize);
  for (let i = 0; i < n && i < fftSize; i++) {
    const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / Math.max(1, n - 1));
    re[i] = d[i] * w;
  }
  fft(re, im);
  const half = fftSize >> 1;
  const p = new Float64Array(half + 1);
  for (let k = 0; k <= half; k++) p[k] = re[k] * re[k] + im[k] * im[k];
  return p;
}

export type BandPeak = {
  /** Peak frequency in Hz (parabolic-interpolated). */
  freq: number;
  /** Fraction of in-band power within ±`halfWidth` bins of the peak (0..1). */
  concentration: number;
  /** Total in-band power. */
  bandPower: number;
  bin: number;
};

export function bandBins(fftSize: number, sampleRate: number, lowHz: number, highHz: number) {
  const hzPerBin = sampleRate / fftSize;
  return {
    lo: Math.max(1, Math.ceil(lowHz / hzPerBin)),
    hi: Math.min(fftSize >> 1, Math.floor(highHz / hzPerBin)),
    hzPerBin,
  };
}

/**
 * Peak window: ±8% of the peak frequency (at least ±2 bins). Real breathing
 * wanders a few breaths/min within a window, so a fixed ±2-bin window would
 * call a perfectly good but slightly irregular rhythm "noisy".
 */
export function peakHalfWidth(bin: number): number {
  return Math.max(2, Math.round(bin * 0.08));
}

export function bandPeak(p: Float64Array, lo: number, hi: number, hzPerBin: number): BandPeak {
  let best = lo;
  let total = 0;
  for (let k = lo; k <= hi; k++) {
    total += p[k];
    if (p[k] > p[best]) best = k;
  }
  const halfWidth = peakHalfWidth(best);
  let near = 0;
  for (let k = Math.max(lo, best - halfWidth); k <= Math.min(hi, best + halfWidth); k++) near += p[k];
  return {
    freq: interpolatePeak(p, best) * hzPerBin,
    concentration: total > 0 ? near / total : 0,
    bandPower: total,
    bin: best,
  };
}

/** Sub-bin peak location via a parabola through the peak and its neighbours. */
export function interpolatePeak(p: ArrayLike<number>, k: number): number {
  if (k <= 0 || k >= p.length - 1) return k;
  const a = p[k - 1];
  const b = p[k];
  const c = p[k + 1];
  const denom = a - 2 * b + c;
  if (denom === 0) return k;
  const delta = (0.5 * (a - c)) / denom;
  return k + Math.max(-0.5, Math.min(0.5, delta));
}
