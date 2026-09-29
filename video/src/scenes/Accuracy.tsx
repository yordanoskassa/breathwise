import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

import { Field } from '../components/Field';
import { Caption, Reveal, Steps } from '../components/Text';
import { localBeat } from '../timeline';
import { C, EASE, text } from '../theme';

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

const PW = 600;
const PH = 520;
const MIN = 10;
const MAX = 80;
const px = (v: number) => ((v - MIN) / (MAX - MIN)) * PW;
const py = (v: number) => PH - ((v - MIN) / (MAX - MIN)) * PH;

export const Accuracy: React.FC = () => {
  const f = useCurrentFrame();
  const line = interpolate(f, [0, b(2)], [0, 1], { extrapolateRight: 'clamp', easing: EASE });
  return (
    <Field color={C.white}>
      <AbsoluteFill style={{ padding: '120px 140px', flexDirection: 'row', gap: 130 }}>
        <div style={{ width: 780 }}>
          <Reveal size={70} lines={['Within 2 breaths,', 'from 14 to 75', 'per minute.']} />
          <div style={{ height: 36 }} />
          <Steps
            width={740}
            items={[
              { at: b(1.5), title: 'Chest moving under one pixel' },
              { at: b(2.5), title: 'Heavy low-light sensor noise' },
              { at: b(3.5), title: 'Bumped mid-count: clock pauses' },
              { at: b(4.5), title: 'No breathing at all: never locks' },
            ]}
          />
        </div>
        <div style={{ paddingTop: 40 }}>
          <svg width={PW + 60} height={PH + 60} style={{ overflow: 'visible' }}>
            <g transform="translate(50,0)">
              <line x1={0} y1={PH} x2={PW} y2={PH} stroke={C.ink} strokeWidth={2} />
              <line x1={0} y1={0} x2={0} y2={PH} stroke={C.ink} strokeWidth={2} />
              {[20, 40, 60, 80].map((v) => (
                <g key={v}>
                  <text x={-14} y={py(v) + 7} textAnchor="end" fontFamily={text} fontSize={20} fill={C.gray}>
                    {v}
                  </text>
                  <text x={px(v)} y={PH + 30} textAnchor="middle" fontFamily={text} fontSize={20} fill={C.gray}>
                    {v}
                  </text>
                </g>
              ))}
              <line x1={px(MIN)} y1={py(MIN)} x2={px(MIN + (MAX - MIN) * line)} y2={py(MIN + (MAX - MIN) * line)} stroke={C.gray} strokeWidth={2} strokeDasharray="8 8" />
              {POINTS.map(([t, m], i) => {
                const at = b(0.25 * i);
                const r = interpolate(f, [at, at + 6], [0, 11], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE });
                return <circle key={t} cx={px(t)} cy={py(m)} r={r} fill={C.green} />;
              })}
            </g>
          </svg>
          <Caption at={b(1)} style={{ marginLeft: 50, marginTop: 8 }}>
            True rate (x) vs. what Breathwise counted (y). 13 end-to-end tests on synthetic scenes; a clinical study is next.
          </Caption>
        </div>
      </AbsoluteFill>
    </Field>
  );
};
