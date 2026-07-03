import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { AppText, Button, Card, Field, Screen, TimeField } from '@/components/ui';
import { Font, Palette, Radius } from '@/constants/theme';
import { isRTL } from '@/lib/i18n';
import { FOODS, type Food, type ScheduledDose, SLOTS, type Slot } from '@/lib/medication';
import { useStore } from '@/lib/store';

export default function ScheduleScreen() {
  const { t, i18n } = useTranslation();
  const rtl = isRTL(i18n.language);
  const router = useRouter();
  const { state, setMedication, addDose, updateDose, removeDose, setRemindersEnabled } = useStore();
  const { schedule, medication } = state;

  return (
    <Screen scroll edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Ionicons name={rtl ? 'chevron-forward' : 'chevron-back'} size={22} color={Palette.ink} />
        </Pressable>
        <AppText variant="title">{t('schedule.title')}</AppText>
      </View>

      <AppText variant="body" color={Palette.muted}>
        {t('schedule.sub')}
      </AppText>

      {/* Medication */}
      <Card>
        <View style={{ gap: 16 }}>
          <Field
            label={t('schedule.medLabel')}
            value={medication.name}
            onChangeText={(name) => setMedication({ name })}
            placeholder={t('schedule.medPlaceholder')}
          />
          <Field
            label={t('schedule.strengthLabel')}
            value={medication.dose}
            onChangeText={(dose) => setMedication({ dose })}
            placeholder={t('schedule.strengthPlaceholder')}
          />
        </View>
      </Card>

      {/* Doses */}
      <Card>
        <AppText variant="heading">{t('schedule.dosesLabel')}</AppText>
        {schedule.doses.length === 0 ? (
          <AppText variant="caption" color={Palette.muted} style={{ marginTop: 8 }}>
            {t('schedule.noDoses')}
          </AppText>
        ) : (
          <View style={{ gap: 12, marginTop: 12 }}>
            {schedule.doses.map((d) => (
              <DoseEditor key={d.id} dose={d} onChange={(p) => updateDose(d.id, p)} onDelete={() => removeDose(d.id)} />
            ))}
          </View>
        )}
        <Button
          title={t('schedule.addDose')}
          tone="brand"
          variant="soft"
          size="md"
          leftIcon={<Ionicons name="add" size={18} color={Palette.brand} />}
          onPress={() => addDose('morning')}
          style={{ marginTop: 14 }}
        />
      </Card>

      {/* Reminders */}
      <Card>
        <View style={styles.rowBetween}>
          <View style={[styles.iconLabel, { flex: 1, paddingRight: 12 }]}>
            <Ionicons name="notifications" size={20} color={Palette.brand} />
            <View style={{ flex: 1 }}>
              <AppText variant="heading">{t('schedule.reminders')}</AppText>
              <AppText variant="caption" color={Palette.muted}>
                {t('schedule.remindersSub')}
              </AppText>
            </View>
          </View>
          <Switch
            value={schedule.remindersEnabled}
            onValueChange={setRemindersEnabled}
            trackColor={{ true: Palette.success, false: Palette.line }}
          />
        </View>
      </Card>

      <Button title={t('schedule.save')} tone="brand" onPress={() => router.back()} />
    </Screen>
  );
}

function DoseEditor({
  dose,
  onChange,
  onDelete,
}: {
  dose: ScheduledDose;
  onChange: (patch: Partial<ScheduledDose>) => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.editor}>
      <View style={styles.editorTop}>
        <View style={styles.chipsRow}>
          {SLOTS.map((s) => {
            const active = dose.slot === s.key;
            return (
              <Pressable key={s.key} onPress={() => onChange({ slot: s.key as Slot })} style={[styles.chip, active && styles.chipOn]}>
                <AppText variant="caption" color={active ? '#fff' : Palette.muted} style={{ fontFamily: Font.medium }}>
                  {t(`slot.${s.key}`)}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        <Pressable hitSlop={10} onPress={onDelete}>
          <Ionicons name="close-circle" size={22} color={Palette.muted} />
        </Pressable>
      </View>

      <TimeField value={dose.time} onChange={(time) => onChange({ time })} />

      <View style={styles.chipsRow}>
        {FOODS.map((f) => {
          const active = dose.food === f;
          return (
            <Pressable key={f} onPress={() => onChange({ food: f as Food })} style={[styles.chip, active && styles.chipOn]}>
              <AppText variant="caption" color={active ? '#fff' : Palette.muted} style={{ fontFamily: Font.medium }}>
                {t(`food.${f}`)}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  back: { width: 38, height: 38, borderRadius: Radius.pill, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconLabel: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  editor: { borderWidth: 1.5, borderColor: Palette.line, borderRadius: Radius.md, padding: 14, gap: 10 },
  editorTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, flex: 1 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.pill, backgroundColor: '#F2F3F6' },
  chipOn: { backgroundColor: Palette.brand },
});
