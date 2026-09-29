/** Runs a full synthetic measurement through the exact app pipeline. */
import { computeGrid, GRID_CELLS } from '../grid.ts';
import { MeasureSession, type SessionResult } from '../session.ts';
import { type SceneOptions, SyntheticScene } from '../synthetic.ts';

export type RunOutcome = {
  result: SessionResult | null;
  lockedAfter: number | null;
  totalSeconds: number;
};

export function runSynthetic(opts: Partial<SceneOptions>, fps = 15, maxSeconds = 120): RunOutcome {
  const scene = new SyntheticScene(opts);
  const { width, height } = scene.opts;
  const session = new MeasureSession(GRID_CELLS, 60);
  const grid = new Array(GRID_CELLS).fill(0);
  const frame = new Uint8Array(width * height);
  let lockedAfter: number | null = null;
  for (let i = 0; i < maxSeconds * fps; i++) {
    const t = i / fps + 0.004 * Math.sin(i * 1.7); // small timestamp jitter
    scene.render(t, frame);
    computeGrid(frame, width, height, width, 1, grid);
    session.pushFrame(t, grid);
    const snap = session.snapshot();
    if (lockedAfter === null && snap.phase !== 'searching') lockedAfter = t;
    if (snap.phase === 'done') return { result: session.result(), lockedAfter, totalSeconds: t };
  }
  return { result: null, lockedAfter, totalSeconds: maxSeconds };
}
