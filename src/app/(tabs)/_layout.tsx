import { Redirect } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useT } from '@/i18n';
import { useApp } from '@/store/app';
import { C } from '@/theme';

export default function TabsLayout() {
  const t = useT();
  const onboarded = useApp((s) => s.onboarded);
  if (!onboarded) return <Redirect href="/onboarding" />;

  return (
    <NativeTabs tintColor={C.teal} backgroundColor={C.bg} indicatorColor={C.surfaceHi} labelStyle={{ selected: { color: C.teal } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t('app.name')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'lungs', selected: 'lungs.fill' }} md="pulmonology" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="history">
        <NativeTabs.Trigger.Label>{t('h.title')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.xyaxis.line" md="monitoring" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>{t('s.title')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
