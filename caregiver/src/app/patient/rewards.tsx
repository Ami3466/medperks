import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card, Screen } from '@/components/ui';
import { Palette, Radius } from '@/constants/theme';
import { isRTL } from '@/lib/i18n';
import { describeAutoPrize, describePrizeRule } from '@/lib/rewards';
import { useStore } from '@/lib/store';

export default function PatientPrizes() {
  const { t, i18n } = useTranslation();
  const rtl = isRTL(i18n.language);
  const router = useRouter();
  const { state } = useStore();

  // The prizes the caregiver defined — shown straight to the patient.
  const rewards =
    state.prizes.mode === 'manual'
      ? state.prizes.rules.filter((r) => r.prize.trim()).map((r) => ({ key: r.id, label: r.prize, sub: describePrizeRule(r, t) }))
      : state.prizes.prizes.filter((p) => p.label.trim()).map((p) => ({ key: p.id, label: p.label, sub: describeAutoPrize(p, t) }));

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Ionicons name={rtl ? 'chevron-forward' : 'chevron-back'} size={22} color={Palette.ink} />
        </Pressable>
        <AppText variant="title">{t('patient.prizesTitle')}</AppText>
      </View>

      {/* Claimable — honest empty state */}
      <Card>
        <View style={styles.empty}>
          <View style={styles.giftCircle}>
            <Ionicons name="gift" size={28} color={Palette.warm} />
          </View>
          <AppText variant="heading" center>
            {t('patient.nothingToClaim')}
          </AppText>
          <AppText variant="caption" color={Palette.muted} center style={{ maxWidth: 280 }}>
            {t('patient.nothingToClaimSub')}
          </AppText>
        </View>
      </Card>

      {/* The prizes the caregiver set up */}
      {rewards.length > 0 && (
        <View style={{ gap: 12 }}>
          <AppText variant="heading">{t('patient.howYouEarn')}</AppText>
          {rewards.map((r) => (
            <View key={r.key} style={styles.rewardRow}>
              <View style={styles.checkCircle}>
                <Ionicons name="gift" size={16} color={Palette.warm} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="label">{r.label}</AppText>
                {!!r.sub && (
                  <AppText variant="caption" color={Palette.muted}>
                    {r.sub}
                  </AppText>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  back: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 14 },
  giftCircle: {
    width: 64,
    height: 64,
    borderRadius: Radius.pill,
    backgroundColor: Palette.warmSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.line,
    padding: 16,
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    backgroundColor: Palette.warmSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
