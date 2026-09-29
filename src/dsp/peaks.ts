/**
 * Streaming breath detector on the fused, normalised respiration signal.
 * Hysteresis (a peak only counts once the signal has fallen a fraction of the
 * recent breath depth) plus a refractory gap tied to the expected period
 * keeps noise wiggles from being double-counted.
 */

export type Breath = { t: number; depth: number };

export class PeakTracker {
  private lookingForPeak = true;
  private ext = 0;
  private extT = 0;
  private lastTrough = 0;
  private lastPeakT = -Infinity;
  private depth = 2;
  private started = false;

  reset(): void {
    this.lookingForPeak = true;
    this.started = false;
    this.depth = 2;
    this.lastPeakT = -Infinity;
  }

  /** Returns a Breath when a peak is confirmed on this sample. */
  update(t: number, x: number, expectedPeriod: number): Breath | null {
    if (!this.started) {
      this.started = true;
      this.ext = x;
      this.extT = t;
      this.lastTrough = x;
      return null;
    }
    const h = 0.35 * this.depth;
    if (this.lookingForPeak) {
      if (x > this.ext) {
        this.ext = x;
        this.extT = t;
      } else if (this.ext - x > h) {
        const depth = this.ext - this.lastTrough;
        const minGap = Math.max(0.3, 0.55 * expectedPeriod);
        let breath: Breath | null = null;
        if (this.extT - this.lastPeakT >= minGap && depth > 0.25 * this.depth) {
          breath = { t: this.extT, depth };
          this.lastPeakT = this.extT;
          this.depth = 0.8 * this.depth + 0.2 * Math.min(depth, 3 * this.depth);
        }
        this.lookingForPeak = false;
        this.ext = x;
        this.extT = t;
        return breath;
      }
    } else if (x < this.ext) {
      this.ext = x;
      this.extT = t;
    } else if (x - this.ext > h) {
      this.lastTrough = this.ext;
      this.lookingForPeak = true;
      this.ext = x;
      this.extT = t;
    }
    return null;
  }
}

/** Offline version over a whole recording, for tests and the result chart. */
export function detectBreaths(
  samples: ArrayLike<number>,
  sampleRate: number,
  expectedPeriod: number,
): Breath[] {
  const tracker = new PeakTracker();
  const out: Breath[] = [];
  for (let i = 0; i < samples.length; i++) {
    const b = tracker.update(i / sampleRate, samples[i], expectedPeriod);
    if (b) out.push(b);
  }
  return out;
}
