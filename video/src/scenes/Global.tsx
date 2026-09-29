import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';

import { Background } from '../components/Background';
import { Clip, Phone } from '../components/Phone';
import { Kinetic } from '../components/Text';
import { CLIPS, localBeat } from '../timeline';
import { C, fontFamily } from '../theme';

const b = (k: number) => localBeat('global', k);
const LANGS = ['English', 'Français', 'Español', 'Kiswahili', 'አማርኛ'];

export const Global: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: f, fps, config: { damping: 18 } });
  return (
    <AbsoluteFill>
      <Background tint={C.sky} />
      <AbsoluteFill style={{ padding: '0 140px', justifyContent: 'center', gap: 34 }}>
        <Kinetic text="Five languages. Offline. Free for health workers." size={64} stagger={2} style={{ width: 980 }} />
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', width: 980 }}>
          {LANGS.map((l, i) => {
            const s = spring({ frame: f - b(i), fps, config: { damping: 11, stiffness: 200 } });
            return (
              <div
                key={l}
                style={{
                  fontFamily,
                  fontSize: 38,
                  fontWeight: 800,
                  padding: '14px 28px',
                  borderRadius: 999,
                  color: i === 4 ? C.bg : C.text,
                  background: i === 4 ? C.teal : 'rgba(24,34,58,0.9)',
                  border: `1.5px solid ${C.teal}55`,
                  transform: `scale(${s})`,
                }}>
                {l}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: 'flex-end', justifyContent: 'center', paddingRight: 200 }}>
        <div style={{ transform: `translateY(${(1 - enter) * 300}px)`, opacity: enter }}>
          <Phone height={880} glow={C.sky}>
            <Clip file="walkthrough.mp4" from={CLIPS.walk.settings} rate={3} />
          </Phone>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
