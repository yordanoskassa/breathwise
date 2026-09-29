import { AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from 'remotion';

import { Background } from '../components/Background';
import { IconAlert } from '../components/Icons';
import { Clip, Phone } from '../components/Phone';
import { FadeIn, Kinetic, Label } from '../components/Text';
import { CLIPS, localBeat } from '../timeline';
import { C, fontFamily } from '../theme';


const ROWS = [
  ['Under 2 months', '≥ 60 /min'],
  ['2–11 months', '≥ 50 /min'],
  ['1–4 years', '≥ 40 /min'],
] as const;

const b = (k: number) => localBeat('result', k);
const M = CLIPS.measure;
/** Seg 1 shows the count-up; seg 2 is timed so the danger-sign tick lands on beat 12. */
const SEG2_AT = b(6);
const seg2From = M.tick - (b(12) - SEG2_AT) / 30;

export const Result: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: f, fps, config: { damping: 18, stiffness: 80 } });
  const tickAt = b(12);
  const danger = spring({ frame: f - tickAt - 6, fps, config: { damping: 14 } });
  return (
    <AbsoluteFill>
      <Background tint={f > tickAt ? C.coral : C.amber} intensity={0.9} />
      <AbsoluteFill style={{ padding: '120px 140px', gap: 22 }}>
        <Label n="03" text="Result" color={C.amber} />
        <Kinetic text="A clear answer, using WHO rules." size={66} delay={2} stagger={3} style={{ width: 900 }} />
        <FadeIn at={b(2)}>
          <div style={{ fontFamily, fontSize: 26, color: C.dim, marginTop: 10, marginBottom: 14 }}>
            WHO IMCI fast-breathing cut-offs by age
          </div>
        </FadeIn>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: 820 }}>
          {ROWS.map(([age, cut], i) => {
            const s = spring({ frame: f - b(2 + i), fps, config: { damping: 16 } });
            const hi = i === 2;
            const glow = hi ? interpolate(f, [b(6), b(6) + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0;
            return (
              <div
                key={age}
                style={{
                  fontFamily,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '22px 30px',
                  borderRadius: 20,
                  background: `rgba(16,24,41,${0.7 + 0.2 * glow})`,
                  border: `1.5px solid ${hi ? `rgba(255,181,71,${0.2 + 0.6 * glow})` : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: hi ? `0 0 ${60 * glow}px ${C.amber}33` : 'none',
                  opacity: s,
                  transform: `translateX(${(1 - s) * -40}px)`,
                }}>
                <div style={{ fontSize: 34, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 16 }}>
                  {age}
                  {hi ? (
                    <span
                      style={{
                        fontSize: 20,
                        fontWeight: 800,
                        color: C.bg,
                        background: '#FF8FB1',
                        borderRadius: 999,
                        padding: '5px 12px',
                        opacity: glow,
                      }}>
                      Liya · 14 mo
                    </span>
                  ) : null}
                </div>
                <div style={{ fontSize: 34, fontWeight: 900, color: hi ? C.amber : C.dim, fontVariantNumeric: 'tabular-nums' }}>{cut}</div>
              </div>
            );
          })}
          <div
            style={{
              fontFamily,
              marginTop: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              padding: '22px 30px',
              borderRadius: 20,
              background: C.coral + '1c',
              border: `1.5px solid ${C.coral}77`,
              opacity: danger,
              transform: `scale(${0.9 + 0.1 * danger})`,
            }}>
            <IconAlert color={C.coral} size={36} />
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color: C.coral }}>Any IMCI danger sign → Seek care now</div>
              <div style={{ fontSize: 22, color: C.dim, marginTop: 4 }}>Chest indrawing, can’t drink, convulsions, lethargy…</div>
            </div>
          </div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: 'flex-end', justifyContent: 'center', paddingRight: 190 }}>
        <div style={{ transform: `translateX(${(1 - enter) * 400}px)`, opacity: enter }}>
          <Phone height={940} glow={f > tickAt ? C.coral : C.amber}>
            <Sequence durationInFrames={SEG2_AT}>
              <Clip file="measure.mp4" from={M.resultIn - 0.2} to={M.tick - 0.3} />
            </Sequence>
            <Sequence from={SEG2_AT}>
              <Clip file="measure.mp4" from={seg2From} to={M.end} />
            </Sequence>
          </Phone>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
