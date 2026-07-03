import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, Card, Screen } from '@/components/ui';
import { Font, Palette, Radius } from '@/constants/theme';
import {
  type AutoPeriod,
  AUTO_PERIODS,
  type AutoPrize,
  defaultAutoPrizes,
  defaultManualPrizes,
  newAutoPrize,
  newRule,
  type PrizeProgram,
  type PrizeRule,
  type PrizeUnit,
  PRIZE_UNITS,
} from '@/lib/rewards';
import { useStore } from '@/lib/store';

export default function PrizesScreen() {
  const { t } = useTranslation();
  const { state, setPrizes } = useStore();
  const prizes = state.prizes;

  function setMode(mode: 'manual' | 'auto') {
    if (mode === prizes.mode) return;
    setPrizes(mode === 'manual' ? defaultManualPrizes() : defaultAutoPrizes());
  }

  return (
    <Screen scroll edges={['top']}>
      <View style={{ marginTop: 4, gap: 4 }}>
        <AppText variant="title">{t('rewards.title')}</AppText>
        <AppText variant="body" color={Palette.muted}>
          {t('rewards.intro')}
        </AppText>
      </View>

      <Card>
        <View style={styles.segment}>
          {(['manual', 'auto'] as const).map((m) => (
            <Pressable key={m} onPress={() => setMode(m)} style={[styles.seg, prizes.mode === m && styles.segActive]}>
              <AppText variant="label" color={prizes.mode === m ? Palette.ink : Palette.muted} center>
                {m === 'manual' ? t('rewards.manual') : t('rewards.auto')}
              </AppText>
            </Pressable>
          ))}
        </View>
        <AppText variant="caption" color={Palette.muted} style={{ marginTop: 12 }}>
          {prizes.mode === 'manual' ? t('rewards.manualDesc') : t('rewards.autoDesc')}
        </AppText>
      </Card>

      {prizes.mode === 'manual' ? (
        <ManualConfig prizes={prizes} setPrizes={setPrizes} />
      ) : (
        <AutoConfig prizes={prizes} setPrizes={setPrizes} />
      )}

      <Card>
        <AppText variant="heading">{t('rewards.toGive')}</AppText>
        <AppText variant="caption" color={Palette.muted} style={{ marginTop: 2 }}>
          {t('rewards.toGiveSub')}
        </AppText>
        <View style={styles.empty}>
          <Ionicons name="checkmark-done-outline" size={26} color={Palette.muted} />
          <AppText variant="caption" color={Palette.muted}>
            {t('rewards.nothingToGive')}
          </AppText>
        </View>
      </Card>
    </Screen>
  );
}

function ManualConfig({ prizes, setPrizes }: { prizes: Extract<PrizeProgram, { mode: 'manual' }>; setPrizes: (p: PrizeProgram) => void }) {
  const { t } = useTranslation();
  const update = (id: string, patch: Partial<PrizeRule>) =>
    setPrizes({ ...prizes, rules: prizes.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)) });

  return (
    <Card>
      <AppText variant="heading">{t('rewards.prizesHeading')}</AppText>
      {prizes.rules.length === 0 ? (
        <AppText variant="caption" color={Palette.muted} style={{ marginTop: 8 }}>
          {t('rewards.noRewards')}
        </AppText>
      ) : (
        <View style={{ gap: 12, marginTop: 12 }}>
          {prizes.rules.map((r) => (
            <RuleEditor key={r.id} rule={r} onChange={(p) => update(r.id, p)} onDelete={() => setPrizes({ ...prizes, rules: prizes.rules.filter((x) => x.id !== r.id) })} />
          ))}
        </View>
      )}
      <Button
        title={t('rewards.addReward')}
        tone="brand"
        variant="soft"
        size="md"
        leftIcon={<Ionicons name="add" size={18} color={Palette.brand} />}
        onPress={() => setPrizes({ ...prizes, rules: [...prizes.rules, newRule()] })}
        style={{ marginTop: 14 }}
      />
    </Card>
  );
}

function RuleEditor({ rule, onChange, onDelete }: { rule: PrizeRule; onChange: (patch: Partial<PrizeRule>) => void; onDelete: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.editor}>
      <View style={styles.editorTop}>
        <TextInput
          value={rule.prize}
          onChangeText={(prize) => onChange({ prize })}
          placeholder={t('rewards.whatPlaceholder')}
          placeholderTextColor={Palette.muted}
          style={styles.labelInput}
        />
        <Pressable hitSlop={10} onPress={onDelete}>
          <Ionicons name="close-circle" size={22} color={Palette.muted} />
        </Pressable>
      </View>

      <AppText variant="caption" color={Palette.muted} style={{ marginTop: 12 }}>
        {t('rewards.everyLabel')}
      </AppText>
      <Stepper value={rule.everyN} min={1} onChange={(everyN) => onChange({ everyN })} />
      <View style={styles.chipsRow}>
        {PRIZE_UNITS.map((u) => {
          const active = rule.unit === u;
          return (
            <Pressable key={u} onPress={() => onChange({ unit: u as PrizeUnit })} style={[styles.chip, active && styles.chipOn]}>
              <AppText variant="caption" color={active ? '#fff' : Palette.muted} style={{ fontFamily: Font.medium }}>
                {t(`prize.unit_${u}`)}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <Stepper label={t('rewards.missesLabel')} value={rule.maxMisses} min={0} onChange={(maxMisses) => onChange({ maxMisses })} />
    </View>
  );
}

function AutoConfig({ prizes, setPrizes }: { prizes: Extract<PrizeProgram, { mode: 'auto' }>; setPrizes: (p: PrizeProgram) => void }) {
  const { t } = useTranslation();
  const update = (id: string, patch: Partial<AutoPrize>) =>
    setPrizes({ ...prizes, prizes: prizes.prizes.map((p) => (p.id === id ? { ...p, ...patch } : p)) });

  return (
    <>
      <Card>
        <AppText variant="heading">{t('rewards.autoHeading')}</AppText>
        {prizes.prizes.length === 0 ? (
          <AppText variant="caption" color={Palette.muted} style={{ marginTop: 8 }}>
            {t('rewards.noOptions')}
          </AppText>
        ) : (
          <View style={{ gap: 12, marginTop: 12 }}>
            {prizes.prizes.map((p) => (
              <AutoEditor key={p.id} prize={p} onChange={(patch) => update(p.id, patch)} onDelete={() => setPrizes({ ...prizes, prizes: prizes.prizes.filter((x) => x.id !== p.id) })} />
            ))}
          </View>
        )}
        <Button
          title={t('rewards.addOption')}
          tone="brand"
          variant="soft"
          size="md"
          leftIcon={<Ionicons name="add" size={18} color={Palette.brand} />}
          onPress={() => setPrizes({ ...prizes, prizes: [...prizes.prizes, newAutoPrize()] })}
          style={{ marginTop: 14 }}
        />
      </Card>

      <View style={styles.infoNote}>
        <Ionicons name="sparkles" size={16} color={Palette.success} />
        <AppText variant="caption" color={Palette.muted} style={{ flex: 1 }}>
          {t('rewards.autoRotateNote')}
        </AppText>
      </View>
    </>
  );
}

function AutoEditor({ prize, onChange, onDelete }: { prize: AutoPrize; onChange: (patch: Partial<AutoPrize>) => void; onDelete: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.editor}>
      <View style={styles.editorTop}>
        <TextInput
          value={prize.label}
          onChangeText={(label) => onChange({ label })}
          placeholder={t('rewards.whatPlaceholder')}
          placeholderTextColor={Palette.muted}
          style={styles.labelInput}
        />
        <Pressable hitSlop={10} onPress={onDelete}>
          <Ionicons name="close-circle" size={22} color={Palette.muted} />
        </Pressable>
      </View>

      <Stepper label={t('rewards.limitLabel')} value={prize.limit} min={1} onChange={(limit) => onChange({ limit })} />
      <AppText variant="caption" color={Palette.muted} style={{ marginTop: 12 }}>
        {t('rewards.perLabel')}
      </AppText>
      <View style={styles.chipsRow}>
        {AUTO_PERIODS.map((p) => {
          const active = prize.period === p;
          return (
            <Pressable key={p} onPress={() => onChange({ period: p as AutoPeriod })} style={[styles.chip, active && styles.chipOn]}>
              <AppText variant="caption" color={active ? '#fff' : Palette.muted} style={{ fontFamily: Font.medium }}>
                {t(`auto.period_${p}`)}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Stepper({ label, value, min, onChange }: { label?: string; value: number; min: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.stepperRow}>
      {label ? (
        <AppText variant="label" color={Palette.muted} style={{ flex: 1 }}>
          {label}
        </AppText>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      <Pressable hitSlop={8} onPress={() => onChange(Math.max(min, value - 1))} style={styles.stepBtn}>
        <Ionicons name="remove" size={18} color={Palette.ink} />
      </Pressable>
      <AppText variant="heading" style={{ minWidth: 28, textAlign: 'center' }}>
        {value}
      </AppText>
      <Pressable hitSlop={8} onPress={() => onChange(value + 1)} style={styles.stepBtn}>
        <Ionicons name="add" size={18} color={Palette.ink} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', backgroundColor: '#F2F3F6', borderRadius: Radius.md, padding: 4 },
  seg: { flex: 1, paddingVertical: 10, borderRadius: Radius.sm, alignItems: 'center' },
  segActive: { backgroundColor: '#fff' },
  editor: { borderWidth: 1.5, borderColor: Palette.line, borderRadius: Radius.md, padding: 14 },
  editorTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  labelInput: { flex: 1, height: 46, borderRadius: Radius.sm, backgroundColor: '#F7F8FA', paddingHorizontal: 12, fontFamily: Font.medium, fontSize: 16, color: Palette.ink },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: Radius.pill, backgroundColor: '#F2F3F6' },
  chipOn: { backgroundColor: Palette.brand },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  stepBtn: { width: 36, height: 36, borderRadius: Radius.pill, backgroundColor: '#F2F3F6', alignItems: 'center', justifyContent: 'center' },
  infoNote: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 6 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 22 },
});
