import { createContext, useContext, useMemo, type ReactNode } from 'react';

export type Role = 'caregiver' | 'patient' | 'unknown';

export type Profile = {
  id: string;
  full_name: string | null;
  locale: string;
  avatar_url: string | null;
};

type AuthState = {
  session: null;
  profile: Profile | null;
  role: Role;
  /** patient ids this caregiver manages (empty for a patient account) */
  patientIds: string[];
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const value = useMemo<AuthState>(
    () => ({
      session: null,
      profile: null,
      role: 'unknown',
      patientIds: [],
      loading: false,
      signOut: async () => {},
      refresh: async () => {},
    }),
    [],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
