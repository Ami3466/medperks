import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Field, Screen } from '@/components/ui';
import { Palette, Radius } from '@/constants/theme';
import { isRTL } from '@/lib/i18n';
import { useStore } from '@/lib/store';

/** Manage the loved one — set once, edited from Settings. Name only. */
export default function ManageUserScreen() {
  const { t, i18n } = useTranslation();
  const rtl = isRTL(i18n.language);
  const router = useRouter();
  const { state, setPatientName } = useStore();
  const [name, setName] = useState(state.patientName ?? '');

  function save() {
    setPatientName(name.trim() || null);
    router.back();
  }

  return (
    <Screen scroll edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Ionicons name={rtl ? 'chevron-forward' : 'chevron-back'} size={22} color={Palette.ink} />
        </Pressable>
        <AppText variant="title">{t('caregiver.addLovedOne')}</AppText>
      </View>

      <AppText variant="body" color={Palette.muted}>
        {t('caregiver.addLovedOneSub')}
      </AppText>

      <Card>
        <Field
          label={t('schedule.nameLabel')}
          value={name}
          onChangeText={setName}
          placeholder={t('schedule.namePlaceholder')}
          autoCapitalize="words"
        />
      </Card>

      <Button title={t('schedule.save')} tone="brand" onPress={save} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  back: { width: 38, height: 38, borderRadius: Radius.pill, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
});
