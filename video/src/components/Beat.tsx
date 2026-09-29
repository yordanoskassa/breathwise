import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

import { BEAT_SEC, FIRST_BEAT } from '../timeline';
import { FPS } from '../theme';

/** 1 right on a beat, decaying to 0 before the next. `every` = 4 → bars only. */
export const beatPulse = (absFrame: number, every = 1, decay = 7) => {
  const k = (absFrame / FPS - FIRST_BEAT) / BEAT_SEC;
  if (k < 0) return 0;
  const n = Math.floor(k);
  if (n % every !== 0) return 0;
  return Math.exp(-(k - n) * decay);
};

/**
 * Wraps a scene: it punches in on its first frame (hard cut on the beat)
 * with a quick flash, then settles. `pulseEvery` makes the whole scene
 * breathe with the music.
 */
export const SceneIn: React.FC<{
  children: React.ReactNode;
  offset: number;
  flash?: number;
  color?: string;
  pulseEvery?: number;
  pulseAmount?: number;
}> = ({ children, offset, flash = 0.35, color = '#ffffff', pulseEvery = 0, pulseAmount = 0.008 }) => {
  const f = useCurrentFrame();
  const punch = interpolate(f, [0, 10], [1.06, 1], { extrapolateRight: 'clamp' });
  const pulse = pulseEvery ? 1 + pulseAmount * beatPulse(f + offset, pulseEvery) : 1;
  const flashO = interpolate(f, [0, 6], [flash, 0], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${punch * pulse})` }}>{children}</AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: color, opacity: flashO, pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};
