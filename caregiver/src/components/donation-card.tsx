import { Ionicons } from '@expo/vector-icons';
import * as ExpoLinking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button } from '@/components/ui';
import { Font, Palette, Radius, Shadow } from '@/constants/theme';
import { createDonationCheckout, hasApiConfig } from '@/lib/api';

const AMOUNTS: Record<'monthly' | 'oneTime', number[]> = {
  monthly: [5, 15, 25, 50],
  oneTime: [10, 25, 50, 100],
};

export function DonationCard() {
  const { t } = useTranslation();
  const [plan, setPlan] = useState<'monthly' | 'oneTime'>('monthly');
  const [amount, setAmount] = useState(25);
  const [loading, setLoading] = useState(false);

  async function openCheckout() {
    if (!hasApiConfig) {
      Alert.alert(t('donation.unavailableTitle'), t('donation.unavailableBody'));
      return;
    }

    setLoading(true);
    try {
      const fallbackUrl = ExpoLinking.createURL('/caregiver/settings');
      const origin = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : fallbackUrl;
      const url = await createDonationCheckout({
        amount,
        plan,
        successUrl: `${origin}?donation=success`,
        cancelUrl: `${origin}?donation=cancelled`,
      });
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.assign(url);
        return;
      }
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Alert.alert(t('donation.errorTitle'), t('donation.errorBody'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.icon}>
          <Ionicons name="heart" size={20} color={Palette.warm} />
        </View>
        <AppText variant="heading" style={{ flex: 1 }}>
          {t('donation.title')}
        </AppText>
      </View>

      <AppText variant="body" color={Palette.muted}>
        {t('donation.body')}
      </AppText>

      <View style={styles.segment}>
        {(['monthly', 'oneTime'] as const).map((p) => (
          <Pressable key={p} onPress={() => setPlan(p)} style={[styles.seg, plan === p && styles.segActive]}>
            <AppText variant="label" color={plan === p ? Palette.ink : Palette.muted} center>
              {t(`donation.${p}`)}
            </AppText>
          </Pressable>
        ))}
      </View>

      <View style={styles.amounts}>
        {AMOUNTS[plan].map((a) => {
          const active = a === amount;
          return (
            <Pressable key={a} onPress={() => setAmount(a)} style={[styles.amount, active && styles.amountActive]}>
              <AppText style={{ fontFamily: Font.semibold, color: active ? '#fff' : Palette.ink }}>${a}</AppText>
            </Pressable>
          );
        })}
      </View>

      <Button
        title={`${t('donation.cta')} · $${amount}${plan === 'monthly' ? '/mo' : ''}`}
        tone="warm"
        leftIcon={<Ionicons name="heart" size={18} color="#fff" />}
        onPress={openCheckout}
        loading={loading}
        style={{ marginTop: 4 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.warmSoft,
    borderRadius: Radius.lg,
    padding: 18,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#FAD4CC',
    ...Shadow.card,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segment: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: Radius.md, padding: 4 },
  seg: { flex: 1, paddingVertical: 9, borderRadius: Radius.sm, alignItems: 'center' },
  segActive: { backgroundColor: '#fff', ...Shadow.card },
  amounts: { flexDirection: 'row', gap: 8 },
  amount: {
    flex: 1,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  amountActive: { backgroundColor: Palette.warm, borderColor: Palette.warm },
});
