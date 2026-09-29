/**
 * Second-order IIR sections (RBJ cookbook, Butterworth Q) in Direct Form II
 * Transposed. Used to band-pass every grid cell's brightness trace down to
 * the breathing band before spectral analysis.
 */

export type BiquadCoeffs = { b0: number; b1: number; b2: number; a1: number; a2: number };

const BUTTERWORTH_Q = Math.SQRT1_2;

export function lowPassCoeffs(cutoffHz: number, sampleRate: number): BiquadCoeffs {
  const w0 = (2 * Math.PI * cutoffHz) / sampleRate;
  const alpha = Math.sin(w0) / (2 * BUTTERWORTH_Q);
  const cos = Math.cos(w0);
  const a0 = 1 + alpha;
  return {
    b0: (1 - cos) / 2 / a0,
    b1: (1 - cos) / a0,
    b2: (1 - cos) / 2 / a0,
    a1: (-2 * cos) / a0,
    a2: (1 - alpha) / a0,
  };
}

export function highPassCoeffs(cutoffHz: number, sampleRate: number): BiquadCoeffs {
  const w0 = (2 * Math.PI * cutoffHz) / sampleRate;
  const alpha = Math.sin(w0) / (2 * BUTTERWORTH_Q);
  const cos = Math.cos(w0);
  const a0 = 1 + alpha;
  return {
    b0: (1 + cos) / 2 / a0,
    b1: -(1 + cos) / a0,
    b2: (1 + cos) / 2 / a0,
    a1: (-2 * cos) / a0,
    a2: (1 - alpha) / a0,
  };
}

/** DC gain of a section, used to start it in steady state (no start-up ringing). */
function dcGain(c: BiquadCoeffs): number {
  return (c.b0 + c.b1 + c.b2) / (1 + c.a1 + c.a2);
}

/**
 * A bank of identical band-pass filters (high-pass then low-pass), one per
 * channel, stored in flat typed arrays so hundreds of cells stay cheap.
 */
export class BandPassBank {
  readonly channels: number;
  private hp: BiquadCoeffs;
  private lp: BiquadCoeffs;
  private hz1: Float64Array;
  private hz2: Float64Array;
  private lz1: Float64Array;
  private lz2: Float64Array;

  constructor(channels: number, lowHz: number, highHz: number, sampleRate: number) {
    this.channels = channels;
    this.hp = highPassCoeffs(lowHz, sampleRate);
    this.lp = lowPassCoeffs(highHz, sampleRate);
    this.hz1 = new Float64Array(channels);
    this.hz2 = new Float64Array(channels);
    this.lz1 = new Float64Array(channels);
    this.lz2 = new Float64Array(channels);
  }

  /** Put one channel in steady state for a constant input `x0`. */
  resetChannel(ch: number, x0: number): void {
    const hp = this.hp;
    const yHp = x0 * dcGain(hp); // 0 for a high-pass
    this.hz2[ch] = hp.b2 * x0 - hp.a2 * yHp;
    this.hz1[ch] = yHp - hp.b0 * x0;
    const lp = this.lp;
    const yLp = yHp * dcGain(lp);
    this.lz2[ch] = lp.b2 * yHp - lp.a2 * yLp;
    this.lz1[ch] = yLp - lp.b0 * yHp;
  }

  resetAll(values: ArrayLike<number>): void {
    for (let ch = 0; ch < this.channels; ch++) this.resetChannel(ch, values[ch]);
  }

  /** Filters one sample per channel; writes results into `out`. */
  process(input: ArrayLike<number>, out: Float64Array): void {
    const hp = this.hp;
    const lp = this.lp;
    for (let ch = 0; ch < this.channels; ch++) {
      const x = input[ch];
      const h = hp.b0 * x + this.hz1[ch];
      this.hz1[ch] = hp.b1 * x - hp.a1 * h + this.hz2[ch];
      this.hz2[ch] = hp.b2 * x - hp.a2 * h;
      const y = lp.b0 * h + this.lz1[ch];
      this.lz1[ch] = lp.b1 * h - lp.a1 * y + this.lz2[ch];
      this.lz2[ch] = lp.b2 * h - lp.a2 * y;
      out[ch] = y;
    }
  }
}
