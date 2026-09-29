/** WHO-standard manual count: tap each breath for a full 60 seconds. */
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { fromTaps } from '@/clinical/record';
import { useSubject } from '@/clinical/subject';
import { formatAge } from '@/clinical/who';
import { breathPulse, success } from '@/feedback';
import { useT } from '@/i18n';
import { useApp } from '@/store/app';
import { C, S } from '@/theme';
import { Press, Row, Screen, T } from '@/ui/core';
import { Icon } from '@/ui/icon';
import { BreathOrb } from '@/ui/orb';
import { CountRing } from '@/ui/ring';

const SECONDS = 60;

export default function TapScreen() {
  const t = useT();
  const { child, childId, ageMonths } = useSubject();
  const setDraft = useApp((s) => s.setDraft);
  const [taps, setTaps] = useState<number[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);
  const doneRef = useRef(false);
  const tapsRef = useRef<number[]>([]);

  useEffect(() => {
    const id = setInterval(() => {
      if (startRef.current === null || doneRef.current) return;
      const e = (Date.now() - startRef.current) / 1000;
      setElapsed(Math.min(e, SECONDS));
      if (e >= SECONDS) {
        doneRef.current = true;
        success();
        setDraft(fromTaps(tapsRef.current, SECONDS, { childId, ageMonths }));
        setTimeout(() => router.replace('/result'), 400);
      }
    }, 100);
    return () => clearInterval(id);
  }, [childId, ageMonths, setDraft]);

  const onTap = () => {
    if (doneRef.current) return;
    if (startRef.current === null) startRef.current = Date.now();
    breathPulse();
    tapsRef.current = [...tapsRef.current, (Date.now() - startRef.current) / 1000];
    setTaps(tapsRef.current);
  };

  const started = startRef.current !== null;
  return (
    <Screen edges={['top', 'bottom']}>
      <Row style={styles.top}>
        <Press onPress={() => router.back()} style={styles.iconBtn} hitSlop={10}>
          <Icon ios="xmark" android="close" size={18} />
        </Press>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <T v="h2">{t('tap.title')}</T>
          <T v="small" color={C.dim}>
            {(child?.name ? child.name + ' · ' : '') + formatAge(ageMonths, t)}
          </T>
        </View>
        <View style={{ width: 38 }} />
      </Row>

      <View style={styles.body}>
        <T color={C.dim} style={{ textAlign: 'center', paddingHorizontal: S.xl }}>
          {t('tap.instructions')}
        </T>
        <CountRing progress={elapsed / SECONDS} size={300}>
          <Press onPress={onTap} style={styles.tapZone}>
            <BreathOrb size={240} pulse={taps.length} />
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <View style={styles.center}>
                <T v="hero" style={{ fontSize: 72 }}>
                  {taps.length}
                </T>
                <T v="small" color={C.bg} style={{ fontWeight: '700' }}>
                  {started ? t('tap.each') : t('tap.start')}
                </T>
              </View>
            </View>
          </Press>
        </CountRing>
        <T v="num" color={C.teal}>
          {Math.max(0, Math.ceil(SECONDS - elapsed))}s
        </T>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: S.lg, paddingVertical: S.sm },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.surfaceHi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: S.xl },
  tapZone: { width: 240, height: 240, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
