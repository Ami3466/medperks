/**
 * Prizes — fully caregiver-customizable. Two modes:
 *
 *  - manual: a list of PrizeRules. Each = a free-text prize earned "every N
 *    days/weeks/months, allowing up to M misses". Stack as many as you want.
 *    Covers $5/day, $100/week, every 13 days, "no misses over 60 days", etc.
 *
 *  - auto: a list of prizes, each with a cap ("up to N per day/week/month").
 *    The caregiver sets only the limits; the app rotates/combines prizes within them.
 *
 * No payment integration and no hardcoded currency — prize text is whatever the
 * caregiver writes, and they hand the prize over themselves.
 */

type TFn = (key: string, opts?: Record<string, unknown>) => string;

let _seq = 0;
const rid = () => `r${Date.now().toString(36)}${_seq++}`;

export type PrizeUnit = 'days' | 'weeks' | 'months';
export const PRIZE_UNITS: PrizeUnit[] = ['days', 'weeks', 'months'];

export type PrizeRule = {
  id: string;
  prize: string; // free text — anything the caregiver decides
  everyN: number;
  unit: PrizeUnit;
  maxMisses: number;
};

export type AutoPeriod = 'day' | 'week' | 'month';
export const AUTO_PERIODS: AutoPeriod[] = ['day', 'week', 'month'];

export type AutoPrize = {
  id: string;
  label: string; // free text
  limit: number;
  period: AutoPeriod;
};

export type ManualPrizes = { mode: 'manual'; rules: PrizeRule[] };
export type AutoPrizes = { mode: 'auto'; prizes: AutoPrize[] };
export type PrizeProgram = ManualPrizes | AutoPrizes;

export function newRule(): PrizeRule {
  return { id: rid(), prize: '', everyN: 1, unit: 'days', maxMisses: 0 };
}

export function newAutoPrize(): AutoPrize {
  return { id: rid(), label: '', limit: 1, period: 'week' };
}

/** The condition phrase, e.g. "Every day" / "Every 60 days · up to 5 misses". */
export function describePrizeRule(r: PrizeRule, t: TFn): string {
  const every = r.everyN === 1 ? t(`prize.everyOne_${r.unit}`) : t(`prize.everyN_${r.unit}`, { n: r.everyN });
  const misses = r.maxMisses > 0 ? t('prize.withMisses', { max: r.maxMisses }) : '';
  return `${every}${misses}`;
}

/** "Up to 10 ice cream per month". */
export function describeAutoPrize(a: AutoPrize, t: TFn): string {
  return t(`auto.upTo_${a.period}`, { limit: a.limit, label: a.label });
}

export function defaultManualPrizes(): ManualPrizes {
  return { mode: 'manual', rules: [] };
}

export function defaultAutoPrizes(): AutoPrizes {
  return { mode: 'auto', prizes: [] };
}
