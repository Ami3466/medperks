import { Text, type TextProps, type TextStyle } from 'react-native';

import { Font, Palette } from '@/constants/theme';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption' | 'mono';

const VARIANTS: Record<Variant, TextStyle> = {
  display: { fontFamily: Font.bold, fontSize: 34, lineHeight: 41 },
  title: { fontFamily: Font.bold, fontSize: 26, lineHeight: 32 },
  heading: { fontFamily: Font.semibold, fontSize: 19, lineHeight: 25 },
  body: { fontFamily: Font.regular, fontSize: 16, lineHeight: 23 },
  label: { fontFamily: Font.medium, fontSize: 15, lineHeight: 20 },
  caption: { fontFamily: Font.regular, fontSize: 13, lineHeight: 18 },
  mono: { fontFamily: Font.medium, fontSize: 13, lineHeight: 18, letterSpacing: 0.4 },
};

export type AppTextProps = TextProps & {
  variant?: Variant;
  color?: string;
  center?: boolean;
  weight?: keyof typeof Font;
};

export function AppText({ variant = 'body', color, center, weight, style, ...rest }: AppTextProps) {
  return (
    <Text
      {...rest}
      style={[
        VARIANTS[variant],
        { color: color ?? Palette.ink },
        center && { textAlign: 'center' },
        weight && { fontFamily: Font[weight] },
        style,
      ]}
    />
  );
}
