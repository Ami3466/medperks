import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { Font, Palette } from '@/constants/theme';

export default function CaregiverLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Palette.brand,
        tabBarInactiveTintColor: Palette.muted,
        tabBarLabelStyle: { fontFamily: Font.medium, fontSize: 11 },
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: Palette.line,
          height: Platform.select({ ios: 86, default: 64 }),
          paddingTop: 6,
        },
        tabBarItemStyle: { paddingVertical: 2 },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('caregiver.dashboard'),
          tabBarIcon: ({ color, size }) => <Ionicons name="grid" color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t('caregiver.calendar'),
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: t('caregiver.rewards'),
          tabBarIcon: ({ color, size }) => <Ionicons name="gift" color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('caregiver.settings'),
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen name="setup" options={{ href: null }} />
      <Tabs.Screen name="schedule" options={{ href: null }} />
      <Tabs.Screen name="review" options={{ href: null }} />
    </Tabs>
  );
}
