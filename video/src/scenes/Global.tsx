import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

import { Field } from '../components/Field';
import { Clip, Phone } from '../components/Phone';
import { P, useIn } from '../components/Text';
import { CLIPS, localBeat } from '../timeline';
import { C, display, EASE } from '../theme';

const b = (k: number) => localBeat('global', k);
const LANGS = ['English', 'Français', 'Español', 'Kiswahili', 'አማርኛ'];

export const Global: React.FC = () => {
  const f = useCurrentFrame();
  const enter = useIn(0, 14);
  return (
    <Field color={C.green}>
      <AbsoluteFill style={{ padding: '100px 140px', justifyContent: 'center' }}>
        {LANGS.map((l, i) => {
          const p = interpolate(f, [b(i * 0.45), b(i * 0.45) + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE });
          return (
            <div key={l} style={{ overflow: 'hidden' }}>
              <div style={{ fontFamily: display, fontSize: 108, lineHeight: 1.08, color: C.white, transform: `translateY(${(1 - p) * 100}%)` }}>{l}</div>
            </div>
          );
        })}
        <P at={b(1.8)} size={34} color={C.white} style={{ marginTop: 24, fontWeight: 700 }}>
          Five languages, voice guidance, works offline.
        </P>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: 'flex-end', justifyContent: 'center', paddingRight: 220 }}>
        <div style={{ transform: `translateY(${(1 - enter) * 120}px)`, opacity: enter }}>
          <Phone height={880}>
            <Clip file="walkthrough.mp4" from={CLIPS.walk.settings} rate={3} />
          </Phone>
        </div>
      </AbsoluteFill>
    </Field>
  );
};
