/**
 * Medication + dose schedule. This is the patient's schedule — separate from
 * prizes. A schedule is a set of daily doses, each with a time-of-day slot, a
 * clock time (so reminders can fire), and an optional food relation.
 */

type TFn = (key: string, opts?: Record<string, unknown>) => string;

export type Slot = 'morning' | 'afternoon' | 'evening' | 'night';
export type Food = 'before' | 'after' | 'with' | 'none';

export const SLOTS: { key: Slot; defaultTime: string }[] = [
  { key: 'morning', defaultTime: '08:00' },
  { key: 'afternoon', defaultTime: '14:00' },
  { key: 'evening', defaultTime: '20:00' },
  { key: 'night', defaultTime: '22:00' },
];

export const FOODS: Food[] = ['none', 'before', 'after', 'with'];

export type ScheduledDose = { id: string; slot: Slot; time: string; food: Food };
export type Schedule = { doses: ScheduledDose[]; remindersEnabled: boolean };
export type Medication = { name: string; dose: string };

let _seq = 0;
const sid = () => `s${Date.now().toString(36)}${_seq++}`;

export function defaultTimeFor(slot: Slot): string {
  return SLOTS.find((s) => s.key === slot)?.defaultTime ?? '08:00';
}

export function newDose(slot: Slot = 'morning'): ScheduledDose {
  return { id: sid(), slot, time: defaultTimeFor(slot), food: 'none' };
}

export function defaultSchedule(): Schedule {
  return { doses: [], remindersEnabled: false };
}

export function defaultMedication(): Medication {
  return { name: '', dose: '' };
}

/** "Morning · 08:00 · after food" — localized. */
export function describeDose(d: ScheduledDose, t: TFn): string {
  const parts = [t(`slot.${d.slot}`), d.time];
  if (d.food !== 'none') parts.push(t(`food.${d.food}`));
  return parts.join(' · ');
}

export function sortedDoses(s: Schedule): ScheduledDose[] {
  return [...s.doses].sort((a, b) => a.time.localeCompare(b.time));
}

/** The next upcoming dose today (falls back to the first dose of the day). */
export function nextDose(s: Schedule, now: Date = new Date()): ScheduledDose | null {
  const sorted = sortedDoses(s);
  if (!sorted.length) return null;
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return sorted.find((d) => d.time >= hhmm) ?? sorted[0];
}

export function scheduleTimes(s: Schedule): string[] {
  return sortedDoses(s).map((d) => d.time);
}
