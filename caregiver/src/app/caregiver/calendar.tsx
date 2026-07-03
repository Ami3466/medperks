import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Screen } from '@/components/ui';
import { Palette, Radius } from '@/constants/theme';
import { isRTL } from '@/lib/i18n';
import { dateKey, dayStatus, type DoseStatus, useStore } from '@/lib/store';

const pad = (n: number) => String(n).padStart(2, '0');

const STATUS_STYLE: Record<DoseStatus, { bg: string; fg: string; icon?: keyof typeof Ionicons.glyphMap }> = {
  confirmed: { bg: Palette.successSoft, fg: Palette.success, icon: 'checkmark' },
  manual: { bg: '#FEF3E2', fg: Palette.flag, icon: 'create' },
  flagged: { bg: '#FFE2D6', fg: Palette.warm, icon: 'eye' },
  missed: { bg: Palette.missedSoft, fg: Palette.missed, icon: 'close' },
};

export default function CalendarScreen() {
  const { t, i18n } = useTranslation();
  const { state, toggleManual, recordDose } = useStore();
  const locale = i18n.language?.startsWith('he') ? 'he-IL' : 'en-US';
  const rtl = isRTL(i18n.language);

  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const todayK = dateKey(now);

  // Localized weekday initials (Jan 1 2023 is a Sunday) and month label.
  const weekdayFmt = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
  const weekdays = Array.from({ length: 7 }, (_, i) => weekdayFmt.format(new Date(2023, 0, 1 + i)));
  const monthLabel = new Date(cursor.y, cursor.m, 1).toLocaleString(locale, { month: 'long', year: 'numeric' });

  const firstWeekday = new Date(cursor.y, cursor.m, 1).getDay();
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  let confirmedCount = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const s = dayStatus(state, `${cursor.y}-${pad(cursor.m + 1)}-${pad(d)}`);
    if (s === 'confirmed' || s === 'manual') confirmedCount++;
  }

  function shift(delta: number) {
    setCursor((c) => {
      const next = new Date(c.y, c.m + delta, 1);
      return { y: next.getFullYear(), m: next.getMonth() };
    });
  }

  function onDay(day: number) {
    const key = `${cursor.y}-${pad(cursor.m + 1)}-${pad(day)}`;
    if (key > todayK) return;
    const s = dayStatus(state, key);
    if (s === 'confirmed' || s === 'flagged') return;
    toggleManual(key);
  }

  return (
    <Screen scroll edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => shift(-1)} hitSlop={10} style={styles.nav}>
          <Ionicons name={rtl ? 'chevron-forward' : 'chevron-back'} size={20} color={Palette.ink} />
        </Pressable>
        <AppText variant="heading" style={{ flex: 1 }} center>
          {monthLabel}
        </AppText>
        <Pressable onPress={() => shift(1)} hitSlop={10} style={styles.nav}>
          <Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={20} color={Palette.ink} />
        </Pressable>
      </View>

      <Card>
        <View style={styles.weekRow}>
          {weekdays.map((d, i) => (
            <AppText key={i} variant="caption" color={Palette.muted} center style={styles.weekday}>
              {d}
            </AppText>
          ))}
        </View>
        <View style={styles.grid}>
          {cells.map((day, i) => {
            if (day == null) return <View key={`e${i}`} style={styles.cell} />;
            const key = `${cursor.y}-${pad(cursor.m + 1)}-${pad(day)}`;
            const s = dayStatus(state, key);
            const isToday = key === todayK;
            const isFuture = key > todayK;
            const style = s !== 'none' ? STATUS_STYLE[s] : undefined;
            return (
              <Pressable key={key} onPress={() => onDay(day)} disabled={isFuture} style={styles.cell}>
                <View
                  style={[
                    styles.dayBox,
                    { backgroundColor: style?.bg ?? '#F4F5F8' },
                    isToday && styles.todayBox,
                    isFuture && { opacity: 0.4 },
                  ]}>
                  <AppText variant="caption" color={style?.fg ?? Palette.muted} style={{ fontSize: 12 }}>
                    {day}
                  </AppText>
                  {style?.icon && <Ionicons name={style.icon} size={12} color={style.fg} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Button
        title={t('caregiver.addDoseToday')}
        tone="brand"
        leftIcon={<Ionicons name="add" size={18} color="#fff" />}
        onPress={() => {
          const s = dayStatus(state, todayK);
          if (s === 'none') recordDose({ status: 'manual' });
        }}
      />

      <AppText variant="caption" color={Palette.muted} style={{ paddingHorizontal: 4 }}>
        {t('caregiver.recordedThisMonth', { count: confirmedCount })}
      </AppText>

      <View style={styles.legendRow}>
        <Legend color={Palette.success} label={t('caregiver.legendConfirmed')} />
        <Legend color={Palette.flag} label={t('caregiver.legendManual')} />
        <Legend color={Palette.missed} label={t('caregiver.legendMissed')} />
      </View>
    </Screen>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legend}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <AppText variant="caption" color={Palette.muted}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  nav: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRow: { flexDirection: 'row', marginBottom: 8 },
  weekday: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 3 },
  dayBox: { flex: 1, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', gap: 1 },
  todayBox: { borderWidth: 2, borderColor: Palette.brand },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, paddingHorizontal: 4 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
});
