import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { QUICK_AGES } from '@/clinical/who';
import { ChildrenRow } from '@/features/home/children-row';
import { useT } from '@/i18n';
import { usePro } from '@/purchases';
import { useApp } from '@/store/app';
import { C, R, S } from '@/theme';
import { Button, Card, Pill, Press, Row, Screen, T } from '@/ui/core';
import { Icon } from '@/ui/icon';
import { BreathOrb } from '@/ui/orb';

function greetingKey(): string {
  const h = new Date().getHours();
  if (h < 5 || h >= 22) return 'home.night';
  if (h < 12) return 'home.morning';
  if (h < 18) return 'home.afternoon';
  return 'home.evening';
}

export default function Home() {
  const t = useT();
  const pro = usePro();
  const role = useApp((s) => s.role);
  const children = useApp((s) => s.children);
  const [selected, setSelected] = useState<string | null>(children[0]?.id ?? null);
  const [ageIdx, setAgeIdx] = useState(2);

  const quick = role === 'chw' || children.length === 0;
  const childId = children.some((c) => c.id === selected) ? selected : (children[0]?.id ?? null);
  const target = !quick && childId ? { child: childId } : { age: String(QUICK_AGES[ageIdx].months) };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Row style={styles.header}>
          <View style={{ flex: 1 }}>
            <T v="small" color={C.dim}>
              {t(greetingKey())}
            </T>
            <T v="display">{t('app.name')}</T>
          </View>
          {role === 'chw' ? (
            <Pill label={t('role.chw')} color={C.teal} dot />
          ) : pro ? (
            <Pill label={t('s.family')} color={C.violet} dot />
          ) : (
            <Press onPress={() => router.push('/paywall')}>
              <Pill label={t('home.pro')} color={C.violet} />
            </Press>
          )}
        </Row>

        <Animated.View entering={FadeInDown.duration(500)} style={{ paddingHorizontal: S.lg }}>
          <Press onPress={() => router.push({ pathname: '/measure', params: target })} style={styles.hero}>
            <LinearGradient colors={['#0F2A3F', '#0A1628']} style={StyleSheet.absoluteFill} />
            <LinearGradient colors={[C.teal + '30', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.7 }} style={StyleSheet.absoluteFill} />
            <BreathOrb size={210} rate={16} />
            <T v="title">{t('home.measure')}</T>
            <Row gap={6}>
              <Icon ios="camera.fill" android="photo_camera" size={13} color={C.teal} />
              <T v="small" color={C.teal}>
                {t('home.measure.sub')}
              </T>
            </Row>
          </Press>
        </Animated.View>

        {quick ? (
          <Animated.View entering={FadeInDown.delay(120)} style={{ gap: S.sm }}>
            <View style={styles.sectionHead}>
              <T v="label" color={C.dim}>
                {t('home.quick')}
              </T>
              <T v="small" color={C.faint}>
                {t('home.quick.sub')}
              </T>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {QUICK_AGES.map((a, i) => (
                <Press key={a.key} onPress={() => setAgeIdx(i)} style={[styles.chip, i === ageIdx && styles.chipOn]}>
                  <T v="small" color={i === ageIdx ? C.bg : C.text} style={{ fontWeight: '700' }}>
                    {t(a.key)}
                  </T>
                </Press>
              ))}
            </ScrollView>
          </Animated.View>
        ) : null}

        {role === 'parent' ? (
          <Animated.View entering={FadeInDown.delay(180)} style={{ gap: S.sm }}>
            <View style={styles.sectionHead}>
              <T v="label" color={C.dim}>
                {t('home.children')}
              </T>
            </View>
            <ChildrenRow selected={childId} onSelect={setSelected} />
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(240)} style={styles.pad}>
          <Button
            label={t('home.tap')}
            kind="secondary"
            icon={<Icon ios="hand.tap.fill" android="touch_app" size={17} />}
            onPress={() => router.push({ pathname: '/tap', params: target })}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)} style={styles.pad}>
          <Card glow={C.teal} style={{ gap: S.sm }}>
            <Row gap={S.sm}>
              <Icon ios="heart.fill" android="favorite" size={16} color={C.coral} />
              <T v="h2">{t('home.impact.title')}</T>
            </Row>
            <T v="small" color={C.dim}>
              {t('home.impact.body')}
            </T>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(360)} style={styles.pad}>
          <Press onPress={() => router.push('/how')} style={styles.howRow}>
            <Icon ios="waveform.path.ecg" android="ecg" size={18} color={C.sky} />
            <T v="h2" style={{ flex: 1 }}>
              {t('how.title')}
            </T>
            <Icon ios="chevron.right" android="chevron_right" size={14} color={C.faint} />
          </Press>
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: S.xl, paddingBottom: 120 },
  header: { paddingHorizontal: S.lg, paddingTop: S.md },
  hero: {
    borderRadius: R.xl,
    overflow: 'hidden',
    alignItems: 'center',
    paddingBottom: S.xl,
    gap: S.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.teal + '44',
  },
  sectionHead: { paddingHorizontal: S.lg, gap: 2 },
  chips: { gap: S.sm, paddingHorizontal: S.lg },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: R.pill,
    backgroundColor: C.surfaceHi,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
  },
  chipOn: { backgroundColor: C.teal, borderColor: C.teal },
  pad: { paddingHorizontal: S.lg },
  howRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    padding: S.lg,
    borderRadius: R.lg,
    backgroundColor: C.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
  },
});

