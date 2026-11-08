import { toMonthKey } from "@/lib/format";
import type { IsoDate, MonthKey } from "@/types/finance";

/**
 * Explicit demo base date ("today" for the demo).
 * Aligned to the current calendar month; the day is fixed so the scenario's
 * records always fit before it. Nothing registered is dated after it.
 */
export const DEMO_BASE_DAY = 20;

export interface DemoCalendar {
  baseYear: number;
  /** 1-12 */
  baseMonth: number;
  baseDate: IsoDate;
  baseMonthKey: MonthKey;
  /** Month key relative to the base month. */
  m: (offset: number) => MonthKey;
  /** ISO date at `day` in the month at `offset` from base. */
  d: (offset: number, day: number) => IsoDate;
}

export function createDemoCalendar(now: Date = new Date()): DemoCalendar {
  const baseYear = now.getFullYear();
  const baseMonth = now.getMonth() + 1;

  const shift = (offset: number) => {
    const idx = baseYear * 12 + (baseMonth - 1) + offset;
    return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
  };
  const m = (offset: number) => {
    const { year, month } = shift(offset);
    return toMonthKey(year, month);
  };
  const d = (offset: number, day: number) => `${m(offset)}-${String(day).padStart(2, "0")}`;

  return {
    baseYear,
    baseMonth,
    baseDate: d(0, DEMO_BASE_DAY),
    baseMonthKey: m(0),
    m,
    d,
  };
}

/** Days between two ISO dates (b - a), timezone-safe. */
export function daysBetween(a: IsoDate, b: IsoDate): number {
  const toUtc = (iso: IsoDate) => {
    const [y = 0, mo = 1, da = 1] = iso.split("-").map(Number);
    return Date.UTC(y, mo - 1, da);
  };
  return Math.round((toUtc(b) - toUtc(a)) / 86_400_000);
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  const [y = 0, mo = 1, da = 1] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, mo - 1, da + days));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(
    t.getUTCDate(),
  ).padStart(2, "0")}`;
}
