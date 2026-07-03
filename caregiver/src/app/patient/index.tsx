import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card, Screen } from '@/components/ui';
import { Font, Palette, Radius, Shadow } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { describeDose, nextDose } from '@/lib/medication';
import { currentStreak, lastSevenDays, useStore } from '@/lib/store';

const STICKERS = ['🦊', '🦕', '🐢', '🐙', '🦋', '⭐️'];

export default function PatientHome() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith('he') ? 'he-IL' : 'en-US';
  const router = useRouter();
  const { profile } = useAuth();
  const { state, setRole } = useStore();

  const firstName = profile?.full_name?.split(' ')[0] || state.patientName?.split(' ')[0];
  const nd = nextDose(state.schedule);
  const nextLabel = nd ? describeDose(nd, t) : t('patient.recordToEarn');
  const streak = currentStreak(state);
  const week = lastSevenDays(state);
  const earned = state.doses.filter((d) => d.status === 'confirmed' || d.status === 'manual').length;

  return (
    <Screen scroll>
      <View style={styles.headerRow}>
        <AppText variant="title" style={{ flex: 1 }}>
          {firstName ? t('patient.greeting', { name: firstName }) : t('patient.greetingNoName')}
        </AppText>
        <Pressable onPress={() => setRole(null)} hitSlop={10} style={styles.gear}>
          <Ionicons name="ellipsis-horizontal" size={20} color={Palette.muted} />
        </Pressable>
        <Pressable onPress={() => router.push('/patient/rewards')} style={styles.prizeBtn}>
          <Ionicons name="gift" size={18} color={Palette.warm} />
          <AppText variant="label" color={Palette.warm}>
            {t('patient.prizes')}
          </AppText>
        </Pressable>
      </View>

      {/* Next dose */}
      <LinearGradient colors={['#FF8A5B', '#FF5E7A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <AppText variant="label" style={{ color: 'rgba(255,255,255,0.9)' }}>
          {t('patient.doseReady').toUpperCase()}
        </AppText>
        <AppText variant="title" style={{ color: '#fff', marginTop: 2 }}>
          {nextLabel}
        </AppText>
        {!!nd && (
          <AppText variant="body" style={{ color: 'rgba(255,255,255,0.9)', marginTop: 6 }}>
            {t('patient.recordToEarn')}
          </AppText>
        )}
        <Pressable
          onPress={() => router.push('/patient/capture')}
          style={({ pressed }) => [styles.cta, pressed && { transform: [{ scale: 0.97 }] }]}>
          <Ionicons name="videocam" size={20} color={Palette.warm} />
          <AppText style={{ color: Palette.warm, fontFamily: Font.semibold, fontSize: 17 }}>
            {t('patient.takeDose')}
          </AppText>
        </Pressable>
      </LinearGradient>

      {/* Streak */}
      <Card>
        <View style={styles.streakRow}>
          <View style={styles.flame}>
            <Ionicons name={streak > 0 ? 'flame' : 'flame-outline'} size={22} color={Palette.warm} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="heading">
              {streak > 0 ? t('patient.streak', { count: streak }) : t('patient.startStreak')}
            </AppText>
            <AppText variant="caption" color={Palette.muted}>
              {streak > 0 ? t('patient.recordToEarn') : t('patient.startStreakSub')}
            </AppText>
          </View>
        </View>
        <View style={styles.week}>
          {week.map((d, i) => {
            const done = d.status === 'confirmed' || d.status === 'manual';
            const [yy, mm, dd] = d.key.split('-').map(Number);
            const letter = new Date(yy, mm - 1, dd).toLocaleDateString(locale, { weekday: 'narrow' });
            return (
              <View key={i} style={styles.weekItem}>
                <View style={[styles.weekDot, done ? styles.weekDone : d.isToday ? styles.weekToday : styles.weekTodo]}>
                  {done && <Ionicons name="checkmark" size={15} color="#fff" />}
                </View>
                <AppText variant="caption" color={Palette.muted}>
                  {letter}
                </AppText>
              </View>
            );
          })}
        </View>
      </Card>

      {/* Collection — unlocked by recorded doses */}
      <View style={{ gap: 12 }}>
        <AppText variant="heading">{t('patient.collection')}</AppText>
        <AppText variant="caption" color={Palette.muted}>
          {t('patient.collectionSub')}
        </AppText>
        <View style={styles.grid}>
          {STICKERS.map((emoji, i) => {
            const unlocked = i < earned;
            return (
              <View key={i} style={[styles.tile, !unlocked && styles.tileLocked]}>
                {unlocked ? (
                  <AppText style={{ fontSize: 30 }}>{emoji}</AppText>
                ) : (
                  <Ionicons name="lock-closed" size={20} color={Palette.line} />
                )}
              </View>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  gear: { width: 38, height: 38, borderRadius: Radius.pill, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  prizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: Palette.warmSoft,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.pill,
  },
  hero: { borderRadius: Radius.xl, padding: 22, gap: 2, ...Shadow.lifted },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: '#fff',
    height: 56,
    borderRadius: Radius.pill,
    marginTop: 16,
  },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  flame: {
    width: 46,
    height: 46,
    borderRadius: Radius.pill,
    backgroundColor: Palette.warmSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  week: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  weekItem: { alignItems: 'center', gap: 6 },
  weekDot: { width: 34, height: 34, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  weekDone: { backgroundColor: Palette.success },
  weekToday: { backgroundColor: '#fff', borderWidth: 2, borderColor: Palette.warm },
  weekTodo: { backgroundColor: '#EDEFF3' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    width: 72,
    height: 72,
    borderRadius: Radius.lg,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.line,
    ...Shadow.card,
  },
  tileLocked: { backgroundColor: '#F4F5F8' },
});
