import { type ReactNode } from 'react';
import { ActivityIndicator, Pressable, type PressableProps, StyleSheet, View, type ViewStyle } from 'react-native';

import { Font, Palette, Radius, Shadow } from '@/constants/theme';
import { AppText } from './text';

type Variant = 'primary' | 'soft' | 'ghost';
type Tone = 'warm' | 'brand' | 'success' | 'ink';
type Size = 'lg' | 'md';

const TONE_FILL: Record<Tone, string> = {
  warm: Palette.warm,
  brand: Palette.brand,
  success: Palette.success,
  ink: Palette.ink,
};
const TONE_SOFT: Record<Tone, string> = {
  warm: Palette.warmSoft,
  brand: Palette.brandSoft,
  success: Palette.successSoft,
  ink: '#ECEDF2',
};

export type ButtonProps = Omit<PressableProps, 'style'> & {
  title: string;
  variant?: Variant;
  tone?: Tone;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
};

export function Button({
  title,
  variant = 'primary',
  tone = 'brand',
  size = 'lg',
  loading,
  leftIcon,
  fullWidth = true,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isSoft = variant === 'soft';
  const fill = isPrimary ? TONE_FILL[tone] : isSoft ? TONE_SOFT[tone] : 'transparent';
  const fg = isPrimary ? '#FFFFFF' : TONE_FILL[tone];
  const off = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={off}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        { backgroundColor: fill },
        isPrimary && Shadow.card,
        fullWidth && { alignSelf: 'stretch' },
        off && { opacity: 0.5 },
        pressed && { transform: [{ scale: 0.97 }], opacity: 0.92 },
        style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {leftIcon}
          <AppText style={{ color: fg, fontFamily: Font.semibold, fontSize: size === 'lg' ? 17 : 15 }}>
            {title}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  lg: { height: 56, paddingHorizontal: 24 },
  md: { height: 46, paddingHorizontal: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
