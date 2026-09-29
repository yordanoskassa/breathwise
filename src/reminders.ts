/**
 * Sick-night rechecks (Family): local notifications every 3 hours until 7 am.
 * Everything is scheduled on-device; nothing goes through a server.
 */
import * as Notifications from 'expo-notifications';
import { create } from 'zustand';

import { t } from '@/i18n';
import { success } from '@/feedback';

export const useReminders = create<{ until: number | null }>(() => ({ until: null }));

export async function scheduleSickNight(): Promise<void> {
  const perm = await Notifications.requestPermissionsAsync();
  if (!perm.granted) return;
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();
  const end = new Date(now);
  end.setHours(7, 0, 0, 0);
  if (end <= now) end.setDate(end.getDate() + 1);

  for (let at = new Date(now.getTime() + 3 * 3600_000); at <= end; at = new Date(at.getTime() + 3 * 3600_000)) {
    await Notifications.scheduleNotificationAsync({
      content: { title: t('app.name'), body: t('home.measure') + ' · ' + t('home.measure.sub') },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
    });
  }
  useReminders.setState({ until: end.getTime() });
  success();
}
