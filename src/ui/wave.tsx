/** Waveform plots: the live breathing trace and the saved 60 s signal. */
import {
  Canvas,
  Circle,
  LinearGradient,
  Path,
  Skia,
  type SkPath,
  vec,
} from '@shopify/react-native-skia';
import { useMemo } from 'react';

import { C } from '@/theme';

function robustScale(values: number[]): number {
  if (values.length === 0) return 1;
  const abs = values.map(Math.abs).sort((a, b) => a - b);
  return Math.max(abs[Math.floor(abs.length * 0.95)] ?? 1, 0.3);
}

function buildPath(values: number[], w: number, h: number, scale: number, pad: number): { line: SkPath; fill: SkPath; pts: { x: number; y: number }[] } {
  const line = Skia.Path.Make();
  const fill = Skia.Path.Make();
  const n = values.length;
  const pts = values.map((v, i) => ({
    x: n > 1 ? (i / (n - 1)) * w : 0,
    y: h / 2 - Math.max(-1.15, Math.min(1.15, v / scale)) * (h / 2 - pad),
  }));
  if (pts.length === 0) return { line, fill, pts };
  line.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1];
    const q = pts[i];
    const mx = (p.x + q.x) / 2;
    line.cubicTo(mx, p.y, mx, q.y, q.x, q.y);
  }
  fill.addPath(line);
  fill.lineTo(pts[pts.length - 1].x, h);
  fill.lineTo(pts[0].x, h);
  fill.close();
  return { line, fill, pts };
}

export function LiveWave({
  values,
  markers = [],
  width,
  height,
  color = C.teal,
  dim,
}: {
  values: number[];
  markers?: number[];
  width: number;
  height: number;
  color?: string;
  dim?: boolean;
}) {
  const { line, fill, pts } = useMemo(
    () => buildPath(values, width, height, robustScale(values), 10),
    [values, width, height],
  );
  return (
    <Canvas style={{ width, height }}>
      <Path path={fill} opacity={dim ? 0.15 : 0.35}>
        <LinearGradient start={vec(0, 0)} end={vec(0, height)} colors={[color + '88', color + '00']} />
      </Path>
      <Path path={line} style="stroke" strokeWidth={3} strokeCap="round" opacity={dim ? 0.4 : 1}>
        <LinearGradient start={vec(0, 0)} end={vec(width, 0)} colors={[color + '10', color, C.white]} />
      </Path>
      {markers.map((i) =>
        pts[i] ? <Circle key={i} cx={pts[i].x} cy={pts[i].y} r={4.5} color={C.white} opacity={dim ? 0.4 : 0.95} /> : null,
      )}
    </Canvas>
  );
}

/** Static full-recording plot for results, history and the PDF preview. */
export function SignalPlot({
  values,
  breathTimes,
  rate,
  width,
  height,
  color = C.teal,
}: {
  values: number[];
  breathTimes: number[];
  rate: number;
  width: number;
  height: number;
  color?: string;
}) {
  // Snap each breath to the local peak so dots sit on the crests.
  const markerIdx = useMemo(
    () =>
      breathTimes.map((t) => {
        const i = Math.round(t * rate);
        let best = i;
        for (let k = Math.max(0, i - 3); k <= Math.min(values.length - 1, i + 3); k++) if (values[k] > (values[best] ?? -Infinity)) best = k;
        return best;
      }),
    [breathTimes, rate, values],
  );
  return <LiveWave values={values} markers={markerIdx} width={width} height={height} color={color} />;
}
