import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { LanguageToggle } from '@/components/language-toggle';
import { AppText, Screen } from '@/components/ui';
import { Palette, Radius, Shadow } from '@/constants/theme';
import { type AppRole, useStore } from '@/lib/store';

export default function Welcome() {
  const { t } = useTranslation();
  const { setRole } = useStore();

  const choose = (role: AppRole) => () => setRole(role);

  return (
    <Screen scroll>
      <View style={{ alignItems: 'center', paddingTop: 8 }}>
        <LanguageToggle />
      </View>

      <View style={styles.hero}>
        <View style={styles.mark}>
          <Ionicons name="heart" size={34} color={Palette.warm} />
        </View>
        <AppText variant="title" center>
          {t('common.appName')}
        </AppText>
        <AppText variant="body" color={Palette.muted} center style={{ maxWidth: 300 }}>
          {t('welcome.subtitle')}
        </AppText>
      </View>

      <AppText variant="heading" center style={{ marginBottom: 4 }}>
        {t('welcome.who')}
      </AppText>

      <RoleCard
        icon="people"
        tone={Palette.brand}
        toneSoft={Palette.brandSoft}
        title={t('welcome.caregiver')}
        sub={t('welcome.caregiverSub')}
        onPress={choose('caregiver')}
      />
      <RoleCard
        icon="happy"
        tone={Palette.warm}
        toneSoft={Palette.warmSoft}
        title={t('welcome.patient')}
        sub={t('welcome.patientSub')}
        onPress={choose('patient')}
      />
    </Screen>
  );
}

function RoleCard({
  icon,
  tone,
  toneSoft,
  title,
  sub,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tone: string;
  toneSoft: string;
  title: string;
  sub: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.98 }], opacity: 0.95 }]}>
      <View style={[styles.cardIcon, { backgroundColor: toneSoft }]}>
        <Ionicons name={icon} size={26} color={tone} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="heading">{title}</AppText>
        <AppText variant="caption" color={Palette.muted}>
          {sub}
        </AppText>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Palette.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 10, marginTop: 24, marginBottom: 28 },
  mark: {
    width: 76,
    height: 76,
    borderRadius: Radius.xl,
    backgroundColor: Palette.warmSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: 18,
    ...Shadow.card,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
