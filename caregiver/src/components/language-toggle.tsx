import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { Font, Palette, Radius } from '@/constants/theme';
import { applyDirection, type Lang, persistLanguage } from '@/lib/i18n';

const OPTIONS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'he', label: 'עברית' },
];

export function LanguageToggle({ onChange }: { onChange?: (lng: Lang) => void }) {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith('he') ? 'he' : 'en';

  function select(code: Lang) {
    if (code === current) return;
    i18n.changeLanguage(code);
    applyDirection(code);
    persistLanguage(code);
    onChange?.(code);
  }

  return (
    <View style={styles.wrap}>
      {OPTIONS.map((opt) => {
        const active = opt.code === current;
        return (
          <Pressable
            key={opt.code}
            onPress={() => select(opt.code)}
            style={[styles.pill, active && styles.pillActive]}>
            <AppText
              style={{
                fontFamily: active ? Font.semibold : Font.medium,
                color: active ? Palette.ink : Palette.muted,
                fontSize: 14,
              }}>
              {opt.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: '#ECEDF2',
    borderRadius: Radius.pill,
    padding: 4,
    gap: 4,
    alignSelf: 'center',
  },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.pill },
  pillActive: { backgroundColor: '#fff' },
});
