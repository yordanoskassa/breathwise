import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useT } from '@/i18n';
import { C, R, S } from '@/theme';
import { Card, Press, Row, T } from '@/ui/core';
import { Icon } from '@/ui/icon';
import { LiveWave } from '@/ui/wave';

const STEPS: [string, string][] = [
  ['square.grid.3x3.fill', 'grid_on'],
  ['waveform.path', 'graphic_eq'],
  ['checkmark.seal.fill', 'how_to_vote'],
  ['point.3.connected.trianglepath.dotted', 'hub'],
  ['timer', 'timer'],
];

/** A little animated breathing trace so the page itself feels alive. */
function useDemoWave(): { values: number[]; markers: number[] } {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 100);
    return () => clearInterval(id);
  }, []);
  const values: number[] = [];
  const markers: number[] = [];
  for (let i = 0; i < 100; i++) {
    const tt = (tick + i) / 10;
    const ph = 2 * Math.PI * 0.6 * tt;
    values.push(Math.sin(ph) + 0.15 * Math.sin(ph * 3.1));
    const next = Math.sin(2 * Math.PI * 0.6 * (tt + 0.1));
    const prev = Math.sin(2 * Math.PI * 0.6 * (tt - 0.1));
    if (Math.sin(ph) > prev && Math.sin(ph) >= next && Math.sin(ph) > 0.9) markers.push(i);
  }
  return { values, markers };
}

export default function How() {
  const t = useT();
  const { width } = useWindowDimensions();
  const demo = useDemoWave();

  return (
    <View style={styles.root}>
      <Press onPress={() => router.back()} style={styles.close} hitSlop={12}>
        <Icon ios="xmark" android="close" size={16} color={C.dim} />
      </Press>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <T v="display">{t('how.title')}</T>
        <Card style={{ paddingHorizontal: 0, paddingVertical: S.md }}>
          <LiveWave values={demo.values} markers={demo.markers} width={width - S.xl * 2} height={90} />
        </Card>
        {STEPS.map(([ios, android], i) => (
          <Animated.View key={i} entering={FadeInDown.delay(90 * i)}>
            <Row gap={S.lg} style={{ alignItems: 'flex-start' }}>
              <View style={styles.num}>
                <Icon ios={ios} android={android} size={18} color={C.teal} />
                {i < STEPS.length - 1 ? <View style={styles.rail} /> : null}
              </View>
              <View style={{ flex: 1, gap: 4, paddingBottom: S.lg }}>
                <T v="h2">{t(`how.${i + 1}.t`)}</T>
                <T v="small" color={C.dim}>
                  {t(`how.${i + 1}.b`)}
                </T>
              </View>
            </Row>
          </Animated.View>
        ))}
        <Card glow={C.teal}>
          <Row gap={S.sm}>
            <Icon ios="checkmark.shield.fill" android="verified" size={16} color={C.teal} />
            <T v="small" style={{ flex: 1 }}>
              {t('how.tests')}
            </T>
          </Row>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  close: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { padding: S.xl, gap: S.lg, paddingBottom: 60 },
  num: {
    width: 40,
    height: 40,
    borderRadius: R.sm,
    backgroundColor: C.teal + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rail: { position: 'absolute', top: 44, width: 2, height: 46, backgroundColor: C.teal + '33' },
});
