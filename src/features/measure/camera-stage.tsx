/**
 * The camera card: live preview (or simulated patient), breathing heatmap,
 * lock-on brackets, a scanning sweep while searching, and a status pill.
 */
import { Canvas, ColorMatrix, Image as SkiaImage, type SkImage } from '@shopify/react-native-skia';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Camera, type CameraDevice, type CameraRef, type CameraFrameOutput } from 'react-native-vision-camera';

import type { SessionSnapshot } from '@/dsp/session';
import { useT } from '@/i18n';
import { C, R } from '@/theme';
import { Pill } from '@/ui/core';
import { HeatOverlay } from '@/ui/heatmap';

export function CameraStage({
  width,
  height,
  device,
  frameOutput,
  simImage,
  snap,
  pulse,
  torch,
  active,
}: {
  width: number;
  height: number;
  device: CameraDevice | undefined;
  frameOutput: CameraFrameOutput;
  simImage: SkImage | null;
  snap: SessionSnapshot;
  pulse: number;
  torch: boolean;
  active: boolean;
}) {
  const t = useT();
  const cameraRef = useRef<CameraRef>(null);
  const searching = snap.phase === 'searching';

  const sweep = useSharedValue(0);
  useEffect(() => {
    sweep.value = searching
      ? withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) }), -1, true)
      : withTiming(0, { duration: 300 });
  }, [searching, sweep]);
  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sweep.value * (height - 80) }],
    opacity: searching ? 1 : 0,
  }));

  // Once the scene is framed, freeze exposure/focus/white balance: auto
  // adjustments mid-count would look exactly like brightness "breathing".
  const onStarted = () => {
    setTimeout(async () => {
      const ctl = cameraRef.current?.controller;
      if (!ctl || !device) return;
      try {
        if (device.supportsExposureLocking) await ctl.lockCurrentExposure();
        if (device.supportsFocusLocking) await ctl.lockCurrentFocus();
        if (device.supportsWhiteBalanceLocking) await ctl.lockCurrentWhiteBalance();
      } catch {
        // Locking is a nice-to-have; the engine normalises brightness anyway.
      }
    }, 1500);
  };

  const status = snap.pauseReason === 'motion'
    ? { label: t('m.paused.motion'), color: C.amber }
    : snap.pauseReason === 'signal'
      ? { label: t('m.paused.signal'), color: C.amber }
      : searching
        ? { label: t('m.searching'), color: C.sky }
        : { label: t('m.locked'), color: C.teal };

  return (
    <View style={[styles.card, { width, height }]}>
      {simImage ? (
        <Canvas style={StyleSheet.absoluteFill}>
          <SkiaImage image={simImage} x={0} y={0} width={width} height={height} fit="cover">
            {/* Warm, low-light tint so the simulated feed reads like a night camera. */}
            <ColorMatrix matrix={[1.05, 0, 0, 0, 0.02, 0, 0.94, 0, 0, 0.01, 0, 0, 0.82, 0, 0, 0, 0, 0, 1, 0]} />
          </SkiaImage>
        </Canvas>
      ) : device ? (
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={active}
          outputs={[frameOutput]}
          constraints={[{ fps: 30 }]}
          resizeMode="cover"
          torchMode={torch ? 'on' : 'off'}
          onStarted={onStarted}
        />
      ) : null}

      <LinearGradient
        colors={['rgba(4,6,12,0.55)', 'rgba(4,6,12,0)', 'rgba(4,6,12,0)', 'rgba(4,6,12,0.65)']}
        locations={[0, 0.2, 0.75, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <HeatOverlay heat={snap.heat} width={width} height={height} locked={snap.locked} pulse={pulse} />

      <Animated.View style={[styles.sweep, { width }, sweepStyle]} pointerEvents="none">
        <LinearGradient colors={['rgba(77,168,255,0)', 'rgba(77,168,255,0.35)', 'rgba(60,240,200,0)']} style={{ flex: 1 }} />
      </Animated.View>

      <View style={styles.statusRow} pointerEvents="none">
        <Pill label={status.label} color={status.color} dot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: R.xl,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.borderHi,
  },
  sweep: { position: 'absolute', top: 0, left: 0, height: 80 },
  statusRow: { position: 'absolute', top: 14, left: 14, right: 14 },
});
