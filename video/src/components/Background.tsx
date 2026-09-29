import { AbsoluteFill, useCurrentFrame } from 'remotion';

import { C } from '../theme';

/** Slow-drifting aurora + faint 12×16 dot grid (the app's analysis grid). */
export const Background: React.FC<{ tint?: string; intensity?: number }> = ({ tint = C.teal, intensity = 1 }) => {
  const f = useCurrentFrame();
  const t = f / 30;
  const x1 = 30 + 8 * Math.sin(t * 0.21);
  const y1 = 25 + 6 * Math.cos(t * 0.17);
  const x2 = 72 + 7 * Math.cos(t * 0.13);
  const y2 = 78 + 5 * Math.sin(t * 0.19);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <AbsoluteFill
        style={{
          opacity: 0.9 * intensity,
          background: `radial-gradient(900px 700px at ${x1}% ${y1}%, ${tint}22, transparent 70%),
            radial-gradient(1000px 800px at ${x2}% ${y2}%, ${C.sky}1c, transparent 70%),
            radial-gradient(1400px 900px at 50% 120%, ${C.violet}14, transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.18 * intensity,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.35) 1.2px, transparent 1.4px)',
          backgroundSize: '48px 48px',
          backgroundPosition: `${(t * 6) % 48}px ${(t * 3) % 48}px`,
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.65) 100%)' }} />
    </AbsoluteFill>
  );
};
