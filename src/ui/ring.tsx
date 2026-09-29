/** Circular 60-second progress ring with the live breath count inside. */
import { Canvas, Path, Skia, SweepGradient, vec } from '@shopify/react-native-skia';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Easing, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';

import { C } from '@/theme';

export function CountRing({
  progress,
  size,
  children,
  color = C.teal,
  paused,
}: {
  progress: number;
  size: number;
  children?: ReactNode;
  color?: string;
  paused?: boolean;
}) {
  const p = useSharedValue(progress);
  useEffect(() => {
    p.value = withTiming(progress, { duration: 250, easing: Easing.linear });
  }, [progress, p]);

  const stroke = 10;
  const r = (size - stroke) / 2 - 4;
  const c = size / 2;
  const track = Skia.Path.Make();
  track.addCircle(c, c, r);
  const arc = useDerivedValue(() => {
    const path = Skia.Path.Make();
    const sweep = Math.max(0.001, Math.min(1, p.value)) * 360;
    path.addArc({ x: c - r, y: c - r, width: r * 2, height: r * 2 }, -90, sweep);
    return path;
  });

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Path path={track} style="stroke" strokeWidth={stroke} color={C.border} />
        <Path path={arc} style="stroke" strokeWidth={stroke} strokeCap="round" opacity={paused ? 0.35 : 1}>
          <SweepGradient c={vec(c, c)} colors={[C.sky, color, C.white, C.sky]} />
        </Path>
      </Canvas>
      <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
