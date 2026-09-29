import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

import { Background } from '../components/Background';
import { IconCheck } from '../components/Icons';
import { Kinetic, Label } from '../components/Text';
import { localBeat } from '../timeline';
import { C, fontFamily } from '../theme';

const b = (k: number) => localBeat('accuracy', k);

/** From `npm test`: true rate → measured rate on synthetic scenes. */
const POINTS: [number, number][] = [
  [14, 14],
  [20, 19],
  [28, 28],
  [36, 36],
  [44, 43],
  [52, 51],
  [62, 62],
  [75, 74],
];
const CHECKS = ['Sub-pixel chest motion (0.6 px)', 'Heavy low-light sensor noise', 'Bumped mid-count: clock pauses', 'No breathing: never locks on'];

const PW = 620;
const PH = 520;
const MIN = 10;
const MAX = 80;
const px = (v: number) => ((v - MIN) / (MAX - MIN)) * PW;
const py = (v: number) => PH - ((v - MIN) / (MAX - MIN)) * PH;

export const Accuracy: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const line = interpolate(f, [0, b(4)], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill>
      <Background tint={C.teal} />
      <AbsoluteFill style={{ padding: '120px 140px', flexDirection: 'row', gap: 110, alignItems: 'center' }}>
        <div style={{ width: 760, display: 'flex', flexDirection: 'column', gap: 22 }}>
          <Label n="04" text="Accuracy" />
          <Kinetic text="Within ±2 breaths, 14 to 75 per minute." size={62} stagger={2} />
          <div style={{ height: 10 }} />
          {CHECKS.map((c, i) => {
            const s = spring({ frame: f - b(6 + i), fps, config: { damping: 15 } });
            return (
              <div
                key={c}
                style={{ fontFamily, fontSize: 30, fontWeight: 650, color: C.text, display: 'flex', alignItems: 'center', gap: 16, opacity: s, transform: `translateX(${(1 - s) * -30}px)` }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: C.teal + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconCheck color={C.teal} size={24} />
                </div>
                {c}
              </div>
            );
          })}
          <div style={{ fontFamily, fontSize: 21, color: C.faint, marginTop: 12, opacity: interpolate(f, [b(10), b(10) + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
            13 end-to-end tests: synthetic pixels → the exact app pipeline. Clinical agreement study next.
          </div>
        </div>

        <div style={{ position: 'relative', width: PW, height: PH }}>
          <svg width={PW} height={PH} style={{ overflow: 'visible' }}>
            {[20, 40, 60, 80].map((v) => (
              <g key={v}>
                <line x1={0} x2={PW} y1={py(v)} y2={py(v)} stroke="rgba(255,255,255,0.07)" />
                <text x={-14} y={py(v) + 6} textAnchor="end" fontFamily={fontFamily} fontSize={18} fill={C.faint}>
                  {v}
                </text>
                <text x={px(v)} y={PH + 30} textAnchor="middle" fontFamily={fontFamily} fontSize={18} fill={C.faint}>
                  {v}
                </text>
              </g>
            ))}
            <line x1={px(MIN)} y1={py(MIN)} x2={px(MIN + (MAX - MIN) * line)} y2={py(MIN + (MAX - MIN) * line)} stroke={C.teal} strokeOpacity={0.4} strokeWidth={3} strokeDasharray="10 8" />
            {POINTS.map(([t, m], i) => {
              const s = spring({ frame: f - i * 6, fps, config: { damping: 10, stiffness: 180 } });
              return <circle key={t} cx={px(t)} cy={py(m)} r={13 * s} fill={C.teal} style={{ filter: `drop-shadow(0 0 12px ${C.teal})` }} />;
            })}
          </svg>
          <div style={{ fontFamily, fontSize: 20, color: C.dim, position: 'absolute', bottom: -70, width: '100%', textAlign: 'center' }}>true rate (breaths/min)</div>
          <div style={{ fontFamily, fontSize: 20, color: C.dim, position: 'absolute', left: -90, top: PH / 2, transform: 'rotate(-90deg)', transformOrigin: 'left top' }}>measured</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
