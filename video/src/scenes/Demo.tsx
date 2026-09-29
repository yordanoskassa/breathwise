import { AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from 'remotion';

import { Background } from '../components/Background';
import { beatPulse } from '../components/Beat';
import { IconGrid, IconLock, IconScan, IconTimer, IconWave } from '../components/Icons';
import { Clip, Phone } from '../components/Phone';
import { Callout, Kinetic, Label } from '../components/Text';
import { CLIPS, localBeat, sceneStart } from '../timeline';
import { C, FPS, fontFamily } from '../theme';

const b = (k: number) => localBeat('demo', k);
const M = CLIPS.measure;

/**
 * Clip plan (all cuts on beats):
 *  A  1×  searching → heat → lock-on lands exactly on beat 24
 *  B  7×  the 60-second count flies by
 *  C  1×  last breaths → result pops on the section change
 */
const LOCK_BEAT = 24;
const aStart = M.lock - b(LOCK_BEAT) / FPS;
const aEnd = aStart + b(28) / FPS;
// The result pops ~0.6 s before the cut into the next section.
const cStart = M.resultIn - (b(56) - b(48)) / FPS + 0.6;
const bRate = (cStart - aEnd) / ((b(48) - b(28)) / FPS);

const SpeedBadge: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 6, len - 6, len], [0, 1, 1, 0], { extrapolateRight: 'clamp' });
  return (
    <div
      style={{
        position: 'absolute',
        top: 118,
        right: 22,
        opacity: o,
        fontFamily,
        fontSize: 20,
        fontWeight: 900,
        color: C.bg,
        background: C.teal,
        padding: '6px 14px',
        borderRadius: 999,
        letterSpacing: 1,
      }}>
      ▶▶ {Math.round(bRate)}× · 60 s COUNT
    </div>
  );
};

export const Demo: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const abs = f + sceneStart('demo');
  const enter = spring({ frame: f, fps, config: { damping: 16, stiffness: 90 } });
  // Push in on the camera card as it locks on (beat 24), pull back two bars later.
  const zoom = interpolate(f, [b(18), b(23), b(30), b(33)], [1, 1.45, 1.45, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const lockFlash = interpolate(f, [b(LOCK_BEAT) - 1, b(LOCK_BEAT), b(LOCK_BEAT) + 10], [0, 0.3, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const pulse = 1 + 0.012 * beatPulse(abs, 2, 8);

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill style={{ justifyContent: 'center', paddingLeft: 250 }}>
        <div
          style={{
            transform: `perspective(1800px) translateX(${(1 - enter) * -500}px) rotateY(${(1 - enter) * 28}deg) scale(${zoom * pulse})`,
            transformOrigin: '50% 39%',
            opacity: enter,
            width: 'fit-content',
            position: 'relative',
          }}>
          <Phone height={940} glow={C.teal}>
            <Sequence durationInFrames={b(28)}>
              <Clip file="measure.mp4" from={aStart} to={aEnd + 0.2} />
            </Sequence>
            <Sequence from={b(28)} durationInFrames={b(48) - b(28)}>
              <Clip file="measure.mp4" from={aEnd} to={cStart + 0.5} rate={bRate} />
              <SpeedBadge len={b(48) - b(28)} />
            </Sequence>
            <Sequence from={b(48)}>
              <Clip file="measure.mp4" from={cStart} to={M.end} />
            </Sequence>
            <div style={{ position: 'absolute', inset: 0, background: C.teal, opacity: lockFlash, mixBlendMode: 'screen' }} />
          </Phone>
        </div>
      </AbsoluteFill>

      <div
        style={{
          position: 'absolute',
          left: 250,
          bottom: 22,
          width: 460,
          textAlign: 'center',
          fontFamily,
          fontSize: 18,
          fontWeight: 600,
          color: C.faint,
          opacity: enter,
        }}>
        Recorded in the iOS Simulator · simulated baby
      </div>
      <AbsoluteFill style={{ left: 900, width: 900, paddingTop: 140, gap: 20 }}>
        <Label n="01" text="Measure" />
        <Kinetic text="Point the camera. That’s it." size={70} delay={4} stagger={3} />
        <div style={{ height: 14 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 820 }}>
          <Callout at={b(4)} icon={<IconScan color={C.sky} />} color={C.sky} text="Finds the breathing on its own" sub="No setup, no touching, no wearable" />
          <Callout at={b(LOCK_BEAT)} icon={<IconGrid color={C.teal} />} text="Locks onto the chest" sub="Glowing tiles show where it sees breathing" />
          <Callout at={b(32)} icon={<IconWave color={C.teal} />} text="Counts every breath, live" sub="A dot on the waveform and a gentle pulse" />
          <Callout at={b(40)} icon={<IconTimer color={C.amber} />} color={C.amber} text="The WHO method: 60 seconds" sub="The clock pauses by itself if the child moves" />
          <Callout at={b(48)} icon={<IconLock color={C.violet} />} color={C.violet} text="Nothing is recorded" sub="Video never leaves the phone" />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
