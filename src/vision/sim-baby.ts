/**
 * Simulator-only "sleeping baby" scene, seen from above: head on a quilted
 * mattress, striped blanket, hands resting on top. Breathing gently expands
 * the chest region. The static picture is rendered once; each frame only
 * re-samples the chest, so it stays cheap on the JS thread.
 */

export class BabyScene {
  readonly width: number;
  readonly height: number;
  private base: Float32Array;
  private noise: Float32Array;
  private phase = 0;
  private lastT = 0;
  private frameNo = 0;
  private rateBpm: number;

  constructor(width: number, height: number, rateBpm: number) {
    this.width = width;
    this.height = height;
    this.rateBpm = rateBpm;
    this.base = renderBase(width, height);
    this.noise = new Float32Array(4096);
    let s = 12345;
    for (let i = 0; i < this.noise.length; i++) {
      s = (s * 1103515245 + 12345) >>> 0;
      this.noise[i] = ((s >>> 8) / 16777216 - 0.5) * 3.2;
    }
  }

  render(t: number, out: Uint8Array): void {
    const { width: w, height: h, base } = this;
    const dt = Math.max(0, t - this.lastT);
    this.lastT = t;
    const f = (this.rateBpm / 60) * (1 + 0.06 * Math.sin(2 * Math.PI * 0.05 * t));
    this.phase += 2 * Math.PI * f * dt;
    const lift = 0.5 * (1 - Math.cos(this.phase + 0.3 * Math.sin(this.phase)));

    const cx = w * 0.5;
    const cy = h * 0.55;
    const rx = w * 0.3;
    const ry = h * 0.2;
    const k = 0.028 * lift; // up to ~3% expansion at the chest centre
    const n0 = (this.frameNo++ * 997) % this.noise.length;
    let ni = n0;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const gx = (x - cx) / rx;
        const gy = (y - cy) / ry;
        const g = Math.exp(-(gx * gx + gy * gy) * 1.4);
        let v: number;
        if (g > 0.02) {
          const s = 1 / (1 + k * g);
          v = sample(base, w, h, cx + (x - cx) * s, cy + (y - cy) * s);
        } else {
          v = base[i];
        }
        v += this.noise[ni];
        ni = ni + 1 === this.noise.length ? 0 : ni + 1;
        out[i] = v < 0 ? 0 : v > 255 ? 255 : v;
      }
    }
  }
}

function sample(img: Float32Array, w: number, h: number, x: number, y: number): number {
  const x0 = Math.max(0, Math.min(w - 2, Math.floor(x)));
  const y0 = Math.max(0, Math.min(h - 2, Math.floor(y)));
  const fx = x - x0;
  const fy = y - y0;
  const i = y0 * w + x0;
  const a = img[i] + (img[i + 1] - img[i]) * fx;
  const b = img[i + w] + (img[i + w + 1] - img[i + w]) * fx;
  return a + (b - a) * fy;
}

function smooth(e: number): number {
  // 1 inside, 0 outside, soft ~1px edge for an ellipse distance e (1 = edge)
  return Math.max(0, Math.min(1, (1 - e) * 12 + 0.5));
}

function renderBase(w: number, h: number): Float32Array {
  const img = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const v = y / h;
      // Quilted mattress sheet, lit from the top.
      const quilt = Math.sin((x + y) * 0.3) * Math.sin((x - y) * 0.3);
      let c = 104 + 9 * quilt - 26 * v;

      // Blanket: a soft superellipse from the shoulders down.
      const bx = (u - 0.5) / 0.36;
      const by = (v - 0.66) / 0.33;
      const be = Math.pow(Math.pow(Math.abs(bx), 3) + Math.pow(Math.abs(by), 3), 1 / 3);
      const bm = smooth(be);
      const wave = v * h * 0.55 + 1.6 * Math.sin(u * 9 + v * 3);
      const stripe = 0.5 + 0.5 * Math.tanh(4 * Math.sin(wave));
      const fold = 16 * Math.sin(u * 14 - v * 5) * Math.exp(-((u - 0.5) ** 2) * 5);
      const blanket = 112 + 58 * stripe + fold - 34 * be * be;
      c = c * (1 - bm) + blanket * bm;

      // Head resting above the blanket, with a dark cap of hair.
      const hx = (u - 0.5) / 0.19;
      const hy = (v - 0.2) / 0.125;
      const he = Math.sqrt(hx * hx + hy * hy);
      const hm = smooth(he);
      const hairMix = Math.max(0, Math.min(1, (-hy - 0.15) * 4));
      const skin = 186 - 44 * he * he;
      const hair = 58 + 12 * Math.sin(u * 60 + v * 25);
      c = c * (1 - hm) + (skin * (1 - hairMix) + hair * hairMix) * hm;

      // Two small hands resting on the top of the blanket.
      for (const side of [-1, 1]) {
        const ax = (u - (0.5 + side * 0.17)) / 0.06;
        const ay = (v - 0.375) / 0.042;
        const ae = Math.sqrt(ax * ax + ay * ay);
        const am = smooth(ae);
        c = c * (1 - am) + (182 - 36 * ae * ae) * am;
      }
      img[y * w + x] = c;
    }
  }
  return img;
}
