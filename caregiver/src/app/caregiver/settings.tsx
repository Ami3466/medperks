import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { DonationCard } from '@/components/donation-card';
import { LanguageToggle } from '@/components/language-toggle';
import { AppText, Button, Card, Screen } from '@/components/ui';
import { Palette, Radius } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { useStore } from '@/lib/store';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { profile } = useAuth();
  const { state, setRole } = useStore();
  const name = profile?.full_name || t('common.you');
  const patient = state.patientName;

  return (
    <Screen scroll edges={['top']}>
      <AppText variant="title" style={{ marginTop: 4 }}>
        {t('caregiver.settings')}
      </AppText>

      {/* Profile */}
      <Card>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <AppText style={{ fontSize: 24 }}>👤</AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="heading">{name}</AppText>
            <AppText variant="caption" color={Palette.muted}>
              {t('roles.caregiver')}
            </AppText>
          </View>
        </View>
      </Card>

      {/* Language */}
      <Card>
        <View style={styles.rowBetween}>
          <View style={styles.iconLabel}>
            <Ionicons name="language" size={20} color={Palette.brand} />
            <AppText variant="heading">{t('common.language')}</AppText>
          </View>
        </View>
        <View style={{ marginTop: 14 }}>
          <LanguageToggle />
        </View>
        {Platform.OS !== 'web' && (
          <AppText variant="caption" color={Palette.muted} center style={{ marginTop: 10 }}>
            {t('caregiver.rtlNote')}
          </AppText>
        )}
      </Card>

      {/* Care team */}
      <Card>
        <AppText variant="heading">{t('caregiver.careTeam')}</AppText>
        <View style={{ gap: 12, marginTop: 12 }}>
          <TeamRow emoji="👤" name={name} role={t('roles.caregiver')} />
          {patient ? (
            <TeamRow emoji="🙂" name={patient} role={t('roles.patient')} onPress={() => router.push('/caregiver/setup')} />
          ) : null}
        </View>
        {!patient && (
          <Button
            title={t('caregiver.addLovedOne')}
            tone="brand"
            variant="soft"
            size="md"
            leftIcon={<Ionicons name="person-add" size={18} color={Palette.brand} />}
            style={{ marginTop: 14 }}
            onPress={() => router.push('/caregiver/setup')}
          />
        )}
      </Card>

      {/* Support */}
      <DonationCard />

      <Button
        title={t('welcome.switchRole')}
        tone="ink"
        variant="soft"
        onPress={() => setRole(null)}
        leftIcon={<Ionicons name="swap-horizontal" size={18} color={Palette.ink} />}
      />

      <AppText variant="caption" color={Palette.muted} center>
        {t('common.version')}
      </AppText>
    </Screen>
  );
}

function TeamRow({ emoji, name, role, onPress }: { emoji: string; name: string; role: string; onPress?: () => void }) {
  const body = (
    <View style={styles.teamRow}>
      <View style={styles.teamAvatar}>
        <AppText style={{ fontSize: 18 }}>{emoji}</AppText>
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="label">{name}</AppText>
        <AppText variant="caption" color={Palette.muted}>
          {role}
        </AppText>
      </View>
      {onPress ? <Ionicons name="pencil" size={16} color={Palette.muted} /> : null}
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{body}</Pressable> : body;
}

const styles = StyleSheet.create({
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    backgroundColor: Palette.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconLabel: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  teamAvatar: {
    width: 42,
    height: 42,
    borderRadius: Radius.pill,
    backgroundColor: '#F0F1F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
