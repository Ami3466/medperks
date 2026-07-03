import {
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_600SemiBold,
  Rubik_700Bold,
  useFonts,
} from '@expo-google-fonts/rubik';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Palette } from '@/constants/theme';
import { AuthProvider } from '@/lib/auth';
import { restoreLanguage } from '@/lib/i18n';
import { scheduleTimes } from '@/lib/medication';
import { cancelAllReminders, ensurePermission, scheduleDailyReminders, setupAndroidChannel } from '@/lib/notifications';
import { StoreProvider, useStore } from '@/lib/store';

SplashScreen.preventAutoHideAsync();

// Local-first entry: the device picks a role (caregiver / patient). API sync is
// optional and configured with EXPO_PUBLIC_API_URL.
function Gate() {
  const { state, hydrated } = useStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    const group = segments[0]; // 'welcome' | 'caregiver' | 'patient' | undefined
    if (!state.role) {
      if (group !== 'welcome') router.replace('/welcome');
      return;
    }
    const target = state.role === 'patient' ? 'patient' : 'caregiver';
    if (group !== target) router.replace(state.role === 'patient' ? '/patient' : '/caregiver');
  }, [hydrated, state.role, segments, router]);

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Palette.canvas } }} />;
}

/** Schedules daily dose reminders and routes notification taps to capture. */
function NotificationsBridge() {
  const router = useRouter();
  const { state, hydrated } = useStore();

  useEffect(() => {
    setupAndroidChannel();
    const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
      const url = resp.notification.request.content.data?.url as string | undefined;
      if (url) router.push(url as never);
    });
    return () => sub.remove();
  }, [router]);

  const times = scheduleTimes(state.schedule);
  const timesKey = times.join(',');
  const remindersOn = state.schedule.remindersEnabled;
  useEffect(() => {
    if (!hydrated) return;
    (async () => {
      if (remindersOn && times.length) {
        const ok = await ensurePermission();
        if (ok) await scheduleDailyReminders(times);
      } else {
        await cancelAllReminders();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, remindersOn, timesKey]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_600SemiBold,
    Rubik_700Bold,
  });
  const [langReady, setLangReady] = useState(false);

  useEffect(() => {
    restoreLanguage().finally(() => setLangReady(true));
  }, []);

  useEffect(() => {
    if (fontsLoaded && langReady) SplashScreen.hideAsync();
  }, [fontsLoaded, langReady]);

  if (!fontsLoaded || !langReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StoreProvider>
          <AuthProvider>
            <StatusBar style="dark" />
            <NotificationsBridge />
            <Gate />
          </AuthProvider>
        </StoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
