import { useState } from 'react';
import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { Font, Palette, Radius } from '@/constants/theme';
import { AppText } from './text';

export function Field({ label, style, ...props }: TextInputProps & { label?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 7 }}>
      {label ? (
        <AppText variant="label" color={Palette.muted}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        placeholderTextColor={Palette.muted}
        {...props}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        style={[styles.input, focused && styles.focused, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 54,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Palette.line,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    fontFamily: Font.regular,
    fontSize: 16,
    color: Palette.ink,
  },
  focused: { borderColor: Palette.brand, backgroundColor: '#fff' },
});
