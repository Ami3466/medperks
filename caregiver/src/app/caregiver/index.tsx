import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { DonationCard } from '@/components/donation-card';
import { AppText, Button, Card, ProgressRing, Screen } from '@/components/ui';
import { Font, Palette, Radius } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { isRTL } from '@/lib/i18n';
import { adherenceThisMonth, flaggedDoses, useStore } from '@/lib/store';

export default function CaregiverDashboard() {
  const { t, i18n } = useTranslation();
  const rtl = isRTL(i18n.language);
  const router = useRouter();
  const { profile } = useAuth();
  const { state } = useStore();

  const firstName = profile?.full_name?.split(' ')[0];
  const patientName = state.patientName;
  const adherence = adherenceThisMonth(state);
  const flagged = flaggedDoses(state);
  const hasData = state.doses.length > 0;

  return (
    <Screen scroll>
      <View style={{ marginTop: 4 }}>
        <AppText variant="caption" color={Palette.muted}>
          {firstName ? `${firstName} · ` : ''}
          {t('roles.caregiver')}
        </AppText>
        <AppText variant="title">{t('caregiver.dashboard')}</AppText>
      </View>

      {/* Loved one / setup */}
      {patientName ? (
        <Pressable onPress={() => router.push('/caregiver/schedule')}>
          <Card>
            <View style={styles.row}>
              <View style={styles.avatar}>
                <AppText style={{ fontSize: 22 }}>🙂</AppText>
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="heading">{patientName}</AppText>
                <AppText variant="caption" color={Palette.muted}>
                  {[state.medication.name, state.medication.dose].filter(Boolean).join(' ') || t('schedule.title')}
                </AppText>
              </View>
              <Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={20} color={Palette.muted} />
            </View>
          </Card>
        </Pressable>
      ) : (
        <Card>
          <View style={styles.setupRow}>
            <View style={styles.avatar}>
              <Ionicons name="person-add" size={22} color={Palette.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="heading">{t('caregiver.addLovedOne')}</AppText>
              <AppText variant="caption" color={Palette.muted}>
                {t('caregiver.addLovedOneSub')}
              </AppText>
            </View>
          </View>
          <Button
            title={t('caregiver.addLovedOne')}
            tone="brand"
            leftIcon={<Ionicons name="add" size={18} color="#fff" />}
            style={{ marginTop: 14 }}
            onPress={() => router.push('/caregiver/setup')}
          />
        </Card>
      )}

      {/* This month */}
      <Card>
        <AppText variant="heading">{t('caregiver.confirmedThisMonth')}</AppText>
        {hasData ? (
          <View style={styles.adhRow}>
            <ProgressRing size={96} stroke={10} progress={adherence.rate / 100} color={Palette.brand} track={Palette.brandSoft}>
              <AppText style={{ fontFamily: Font.bold, fontSize: 24, color: Palette.ink }}>{adherence.rate}%</AppText>
            </ProgressRing>
            <View style={{ flex: 1, gap: 4 }}>
              <AppText variant="heading">
                {adherence.confirmed} / {adherence.expected}
              </AppText>
              <AppText variant="caption" color={Palette.muted}>
                {t('caregiver.dosesRecordedSub')}
              </AppText>
            </View>
          </View>
        ) : (
          <View style={styles.empty}>
            <Ionicons name="bar-chart-outline" size={26} color={Palette.muted} />
            <AppText variant="caption" color={Palette.muted} center style={{ maxWidth: 260 }}>
              {t('caregiver.adherenceEmpty')}
            </AppText>
          </View>
        )}
      </Card>

      {/* Needs review */}
      <Card>
        <View style={styles.rowBetween}>
          <AppText variant="heading">{t('caregiver.needsReview')}</AppText>
          <Ionicons name="eye-outline" size={20} color={Palette.muted} />
        </View>
        {flagged.length ? (
          <View style={{ gap: 10, marginTop: 12 }}>
            {flagged.map((d) => (
              <Pressable
                key={d.id}
                onPress={() => router.push(`/caregiver/review?id=${d.id}`)}
                style={({ pressed }) => [styles.flagRow, pressed && { opacity: 0.72 }]}>
                <Ionicons name="play-circle" size={20} color={Palette.brand} />
                <View style={{ flex: 1 }}>
                  <AppText variant="label">{d.date}</AppText>
                  <AppText variant="caption" color={Palette.muted}>
                    {d.verdict?.reasoning ?? t('caregiver.swallowUnconfirmed')}
                  </AppText>
                </View>
                <AppText variant="label" color={Palette.brand}>
                  {t('caregiver.watchClip')}
                </AppText>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <AppText variant="caption" color={Palette.muted} center style={{ maxWidth: 280 }}>
              {t('caregiver.reviewEmpty')}
            </AppText>
          </View>
        )}
      </Card>

      {/* Reward program entry */}
      <Pressable onPress={() => router.push('/caregiver/rewards')}>
        <Card>
          <View style={styles.row}>
            <View style={[styles.avatar, { backgroundColor: Palette.warmSoft }]}>
              <Ionicons name="gift" size={20} color={Palette.warm} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="heading">{t('caregiver.rewards')}</AppText>
              <AppText variant="caption" color={Palette.muted}>
                {state.prizes.mode === 'manual' ? t('caregiver.modeManual') : t('caregiver.modeAuto')}
              </AppText>
            </View>
            <Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={20} color={Palette.muted} />
          </View>
        </Card>
      </Pressable>

      <DonationCard />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  setupRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    backgroundColor: Palette.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adhRow: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 12 },
  flagRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 20 },
});
