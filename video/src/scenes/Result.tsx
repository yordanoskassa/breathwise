import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from 'remotion';

import { Field } from '../components/Field';
import { Clip, Phone } from '../components/Phone';
import { P, Reveal, useIn } from '../components/Text';
import { CLIPS, localBeat } from '../timeline';
import { C, display, EASE, FPS, text } from '../theme';

const b = (k: number) => localBeat('result', k);
const M = CLIPS.measure;
/** Seg 1 shows the count-up; seg 2 is timed so the danger-sign tick lands on beat 4. */
const SEG2_AT = b(2);
const TICK = b(4);
const seg2From = M.tick - (TICK - SEG2_AT) / FPS;

const ROWS = [
  ['Under 2 months', '60 or more'],
  ['2 to 11 months', '50 or more'],
  ['1 to 4 years', '40 or more'],
] as const;

export const Result: React.FC = () => {
  const f = useCurrentFrame();
  const enter = useIn(0, 16);
  const danger = interpolate(f, [TICK + 4, TICK + 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE });
  return (
    <Field color={C.yellow}>
      <AbsoluteFill style={{ padding: '120px 140px' }}>
        <Reveal size={82} lines={['A clear answer,', 'by WHO rules.']} at={2} />
        <P at={b(0.5)} size={28} color={C.ink} style={{ marginTop: 26, marginBottom: 18 }}>
          Fast breathing (breaths per minute), WHO IMCI
        </P>
        <div style={{ width: 800 }}>
          {ROWS.map(([age, cut], i) => {
            const p = interpolate(f, [b(0.5 + i * 0.5), b(0.5 + i * 0.5) + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE });
            const hi = i === 2 && f >= b(2);
            return (
              <div
                key={age}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  padding: '18px 16px',
                  borderTop: `2px solid ${C.ink}`,
                  background: hi ? C.ink : 'transparent',
                  color: hi ? C.yellow : C.ink,
                  opacity: p,
                  transform: `translateX(${(1 - p) * -20}px)`,
                }}>
                <div style={{ fontFamily: text, fontWeight: 700, fontSize: 36 }}>
                  {age}
                  {hi ? <span style={{ fontWeight: 500, fontSize: 26, marginLeft: 18 }}>Liya, 14 months</span> : null}
                </div>
                <div style={{ fontFamily: display, fontSize: 40 }}>{cut}</div>
              </div>
            );
          })}
        </div>
        <div
          style={{
            width: 800,
            marginTop: 28,
            padding: '22px 24px',
            background: C.red,
            color: C.white,
            opacity: danger,
            transform: `translateY(${(1 - danger) * 20}px)`,
          }}>
          <div style={{ fontFamily: display, fontSize: 38 }}>Any danger sign: seek care now.</div>
          <div style={{ fontFamily: text, fontSize: 25, marginTop: 6 }}>Chest indrawing, can’t drink, convulsions, very sleepy.</div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: 'flex-end', justifyContent: 'center', paddingRight: 190 }}>
        <div style={{ transform: `translateY(${(1 - enter) * 120}px)`, opacity: enter }}>
          <Phone height={940}>
            <Sequence durationInFrames={SEG2_AT}>
              <Clip file="measure.mp4" from={M.resultIn - 0.2} to={M.tick - 0.3} />
            </Sequence>
            <Sequence from={SEG2_AT}>
              <Clip file="measure.mp4" from={seg2From} to={M.end} />
            </Sequence>
          </Phone>
        </div>
      </AbsoluteFill>
    </Field>
  );
};
