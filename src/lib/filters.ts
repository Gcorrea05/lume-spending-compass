import {
  CATEGORIES,
  INTERVAL_OPTIONS,
  type CategoryId,
  type IntervalDays,
  type MonthKey,
  type PeriodSelection,
} from "@/types/finance";

/** Filter state kept in the URL so "Ver todos" and "Voltar" preserve it. */
export interface FilterSearch {
  mes?: MonthKey | undefined;
  dias?: IntervalDays | undefined;
  categoria?: CategoryId | undefined;
}

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function validateFilterSearch(raw: Record<string, unknown>): FilterSearch {
  const out: FilterSearch = {};
  const dias = Number(raw["dias"]);
  if ((INTERVAL_OPTIONS as readonly number[]).includes(dias)) {
    out.dias = dias as IntervalDays;
  } else if (typeof raw["mes"] === "string" && MONTH_RE.test(raw["mes"])) {
    out.mes = raw["mes"];
  }
  if (typeof raw["categoria"] === "string" && CATEGORIES.some((c) => c.id === raw["categoria"])) {
    out.categoria = raw["categoria"] as CategoryId;
  }
  return out;
}

/** Month and interval are mutually exclusive; with neither, use the default month. */
export function resolvePeriod(search: FilterSearch, defaultMonth: MonthKey): PeriodSelection {
  if (search.dias) return { kind: "days", days: search.dias };
  return { kind: "month", month: search.mes ?? defaultMonth };
}

export const selectMonth = (s: FilterSearch, mes: MonthKey): FilterSearch => ({
  ...s,
  mes,
  dias: undefined,
});

export const selectInterval = (s: FilterSearch, dias: IntervalDays): FilterSearch => ({
  ...s,
  dias,
  mes: undefined,
});

export const selectCategory = (s: FilterSearch, categoria?: CategoryId): FilterSearch => ({
  ...s,
  categoria,
});
