import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { GRID_CELLS } from '@/dsp/grid';
import { deviceLang, LANGUAGES, useT } from '@/i18n';
import { type LangCode, type Role, useApp } from '@/store/app';
import { C, R, S } from '@/theme';
import { Button, Press, Row, Screen, T } from '@/ui/core';
import { HeatOverlay } from '@/ui/heatmap';
import { Icon } from '@/ui/icon';
import { BreathOrb } from '@/ui/orb';

/** A chest-shaped patch of "breathing" cells for the privacy illustration. */
const DEMO_HEAT = (() => {
  const h = new Float64Array(GRID_CELLS);
  for (let i = 0; i < GRID_CELLS; i++) {
    const dx = ((i % 12) - 5.5) / 3.4;
    const dy = (Math.floor(i / 12) - 8.5) / 3;
    const d = dx * dx + dy * dy;
    h[i] = d < 0.55 ? 0.9 : d < 1.1 ? 0.4 : 0;
  }
  return h;
})();

export default function Onboarding() {
  const t = useT();
  const { width } = useWindowDimensions();
  const finish = useApp((s) => s.finishOnboarding);
  const setPrefs = useApp((s) => s.setPrefs);
  const lang = useApp((s) => s.lang);
  const [page, setPage] = useState(0);
  const [role, setRole] = useState<Role>('parent');
  const scroller = useRef<ScrollView>(null);
  useEffect(() => {
    setPrefs({ lang: deviceLang() });
  }, [setPrefs]);

  const go = (p: number) => {
    scroller.current?.scrollTo({ x: p * width, animated: true });
    setPage(p);
  };

  const pages = [
    <View key="1" style={styles.visual}>
      <BreathOrb size={300} rate={14} />
    </View>,
    <View key="2" style={styles.visual}>
      <T v="hero" color={C.amber} style={{ fontSize: 72 }}>
        740,000
      </T>
      <T v="small" color={C.dim}>
        {t('ob.2.stat')}
      </T>
    </View>,
    <View key="3" style={styles.visual}>
      <View style={styles.gridDemo}>
        <HeatOverlay heat={DEMO_HEAT} width={180} height={240} locked pulse={0} />
        <View style={styles.lock}>
          <Icon ios="lock.shield.fill" android="shield_lock" size={30} color={C.teal} />
        </View>
      </View>
    </View>,
  ];

  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        scrollEnabled={page < 3}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}>
        {[1, 2, 3].map((n, i) => (
          <View key={n} style={[styles.page, { width }]}>
            {pages[i]}
            <Animated.View entering={FadeInDown.delay(150)} style={styles.copy}>
              <T v="display" style={{ textAlign: 'center' }}>
                {t(`ob.${n}.title`)}
              </T>
              <T color={C.dim} style={{ textAlign: 'center' }}>
                {t(`ob.${n}.body`)}
              </T>
            </Animated.View>
          </View>
        ))}
        <View style={[styles.page, { width, justifyContent: 'center' }]}>
          <View style={styles.copy}>
            <T v="display" style={{ textAlign: 'center' }}>
              {t('ob.4.title')}
            </T>
          </View>
          <View style={{ gap: S.md, width: '100%', paddingHorizontal: S.lg }}>
            {(['parent', 'chw'] as Role[]).map((r) => (
              <Press key={r} onPress={() => setRole(r)} style={[styles.role, role === r && styles.roleOn]}>
                <Icon ios={r === 'parent' ? 'figure.and.child.holdinghands' : 'cross.case.fill'} android={r === 'parent' ? 'family_restroom' : 'medical_services'} size={26} color={role === r ? C.teal : C.dim} />
                <View style={{ flex: 1 }}>
                  <T v="h2">{t(`role.${r}`)}</T>
                  <T v="small" color={C.dim}>
                    {t(`role.${r}.desc`)}
                  </T>
                </View>
                {role === r ? <Icon ios="checkmark.circle.fill" android="check_circle" size={22} color={C.teal} /> : null}
              </Press>
            ))}
            <T v="label" color={C.dim} style={{ marginTop: S.md }}>
              {t('ob.language')}
            </T>
            <Row gap={S.sm} style={{ flexWrap: 'wrap' }}>
              {LANGUAGES.map((l) => (
                <Press key={l.code} onPress={() => setPrefs({ lang: l.code as LangCode })} style={[styles.chip, lang === l.code && styles.chipOn]}>
                  <T v="small" color={lang === l.code ? C.bg : C.text} style={{ fontWeight: '700' }}>
                    {l.label}
                  </T>
                </Press>
              ))}
            </Row>
          </View>
        </View>
      </ScrollView>

      <Animated.View entering={FadeIn.delay(300)} style={styles.footer}>
        <Row gap={6} style={{ justifyContent: 'center' }}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.dot, i === page && styles.dotOn]} />
          ))}
        </Row>
        <Button
          label={page < 3 ? t('common.continue') : t('ob.start')}
          onPress={() => {
            if (page < 3) return go(page + 1);
            finish(role, lang);
            router.replace('/');
          }}
        />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center', paddingTop: S.xl, gap: S.xl },
  visual: { height: 320, alignItems: 'center', justifyContent: 'center', gap: S.sm },
  copy: { paddingHorizontal: S.xl, gap: S.md },
  gridDemo: {
    width: 180,
    height: 240,
    borderRadius: R.lg,
    backgroundColor: '#0B1322',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.borderHi,
    overflow: 'hidden',
  },
  lock: { position: 'absolute', right: 10, bottom: 10 },
  footer: { paddingHorizontal: S.lg, gap: S.lg, paddingBottom: S.md },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.faint },
  dotOn: { width: 22, backgroundColor: C.teal },
  role: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    padding: S.lg,
    borderRadius: R.lg,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  roleOn: { borderColor: C.teal, backgroundColor: C.teal + '14' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: R.pill,
    backgroundColor: C.surfaceHi,
  },
  chipOn: { backgroundColor: C.teal },
});
