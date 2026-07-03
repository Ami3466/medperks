type PublicEnv = {
  EXPO_PUBLIC_API_URL?: string;
};

declare global {
  interface Window {
    __CARE_COMPANION_ENV__?: PublicEnv;
  }
}

export function publicEnv(key: keyof PublicEnv): string | undefined {
  if (typeof window !== 'undefined') {
    const runtimeValue = window.__CARE_COMPANION_ENV__?.[key];
    if (runtimeValue) return runtimeValue;
  }
  // Static access so Expo inlines EXPO_PUBLIC_* at build time on native.
  // (A computed `process.env[key]` is NOT inlined and is undefined on device.)
  return process.env.EXPO_PUBLIC_API_URL;
}
