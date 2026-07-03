import { Stack } from 'expo-router';

import { Palette } from '@/constants/theme';

export default function PatientLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Palette.canvas },
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="rewards" options={{ presentation: 'card', animation: 'slide_from_right' }} />
      <Stack.Screen name="capture" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
    </Stack>
  );
}
