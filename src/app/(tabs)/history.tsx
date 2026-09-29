import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ago } from '@/clinical/ago';
import { ageInMonths, classify, thresholdFor } from '@/clinical/who';
import { useT } from '@/i18n';
import { usePro } from '@/purchases';
import { type Measurement, useApp } from '@/store/app';
import { C, R, S, toneColor } from '@/theme';
import { Card, Press, Row, Screen, T } from '@/ui/core';
import { Icon } from '@/ui/icon';
import { TrendChart } from '@/ui/trend';

const FREE_LIMIT = 3;

export default function History() {
  const t = useT();
  const { width } = useWindowDimensions();
  const pro = usePro();
  const children = useApp((s) => s.children);
  const all = useApp((s) => s.measurements);
  const setDraft = useApp((s) => s.setDraft);
  const [picked, setPicked] = useState<string | null>(null);
  // Default to the first child once one exists (the tab may mount before any).
  const filter = picked ?? children[0]?.id ?? 'all';
  const setFilter = setPicked;

  const list = useMemo(
    () => (filter === 'all' ? all : all.filter((m) => (filter === 'quick' ? m.childId === null : m.childId === filter))),
    [all, filter],
  );
  const child = children.find((c) => c.id === filter);
  const fastAt = thresholdFor(child ? ageInMonths(child.birth) : list[0]?.ageMonths ?? 30).fastAt;
  const visible = pro ? list : list.slice(0, FREE_LIMIT);
  const chartW = width - S.lg * 4;

  const open = (m: Measurement) => {
    setDraft(m);
    router.push('/result');
  };

  const filters = [
    ...children.map((c) => ({ id: c.id, label: c.name, color: c.color })),
    { id: 'quick', label: t('home.quick'), color: C.sky },
    { id: 'all', label: '∑', color: C.dim },
  ];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <T v="display" style={styles.pad}>
          {t('h.title')}
        </T>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {filters.map((f) => (
            <Press key={f.id} onPress={() => setFilter(f.id)} style={[styles.chip, filter === f.id && { backgroundColor: f.color }]}>
              <T v="small" color={filter === f.id ? C.bg : C.text} style={{ fontWeight: '700' }}>
                {f.label}
              </T>
            </Press>
          ))}
        </ScrollView>

        {list.length === 0 ? (
          <View style={styles.empty}>
            <Icon ios="waveform.path" android="show_chart" size={34} color={C.faint} />
            <T color={C.dim}>{t('h.empty')}</T>
          </View>
        ) : (
          <>
            <Animated.View entering={FadeInDown} style={styles.pad}>
              <Card style={{ gap: S.md }}>
                <T v="h2">{t('h.trend')}</T>
                <TrendChart
                  points={list.slice(0, 30).map((m) => ({ at: m.at, rate: m.rate, tone: m.tone }))}
                  fastAt={fastAt}
                  width={chartW}
                  height={170}
                  fastLabel={t('h.fastLine', { n: fastAt })}
                />
                {!pro ? (
                  <Press onPress={() => router.push('/paywall')} style={StyleSheet.absoluteFill}>
                    <BlurView intensity={28} tint="dark" style={[StyleSheet.absoluteFill, styles.lock]}>
                      <Icon ios="lock.fill" android="lock" size={22} color={C.violet} />
                      <T v="h2" style={{ textAlign: 'center' }}>
                        {t('h.locked')}
                      </T>
                    </BlurView>
                  </Press>
                ) : null}
              </Card>
            </Animated.View>

            <View style={[styles.pad, { gap: S.sm }]}>
              {visible.map((m, i) => {
                const cls = classify(m.rate, m.ageMonths, m.signs);
                const name = children.find((c) => c.id === m.childId)?.name ?? t('home.quick');
                return (
                  <Animated.View key={m.id} entering={FadeInDown.delay(60 * i)}>
                    <Press onPress={() => open(m)} style={styles.item}>
                      <View style={[styles.bar, { backgroundColor: toneColor(cls.tone) }]} />
                      <T v="num" style={{ width: 48 }}>
                        {m.rate}
                      </T>
                      <View style={{ flex: 1 }}>
                        <T v="h2" color={toneColor(cls.tone)}>
                          {t(cls.key)}
                        </T>
                        <T v="small" color={C.dim}>
                          {name} · {ago(m.at, t)}
                        </T>
                      </View>
                      <Icon ios={m.method === 'camera' ? 'camera.fill' : 'hand.tap.fill'} android={m.method === 'camera' ? 'photo_camera' : 'touch_app'} size={15} color={C.faint} />
                    </Press>
                  </Animated.View>
                );
              })}
              {!pro && list.length > FREE_LIMIT ? (
                <Press onPress={() => router.push('/paywall')} style={[styles.item, { justifyContent: 'center' }]}>
                  <Icon ios="lock.fill" android="lock" size={14} color={C.violet} />
                  <T v="small" color={C.violet} style={{ fontWeight: '700' }}>
                    +{list.length - FREE_LIMIT} · {t('h.locked')}
                  </T>
                </Press>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: S.lg, paddingTop: S.md, paddingBottom: 120 },
  pad: { paddingHorizontal: S.lg },
  chips: { gap: S.sm, paddingHorizontal: S.lg },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: R.pill, backgroundColor: C.surfaceHi },
  empty: { alignItems: 'center', gap: S.md, paddingTop: 80 },
  lock: { alignItems: 'center', justifyContent: 'center', gap: S.sm, borderRadius: R.lg, overflow: 'hidden', padding: S.xl },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    padding: S.md,
    borderRadius: R.md,
    backgroundColor: C.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    overflow: 'hidden',
  },
  bar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
});
