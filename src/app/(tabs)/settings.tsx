import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';

import { SOURCE_URL } from '@/config';
import { LANGUAGES, useT } from '@/i18n';
import { openCustomerCenter, restore, usePro, usePurchases } from '@/purchases';
import { scheduleSickNight, useReminders } from '@/reminders';
import { type LangCode, useApp } from '@/store/app';
import { C, R, S } from '@/theme';
import { Card, Pill, Press, Row, Screen, T } from '@/ui/core';
import { Icon } from '@/ui/icon';

function Item({ icon, label, right, onPress }: { icon: [string, string]; label: string; right?: ReactNode; onPress?: () => void }) {
  return (
    <Press onPress={onPress} disabled={!onPress} style={styles.item}>
      <Icon ios={icon[0]} android={icon[1]} size={18} color={C.sky} />
      <T style={{ flex: 1 }}>{label}</T>
      {right ?? (onPress ? <Icon ios="chevron.right" android="chevron_right" size={13} color={C.faint} /> : null)}
    </Press>
  );
}

export default function Settings() {
  const t = useT();
  const pro = usePro();
  const configured = usePurchases((s) => s.configured);
  const { role, lang, voice, haptics, setPrefs } = useApp();
  const remindersUntil = useReminders((s) => s.until);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <T v="display">{t('s.title')}</T>

        <Card style={styles.group}>
          <T v="label" color={C.dim}>
            {t('s.role')}
          </T>
          <Row gap={S.sm}>
            {(['parent', 'chw'] as const).map((r) => (
              <Press key={r} onPress={() => setPrefs({ role: r })} style={[styles.chip, role === r && styles.chipOn]}>
                <T v="small" color={role === r ? C.bg : C.text} style={{ fontWeight: '700' }}>
                  {t(`role.${r}`)}
                </T>
              </Press>
            ))}
          </Row>
          <T v="label" color={C.dim} style={{ marginTop: S.sm }}>
            {t('s.language')}
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
        </Card>

        <Card style={styles.list}>
          <Item icon={['speaker.wave.2.fill', 'volume_up']} label={t('s.voice')} right={<Switch value={voice} onValueChange={(v) => setPrefs({ voice: v })} trackColor={{ true: C.teal }} />} />
          <Item icon={['iphone.radiowaves.left.and.right', 'vibration']} label={t('s.haptics')} right={<Switch value={haptics} onValueChange={(v) => setPrefs({ haptics: v })} trackColor={{ true: C.teal }} />} />
          <Item
            icon={['moon.stars.fill', 'bedtime']}
            label={t('s.reminders')}
            right={
              remindersUntil ? (
                <Pill label={t('s.reminders.on')} color={C.teal} />
              ) : (
                <Icon ios={pro ? 'chevron.right' : 'lock.fill'} android="chevron_right" size={13} color={pro ? C.faint : C.violet} />
              )
            }
            onPress={() => (pro ? scheduleSickNight() : router.push('/paywall'))}
          />
        </Card>

        <Card style={styles.list}>
          <Item
            icon={['sparkles', 'workspace_premium']}
            label={t('s.subscription')}
            right={<Pill label={pro ? t('s.family') : t('s.free')} color={pro ? C.violet : C.dim} />}
            onPress={() => (pro ? openCustomerCenter() : router.push('/paywall'))}
          />
          {configured ? <Item icon={['person.crop.circle.badge.checkmark', 'manage_accounts']} label={t('s.manage')} onPress={openCustomerCenter} /> : null}
          <Item icon={['arrow.clockwise', 'restore']} label={t('s.restore')} onPress={() => void restore()} />
        </Card>

        <Card style={styles.list}>
          <Item icon={['waveform.path.ecg', 'ecg']} label={t('s.how')} onPress={() => router.push('/how')} />
          <Item icon={['chevron.left.forwardslash.chevron.right', 'code']} label={t('s.source')} onPress={() => Linking.openURL(SOURCE_URL)} />
          <Item icon={['lock.shield.fill', 'shield_lock']} label={t('s.privacy')} />
        </Card>

        <View style={{ alignItems: 'center', gap: 4 }}>
          <T v="small" color={C.faint} style={{ textAlign: 'center' }}>
            {t('s.disclaimer')}
          </T>
          <T v="small" color={C.faint}>
            Breathwise 1.0 · MIT
          </T>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: S.lg, padding: S.lg, paddingBottom: 120 },
  group: { gap: S.sm },
  list: { padding: 0, overflow: 'hidden' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    paddingHorizontal: S.lg,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: R.pill, backgroundColor: C.surfaceHi },
  chipOn: { backgroundColor: C.teal },
});
