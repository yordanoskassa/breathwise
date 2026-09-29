/**
 * Under the camera: the 60 s ring with the breath count, the live rate, the
 * scrolling waveform, and a tap strip to double-check the camera by hand.
 */
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';

import type { SessionSnapshot } from '@/dsp/session';
import { useT } from '@/i18n';
import { C, R, S } from '@/theme';
import { Press, T } from '@/ui/core';
import { CountRing } from '@/ui/ring';
import { LiveWave } from '@/ui/wave';

export function CountPanel({
  snap,
  pulse,
  width,
  verifyTaps,
  onVerifyTap,
}: {
  snap: SessionSnapshot;
  pulse: number;
  width: number;
  verifyTaps: number;
  onVerifyTap: () => void;
}) {
  const t = useT();
  const counting = snap.phase !== 'searching';
  const left = Math.max(0, Math.ceil(snap.target - snap.counted));
  const ringSize = 132;
  const waveW = width - ringSize - S.lg;

  return (
    <Press onPress={counting ? onVerifyTap : undefined} disabled={!counting} style={styles.panel}>
      <View style={styles.row}>
        <CountRing progress={snap.counted / snap.target} size={ringSize} paused={snap.pauseReason !== null}>
          {counting ? (
            <Animated.View key={pulse} entering={ZoomIn.springify().damping(12)} style={styles.center}>
              <T v="num" style={styles.count}>
                {snap.breaths}
              </T>
              <T v="small" color={C.dim}>
                {t('m.breaths')}
              </T>
            </Animated.View>
          ) : (
            <T v="small" color={C.dim} style={{ textAlign: 'center' }}>
              {t('m.searching')}
            </T>
          )}
        </CountRing>

        <View style={{ width: waveW, gap: 6 }}>
          <View style={styles.rateRow}>
            <T v="h2" color={snap.liveRate ? C.text : C.faint}>
              {snap.liveRate ? t('m.live', { rate: Math.round(snap.liveRate) }) : '—'}
            </T>
            {counting ? (
              <T v="label" color={C.teal}>
                {t('m.secondsLeft', { n: left })}
              </T>
            ) : null}
          </View>
          <LiveWave values={snap.wave} markers={snap.waveBreaths} width={waveW} height={84} dim={!snap.locked} />
        </View>
      </View>

      {counting ? (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.verify}>
          <T v="small" color={C.dim}>
            {verifyTaps > 0 ? t('m.verifyCount', { n: verifyTaps }) : t('m.verify')}
          </T>
        </Animated.View>
      ) : null}
    </Press>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: C.surface,
    borderRadius: R.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    padding: S.md,
    gap: S.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: S.lg },
  center: { alignItems: 'center' },
  count: { fontSize: 44, lineHeight: 48 },
  rateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  verify: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
    paddingTop: S.sm,
    alignItems: 'center',
  },
});
