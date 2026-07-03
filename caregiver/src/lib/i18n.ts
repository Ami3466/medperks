import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager, Platform } from 'react-native';

import en from '@/locales/en.json';
import he from '@/locales/he.json';

export const SUPPORTED = ['en', 'he'] as const;
export type Lang = (typeof SUPPORTED)[number];
export const RTL_LANGS: Lang[] = ['he'];

const LANG_KEY = 'cc.lang';

function deviceLang(): Lang {
  const code = getLocales()[0]?.languageCode ?? 'en';
  return (SUPPORTED as readonly string[]).includes(code) ? (code as Lang) : 'en';
}

const initial = deviceLang();

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, he: { translation: he } },
  lng: initial,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export function isRTL(lang: string): boolean {
  return (RTL_LANGS as string[]).includes(lang);
}

/**
 * Apply text direction for a language.
 * - Web: flips `document.dir` immediately.
 * - Native: I18nManager.forceRTL only takes full effect after an app reload,
 *   so callers should reload (expo-updates) after changing language.
 * Returns true if a native reload is needed to fully apply the change.
 */
export function applyDirection(lang: string): boolean {
  const rtl = isRTL(lang);
  if (Platform.OS === 'web') {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = rtl ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }
    return false;
  }
  if (I18nManager.isRTL !== rtl) {
    I18nManager.allowRTL(rtl);
    I18nManager.forceRTL(rtl);
    return true; // needs reload on native
  }
  return false;
}

applyDirection(initial);

/** Persist the user's language choice. */
export async function persistLanguage(lang: Lang): Promise<void> {
  try {
    await AsyncStorage.setItem(LANG_KEY, lang);
  } catch {
    /* ignore */
  }
}

/**
 * Restore the saved language at startup (call before first render). Returns
 * true if a native reload is needed to fully apply RTL.
 */
export async function restoreLanguage(): Promise<boolean> {
  try {
    const saved = await AsyncStorage.getItem(LANG_KEY);
    if (saved && (SUPPORTED as readonly string[]).includes(saved) && saved !== i18n.language) {
      await i18n.changeLanguage(saved);
      return applyDirection(saved);
    }
  } catch {
    /* ignore */
  }
  return false;
}

export default i18n;
