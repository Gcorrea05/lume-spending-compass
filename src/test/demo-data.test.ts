import { describe, expect, it } from "vitest";

import { selectCategory, selectInterval, selectMonth, validateFilterSearch } from "@/lib/filters";
import { createDemoCalendar } from "@/mocks/demo-calendar";
import { createDemoRepository } from "@/mocks/demo-repository";

// Fixed "now" so the scenario is deterministic: base month Nov/2026, base date 20/11/2026.
const cal = createDemoCalendar(new Date(2026, 10, 8));
const repo = createDemoRepository(cal);
const nov = { kind: "month", month: "2026-11" } as const;

describe("main demo scenario (current month)", () => {
  it("has the approved totals", () => {
    const s = repo.getPeriodSummary(nov);
    expect(s.incomeCents).toBe(356_000);
    expect(s.outflowTotalCents).toBe(236_000);
    expect(s.myShareCents).toBe(136_000);
    expect(s.resultCents).toBe(220_000);
    expect(s.recordCount).toBe(12);
  });

  it("starts with Saldo Atual of R$ 1.200,00", () => {
    expect(repo.initialBalanceCents).toBe(120_000);
  });

  it("shows at most ten, most recent first, including the shared and installment examples", () => {
    const { items, total } = repo.getExpenses(nov, undefined, 10);
    expect(total).toBe(12);
    expect(items).toHaveLength(10);
    const dates = items.map((e) => e.date);
    expect([...dates].sort().reverse()).toEqual(dates);
    expect(items.some((e) => e.shared)).toBe(true);
    expect(items.some((e) => e.installment?.current === 2 && e.installment.total === 6)).toBe(true);
  });

  it("filters by category before limiting", () => {
    const { items, total } = repo.getExpenses(nov, "alimentacao", 10);
    expect(total).toBe(4);
    expect(items.every((e) => e.category === "alimentacao")).toBe(true);
  });

  it("never dates a registered expense after the base date", () => {
    for (const offset of [-2, -1, 0]) {
      const { items } = repo.getExpenses({ kind: "month", month: cal.m(offset) });
      for (const e of items) expect(e.date <= cal.baseDate).toBe(true);
    }
  });
});

describe("invoice and recurrence context in mocks", () => {
  it("a purchase on the closing day (27) goes to the next invoice, day 26 stays", () => {
    const oct = repo.getExpenses({ kind: "month", month: "2026-10" }).items;
    expect(oct.find((e) => e.id === "m1-livros")?.date).toBe("2026-09-27");
    expect(oct.find((e) => e.id === "m1-padaria")?.date).toBe("2026-10-26");
    const novItems = repo.getExpenses(nov).items;
    expect(novItems.find((e) => e.id === "m0-restaurante")?.date).toBe("2026-10-28");
  });

  it("Mensalidade is 150 now, 180 next month and 150 after", () => {
    const fee = (month: string) =>
      repo.getExpenses({ kind: "month", month }).items.find((e) => e.description === "Mensalidade")
        ?.totalCents;
    expect(fee("2026-11")).toBe(15_000);
    expect(fee("2026-12")).toBe(18_000);
    expect(fee("2027-01")).toBe(15_000);
  });

  it("future month shows only forecasts and no invented income", () => {
    const s = repo.getPeriodSummary({ kind: "month", month: "2026-12" });
    expect(s.hasForecast).toBe(true);
    expect(s.incomeCents).toBe(0);
    expect(s.resultCents).toBe(-54_000);
  });

  it("intervals ignore forecasts", () => {
    const { items } = repo.getExpenses({ kind: "days", days: 90 });
    expect(items.every((e) => e.status === "registrado")).toBe(true);
  });

  it("months before the demo start have no records", () => {
    expect(repo.getExpenses({ kind: "month", month: "2026-08" }).total).toBe(0);
  });
});

describe("filters", () => {
  it("month and interval are mutually exclusive", () => {
    expect(selectInterval({ mes: "2026-11", categoria: "lazer" }, 30)).toEqual({
      mes: undefined,
      dias: 30,
      categoria: "lazer",
    });
    expect(selectMonth({ dias: 7 }, "2026-12")).toEqual({ mes: "2026-12", dias: undefined });
  });

  it("category combines with any period", () => {
    expect(selectCategory({ dias: 15 }, "saude")).toEqual({ dias: 15, categoria: "saude" });
  });

  it("rejects intervals other than 7, 15, 30 and 90 days", () => {
    expect(validateFilterSearch({ dias: "10" })).toEqual({});
    expect(validateFilterSearch({ dias: "90" })).toEqual({ dias: 90 });
  });
});
