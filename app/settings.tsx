import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  addReminder,
  listReminders,
  Reminder,
  removeReminder,
  setAllRemindersEnabled,
} from '@/lib/db';
import {
  hasNotificationPermission,
  reconcileReminderNotifications,
  requestNotificationPermission,
} from '@/lib/notifications';
import { formatReminderTime } from '@/lib/time';

export default function SettingsScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [hourText, setHourText] = useState('9');
  const [minuteText, setMinuteText] = useState('00');

  const masterEnabled = useMemo(() => reminders.some((reminder) => reminder.enabled), [reminders]);

  const refresh = useCallback(async () => {
    const [nextReminders, granted] = await Promise.all([listReminders(), hasNotificationPermission()]);
    setReminders(nextReminders);
    setPermissionDenied(!granted);
  }, []);

  const refreshAndReconcile = useCallback(async () => {
    const nextReminders = await listReminders();
    setReminders(nextReminders);
    await reconcileReminderNotifications(nextReminders);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const ensurePermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setPermissionDenied(!granted);
    return granted;
  }, []);

  const onToggleMaster = async (nextValue: boolean) => {
    if (nextValue) {
      const granted = await ensurePermission();
      if (!granted) {
        return;
      }
    }

    await setAllRemindersEnabled(nextValue);
    await refreshAndReconcile();
  };

  const onAddReminder = async () => {
    const hour = Number.parseInt(hourText, 10);
    const minute = Number.parseInt(minuteText, 10);

    if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      Alert.alert('Invalid time', 'Use hour 0-23 and minute 0-59.');
      return;
    }

    // Adding a reminder is an explicit "I want this" — enable it (which also
    // flips the master switch on) rather than inheriting the current state.
    const granted = await ensurePermission();
    if (!granted) {
      return;
    }

    await addReminder(hour, minute, true);
    await refreshAndReconcile();
  };

  const onRemoveReminder = (reminder: Reminder) => {
    Alert.alert('Remove reminder?', formatReminderTime(reminder.hour, reminder.minute), [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void removeReminder(reminder.id).then(() => {
            void refreshAndReconcile();
          });
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.rowBetween}>
        <View style={styles.rowTextContainer}>
          <Text style={styles.rowTitle}>Enable reminders</Text>
          <Text style={styles.rowSubtitle}>Turn all reminders on or off.</Text>
        </View>
        <Switch value={masterEnabled} onValueChange={(value) => void onToggleMaster(value)} />
      </View>

      {permissionDenied ? (
        <View style={styles.permissionBox}>
          <Text style={styles.permissionText}>Reminders need notification permission.</Text>
          <Pressable style={styles.linkButton} onPress={() => void Linking.openSettings()}>
            <Text style={styles.linkButtonText}>Open system settings</Text>
          </Pressable>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Add reminder time</Text>
      <View style={styles.timeRow}>
        <TextInput
          value={hourText}
          onChangeText={setHourText}
          keyboardType="number-pad"
          style={styles.timeInput}
          maxLength={2}
          placeholder="HH"
        />
        <Text style={styles.timeSeparator}>:</Text>
        <TextInput
          value={minuteText}
          onChangeText={setMinuteText}
          keyboardType="number-pad"
          style={styles.timeInput}
          maxLength={2}
          placeholder="MM"
        />
        <Pressable style={styles.addButton} onPress={() => void onAddReminder()}>
          <Text style={styles.addButtonText}>Add</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Daily reminders</Text>
      {!reminders.length ? <Text style={styles.empty}>No reminders set.</Text> : null}
      {reminders.map((reminder) => (
        <View key={reminder.id} style={styles.reminderRow}>
          <Text style={styles.reminderText}>{formatReminderTime(reminder.hour, reminder.minute)}</Text>
          <Pressable onPress={() => onRemoveReminder(reminder)}>
            <Text style={styles.removeText}>Remove</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
    backgroundColor: '#fff',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  rowTextContainer: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  rowSubtitle: {
    color: '#6b7280',
  },
  permissionBox: {
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fef2f2',
    gap: 8,
  },
  permissionText: {
    color: '#991b1b',
  },
  linkButton: {
    alignSelf: 'flex-start',
  },
  linkButtonText: {
    color: '#1d4ed8',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeInput: {
    width: 56,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    textAlign: 'center',
    fontSize: 16,
  },
  timeSeparator: {
    fontSize: 24,
    color: '#374151',
  },
  addButton: {
    marginLeft: 6,
    backgroundColor: '#111827',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  empty: {
    color: '#6b7280',
  },
  reminderRow: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderText: {
    fontSize: 16,
    color: '#111827',
  },
  removeText: {
    color: '#b91c1c',
    fontWeight: '600',
  },
});
