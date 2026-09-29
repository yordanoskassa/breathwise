import { AbsoluteFill, useCurrentFrame } from 'remotion';

import { beatPulse } from './Beat';

/** A flat colour field. Nothing else — the content carries the scene. */
export const Field: React.FC<{ color: string; children?: React.ReactNode }> = ({ color, children }) => (
  <AbsoluteFill style={{ backgroundColor: color }}>{children}</AbsoluteFill>
);

/**
 * The breath mark: a flat disc that inflates with each beat and leaves a
 * thin ring behind. Solid colour only.
 */
export const BreathDisc: React.FC<{ size: number; color: string; offset: number; ring?: string }> = ({
  size,
  color,
  offset,
  ring,
}) => {
  const f = useCurrentFrame();
  const p = beatPulse(f + offset, 1, 3);
  const k = 1 - p;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: `3px solid ${ring ?? color}`,
          transform: `scale(${1 + k * 0.55})`,
          opacity: p * 0.9,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: color,
          transform: `scale(${0.82 + 0.18 * p})`,
        }}
      />
    </div>
  );
};
