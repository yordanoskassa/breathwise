import { AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from 'remotion';

import { Background } from '../components/Background';
import { beatPulse } from '../components/Beat';
import { Orb } from '../components/Orb';
import { Kinetic } from '../components/Text';
import { localBeat, sceneStart } from '../timeline';
import { C, fontFamily } from '../theme';

const b = (k: number) => localBeat('close', k);
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** Grid dots rush into the orb during the build. */
const Converge: React.FC<{ p: number }> = ({ p }) => {
  const dots = [];
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2 + i * 0.37;
    const r0 = 700 + (i % 7) * 60;
    const r = r0 * (1 - p);
    dots.push(
      <div
        key={i}
        style={{
          position: 'absolute',
          left: 960 + Math.cos(a) * r - 5,
          top: 540 + Math.sin(a) * r * 0.62 - 5,
          width: 10,
          height: 10,
          borderRadius: 3,
          background: i % 3 ? C.teal : C.sky,
          opacity: 0.7 * p * (1 - p * 0.6),
        }}
      />,
    );
  }
  return <AbsoluteFill>{dots}</AbsoluteFill>;
};

export const Close: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const abs = f + sceneStart('close');
  const build = interpolate(f, [b(16), b(24)], [0, 1], clamp);
  const hit = spring({ frame: f - b(24), fps, config: { damping: 9, stiffness: 150 } });
  const pulse = beatPulse(abs, 1, 6);
  const fadeOut = interpolate(f, [b(24) + 95, b(24) + 118], [1, 0], clamp);
  const flash = interpolate(f, [b(24), b(24) + 8], [0.8, 0], clamp);
  const lineOut = interpolate(f, [b(16) - 8, b(16)], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ opacity: fadeOut, backgroundColor: C.bg }}>
      <Background intensity={0.7 + 0.8 * build} />
      <Sequence durationInFrames={b(16)}>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', gap: 24, opacity: lineOut }}>
          <Kinetic text="For every parent at 2 a.m." size={84} stagger={3} style={{ justifyContent: 'center' }} />
          <Kinetic
            text="For every health worker, every day."
            size={84}
            delay={b(8)}
            stagger={3}
            color={C.teal}
            style={{ justifyContent: 'center' }}
          />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={b(16)}>
        <Converge p={build} />
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              transform: `translateY(${-110 * hit}px) scale(${(0.35 + 0.65 * build) * (1 + 0.08 * pulse) * (1 + 0.15 * hit)})`,
            }}>
            <Orb size={520} rate={14} glow={1 + build + pulse} id="close" />
          </div>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={b(24)}>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 150 }}>
          <div
            style={{
              fontFamily,
              fontSize: 170,
              fontWeight: 900,
              letterSpacing: -7,
              color: C.text,
              transform: `scale(${0.6 + 0.4 * hit})`,
              opacity: hit,
              textShadow: `0 0 60px ${C.teal}55`,
            }}>
            Breathwise
          </div>
          <div style={{ fontFamily, fontSize: 40, fontWeight: 700, color: C.teal, marginTop: 4, opacity: interpolate(f - b(24), [8, 20], [0, 1], clamp) }}>
            Point. Count. Know.
          </div>
          <div style={{ fontFamily, fontSize: 24, color: C.dim, marginTop: 26, opacity: interpolate(f - b(24), [20, 34], [0, 1], clamp) }}>
            Open source · github.com/yordanoskassa/breathwise · RevenueCat Shipaton 2026
          </div>
        </AbsoluteFill>
        <AbsoluteFill style={{ backgroundColor: '#fff', opacity: flash }} />
      </Sequence>
    </AbsoluteFill>
  );
};
