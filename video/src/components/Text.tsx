import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

import { C, fontFamily } from '../theme';

type Style = React.CSSProperties;

/** Words rise and un-blur one after another. */
export const Kinetic: React.FC<{
  text: string;
  delay?: number;
  stagger?: number;
  size?: number;
  weight?: number;
  color?: string;
  style?: Style;
  highlight?: Record<string, string>;
}> = ({ text, delay = 0, stagger = 3, size = 72, weight = 800, color = C.text, style, highlight = {} }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(' ');
  return (
    <div
      style={{
        fontFamily,
        fontSize: size,
        fontWeight: weight,
        letterSpacing: size > 60 ? -size * 0.035 : -0.5,
        lineHeight: 1.08,
        color,
        display: 'flex',
        flexWrap: 'wrap',
        gap: `0 ${size * 0.26}px`,
        ...style,
      }}>
      {words.map((w, i) => {
        const s = spring({ frame: f - delay - i * stagger, fps, config: { damping: 18, stiffness: 140 } });
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              transform: `translateY(${(1 - s) * size * 0.55}px)`,
              opacity: s,
              filter: `blur(${(1 - s) * 10}px)`,
              color: highlight[w.replace(/[.,]/g, '')] ?? undefined,
            }}>
            {w}
          </span>
        );
      })}
    </div>
  );
};

export const Label: React.FC<{ n: string; text: string; delay?: number; color?: string }> = ({ n, text, delay = 0, color = C.teal }) => {
  const f = useCurrentFrame();
  const o = interpolate(f - delay, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div
      style={{
        fontFamily,
        fontSize: 22,
        fontWeight: 800,
        letterSpacing: 4,
        color,
        opacity: o,
        transform: `translateX(${(1 - o) * -20}px)`,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}>
      <span style={{ padding: '4px 10px', borderRadius: 8, background: color + '22', border: `1px solid ${color}55` }}>{n}</span>
      {text.toUpperCase()}
    </div>
  );
};

/** Pill callout with a dot that slides in from the side. */
export const Callout: React.FC<{ text: string; sub?: string; at: number; color?: string; icon?: React.ReactNode }> = ({
  text,
  sub,
  at,
  color = C.teal,
  icon,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - at, fps, config: { damping: 16, stiffness: 130 } });
  if (f < at - 1) return null;
  return (
    <div
      style={{
        fontFamily,
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: '20px 28px',
        borderRadius: 22,
        background: 'rgba(16, 24, 41, 0.78)',
        border: `1px solid ${color}44`,
        boxShadow: `0 0 50px ${color}1f`,
        transform: `translateX(${(1 - s) * 60}px) scale(${0.96 + 0.04 * s})`,
        opacity: s,
      }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          background: color + '22',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          color,
          flexShrink: 0,
        }}>
        {icon ?? '●'}
      </div>
      <div>
        <div style={{ fontSize: 32, fontWeight: 750, color: C.text, letterSpacing: -0.4 }}>{text}</div>
        {sub ? <div style={{ fontSize: 22, fontWeight: 500, color: C.dim, marginTop: 4 }}>{sub}</div> : null}
      </div>
    </div>
  );
};

export const FadeIn: React.FC<{ at?: number; dur?: number; children: React.ReactNode; style?: Style; y?: number }> = ({
  at = 0,
  dur = 15,
  children,
  style,
  y = 20,
}) => {
  const f = useCurrentFrame();
  const o = interpolate(f - at, [0, dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <div style={{ opacity: o, transform: `translateY(${(1 - o) * y}px)`, ...style }}>{children}</div>;
};

export const Source: React.FC<{ text: string; at?: number }> = ({ text, at = 0 }) => (
  <FadeIn at={at} y={0}>
    <div style={{ fontFamily, fontSize: 20, color: C.faint, fontWeight: 500, letterSpacing: 0.3 }}>{text}</div>
  </FadeIn>
);
