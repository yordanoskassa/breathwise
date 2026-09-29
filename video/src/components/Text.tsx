import { interpolate, useCurrentFrame } from 'remotion';

import { C, display, EASE, text } from '../theme';

type Style = React.CSSProperties;
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** 0→1 over `dur` frames from `at`, eased. */
export const useIn = (at: number, dur = 14) => {
  const f = useCurrentFrame();
  return interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: EASE });
};

/** Lines slide up from behind a mask, one after another. */
export const Reveal: React.FC<{
  lines: React.ReactNode[];
  at?: number;
  gap?: number;
  size: number;
  color?: string;
  font?: 'display' | 'text';
  weight?: number;
  lineHeight?: number;
  style?: Style;
}> = ({ lines, at = 0, gap = 5, size, color = C.ink, font = 'display', weight, lineHeight = 1.04, style }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ fontFamily: font === 'display' ? display : text, fontSize: size, fontWeight: weight ?? (font === 'display' ? 400 : 700), color, lineHeight, ...style }}>
      {lines.map((l, i) => {
        const p = interpolate(f, [at + i * gap, at + i * gap + 14], [0, 1], { ...clamp, easing: EASE });
        return (
          <div key={i} style={{ overflow: 'hidden', paddingBottom: size * 0.08 }}>
            <div style={{ transform: `translateY(${(1 - p) * 110}%)` }}>{l}</div>
          </div>
        );
      })}
    </div>
  );
};

export const P: React.FC<{ children: React.ReactNode; at?: number; size?: number; color?: string; style?: Style }> = ({
  children,
  at = 0,
  size = 30,
  color = C.gray,
  style,
}) => {
  const p = useIn(at, 12);
  return (
    <div style={{ fontFamily: text, fontSize: size, lineHeight: 1.4, color, opacity: p, transform: `translateY(${(1 - p) * 12}px)`, ...style }}>
      {children}
    </div>
  );
};

/**
 * Numbered list separated by hairlines. Items appear at their frame; the
 * newest is full strength, earlier ones step back.
 */
export const Steps: React.FC<{
  items: { at: number; title: string; sub?: string }[];
  onInk?: boolean;
  accent?: string;
  width?: number;
}> = ({ items, onInk = false, accent = C.green, width = 800 }) => {
  const f = useCurrentFrame();
  const fg = onInk ? C.white : C.ink;
  const dim = onInk ? C.grayOnInk : C.gray;
  const line = onInk ? C.lineOnInk : C.lineOnWhite;
  const current = items.reduce((acc, it, i) => (f >= it.at ? i : acc), -1);
  return (
    <div style={{ width }}>
      {items.map((it, i) => {
        const p = interpolate(f, [it.at, it.at + 12], [0, 1], { ...clamp, easing: EASE });
        const active = i === current;
        return (
          <div
            key={it.title}
            style={{
              display: 'flex',
              gap: 28,
              padding: '22px 0',
              borderTop: `1.5px solid ${line}`,
              opacity: p === 0 ? 0 : active ? 1 : 0.45,
              transform: `translateX(${(1 - p) * 24}px)`,
            }}>
            <div style={{ fontFamily: display, fontSize: 34, color: accent, width: 40, lineHeight: 1.15 }}>{i + 1}</div>
            <div>
              <div style={{ fontFamily: text, fontWeight: 700, fontSize: 36, color: fg, lineHeight: 1.2 }}>{it.title}</div>
              {it.sub ? <div style={{ fontFamily: text, fontSize: 25, color: dim, marginTop: 6 }}>{it.sub}</div> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const Caption: React.FC<{ children: React.ReactNode; at?: number; color?: string; style?: Style }> = ({
  children,
  at = 0,
  color = C.gray,
  style,
}) => {
  const p = useIn(at, 10);
  return <div style={{ fontFamily: text, fontSize: 20, color, opacity: p, ...style }}>{children}</div>;
};
