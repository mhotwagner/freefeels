import { Link, Stack, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';

import { initDb } from '@/lib/db';
import { configureNotificationsAsync } from '@/lib/notifications';

function HeaderLinks() {
  return (
    <View style={{ flexDirection: 'row', gap: 16 }}>
      <Link href="/history" asChild>
        <Pressable>
          <Text style={{ color: '#2563eb', fontWeight: '600' }}>History</Text>
        </Pressable>
      </Link>
      <Link href="/settings" asChild>
        <Pressable>
          <Text style={{ color: '#2563eb', fontWeight: '600' }}>Settings</Text>
        </Pressable>
      </Link>
    </View>
  );
}

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    void initDb();
    void configureNotificationsAsync();

    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      router.replace('/');
    });

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        router.replace('/');
      }
    });

    return () => {
      sub.remove();
    };
  }, [router]);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'How Are You Feeling', headerRight: HeaderLinks }} />
      <Stack.Screen name="history" options={{ title: 'History' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
    </Stack>
  );
}
