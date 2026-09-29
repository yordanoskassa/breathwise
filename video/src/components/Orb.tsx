import { useCurrentFrame } from 'remotion';

import { C } from '../theme';

/** The Breathwise orb, breathing at `rate` breaths/min. */
export const Orb: React.FC<{ size: number; rate?: number; glow?: number; colors?: [string, string]; id?: string }> = ({
  size,
  rate = 16,
  glow = 1,
  colors = [C.teal, C.sky],
  id = 'orb',
}) => {
  const f = useCurrentFrame();
  const phase = (f / 30) * (rate / 60) * Math.PI * 2;
  const b = 0.5 - 0.5 * Math.cos(phase);
  const r = size * 0.27 * (1 + 0.1 * b);
  const halo = size * 0.5 * (0.8 + 0.2 * b);
  const c = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id={`${id}-halo`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={colors[0]} stopOpacity={0.55 * glow} />
          <stop offset="55%" stopColor={colors[1]} stopOpacity={0.18 * glow} />
          <stop offset="100%" stopColor={colors[1]} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-body`} cx="36%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="22%" stopColor={colors[0]} />
          <stop offset="66%" stopColor={colors[1]} />
          <stop offset="100%" stopColor="#1B3F86" />
        </radialGradient>
      </defs>
      <circle cx={c} cy={c} r={halo} fill={`url(#${id}-halo)`} />
      <circle cx={c} cy={c} r={r} fill={`url(#${id}-body)`} />
    </svg>
  );
};
