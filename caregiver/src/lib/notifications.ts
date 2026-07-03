import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import i18n from '@/lib/i18n';

/** Daily dose-reminder notifications. Local notifications (no server needed). */

const CHANNEL = 'dose-reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function setupAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: 'Dose reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF6B5A',
  });
}

export async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

/** Replace all scheduled reminders with one daily notification per dose time. */
export async function scheduleDailyReminders(times: string[]): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const t of times) {
    const [hour, minute] = t.split(':').map((n) => parseInt(n, 10));
    if (Number.isNaN(hour) || Number.isNaN(minute)) continue;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: i18n.t('notif.title'),
        body: i18n.t('notif.body'),
        data: { url: '/patient/capture' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: CHANNEL,
      },
    });
  }
}

export async function cancelAllReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
