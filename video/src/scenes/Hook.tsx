import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from 'remotion';

import { Field } from '../components/Field';
import { Caption, P, Reveal, useIn } from '../components/Text';
import { localBeat } from '../timeline';
import { C, display, EASE, text } from '../theme';

const b = (k: number) => localBeat('hook', k);
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** A plain second hand sweeping a minute, drawn in ink. */
const Minute: React.FC = () => {
  const f = useCurrentFrame();
  const p = interpolate(f, [4, b(4) - 6], [0, 1], { ...clamp, easing: EASE });
  const R = 150;
  const a = p * Math.PI * 2 - Math.PI / 2;
  return (
    <svg width={360} height={360}>
      <circle cx={180} cy={180} r={R} stroke={C.ink} strokeWidth={3} fill="none" />
      {Array.from({ length: 60 }).map((_, i) => {
        const t = (i / 60) * Math.PI * 2 - Math.PI / 2;
        const long = i % 5 === 0;
        return (
          <line
            key={i}
            x1={180 + Math.cos(t) * R}
            y1={180 + Math.sin(t) * R}
            x2={180 + Math.cos(t) * (R - (long ? 22 : 11))}
            y2={180 + Math.sin(t) * (R - (long ? 22 : 11))}
            stroke={C.ink}
            strokeWidth={long ? 4 : 2}
          />
        );
      })}
      <line x1={180} y1={180} x2={180 + Math.cos(a) * (R - 30)} y2={180 + Math.sin(a) * (R - 30)} stroke={C.red} strokeWidth={5} strokeLinecap="round" />
      <circle cx={180} cy={180} r={8} fill={C.red} />
    </svg>
  );
};

const Stat: React.FC = () => {
  const f = useCurrentFrame();
  const p = useIn(6, 20);
  const hi = Math.round(interpolate(f, [6, 30], [0, 20], clamp));
  const lo = Math.round(interpolate(f, [6, 30], [0, 8], clamp));
  return (
    <div style={{ fontFamily: display, fontSize: 300, color: C.red, lineHeight: 0.9, opacity: p, fontVariantNumeric: 'tabular-nums' }}>
      {lo}–{hi}%
    </div>
  );
};

export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const out = (a: number) => interpolate(f, [a - 5, a], [1, 0], clamp);
  return (
    <Field color={C.white}>
      <Sequence durationInFrames={b(4)}>
        <AbsoluteFill style={{ opacity: out(b(4)), padding: '0 160px', justifyContent: 'center' }}>
          <Reveal size={124} at={4} gap={6} lines={['Every 43 seconds,', 'a child under five', <span key="p">dies of <span style={{ color: C.red }}>pneumonia.</span></span>]} />
          <Caption at={b(2)} style={{ marginTop: 34 }}>
            WHO, 2019 data: 740,180 children under five.
          </Caption>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={b(4)} durationInFrames={b(8) - b(4)}>
        <AbsoluteFill style={{ opacity: out(b(8)), padding: '0 160px', flexDirection: 'row', alignItems: 'center', gap: 120 }}>
          <Minute />
          <div>
            <P at={2} size={40} color={C.gray}>
              The test health workers use is simple:
            </P>
            <Reveal size={104} at={10} gap={6} lines={['count the breaths', 'for one full minute.']} style={{ marginTop: 18 }} />
          </div>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={b(8)}>
        <AbsoluteFill style={{ padding: '0 160px', justifyContent: 'center' }}>
          <Reveal size={80} gap={5} lines={['Most hand counts on young', 'infants are wrong.']} />
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 48, marginTop: 30 }}>
            <Stat />
            <P at={20} size={34} color={C.ink} style={{ width: 620, marginBottom: 34, fontFamily: text }}>
              of health-worker counts landed within ±2 breaths of the true rate.
            </P>
          </div>
          <Caption at={30} style={{ marginTop: 30 }}>
            Baker et al., 2019. Four-country trial, infants under 2 months.
          </Caption>
        </AbsoluteFill>
      </Sequence>
    </Field>
  );
};
