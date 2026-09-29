import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

import { Background } from '../components/Background';
import { IconLock } from '../components/Icons';
import { Kinetic, Label } from '../components/Text';
import { C, fontFamily } from '../theme';

const STEP = 96;
const STEPS = [
  ['Each frame → 192 numbers', 'The picture itself is discarded instantly'],
  ['Cells vote on the rhythm', 'Band-pass 8–108 /min; periodic cells win'],
  ['Fused into one signal (PCA)', 'Every peak is one breath'],
  ['Counted the WHO way', '60 s of clean signal, auto-pause on movement'],
] as const;

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** Deterministic pseudo-noise. */
const hash = (n: number) => {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s) - 0.5;
};

const STAGE_W = 540;
const STAGE_H = 720;

/** Chest-shaped "breathing here" heat, matching the app's tiles. */
const heatAt = (i: number) => {
  const dx = ((i % 12) - 5.5) / 3.2;
  const dy = (Math.floor(i / 12) - 9) / 3.4;
  const d = dx * dx + dy * dy;
  return d < 0.6 ? 1 : d < 1.2 ? 0.45 : 0;
};

const Step1: React.FC<{ f: number }> = ({ f }) => {
  const grid = interpolate(f, [2, 26], [0, 1], clamp);
  const mosaic = interpolate(f, [36, 50], [0, 1], clamp);
  const lock = interpolate(f, [50, 60], [0, 1], clamp);
  return (
    <div style={{ position: 'relative', width: STAGE_W, height: STAGE_H, borderRadius: 34, overflow: 'hidden' }}>
      <Img src={staticFile('img/baby.png')} style={{ position: 'absolute', width: '100%', height: '100%' }} />
      <Img src={staticFile('img/mosaic.png')} style={{ position: 'absolute', width: '100%', height: '100%', opacity: mosaic }} />
      <svg width={STAGE_W} height={STAGE_H} style={{ position: 'absolute' }}>
        {Array.from({ length: 11 }).map((_, i) => {
          const x = ((i + 1) * STAGE_W) / 12;
          return <line key={`v${i}`} x1={x} y1={0} x2={x} y2={STAGE_H * grid} stroke={C.teal} strokeOpacity={0.55} strokeWidth={1.5} />;
        })}
        {Array.from({ length: 15 }).map((_, i) => {
          const y = ((i + 1) * STAGE_H) / 16;
          return <line key={`h${i}`} x1={0} y1={y} x2={STAGE_W * grid} y2={y} stroke={C.teal} strokeOpacity={0.55} strokeWidth={1.5} />;
        })}
      </svg>
      <div
        style={{
          position: 'absolute',
          right: 18,
          bottom: 18,
          opacity: lock,
          transform: `scale(${0.6 + 0.4 * lock})`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(4,6,12,0.8)',
          border: `1px solid ${C.teal}66`,
          borderRadius: 999,
          padding: '10px 18px',
          fontFamily,
          fontSize: 22,
          fontWeight: 700,
          color: C.teal,
        }}>
        <IconLock color={C.teal} size={22} /> video discarded
      </div>
    </div>
  );
};

const Step3: React.FC<{ f: number }> = ({ f }) => {
  const cw = STAGE_W / 12;
  const ch = STAGE_H / 16;
  const bars = Array.from({ length: 36 }).map((_, i) => {
    const bpm = 10 + i * 2.6;
    const peak = Math.exp(-((bpm - 46) ** 2) / 18);
    const grow = interpolate(f, [8 + i * 0.5, 50], [0, 1], clamp);
    return (0.08 + 0.6 * Math.abs(hash(i * 5.3)) * 0.4 + peak) * grow;
  });
  return (
    <div style={{ display: 'flex', gap: 60, alignItems: 'center' }}>
      <div style={{ position: 'relative', width: STAGE_W * 0.72, height: STAGE_H * 0.72, borderRadius: 26, overflow: 'hidden' }}>
        <Img src={staticFile('img/mosaic.png')} style={{ width: '100%', height: '100%' }} />
        <svg width={STAGE_W * 0.72} height={STAGE_H * 0.72} style={{ position: 'absolute', left: 0, top: 0 }}>
          {Array.from({ length: 192 }).map((_, i) => {
            const h = heatAt(i);
            if (!h) return null;
            const on = interpolate(f, [4 + (i % 12) * 1.5, 18 + (i % 12) * 1.5], [0, 1], clamp);
            return (
              <rect
                key={i}
                x={(i % 12) * cw * 0.72 + 2}
                y={Math.floor(i / 12) * ch * 0.72 + 2}
                width={cw * 0.72 - 4}
                height={ch * 0.72 - 4}
                rx={5}
                fill={h > 0.5 ? C.teal : C.sky}
                opacity={on * (h > 0.5 ? 0.75 : 0.35)}
              />
            );
          })}
        </svg>
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 300 }}>
          {bars.map((b, i) => (
            <div
              key={i}
              style={{
                width: 12,
                height: Math.max(4, b * 260),
                borderRadius: 4,
                background: Math.abs(10 + i * 2.6 - 46) < 3 ? C.teal : 'rgba(255,255,255,0.18)',
                boxShadow: Math.abs(10 + i * 2.6 - 46) < 3 ? `0 0 24px ${C.teal}` : 'none',
              }}
            />
          ))}
        </div>
        <div style={{ fontFamily, color: C.dim, fontSize: 22, marginTop: 14, display: 'flex', justifyContent: 'space-between' }}>
          <span>10</span>
          <span style={{ color: C.teal, fontWeight: 800 }}>46 /min wins</span>
          <span>100</span>
        </div>
      </div>
    </div>
  );
};

const Step4: React.FC<{ f: number }> = ({ f }) => {
  const merge = interpolate(f, [4, 44], [0, 1], clamp);
  const w = STAGE_W + 260;
  const h = 360;
  const line = (k: number, m: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 160; i++) {
      const x = (i / 160) * w;
      const ph = (i / 160) * Math.PI * 2 * 5;
      const indiv = Math.sin(ph + k * 0.5) * (0.4 + 0.3 * hash(k * 13)) + hash(i * 3 + k * 29) * 0.35;
      const fused = Math.sin(ph);
      const v = indiv * (1 - m) + fused * m;
      pts.push(`${x.toFixed(1)},${(h / 2 - v * (h / 2.6) + (1 - m) * (k - 4) * 14).toFixed(1)}`);
    }
    return pts.join(' ');
  };
  const peaks = Array.from({ length: 5 }).map((_, i) => ((i + 0.25) / 5) * w);
  const shown = Math.floor(interpolate(f, [44, 84], [0, 5.99], clamp));
  return (
    <div style={{ position: 'relative' }}>
      <svg width={w} height={h}>
        {Array.from({ length: 9 }).map((_, k) => (
          <polyline key={k} points={line(k, merge)} fill="none" stroke={C.sky} strokeOpacity={0.35 * (1 - merge) + 0.05} strokeWidth={2} />
        ))}
        <polyline points={line(4, 1)} fill="none" stroke={C.teal} strokeWidth={7} opacity={merge} strokeLinecap="round" />
        {peaks.slice(0, shown).map((x, i) => (
          <circle key={i} cx={x} cy={h / 2 - h / 2.6} r={11} fill="#fff" style={{ filter: `drop-shadow(0 0 10px ${C.teal})` }} />
        ))}
      </svg>
      <div style={{ fontFamily, fontSize: 90, fontWeight: 900, color: C.text, position: 'absolute', right: 0, top: -30 }}>
        {shown}
        <span style={{ fontSize: 30, color: C.dim, fontWeight: 600 }}> breaths</span>
      </div>
    </div>
  );
};

const Step5: React.FC<{ f: number }> = ({ f }) => {
  const shake = f > 30 && f < 50;
  const counted = interpolate(f, [0, 30, 50, 90], [0, 22, 22, 60], clamp);
  const R = 170;
  const circ = 2 * Math.PI * R;
  const dx = shake ? Math.sin(f * 2.3) * 14 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 70, transform: `translateX(${dx}px)` }}>
      <svg width={400} height={400}>
        <circle cx={200} cy={200} r={R} stroke="rgba(255,255,255,0.1)" strokeWidth={18} fill="none" />
        <circle
          cx={200}
          cy={200}
          r={R}
          stroke={shake ? C.amber : C.teal}
          strokeWidth={18}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - counted / 60)}
          transform="rotate(-90 200 200)"
          opacity={shake ? 0.5 : 1}
        />
        <text x={200} y={220} textAnchor="middle" fontFamily={fontFamily} fontSize={78} fontWeight={900} fill={C.text}>
          {Math.round(counted)}s
        </text>
      </svg>
      <div
        style={{
          fontFamily,
          fontSize: 34,
          fontWeight: 800,
          color: shake ? C.amber : C.teal,
          padding: '16px 26px',
          borderRadius: 999,
          background: (shake ? C.amber : C.teal) + '1f',
          border: `1.5px solid ${(shake ? C.amber : C.teal)}66`,
        }}>
        {shake ? 'Movement: clock paused' : 'Counting clean signal'}
      </div>
    </div>
  );
};

export const How: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const active = Math.min(3, Math.floor(f / STEP));
  const local = f - active * STEP;
  const fade = interpolate(local, [0, 8, STEP - 6, STEP], [0, 1, 1, active === 3 ? 1 : 0], clamp);
  const Stage = [Step1, Step3, Step4, Step5][active];

  return (
    <AbsoluteFill>
      <Background tint={C.sky} />
      <AbsoluteFill style={{ padding: '110px 130px', flexDirection: 'row', gap: 90 }}>
        <div style={{ width: 620, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Label n="02" text="How it works" color={C.sky} />
          <Kinetic text="Signal processing, not guesswork." size={60} delay={6} />
          <div style={{ height: 30 }} />
          {STEPS.map(([title, sub], i) => {
            const on = i === active;
            const done = i < active;
            const s = spring({ frame: f - i * STEP, fps, config: { damping: 20 } });
            return (
              <div
                key={i}
                style={{
                  fontFamily,
                  display: 'flex',
                  gap: 20,
                  alignItems: 'flex-start',
                  opacity: on ? 1 : done ? 0.55 : 0.28,
                  transform: `translateX(${on ? 12 * s : 0}px)`,
                }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: 22,
                    color: on ? C.bg : C.teal,
                    background: on ? C.teal : C.teal + '1a',
                  }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontSize: 30, fontWeight: 800, color: C.text }}>{title}</div>
                  <div style={{ fontSize: 21, color: C.dim, marginTop: 4, height: on ? 'auto' : 0, overflow: 'hidden' }}>{sub}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: fade }}>
          <Stage f={local} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
