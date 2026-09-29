/**
 * The Breathwise orb: a softly glowing sphere that inhales and exhales.
 * Pass `rate` to breathe at a given pace, or `pulse` (a counter) to make it
 * bloom once per detected breath.
 */
import { Canvas, Circle, Group, RadialGradient, vec } from '@shopify/react-native-skia';
import { useEffect } from 'react';
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { C } from '@/theme';

export function BreathOrb({
  size = 220,
  rate = 14,
  colors = [C.teal, C.sky],
  pulse,
}: {
  size?: number;
  rate?: number;
  colors?: [string, string];
  pulse?: number;
}) {
  const breath = useSharedValue(0);
  const bloom = useSharedValue(0);

  useEffect(() => {
    if (pulse !== undefined) return;
    const half = (60 / rate / 2) * 1000;
    breath.value = withRepeat(
      withSequence(
        withTiming(1, { duration: half * 0.9, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: half * 1.1, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
  }, [rate, pulse, breath]);

  useEffect(() => {
    if (pulse === undefined || pulse === 0) return;
    bloom.value = withSequence(
      withTiming(1, { duration: 280, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) }),
    );
  }, [pulse, bloom]);

  const c = size / 2;
  const base = size * 0.27;
  const r = useDerivedValue(() => base * (1 + 0.14 * breath.value + 0.18 * bloom.value));
  // Kept inside the canvas (≤ size/2) so the glow never shows a clipped edge.
  const haloR = useDerivedValue(() => base * (1.35 + 0.2 * breath.value + 0.25 * bloom.value));
  const haloOpacity = useDerivedValue(() => 0.35 + 0.25 * breath.value + 0.4 * bloom.value);
  const ringR = useDerivedValue(() => base * (1.15 + 0.9 * bloom.value));
  const ringOpacity = useDerivedValue(() => 0.8 * bloom.value);

  return (
    <Canvas style={{ width: size, height: size }}>
      <Group opacity={haloOpacity}>
        <Circle cx={c} cy={c} r={size / 2}>
          <RadialGradient c={vec(c, c)} r={haloR} colors={[colors[0] + 'CC', colors[1] + '55', colors[1] + '00']} positions={[0.4, 0.72, 1]} />
        </Circle>
      </Group>
      <Circle cx={c} cy={c} r={ringR} style="stroke" strokeWidth={2} color={colors[0]} opacity={ringOpacity} />
      <Circle cx={c} cy={c} r={r}>
        <RadialGradient
          c={vec(c - base * 0.35, c - base * 0.4)}
          r={base * 1.6}
          colors={['#FFFFFF', colors[0], colors[1], '#1B3F86']}
          positions={[0, 0.22, 0.66, 1]}
        />
      </Circle>
    </Canvas>
  );
}
