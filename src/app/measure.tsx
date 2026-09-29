import * as Device from 'expo-device';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useCameraDevice, useCameraPermission } from 'react-native-vision-camera';

import { fromCamera } from '@/clinical/record';
import { useSubject } from '@/clinical/subject';
import { formatAge } from '@/clinical/who';
import type { SessionResult } from '@/dsp/session';
import { CameraStage } from '@/features/measure/camera-stage';
import { CountPanel } from '@/features/measure/count-panel';
import { stopVoice } from '@/feedback';
import { useT } from '@/i18n';
import { useApp } from '@/store/app';
import { C, S } from '@/theme';
import { Button, Card, Press, Row, Screen, T } from '@/ui/core';
import { Icon } from '@/ui/icon';
import { useCameraGridOutput, useSimulatedPatient } from '@/vision/sources';
import { useMeasure } from '@/vision/useMeasure';

export default function MeasureScreen() {
  const t = useT();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const { child, childId, ageMonths } = useSubject();
  const setDraft = useApp((s) => s.setDraft);
  const permission = useCameraPermission();
  const device = useCameraDevice('back');
  const [torch, setTorch] = useState(false);
  // The Simulator has no camera: go straight to the simulated patient there.
  const [sim, setSim] = useState(!Device.isDevice);
  const [verifyTaps, setVerifyTaps] = useState(0);
  const verifyTapsRef = useRef(0);

  const onDone = useCallback(
    (r: SessionResult) => {
      setDraft(fromCamera(r, { childId, ageMonths, verifyTaps: verifyTapsRef.current || null }));
      setTimeout(() => router.replace('/result'), 600);
    },
    [childId, ageMonths, setDraft],
  );
  const { snap, pulse, onGrid } = useMeasure(onDone);
  const frameOutput = useCameraGridOutput(onGrid);
  const simImage = useSimulatedPatient(sim, 46, onGrid);

  useEffect(() => () => stopVoice(), []);
  const onVerifyTap = () => {
    verifyTapsRef.current += 1;
    setVerifyTaps(verifyTapsRef.current);
  };

  const stageW = Math.min(screenW - S.lg * 2, (screenH * 0.5 * 3) / 4);
  const stageH = (stageW * 4) / 3;
  const noCamera = !device && !sim;
  const needsPermission = !sim && device && !permission.hasPermission;

  return (
    <Screen edges={['top', 'bottom']}>
      <Row style={styles.top}>
        <Press onPress={() => router.back()} style={styles.iconBtn} hitSlop={10}>
          <Icon ios="xmark" android="close" size={18} />
        </Press>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <T v="h2">{child?.name ?? t('home.quick')}</T>
          <T v="small" color={C.dim}>
            {formatAge(ageMonths, t)}
          </T>
        </View>
        <Press
          onPress={() => setTorch((v) => !v)}
          style={[styles.iconBtn, torch ? { backgroundColor: C.amber } : {}]}
          disabled={!device?.hasTorch}
          hitSlop={10}>
          <Icon ios={torch ? 'flashlight.on.fill' : 'flashlight.off.fill'} android="flashlight_on" size={17} color={torch ? C.bg : C.text} />
        </Press>
      </Row>

      <View style={styles.body}>
        {needsPermission ? (
          <Card style={{ width: stageW, gap: S.md, alignItems: 'center', paddingVertical: S.xxl }}>
            <Icon ios="camera.fill" android="photo_camera" size={36} color={C.teal} />
            <T v="title">{t('m.permission.title')}</T>
            <T color={C.dim} style={{ textAlign: 'center' }}>
              {t('m.permission.body')}
            </T>
            <Button
              label={permission.canRequestPermission ? t('m.permission.cta') : t('m.permission.settings')}
              onPress={() => (permission.canRequestPermission ? permission.requestPermission() : Linking.openSettings())}
              style={{ alignSelf: 'stretch' }}
            />
          </Card>
        ) : noCamera ? (
          <Card style={{ width: stageW, height: stageH, gap: S.md, alignItems: 'center', justifyContent: 'center' }}>
            <Icon ios="video.slash.fill" android="videocam_off" size={36} color={C.dim} />
            <T color={C.dim}>{t('m.noCamera')}</T>
            {!Device.isDevice || __DEV__ ? <Button label={t('m.demo')} kind="secondary" onPress={() => setSim(true)} /> : null}
            <Button label={t('m.useTap')} kind="ghost" onPress={() => router.replace({ pathname: '/tap', params: childParams(childId, ageMonths) })} />
          </Card>
        ) : (
          <Animated.View entering={FadeIn.duration(400)}>
            <CameraStage
              width={stageW}
              height={stageH}
              device={device}
              frameOutput={frameOutput}
              simImage={simImage}
              snap={snap}
              pulse={pulse}
              torch={torch}
              active={!sim && snap.phase !== 'done'}
            />
          </Animated.View>
        )}

        <View style={{ width: stageW, gap: S.md }}>
          <CountPanel snap={snap} pulse={pulse} width={stageW - S.md * 2} verifyTaps={verifyTaps} onVerifyTap={onVerifyTap} />
          {snap.phase === 'searching' ? <SearchTips seconds={snap.searchSeconds} onTap={() => router.replace({ pathname: '/tap', params: childParams(childId, ageMonths) })} /> : null}
        </View>
      </View>
    </Screen>
  );
}

function SearchTips({ seconds, onTap }: { seconds: number; onTap: () => void }) {
  const t = useT();
  if (seconds > 22) {
    return (
      <Animated.View entering={FadeInDown} style={{ gap: S.sm }}>
        <T v="small" color={C.amber} style={{ textAlign: 'center' }}>
          {t('m.slowSearch')}
        </T>
        <Button label={t('m.useTap')} kind="secondary" onPress={onTap} />
      </Animated.View>
    );
  }
  return (
    <Animated.View entering={FadeInDown.delay(300)} style={styles.tips}>
      {(['m.tip.1', 'm.tip.2', 'm.tip.3'] as const).map((k, i) => (
        <Row key={k} gap={S.sm}>
          <T v="label" color={C.teal}>
            {i + 1}
          </T>
          <T v="small" color={C.dim}>
            {t(k)}
          </T>
        </Row>
      ))}
    </Animated.View>
  );
}

function childParams(childId: string | null, ageMonths: number) {
  return childId ? { child: childId } : { age: String(ageMonths) };
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
  body: { flex: 1, alignItems: 'center', gap: S.md, paddingTop: S.sm },
  tips: { gap: 6, paddingHorizontal: S.sm },
});
