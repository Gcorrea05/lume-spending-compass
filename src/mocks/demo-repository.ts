import { formatDayMonth, formatMonthLabel } from "@/lib/format";
import { addDays, createDemoCalendar, daysBetween, type DemoCalendar } from "./demo-calendar";
import { buildDemoDataset, DEMO_INITIAL_BALANCE_CENTS } from "./demo-data";
import type {
  CategoryId,
  ExpenseOccurrence,
  IncomeOccurrence,
  PeriodSelection,
  PeriodSummary,
} from "@/types/finance";

/**
 * Demo data access. Selects prepared occurrences and demo aggregates for a
 * period. This is a stand-in for a future API, not the production rules engine.
 */
export function createDemoRepository(cal: DemoCalendar = createDemoCalendar()) {
  const { expenses, incomes } = buildDemoDataset(cal);

  const inPeriod = <T extends { date: string; competence: string }>(
    item: T & { status?: string },
    period: PeriodSelection,
  ) => {
    if (period.kind === "month") return item.competence === period.month;
    if (item.status === "previsto") return false;
    const diff = daysBetween(item.date, cal.baseDate);
    return diff >= 0 && diff < period.days;
  };

  const sortByDateDesc = (a: ExpenseOccurrence, b: ExpenseOccurrence) =>
    a.date === b.date ? a.id.localeCompare(b.id) : a.date < b.date ? 1 : -1;

  function periodExpenses(period: PeriodSelection): ExpenseOccurrence[] {
    return expenses.filter((e) => inPeriod(e, period));
  }

  function periodIncomes(period: PeriodSelection): IncomeOccurrence[] {
    return incomes.filter((i) => inPeriod(i, period));
  }

  return {
    calendar: cal,
    initialBalanceCents: DEMO_INITIAL_BALANCE_CENTS,

    /** Indicators for the whole period (all records, never the category filter). */
    getPeriodSummary(period: PeriodSelection): PeriodSummary {
      const list = periodExpenses(period);
      const incomeCents = periodIncomes(period).reduce((s, i) => s + i.amountCents, 0);
      const outflowTotalCents = list.reduce((s, e) => s + e.totalCents, 0);
      const myShareCents = list.reduce((s, e) => s + e.myShareCents, 0);
      const label =
        period.kind === "month" ? formatMonthLabel(period.month) : `Últimos ${period.days} dias`;
      const detail =
        period.kind === "days"
          ? `${formatDayMonth(addDays(cal.baseDate, -(period.days - 1)))} a ${formatDayMonth(cal.baseDate)}`
          : undefined;
      return {
        label,
        detail,
        incomeCents,
        outflowTotalCents,
        myShareCents,
        resultCents: incomeCents - myShareCents,
        hasForecast: list.some((e) => e.status === "previsto"),
        recordCount: list.length,
      };
    },

    /** Filter → sort (most recent first) → optional limit. */
    getExpenses(
      period: PeriodSelection,
      category?: CategoryId,
      limit?: number,
    ): { items: ExpenseOccurrence[]; total: number } {
      const filtered = periodExpenses(period)
        .filter((e) => !category || e.category === category)
        .sort(sortByDateDesc);
      return { items: limit ? filtered.slice(0, limit) : filtered, total: filtered.length };
    },
  };
}

export type DemoRepository = ReturnType<typeof createDemoRepository>;

/** Shared instance for the running prototype. */
export const demoRepository = createDemoRepository();
