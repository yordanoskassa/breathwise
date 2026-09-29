/** Rate-over-time chart with the fast-breathing line for the child's age. */
import { Canvas, Circle, DashPathEffect, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { View } from 'react-native';

import { C, toneColor, type Tone } from '@/theme';

import { T } from './core';

export type TrendPoint = { at: number; rate: number; tone: Tone };

export function TrendChart({
  points,
  fastAt,
  width,
  height,
  fastLabel,
}: {
  points: TrendPoint[];
  fastAt: number;
  width: number;
  height: number;
  fastLabel: string;
}) {
  const pad = 14;
  const data = useMemo(() => [...points].sort((a, b) => a.at - b.at), [points]);
  const maxRate = Math.max(fastAt + 15, ...data.map((p) => p.rate + 8));
  const minRate = Math.max(0, Math.min(fastAt - 25, ...data.map((p) => p.rate - 8)));
  const y = (r: number) => pad + (1 - (r - minRate) / (maxRate - minRate)) * (height - pad * 2);
  const x = (i: number) => (data.length <= 1 ? width / 2 : pad + (i / (data.length - 1)) * (width - pad * 2));

  const { line, fill } = useMemo(() => {
    const l = Skia.Path.Make();
    const f = Skia.Path.Make();
    data.forEach((p, i) => {
      if (i === 0) l.moveTo(x(i), y(p.rate));
      else {
        const mx = (x(i - 1) + x(i)) / 2;
        l.cubicTo(mx, y(data[i - 1].rate), mx, y(p.rate), x(i), y(p.rate));
      }
    });
    if (data.length > 1) {
      f.addPath(l);
      f.lineTo(x(data.length - 1), height);
      f.lineTo(x(0), height);
      f.close();
    }
    return { line: l, fill: f };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, width, height, maxRate, minRate]);

  const threshold = Skia.Path.Make();
  threshold.moveTo(0, y(fastAt));
  threshold.lineTo(width, y(fastAt));

  return (
    <View>
      <Canvas style={{ width, height }}>
        <Path path={threshold} style="stroke" strokeWidth={1.5} color={C.amber} opacity={0.8}>
          <DashPathEffect intervals={[6, 6]} />
        </Path>
        <Path path={fill} opacity={0.3}>
          <LinearGradient start={vec(0, 0)} end={vec(0, height)} colors={[C.teal + 'AA', C.teal + '00']} />
        </Path>
        <Path path={line} style="stroke" strokeWidth={3} color={C.teal} strokeCap="round" />
        {data.map((p, i) => (
          <Circle key={p.at} cx={x(i)} cy={y(p.rate)} r={5} color={toneColor(p.tone)} />
        ))}
      </Canvas>
      <T v="small" color={C.amber} style={{ position: 'absolute', right: 4, top: y(fastAt) - 20 }}>
        {fastLabel}
      </T>
    </View>
  );
}
