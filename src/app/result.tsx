import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { reclassify } from '@/clinical/record';
import { classify, type DangerSign, formatAge } from '@/clinical/who';
import { SignsCard } from '@/features/result/signs-card';
import { say, success, warn } from '@/feedback';
import { useT } from '@/i18n';
import { usePro } from '@/purchases';
import { shareReport } from '@/report/pdf';
import { useApp } from '@/store/app';
import { C, S, toneColor } from '@/theme';
import { Button, Card, Pill, Press, Row, Screen, T } from '@/ui/core';
import { RateGauge } from '@/ui/gauge';
import { Icon } from '@/ui/icon';
import { SignalPlot } from '@/ui/wave';

export default function ResultScreen() {
  const t = useT();
  const { width } = useWindowDimensions();
  const draft = useApp((s) => s.draft);
  const child = useApp((s) => s.children.find((c) => c.id === draft?.childId) ?? null);
  const updateDraft = useApp((s) => s.updateDraft);
  const saveDraft = useApp((s) => s.saveDraft);
  const pro = usePro();
  const [shown, setShown] = useState(0);
  const [sharing, setSharing] = useState(false);
  const spoke = useRef(false);

  const rate = draft?.rate ?? 0;
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / 900);
      setShown(Math.round(rate * (1 - Math.pow(1 - p, 3))));
      if (p >= 1) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [rate]);

  useEffect(() => {
    if (!draft || spoke.current) return;
    spoke.current = true;
    const c = classify(draft.rate, draft.ageMonths, draft.signs);
    say('v.done', { rate: draft.rate, verdict: t(c.key) });
  }, [draft, t]);

  if (!draft) return <Screen>{null}</Screen>;
  const cls = classify(draft.rate, draft.ageMonths, draft.signs);
  const tone = toneColor(cls.tone);
  const contentW = width - S.lg * 2;

  const toggleSign = (s: DangerSign) => {
    const signs = draft.signs.includes(s) ? draft.signs.filter((x) => x !== s) : [...draft.signs, s];
    const next = reclassify(draft, signs);
    if (next.tone === 'danger' && draft.tone !== 'danger') warn();
    updateDraft({ signs: next.signs, tone: next.tone });
  };

  const onShare = async () => {
    if (!pro) return router.push('/paywall');
    setSharing(true);
    try {
      await shareReport(draft, child);
    } finally {
      setSharing(false);
    }
  };

  return (
    <Screen edges={['top']}>
      <LinearGradient colors={[tone + '40', 'transparent']} style={styles.glow} pointerEvents="none" />
      <Row style={styles.top}>
        <Press onPress={() => router.dismissAll()} style={styles.iconBtn} hitSlop={10}>
          <Icon ios="xmark" android="close" size={18} />
        </Press>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <T v="h2">{child?.name ?? t('home.quick')}</T>
          <T v="small" color={C.dim}>
            {formatAge(draft.ageMonths, t)} · {new Date(draft.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </T>
        </View>
        <View style={{ width: 38 }} />
      </Row>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(500)} style={styles.hero}>
          <T v="hero" style={{ textShadowColor: tone, textShadowRadius: 30 }}>
            {shown}
          </T>
          <T v="label" color={C.dim}>
            {t('r.perMin')}
          </T>
          <View style={[styles.verdict, { backgroundColor: tone + '22', borderColor: tone + '77' }]}>
            <T v="title" color={tone}>
              {t(cls.key)}
            </T>
          </View>
          <T color={C.dim} style={{ textAlign: 'center', paddingHorizontal: S.lg }}>
            {t(cls.key + '.body', { fast: cls.threshold.fastAt })}
          </T>
          <View style={{ marginTop: S.md }}>
            <RateGauge rate={draft.rate} fastAt={cls.threshold.fastAt} width={contentW - S.xl} />
          </View>
          <T v="small" color={C.faint}>
            {cls.threshold.who ? t('r.who') : t('r.ref')} · {formatAge(draft.ageMonths, t)}
          </T>
        </Animated.View>

        {draft.method === 'camera' && draft.wave.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(250)}>
            <Card style={{ gap: S.md }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <T v="h2">{t('r.signal')}</T>
                {draft.confidenceLabel ? (
                  <Pill
                    label={`${t('r.confidence')}: ${t('conf.' + draft.confidenceLabel)}`}
                    color={draft.confidenceLabel === 'high' ? C.teal : draft.confidenceLabel === 'medium' ? C.sky : C.amber}
                  />
                ) : null}
              </Row>
              <SignalPlot values={draft.wave} breathTimes={draft.breathTimes} rate={draft.waveRate} width={contentW - S.lg * 2} height={110} color={tone} />
              <Row gap={S.sm} style={{ flexWrap: 'wrap' }}>
                <Pill label={t('r.method.camera')} color={C.sky} />
                {draft.corrected ? <Pill label={t('r.corrected')} color={C.violet} /> : null}
                {draft.verifyTaps ? <Pill label={t('r.verify', { cam: draft.countedBreaths, taps: draft.verifyTaps })} color={C.dim} /> : null}
              </Row>
            </Card>
          </Animated.View>
        ) : (
          <Pill label={t('r.method.tap')} color={C.sky} />
        )}

        <Animated.View entering={FadeInDown.delay(400)}>
          <SignsCard signs={draft.signs} onToggle={toggleSign} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(550)} style={{ gap: S.md }}>
          <Button
            label={draft.saved ? t('r.saved') : t('r.save')}
            disabled={draft.saved}
            icon={draft.saved ? <Icon ios="checkmark.circle.fill" android="check_circle" size={18} color={C.bg} /> : null}
            onPress={() => {
              saveDraft();
              success();
            }}
          />
          <Button
            label={t('r.share')}
            kind="secondary"
            loading={sharing}
            icon={<Icon ios={pro ? 'doc.richtext' : 'lock.fill'} android="picture_as_pdf" size={17} />}
            onPress={onShare}
          />
          <Button
            label={t('r.again')}
            kind="ghost"
            onPress={() => router.replace({ pathname: '/measure', params: draft.childId ? { child: draft.childId } : { age: String(draft.ageMonths) } })}
          />
          <T v="small" color={C.faint} style={{ textAlign: 'center', paddingHorizontal: S.lg }}>
            {t('r.disclaimer')}
          </T>
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  glow: { position: 'absolute', top: 0, left: 0, right: 0, height: 420 },
  top: { paddingHorizontal: S.lg, paddingVertical: S.sm },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.surfaceHi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { padding: S.lg, gap: S.lg, paddingBottom: 60 },
  hero: { alignItems: 'center', gap: S.sm, paddingTop: S.md },
  verdict: { paddingHorizontal: S.xl, paddingVertical: S.sm, borderRadius: 999, borderWidth: 1, marginTop: S.sm },
});
