/**
 * Renders a synthetic "sleeping child under a patterned blanket" luma frame.
 * The chest region rises and falls a pixel or two per breath — about what a
 * phone camera sees from 50 cm away. Used by the accuracy tests and by the
 * simulator demo source (the iOS Simulator has no camera).
 */

export type SceneOptions = {
  width: number;
  height: number;
  rateBpm: number;
  /** Peak chest displacement in pixels. */
  amplitudePx: number;
  /** Per-pixel sensor noise (std, luma levels). */
  noise: number;
  /** 0..1 slow wandering of the breathing rate. */
  irregularity: number;
  /** Whole-scene jolts: [startSec, durationSec, shiftPx]. */
  bumps: [number, number, number][];
  seed: number;
};

export const DEFAULT_SCENE: SceneOptions = {
  width: 96,
  height: 128,
  rateBpm: 30,
  amplitudePx: 1.5,
  noise: 2,
  irregularity: 0.08,
  bumps: [],
  seed: 7,
};

export class SyntheticScene {
  readonly opts: SceneOptions;
  private rand: () => number;
  private phase = 0;
  private lastT = 0;

  constructor(opts: Partial<SceneOptions> = {}) {
    this.opts = { ...DEFAULT_SCENE, ...opts };
    this.rand = mulberry32(this.opts.seed);
  }

  /** Chest displacement (px) at time t; call with increasing t. */
  displacement(t: number): number {
    const o = this.opts;
    const dt = Math.max(0, t - this.lastT);
    this.lastT = t;
    const f = (o.rateBpm / 60) * (1 + o.irregularity * Math.sin(2 * Math.PI * 0.04 * t));
    this.phase += 2 * Math.PI * f * dt;
    // Inhale a bit quicker than exhale, like real breathing.
    const s = Math.sin(this.phase);
    return o.amplitudePx * 0.5 * (1 - Math.cos(this.phase + 0.35 * s));
  }

  render(t: number, out?: Uint8Array): Uint8Array {
    const { width: w, height: h, noise, bumps } = this.opts;
    const buf = out ?? new Uint8Array(w * h);
    const d = this.displacement(t);
    let jx = 0;
    let jy = 0;
    for (const [start, dur, px] of bumps) {
      if (t >= start && t < start + dur) {
        jx = px * Math.sin(t * 23);
        jy = px * Math.cos(t * 17);
      }
    }
    const cx = w * 0.5;
    const cy = h * 0.6;
    const rx = w * 0.36;
    const ry = h * 0.24;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const sx = x + jx;
        const sy0 = y + jy;
        // Chest lift is strongest at its centre, fading to the edges.
        const gx = (sx - cx) / rx;
        const gy = (sy0 - cy) / ry;
        const lift = d * Math.exp(-(gx * gx + gy * gy) * 1.2);
        const sy = sy0 + lift;
        const ex = (sx - cx) / rx;
        const ey = (sy - cy) / ry;
        let v: number;
        if (ex * ex + ey * ey <= 1) {
          v = 128 + 38 * Math.sin(0.55 * sy + 0.9 * Math.sin(0.08 * sx)) + 18 * Math.sin(0.23 * sx - 0.11 * sy);
        } else {
          v = 70 + 14 * Math.sin(0.09 * sx + 0.05 * sy) + 9 * Math.sin(0.31 * sx * 0.3 - 0.17 * sy);
        }
        v += noise * gaussian(this.rand);
        buf[y * w + x] = v < 0 ? 0 : v > 255 ? 255 : v;
      }
    }
    return buf;
  }
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rand: () => number): number {
  const u = Math.max(rand(), 1e-12);
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
