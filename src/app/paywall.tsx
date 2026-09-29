import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { PurchasesPackage } from 'react-native-purchases';

import { success } from '@/feedback';
import { useT } from '@/i18n';
import { buy, loadOffering, openCustomerCenter, restore, trialDays, usePurchases } from '@/purchases';
import { C, R, S } from '@/theme';
import { Button, Card, Press, Row, T } from '@/ui/core';
import { Icon } from '@/ui/icon';
import { BreathOrb } from '@/ui/orb';

const FEATURES: [string, string, string][] = [
  ['person.2.fill', 'group', 'p.f1'],
  ['chart.xyaxis.line', 'monitoring', 'p.f2'],
  ['doc.richtext.fill', 'picture_as_pdf', 'p.f3'],
  ['moon.stars.fill', 'bedtime', 'p.f4'],
];

function label(pkg: PurchasesPackage, t: (k: string) => string): string {
  if (pkg.packageType === 'ANNUAL') return t('p.annual');
  if (pkg.packageType === 'MONTHLY') return t('p.monthly');
  if (pkg.packageType === 'LIFETIME') return t('p.lifetime');
  return pkg.product.title;
}

export default function Paywall() {
  const t = useT();
  const { configured, pro, offering, loading, error } = usePurchases();
  const packages = offering?.availablePackages ?? [];
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (configured && !offering) void loadOffering();
  }, [configured, offering]);
  useEffect(() => {
    if (!selected && packages.length) {
      setSelected((packages.find((p) => p.packageType === 'ANNUAL') ?? packages[0]).identifier);
    }
  }, [packages, selected]);

  const pkg = packages.find((p) => p.identifier === selected) ?? null;
  const trial = pkg ? trialDays(pkg) : null;

  const purchase = async () => {
    if (!pkg) return;
    setBusy(true);
    const ok = await buy(pkg);
    setBusy(false);
    if (ok) {
      success();
      router.back();
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#1B1446', '#0A1224', C.bg]} style={StyleSheet.absoluteFill} />
      <Press onPress={() => router.back()} style={styles.close} hitSlop={12}>
        <Icon ios="xmark" android="close" size={16} color={C.dim} />
      </Press>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', marginTop: -10 }}>
          <BreathOrb size={170} rate={12} colors={[C.violet, C.teal]} />
        </View>
        <T v="display" style={{ textAlign: 'center' }}>
          {t('p.title')}
        </T>
        <T color={C.dim} style={{ textAlign: 'center' }}>
          {t('p.sub')}
        </T>

        <View style={{ gap: S.md, marginVertical: S.sm }}>
          {FEATURES.map(([ios, android, key], i) => (
            <Animated.View key={key} entering={FadeInDown.delay(80 * i)}>
              <Row gap={S.md}>
                <View style={styles.featIcon}>
                  <Icon ios={ios} android={android} size={16} color={C.teal} />
                </View>
                <T v="h2">{t(key)}</T>
              </Row>
            </Animated.View>
          ))}
        </View>

        <Card glow={C.coral} style={{ gap: 6 }}>
          <Row gap={S.sm}>
            <Icon ios="heart.fill" android="favorite" size={15} color={C.coral} />
            <T v="h2" style={{ flex: 1 }}>
              {t('p.give')}
            </T>
          </Row>
          <T v="small" color={C.dim}>
            {t('p.free')}
          </T>
        </Card>

        {pro ? (
          <View style={{ gap: S.md }}>
            <T v="h2" color={C.teal} style={{ textAlign: 'center' }}>
              {t('p.active')}
            </T>
            <Button label={t('s.manage')} kind="secondary" onPress={openCustomerCenter} />
          </View>
        ) : !configured ? (
          <Card>
            <T v="small" color={C.amber}>
              {__DEV__ ? 'RevenueCat is not configured. Set EXPO_PUBLIC_RC_TEST_KEY in .env and rebuild.' : t('p.unavailable')}
            </T>
          </Card>
        ) : loading && !offering ? (
          <ActivityIndicator color={C.teal} />
        ) : (
          <View style={{ gap: S.sm }}>
            {packages.map((p) => {
              const on = p.identifier === selected;
              const days = trialDays(p);
              return (
                <Press key={p.identifier} onPress={() => setSelected(p.identifier)} style={[styles.pkg, on && styles.pkgOn]}>
                  <View style={[styles.radio, on && styles.radioOn]}>{on ? <View style={styles.radioDot} /> : null}</View>
                  <View style={{ flex: 1 }}>
                    <Row gap={S.sm}>
                      <T v="h2">{label(p, t)}</T>
                      {p.packageType === 'ANNUAL' ? (
                        <View style={styles.best}>
                          <T v="label" color={C.bg} style={{ fontSize: 10 }}>
                            {t('p.best')}
                          </T>
                        </View>
                      ) : null}
                    </Row>
                    {days ? (
                      <T v="small" color={C.teal}>
                        {t('p.trial', { days })}
                      </T>
                    ) : null}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <T v="h2">{p.product.priceString}</T>
                    {p.packageType === 'ANNUAL' && p.product.pricePerMonthString ? (
                      <T v="small" color={C.dim}>
                        {t('p.perMonth', { price: p.product.pricePerMonthString })}
                      </T>
                    ) : null}
                  </View>
                </Press>
              );
            })}
            {packages.length === 0 ? (
              <T v="small" color={C.amber} style={{ textAlign: 'center' }}>
                {error ?? t('p.unavailable')}
              </T>
            ) : null}
            <Button
              label={trial ? t('p.cta.trial') : t('p.cta')}
              loading={busy}
              disabled={!pkg}
              onPress={purchase}
              colors={[C.violet, C.teal]}
              style={{ marginTop: S.sm }}
            />
            <Row style={{ justifyContent: 'center' }} gap={S.lg}>
              <Press onPress={() => void restore().then((ok) => ok && router.back())}>
                <T v="small" color={C.dim} style={{ textDecorationLine: 'underline' }}>
                  {t('p.restore')}
                </T>
              </Press>
              <T v="small" color={C.faint}>
                {t('p.terms')}
              </T>
            </Row>
          </View>
        )}
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
  featIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.teal + '1F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pkg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    padding: S.lg,
    borderRadius: R.md,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  pkgOn: { borderColor: C.violet, backgroundColor: C.violet + '1A' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.faint, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: C.violet },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.violet },
  best: { backgroundColor: C.teal, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
});
