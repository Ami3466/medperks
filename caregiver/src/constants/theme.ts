/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

/**
 * Brand palette. Two moods:
 *  - Patient surface: warm, game-like (coral / purple).
 *  - Caregiver surface: calm, control-center blue.
 * Used directly by screens via StyleSheet (separate from the themed-* tokens).
 */
export const Palette = {
  warm: '#FF6B5A',
  warmSoft: '#FFE9E4',
  purple: '#6C5CE7',
  purpleSoft: '#ECE9FE',
  brand: '#208AEF',
  brandSoft: '#E6F2FE',
  success: '#16A34A',
  successSoft: '#DCFCE7',
  missed: '#EF4444',
  missedSoft: '#FEE2E2',
  flag: '#F59E0B',
  ink: '#1A1A2E',
  muted: '#6B7280',
  line: '#E5E7EB',
  card: '#FFFFFF',
  canvas: '#F7F8FA',
} as const;

export const Radius = { sm: 8, md: 14, lg: 22, xl: 30, pill: 999 } as const;

/** Cross-platform soft shadow presets (iOS/web shadow* + Android elevation). */
export const Shadow = {
  card: {
    shadowColor: '#1A1A2E',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  lifted: {
    shadowColor: '#1A1A2E',
    shadowOpacity: 0.12,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
} as const;

export const Font = {
  regular: 'Rubik_400Regular',
  medium: 'Rubik_500Medium',
  semibold: 'Rubik_600SemiBold',
  bold: 'Rubik_700Bold',
} as const;
