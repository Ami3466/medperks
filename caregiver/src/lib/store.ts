import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { postDose, syncState } from '@/lib/api';
import {
  defaultMedication,
  defaultSchedule,
  type Medication,
  type Schedule,
  type Slot,
  newDose,
  nextDose,
  sortedDoses,
} from '@/lib/medication';
import { defaultManualPrizes, type PrizeProgram } from '@/lib/rewards';

/**
 * On-device store (local-first). Persisted to AsyncStorage. Holds the patient,
 * their medication + dose schedule, the prize program, and recorded doses.
 */

const KEY = 'cc.store.v4';

export type DoseStatus = 'confirmed' | 'missed' | 'manual' | 'flagged';

export type Verdict = {
  identity_ok: boolean;
  pill_present: boolean;
  swallow_confirmed: boolean;
  confidence: number;
  reasoning?: string;
};

export type DoseRecord = {
  id: string;
  date: string; // 'YYYY-MM-DD' local
  time: string; // 'HH:MM'
  status: DoseStatus;
  verdict?: Verdict;
  videoUri?: string;
};

export type AppRole = 'caregiver' | 'patient';

export type StoreState = {
  role: AppRole | null;
  patientName: string | null;
  medication: Medication;
  schedule: Schedule;
  prizes: PrizeProgram;
  doses: DoseRecord[];
};

const initialState: StoreState = {
  role: null,
  patientName: null,
  medication: defaultMedication(),
  schedule: defaultSchedule(),
  prizes: defaultManualPrizes(),
  doses: [],
};

// --- date helpers ----------------------------------------------------------
export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// --- shape repair (resilient to older persisted shapes) --------------------
function normalizePrizes(p: unknown): PrizeProgram {
  const prog = p as Partial<PrizeProgram> | undefined;
  if (prog?.mode === 'manual' && Array.isArray((prog as { rules?: unknown }).rules)) return prog as PrizeProgram;
  if (prog?.mode === 'auto' && Array.isArray((prog as { prizes?: unknown }).prizes)) return prog as PrizeProgram;
  return defaultManualPrizes();
}

function normalizeSchedule(s: unknown): Schedule {
  const sch = s as Partial<Schedule> | undefined;
  if (sch && Array.isArray(sch.doses)) {
    return { doses: sch.doses, remindersEnabled: Boolean(sch.remindersEnabled) };
  }
  return defaultSchedule();
}

function normalizeMedication(m: unknown): Medication {
  const med = m as Partial<Medication> | undefined;
  if (med && typeof med.name === 'string') return { name: med.name, dose: typeof med.dose === 'string' ? med.dose : '' };
  return defaultMedication();
}

function normalizeState(parsed: Record<string, unknown>): StoreState {
  return {
    role: parsed.role === 'caregiver' || parsed.role === 'patient' ? parsed.role : null,
    patientName: typeof parsed.patientName === 'string' ? parsed.patientName : null,
    medication: normalizeMedication(parsed.medication),
    schedule: normalizeSchedule(parsed.schedule),
    prizes: normalizePrizes(parsed.prizes),
    doses: Array.isArray(parsed.doses) ? (parsed.doses as DoseRecord[]) : [],
  };
}

// --- selectors (pure) ------------------------------------------------------
export function dosesOn(state: StoreState, key: string): DoseRecord[] {
  return state.doses.filter((d) => d.date === key);
}

export function dayStatus(state: StoreState, key: string): DoseStatus | 'none' {
  const ds = dosesOn(state, key);
  if (ds.some((d) => d.status === 'confirmed')) return 'confirmed';
  if (ds.some((d) => d.status === 'manual')) return 'manual';
  if (ds.some((d) => d.status === 'flagged')) return 'flagged';
  if (ds.some((d) => d.status === 'missed')) return 'missed';
  return 'none';
}

function isDone(state: StoreState, key: string): boolean {
  const s = dayStatus(state, key);
  return s === 'confirmed' || s === 'manual';
}

export function currentStreak(state: StoreState): number {
  let streak = 0;
  const d = new Date();
  if (!isDone(state, dateKey(d))) d.setDate(d.getDate() - 1); // today still pending
  while (isDone(state, dateKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function lastSevenDays(state: StoreState): { key: string; status: DoseStatus | 'none'; isToday: boolean }[] {
  const out: { key: string; status: DoseStatus | 'none'; isToday: boolean }[] = [];
  const today = dateKey();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    out.push({ key, status: dayStatus(state, key), isToday: key === today });
  }
  return out;
}

export function adherenceThisMonth(state: StoreState): { confirmed: number; expected: number; rate: number } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const days = new Set<string>();
  for (const d of state.doses) {
    const dt = parseKey(d.date);
    if (dt.getFullYear() === y && dt.getMonth() === m && (d.status === 'confirmed' || d.status === 'manual')) {
      days.add(d.date);
    }
  }
  const expected = now.getDate();
  const confirmed = days.size;
  return { confirmed, expected, rate: expected ? Math.min(100, Math.round((confirmed / expected) * 100)) : 0 };
}

export function flaggedDoses(state: StoreState): DoseRecord[] {
  return state.doses.filter((d) => d.status === 'flagged').sort((a, b) => (a.date < b.date ? 1 : -1));
}

// --- store context ---------------------------------------------------------
type StoreApi = {
  state: StoreState;
  hydrated: boolean;
  recordDose: (p: { status: DoseStatus; time?: string; date?: string; verdict?: Verdict; videoUri?: string }) => DoseRecord;
  updateRecordedDose: (id: string, patch: Partial<DoseRecord>) => void;
  toggleManual: (key: string) => void;
  setRole: (role: AppRole | null) => void;
  setPatientName: (name: string | null) => void;
  setMedication: (patch: Partial<Medication>) => void;
  addDose: (slot?: Slot) => void;
  updateDose: (id: string, patch: Partial<import('@/lib/medication').ScheduledDose>) => void;
  removeDose: (id: string) => void;
  setRemindersEnabled: (v: boolean) => void;
  setPrizes: (prizes: PrizeProgram) => void;
  reset: () => void;
};

const StoreContext = createContext<StoreApi | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) {
        try {
          setState(normalizeState(JSON.parse(raw)));
        } catch {
          /* keep defaults */
        }
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
    syncState(state).catch((error) => console.warn('[api] state sync failed', error));
  }, [state, hydrated]);

  const api = useMemo<StoreApi>(
    () => ({
      state,
      hydrated,
      recordDose: (p) => {
        const time = p.time ?? nextDose(state.schedule)?.time ?? '08:00';
        const rec: DoseRecord = {
          id: `d${Date.now()}`,
          date: p.date ?? dateKey(),
          time,
          status: p.status,
          verdict: p.verdict,
          videoUri: p.videoUri,
        };
        setState((s) => ({ ...s, doses: [...s.doses, rec] }));
        postDose(rec).catch((error) => console.warn('[api] dose sync failed', error));
        return rec;
      },
      updateRecordedDose: (id, patch) =>
        setState((s) => ({
          ...s,
          doses: s.doses.map((d) => (d.id === id ? { ...d, ...patch } : d)),
        })),
      toggleManual: (key) =>
        setState((s) => {
          const existing = s.doses.find((d) => d.date === key && d.status === 'manual');
          if (existing) return { ...s, doses: s.doses.filter((d) => d.id !== existing.id) };
          const time = sortedDoses(s.schedule)[0]?.time ?? '08:00';
          return { ...s, doses: [...s.doses, { id: `d${Date.now()}`, date: key, time, status: 'manual' }] };
        }),
      setRole: (role) => setState((s) => ({ ...s, role })),
      setPatientName: (name) => setState((s) => ({ ...s, patientName: name })),
      setMedication: (patch) => setState((s) => ({ ...s, medication: { ...s.medication, ...patch } })),
      addDose: (slot) =>
        setState((s) => ({ ...s, schedule: { ...s.schedule, doses: [...s.schedule.doses, newDose(slot)] } })),
      updateDose: (id, patch) =>
        setState((s) => ({
          ...s,
          schedule: { ...s.schedule, doses: s.schedule.doses.map((d) => (d.id === id ? { ...d, ...patch } : d)) },
        })),
      removeDose: (id) =>
        setState((s) => ({ ...s, schedule: { ...s.schedule, doses: s.schedule.doses.filter((d) => d.id !== id) } })),
      setRemindersEnabled: (v) => setState((s) => ({ ...s, schedule: { ...s.schedule, remindersEnabled: v } })),
      setPrizes: (prizes) => setState((s) => ({ ...s, prizes })),
      reset: () => setState(initialState),
    }),
    [state, hydrated],
  );

  return createElement(StoreContext.Provider, { value: api }, children);
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within <StoreProvider>');
  return ctx;
}
