import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

import { BEAT_SEC } from '../timeline';
import { EASE, FPS } from '../theme';

/** 1 right on a beat, decaying before the next. `every` = 4 → bars only. */
export const beatPulse = (absFrame: number, every = 1, decay = 4) => {
  const k = absFrame / FPS / BEAT_SEC;
  const n = Math.floor(k);
  if (n % every !== 0) return 0;
  return Math.exp(-(k - n) * decay);
};

/** Hard cut on the beat with a small settle; no flashes, no glow. */
export const SceneIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  const s = interpolate(f, [0, 12], [1.025, 1], { extrapolateRight: 'clamp', easing: EASE });
  return <AbsoluteFill style={{ transform: `scale(${s})` }}>{children}</AbsoluteFill>;
};
