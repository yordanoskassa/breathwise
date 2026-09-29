/** Horizontal scale 0–90/min with the age's fast-breathing zone and a marker. */
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { C, R } from '@/theme';

import { T } from './core';

const MAX = 90;

export function RateGauge({ rate, fastAt, width }: { rate: number; fastAt: number; width: number }) {
  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withSpring((Math.min(rate, MAX) / MAX) * width, { damping: 14, stiffness: 90 });
  }, [rate, width, x]);
  const marker = useAnimatedStyle(() => ({ transform: [{ translateX: x.value - 9 }] }));
  const split = (fastAt / MAX) * width;

  return (
    <View style={{ width, gap: 6 }}>
      <View style={styles.track}>
        <LinearGradient colors={[C.sky, C.teal]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: split, height: '100%' }} />
        <LinearGradient colors={[C.amber, C.coral]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, height: '100%' }} />
      </View>
      <Animated.View style={[styles.marker, marker]} />
      <View style={{ height: 16 }}>
        <T v="small" color={C.faint} style={{ position: 'absolute', left: 0 }}>
          0
        </T>
        <T v="small" color={C.amber} style={{ position: 'absolute', left: split - 10, fontWeight: '700' }}>
          {fastAt}
        </T>
        <T v="small" color={C.faint} style={{ position: 'absolute', right: 0 }}>
          {MAX}
        </T>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 10, borderRadius: R.pill, overflow: 'hidden', flexDirection: 'row', opacity: 0.9 },
  marker: {
    position: 'absolute',
    top: -5,
    width: 18,
    height: 20,
    borderRadius: 9,
    backgroundColor: C.white,
    borderWidth: 3,
    borderColor: C.bg,
    shadowColor: '#fff',
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
});
