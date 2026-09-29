import { AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from 'remotion';

import { Background } from '../components/Background';
import { beatPulse } from '../components/Beat';
import { Kinetic, Source } from '../components/Text';
import { localBeat } from '../timeline';
import { C, fontFamily } from '../theme';

const b = (k: number) => localBeat('hook', k);
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** A red ring pulses outward on every beat of the intro. */
const Pulse: React.FC = () => {
  const f = useCurrentFrame();
  const p = beatPulse(f, 2, 3);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      {[0, 1].map((k) => {
        const s = 1 - p;
        const size = 220 + (s + k * 0.5) * 700;
        return (
          <div
            key={k}
            style={{
              position: 'absolute',
              width: size,
              height: size,
              borderRadius: '50%',
              border: `2px solid ${C.coral}`,
              opacity: 0.4 * p * (1 - k * 0.4),
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** 60-second stopwatch ring that fills while a human tries to count. */
const Stopwatch: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(f, [4, 90], [0, 1], clamp);
  const s = spring({ frame: f, fps, config: { damping: 14 } });
  const R = 120;
  const circ = 2 * Math.PI * R;
  return (
    <div style={{ position: 'relative', width: 300, height: 300, transform: `scale(${s})` }}>
      <svg width={300} height={300}>
        <circle cx={150} cy={150} r={R} stroke="rgba(255,255,255,0.1)" strokeWidth={14} fill="none" />
        <circle
          cx={150}
          cy={150}
          r={R}
          stroke={C.sky}
          strokeWidth={14}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - p)}
          transform="rotate(-90 150 150)"
        />
        {Array.from({ length: 60 }).map((_, i) => {
          const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
          const on = i / 60 < p;
          return (
            <line
              key={i}
              x1={150 + Math.cos(a) * 92}
              y1={150 + Math.sin(a) * 92}
              x2={150 + Math.cos(a) * (i % 5 === 0 ? 76 : 84)}
              y2={150 + Math.sin(a) * (i % 5 === 0 ? 76 : 84)}
              stroke={on ? C.text : 'rgba(255,255,255,0.18)'}
              strokeWidth={i % 5 === 0 ? 4 : 2}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily,
          fontSize: 64,
          fontWeight: 800,
          color: C.text,
          fontVariantNumeric: 'tabular-nums',
        }}>
        {Math.round(p * 60)}s
      </div>
    </div>
  );
};

const Stat: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - 12, fps, config: { damping: 12, stiffness: 110 } });
  const hi = Math.round(interpolate(f, [12, 36], [0, 20], clamp));
  const lo = Math.round(interpolate(f, [12, 36], [0, 8], clamp));
  return (
    <div
      style={{
        fontFamily,
        fontSize: 220,
        fontWeight: 900,
        color: C.amber,
        letterSpacing: -10,
        lineHeight: 1,
        textShadow: `0 0 80px ${C.amber}55`,
        transform: `scale(${0.7 + 0.3 * s})`,
        opacity: s,
      }}>
      {lo}–{hi}%
    </div>
  );
};

export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const out = (a: number) => interpolate(f, [a - 6, a], [1, 0], clamp);
  return (
    <AbsoluteFill>
      <Background tint={C.coral} intensity={0.6} />
      <Sequence from={b(0)} durationInFrames={b(16) - b(0)}>
        <AbsoluteFill style={{ opacity: out(b(16)) }}>
          <Pulse />
          <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', gap: 28 }}>
            <Kinetic text="Every 43 seconds," size={120} stagger={4} style={{ justifyContent: 'center' }} />
            <Kinetic
              text="a child under five dies of pneumonia."
              size={60}
              weight={600}
              color={C.dim}
              delay={b(8) - b(0)}
              stagger={3}
              style={{ justifyContent: 'center' }}
              highlight={{ pneumonia: C.coral }}
            />
          </AbsoluteFill>
        </AbsoluteFill>
      </Sequence>
      <Sequence from={b(16)} durationInFrames={b(24) - b(16)}>
        <AbsoluteFill style={{ opacity: out(b(24)), alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 110 }}>
          <Stopwatch />
          <div style={{ width: 900, display: 'flex', flexDirection: 'column', gap: 22 }}>
            <Kinetic text="The first test is simple:" size={44} weight={600} color={C.dim} />
            <Kinetic text="count breaths for a full minute." size={92} delay={12} highlight={{ minute: C.sky }} />
          </div>
        </AbsoluteFill>
      </Sequence>
      <Sequence from={b(24)}>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', gap: 22 }}>
          <Kinetic text="But hand counts are often wrong." size={64} weight={700} style={{ justifyContent: 'center' }} />
          <Stat />
          <Kinetic
            text="of health-worker counts on young infants were within ±2 breaths."
            size={38}
            weight={500}
            color={C.dim}
            delay={30}
            stagger={2}
            style={{ justifyContent: 'center', width: 1300 }}
          />
          <div style={{ position: 'absolute', bottom: 56 }}>
            <Source text="Baker et al., 2019 (4-country trial) · WHO pneumonia fact sheet, 2019 data" at={36} />
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
