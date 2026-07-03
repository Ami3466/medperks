import { type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Palette, Radius, Shadow } from '@/constants/theme';

export function Card({
  children,
  style,
  padded = true,
  tone = 'white',
}: {
  children: ReactNode;
  style?: ViewStyle;
  padded?: boolean;
  tone?: 'white' | 'plain';
}) {
  return (
    <View
      style={[
        styles.card,
        tone === 'white' && Shadow.card,
        padded && { padding: 18 },
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.card,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.line,
  },
});
