import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { LanguageToggle } from '@/components/language-toggle';
import { AppText, Button, Field, Screen } from '@/components/ui';
import { Palette, Radius, Shadow } from '@/constants/theme';

type Mode = 'signin' | 'signup';

export default function SignIn() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setLoading(true);
    setError(t('auth.localOnly'));
    setLoading(false);
  }

  return (
    <Screen scroll background={Palette.canvas}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 4 }}>
          <LanguageToggle />
        </View>

        <View style={styles.hero}>
          <View style={styles.mark}>
            <Ionicons name="heart" size={34} color={Palette.warm} />
          </View>
          <AppText variant="title" center>
            {t('auth.welcome')}
          </AppText>
          <AppText variant="body" color={Palette.muted} center style={{ maxWidth: 300 }}>
            {t('auth.subtitle')}
          </AppText>
        </View>

        <View style={styles.card}>
          <View style={styles.segment}>
            {(['signin', 'signup'] as Mode[]).map((m) => (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                style={[styles.segItem, mode === m && styles.segItemActive]}>
                <AppText variant="label" color={mode === m ? Palette.ink : Palette.muted} center>
                  {m === 'signin' ? t('auth.signIn') : t('auth.createAccount')}
                </AppText>
              </Pressable>
            ))}
          </View>

          <View style={{ gap: 14, marginTop: 16 }}>
            {mode === 'signup' && (
              <Field
                label={t('auth.name')}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            )}
            <Field
              label={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <Field
              label={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
            />

            {error && (
              <View style={styles.error}>
                <Ionicons name="alert-circle" size={18} color={Palette.missed} />
                <AppText variant="caption" color={Palette.missed} style={{ flex: 1 }}>
                  {error}
                </AppText>
              </View>
            )}

            <Button
              title={loading ? t('auth.signingIn') : mode === 'signin' ? t('auth.signIn') : t('auth.createAccount')}
              tone="brand"
              loading={loading}
              onPress={submit}
              style={{ marginTop: 4 }}
            />
          </View>
        </View>

        <AppText variant="caption" color={Palette.muted} center style={{ marginTop: 18, paddingHorizontal: 24 }}>
          {t('roles.caregiver')} · {t('roles.patient')}
        </AppText>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 10, marginTop: 18, marginBottom: 22 },
  mark: {
    width: 76,
    height: 76,
    borderRadius: Radius.xl,
    backgroundColor: Palette.warmSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  card: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: 18, ...Shadow.card },
  segment: { flexDirection: 'row', backgroundColor: '#F2F3F6', borderRadius: Radius.md, padding: 4 },
  segItem: { flex: 1, paddingVertical: 9, borderRadius: Radius.sm, alignItems: 'center' },
  segItemActive: { backgroundColor: '#fff', ...Shadow.card },
  error: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: Palette.missedSoft,
    borderRadius: Radius.md,
    padding: 12,
  },
});
