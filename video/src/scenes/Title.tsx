import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

import { Background } from '../components/Background';
import { beatPulse } from '../components/Beat';
import { Orb } from '../components/Orb';
import { Kinetic } from '../components/Text';
import { localBeat, sceneStart } from '../timeline';
import { C, fontFamily } from '../theme';

export const Title: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const abs = f + sceneStart('title');
  const s = spring({ frame: f, fps, config: { damping: 11, stiffness: 120 } });
  const pulse = beatPulse(abs, 1, 6);
  const shock = interpolate(f, [0, 22], [0, 1], { extrapolateRight: 'clamp' });
  const letters = 'Breathwise'.split('');
  return (
    <AbsoluteFill>
      <Background intensity={1.3} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            position: 'absolute',
            width: 300 + shock * 1500,
            height: 300 + shock * 1500,
            borderRadius: '50%',
            border: `3px solid ${C.teal}`,
            opacity: 0.6 * (1 - shock),
            transform: 'translateY(-120px)',
          }}
        />
        <div style={{ transform: `scale(${(0.3 + 0.7 * s) * (1 + 0.05 * pulse)}) translateY(-120px)`, opacity: s }}>
          <Orb size={560} rate={14} glow={1.3 + 0.6 * pulse} id="title" />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 190 }}>
        <div style={{ display: 'flex', fontFamily, fontSize: 150, fontWeight: 900, letterSpacing: -6, color: C.text }}>
          {letters.map((l, i) => {
            const ls = spring({ frame: f - 4 - i * 1.5, fps, config: { damping: 13, stiffness: 160 } });
            return (
              <span key={i} style={{ display: 'inline-block', transform: `translateY(${(1 - ls) * 90}px)`, opacity: ls }}>
                {l}
              </span>
            );
          })}
        </div>
        <Kinetic
          text="Your phone camera counts the breaths."
          size={46}
          weight={600}
          color={C.teal}
          delay={localBeat('title', 4)}
          stagger={2}
          style={{ justifyContent: 'center', marginTop: 8 }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
