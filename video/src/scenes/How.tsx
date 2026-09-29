import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';

import { Field } from '../components/Field';
import { Reveal, Steps } from '../components/Text';
import { localBeat } from '../timeline';
import { C, display, EASE, text } from '../theme';

const b = (k: number) => localBeat('how', k);
const STEP_BEATS = 3;
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = { ...clamp, easing: EASE };

/** Deterministic pseudo-noise. */
const hash = (n: number) => {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s) - 0.5;
};

const SW = 480;
const SH = 640;

const heatAt = (i: number) => {
  const dx = ((i % 12) - 5.5) / 3.2;
  const dy = (Math.floor(i / 12) - 9) / 3.4;
  const d = dx * dx + dy * dy;
  return d < 0.6 ? 1 : d < 1.2 ? 0.4 : 0;
};

const Step1: React.FC<{ f: number }> = ({ f }) => {
  const grid = interpolate(f, [2, 30], [0, 1], ease);
  const mosaic = interpolate(f, [38, 54], [0, 1], ease);
  const note = interpolate(f, [56, 66], [0, 1], ease);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 40 }}>
      <div style={{ position: 'relative', width: SW, height: SH, overflow: 'hidden' }}>
        <Img src={staticFile('img/baby.png')} style={{ position: 'absolute', width: '100%', height: '100%' }} />
        <Img src={staticFile('img/mosaic.png')} style={{ position: 'absolute', width: '100%', height: '100%', opacity: mosaic }} />
        <svg width={SW} height={SH} style={{ position: 'absolute' }}>
          {Array.from({ length: 11 }).map((_, i) => (
            <line key={`v${i}`} x1={((i + 1) * SW) / 12} y1={0} x2={((i + 1) * SW) / 12} y2={SH * grid} stroke={C.white} strokeWidth={1.5} />
          ))}
          {Array.from({ length: 15 }).map((_, i) => (
            <line key={`h${i}`} x1={0} y1={((i + 1) * SH) / 16} x2={SW * grid} y2={((i + 1) * SH) / 16} stroke={C.white} strokeWidth={1.5} />
          ))}
        </svg>
      </div>
      <div style={{ opacity: note, width: 300, fontFamily: text, fontSize: 28, color: C.ink, lineHeight: 1.35 }}>
        <div style={{ fontFamily: display, fontSize: 96, lineHeight: 1 }}>192</div>
        brightness values per frame. The picture is dropped on the spot.
      </div>
    </div>
  );
};

const Step2: React.FC<{ f: number }> = ({ f }) => {
  const cw = SW / 12;
  const ch = SH / 16;
  const bars = Array.from({ length: 30 }).map((_, i) => {
    const bpm = 10 + i * 3;
    const peak = Math.exp(-((bpm - 46) ** 2) / 22);
    const grow = interpolate(f, [8 + i * 0.6, 56], [0, 1], ease);
    return (0.1 + 0.25 * Math.abs(hash(i * 5.3)) + peak) * grow;
  });
  return (
    <div style={{ display: 'flex', gap: 56, alignItems: 'flex-end' }}>
      <div style={{ position: 'relative', width: SW * 0.8, height: SH * 0.8 }}>
        <Img src={staticFile('img/mosaic.png')} style={{ width: '100%', height: '100%' }} />
        <svg width={SW * 0.8} height={SH * 0.8} style={{ position: 'absolute', left: 0, top: 0 }}>
          {Array.from({ length: 192 }).map((_, i) => {
            const h = heatAt(i);
            if (!h) return null;
            const on = interpolate(f, [4 + (i % 12) * 1.5, 16 + (i % 12) * 1.5], [0, 1], clamp);
            return (
              <rect
                key={i}
                x={(i % 12) * cw * 0.8 + 1}
                y={Math.floor(i / 12) * ch * 0.8 + 1}
                width={cw * 0.8 - 2}
                height={ch * 0.8 - 2}
                fill={C.green}
                opacity={on * (h > 0.5 ? 0.85 : 0.4)}
              />
            );
          })}
        </svg>
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 300, borderBottom: `2px solid ${C.ink}` }}>
          {bars.map((v, i) => (
            <div key={i} style={{ width: 13, height: Math.max(3, v * 250), background: Math.abs(10 + i * 3 - 46) < 3 ? C.green : C.ink, opacity: Math.abs(10 + i * 3 - 46) < 3 ? 1 : 0.8 }} />
          ))}
        </div>
        <div style={{ fontFamily: text, fontSize: 22, color: C.gray, marginTop: 12, display: 'flex', justifyContent: 'space-between', width: 570 }}>
          <span>10 /min</span>
          <span style={{ color: C.green, fontWeight: 800 }}>46 /min wins the vote</span>
          <span>100</span>
        </div>
      </div>
    </div>
  );
};

const Step3: React.FC<{ f: number }> = ({ f }) => {
  const merge = interpolate(f, [4, 50], [0, 1], ease);
  const w = 820;
  const h = 360;
  const line = (k: number, m: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 160; i++) {
      const x = (i / 160) * w;
      const ph = (i / 160) * Math.PI * 2 * 5;
      const indiv = Math.sin(ph + k * 0.5) * (0.4 + 0.3 * hash(k * 13)) + hash(i * 3 + k * 29) * 0.35;
      const v = indiv * (1 - m) + Math.sin(ph) * m;
      pts.push(`${x.toFixed(1)},${(h / 2 - v * (h / 2.6) + (1 - m) * (k - 4) * 14).toFixed(1)}`);
    }
    return pts.join(' ');
  };
  const peaks = Array.from({ length: 5 }).map((_, i) => ((i + 0.25) / 5) * w);
  const shown = Math.floor(interpolate(f, [50, 90], [0, 5.99], clamp));
  return (
    <div style={{ position: 'relative' }}>
      <svg width={w} height={h}>
        {Array.from({ length: 9 }).map((_, k) => (
          <polyline key={k} points={line(k, merge)} fill="none" stroke={C.ink} strokeOpacity={0.4 * (1 - merge) + 0.05} strokeWidth={2} />
        ))}
        <polyline points={line(4, 1)} fill="none" stroke={C.green} strokeWidth={7} opacity={merge} strokeLinecap="round" />
        {peaks.slice(0, shown).map((x, i) => (
          <circle key={i} cx={x} cy={h / 2 - h / 2.6} r={12} fill={C.ink} />
        ))}
      </svg>
      <div style={{ fontFamily: display, fontSize: 110, color: C.ink, position: 'absolute', right: 0, top: -110 }}>
        {shown}
        <span style={{ fontFamily: text, fontSize: 30, color: C.gray, fontWeight: 700 }}> breaths</span>
      </div>
    </div>
  );
};

const Step4: React.FC<{ f: number }> = ({ f }) => {
  const shake = f > 28 && f < 50;
  const counted = interpolate(f, [0, 28, 50, 92], [0, 22, 22, 60], clamp);
  const R = 170;
  const circ = 2 * Math.PI * R;
  const dx = shake ? Math.sin(f * 2.3) * 12 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 64, transform: `translateX(${dx}px)` }}>
      <svg width={400} height={400}>
        <circle cx={200} cy={200} r={R} stroke={C.paper} strokeWidth={22} fill="none" />
        <circle
          cx={200}
          cy={200}
          r={R}
          stroke={shake ? C.yellow : C.green}
          strokeWidth={22}
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - counted / 60)}
          transform="rotate(-90 200 200)"
        />
        <text x={200} y={228} textAnchor="middle" fontFamily={display} fontSize={86} fill={C.ink}>
          {Math.round(counted)}s
        </text>
      </svg>
      <div style={{ fontFamily: text, fontSize: 36, fontWeight: 800, color: C.ink, background: shake ? C.yellow : C.paper, padding: '14px 22px' }}>
        {shake ? 'Child moved: clock paused' : 'Counting clean signal'}
      </div>
    </div>
  );
};

export const How: React.FC = () => {
  const f = useCurrentFrame();
  const STEP = b(STEP_BEATS);
  const active = Math.min(3, Math.floor(f / STEP));
  const local = f - b(active * STEP_BEATS);
  const fade = interpolate(local, [0, 8], [0, 1], ease);
  const Stage = [Step1, Step2, Step3, Step4][active];
  return (
    <Field color={C.white}>
      <AbsoluteFill style={{ padding: '120px 140px', flexDirection: 'row', gap: 80 }}>
        <div style={{ width: 660 }}>
          <Reveal size={68} lines={['Video in.', 'Numbers out.', 'Breaths counted.']} />
          <div style={{ height: 40 }} />
          <Steps
            width={640}
            items={[
              { at: b(0), title: 'Shrink each frame to a grid' },
              { at: b(3), title: 'Cells vote on the rhythm', sub: 'Filtered to 8–108 breaths/min' },
              { at: b(6), title: 'Merge them into one trace', sub: 'Principal component analysis' },
              { at: b(9), title: 'Count for sixty seconds', sub: 'Pauses when the child moves' },
            ]}
          />
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: fade }}>
          <Stage f={local} />
        </div>
      </AbsoluteFill>
    </Field>
  );
};
