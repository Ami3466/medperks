import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

import { MaxContentWidth, Palette } from '@/constants/theme';

export function Screen({
  children,
  background = Palette.canvas,
  scroll = false,
  padded = true,
  edges = ['top', 'bottom'],
  contentStyle,
}: {
  children: ReactNode;
  background?: string;
  scroll?: boolean;
  padded?: boolean;
  edges?: Edge[];
  contentStyle?: ViewStyle;
}) {
  const inner: ViewStyle = {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    ...(padded ? { paddingHorizontal: 18 } : null),
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: background }]} edges={edges}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[inner, { paddingVertical: 16, gap: 16 }, contentStyle]}
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, inner, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
});
