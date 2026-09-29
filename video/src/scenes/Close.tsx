import { AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame } from 'remotion';

import { BreathDisc, Field } from '../components/Field';
import { Caption, Reveal, useIn } from '../components/Text';
import { localBeat, MUSIC, SCENES, sceneStart } from '../timeline';
import { C, EASE, text } from '../theme';

const b = (k: number) => localBeat('close', k);
const HIT = MUSIC.hitBeat - SCENES.close[0];

export const Close: React.FC = () => {
  const f = useCurrentFrame();
  const out = interpolate(f, [b(4) - 6, b(4)], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const grow = interpolate(f, [b(4), b(HIT)], [0.25, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE });
  const credits = useIn(b(HIT) + 24, 16);
  const fade = interpolate(f, [b(HIT) + 170, b(HIT) + 205], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <Field color={C.ink}>
      <Sequence durationInFrames={b(4)}>
        <AbsoluteFill style={{ padding: '0 160px', justifyContent: 'center', opacity: out }}>
          <Reveal size={88} color={C.white} lines={['For every parent at 2 a.m.']} />
          <Reveal size={88} color={C.green} at={b(2)} lines={['For every health worker,', 'every day.']} />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={b(4)} durationInFrames={b(HIT) - b(4)}>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ transform: `scale(${grow})` }}>
            <BreathDisc size={420} color={C.green} ring={C.white} offset={sceneStart('close') + b(4)} />
          </div>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={b(HIT)}>
        <AbsoluteFill style={{ opacity: fade }}>
          <Field color={C.green}>
            <AbsoluteFill style={{ padding: '0 160px', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 56 }}>
                <BreathDisc size={180} color={C.white} offset={sceneStart('close') + b(HIT)} />
                <Reveal size={230} color={C.white} lines={['Breathwise']} />
              </div>
              <Reveal size={54} color={C.white} at={10} font="text" lines={['Point the camera. Count. Know.']} style={{ marginTop: 20, marginLeft: 236 }} />
            </AbsoluteFill>
            <AbsoluteFill style={{ justifyContent: 'flex-end', padding: '0 160px 64px', opacity: credits }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 22, fontFamily: text, fontSize: 24, color: C.white }}>
                Built for
                <Img src={staticFile('brand/revenuecat-logo-light.svg')} style={{ height: 40 }} />
                Shipaton 2026 · Open source: github.com/yordanoskassa/breathwise
              </div>
              <Caption color="rgba(255,255,255,0.8)" style={{ marginTop: 14 }}>
                Music: “A Kind of Hope” by Scott Buckley, CC BY 4.0, scottbuckley.com.au
              </Caption>
            </AbsoluteFill>
          </Field>
        </AbsoluteFill>
      </Sequence>
    </Field>
  );
};
