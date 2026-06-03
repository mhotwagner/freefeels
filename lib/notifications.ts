import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { Reminder } from '@/lib/db';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function configureNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export async function hasNotificationPermission() {
  const permissions = await Notifications.getPermissionsAsync();
  return permissions.granted;
}

export async function requestNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();

  if (current.granted) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function reconcileReminderNotifications(reminders: Reminder[]) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const enabledReminders = reminders.filter((reminder) => reminder.enabled);

  for (const reminder of enabledReminders) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Check in',
        body: 'How are you feeling?',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: reminder.hour,
        minute: reminder.minute,
      },
    });
  }
}
