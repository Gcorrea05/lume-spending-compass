import type { DemoCalendar } from "./demo-calendar";
import type {
  CategoryId,
  ExpenseOccurrence,
  IncomeOccurrence,
  Installment,
  MonthKey,
  PaymentInfo,
} from "@/types/finance";

/**
 * Deterministic demo dataset, built relative to the demo base month (offset 0).
 *
 * Occurrences arrive already prepared: invoice month (card closes on day 27;
 * a purchase on the closing day goes to the next invoice), installment number,
 * fixed-expense adjustments and forecast status. The UI never derives these.
 *
 * Coverage: months -2 and -1 (past), 0 (main scenario), +1..+4 (forecast:
 * fixed expenses and installments only, no invented income). Earlier months
 * have no records (demo start).
 */

export const DEMO_CARD = { name: "Cartão principal", closingDay: 27 } as const;
export const DEMO_INITIAL_BALANCE_CENTS = 120_000;

interface Draft {
  id: string;
  description: string;
  category: CategoryId;
  date: string;
  competence: MonthKey;
  total: number;
  mine?: number;
  fixed?: boolean;
  installment?: Installment;
  status?: "registrado" | "previsto";
  payment: PaymentInfo;
}

const occ = (x: Draft): ExpenseOccurrence => ({
  id: x.id,
  description: x.description,
  category: x.category,
  date: x.date,
  competence: x.competence,
  totalCents: x.total,
  myShareCents: x.mine ?? x.total,
  shared: x.mine !== undefined && x.mine !== x.total,
  fixed: x.fixed ?? false,
  installment: x.installment,
  status: x.status ?? "registrado",
  payment: x.payment,
});

export function buildDemoDataset(cal: DemoCalendar) {
  const { m, d } = cal;
  const card = (offset: number): PaymentInfo => ({
    method: "credito",
    cardName: DEMO_CARD.name,
    invoice: m(offset),
  });
  const pix: PaymentInfo = { method: "pix" };
  const debito: PaymentInfo = { method: "debito" };

  const tabletPurchase = d(-1, 15);
  const tripPurchase = d(-2, 15);

  const expenses: ExpenseOccurrence[] = [
    // ── Month -2 ───────────────────────────────────────────────
    occ({ id: "m2-viagem", description: "Viagem compartilhada", category: "lazer", date: d(-2, 15), competence: m(-2), total: 30_000, mine: 15_000, installment: { current: 1, total: 2, purchaseDate: tripPurchase }, payment: card(-2) }),
    occ({ id: "m2-internet", description: "Internet", category: "casa", date: d(-2, 10), competence: m(-2), total: 12_000, fixed: true, payment: debito }),
    occ({ id: "m2-mensalidade", description: "Mensalidade", category: "estudos", date: d(-2, 5), competence: m(-2), total: 15_000, fixed: true, payment: pix }),
    occ({ id: "m2-streaming", description: "Streaming", category: "lazer", date: d(-2, 12), competence: m(-2), total: 4_000, fixed: true, payment: card(-2) }),
    occ({ id: "m2-mercado", description: "Mercado", category: "alimentacao", date: d(-2, 8), competence: m(-2), total: 16_500, payment: debito }),
    occ({ id: "m2-combustivel", description: "Combustível", category: "transporte", date: d(-2, 20), competence: m(-2), total: 9_000, payment: debito }),
    occ({ id: "m2-farmacia", description: "Farmácia", category: "saude", date: d(-2, 23), competence: m(-2), total: 3_500, payment: pix }),

    // ── Month -1 ───────────────────────────────────────────────
    occ({ id: "m1-viagem", description: "Viagem compartilhada", category: "lazer", date: d(-1, 15), competence: m(-1), total: 30_000, mine: 15_000, installment: { current: 2, total: 2, purchaseDate: tripPurchase }, payment: card(-1) }),
    occ({ id: "m1-tablet", description: "Tablet", category: "estudos", date: d(-1, 15), competence: m(-1), total: 20_000, installment: { current: 1, total: 6, purchaseDate: tabletPurchase }, payment: card(-1) }),
    occ({ id: "m1-internet", description: "Internet", category: "casa", date: d(-1, 10), competence: m(-1), total: 12_000, fixed: true, payment: debito }),
    occ({ id: "m1-mensalidade", description: "Mensalidade", category: "estudos", date: d(-1, 5), competence: m(-1), total: 15_000, fixed: true, payment: pix }),
    occ({ id: "m1-streaming", description: "Streaming", category: "lazer", date: d(-1, 12), competence: m(-1), total: 4_000, fixed: true, payment: card(-1) }),
    occ({ id: "m1-mercado", description: "Mercado", category: "alimentacao", date: d(-1, 9), competence: m(-1), total: 21_000, payment: debito }),
    occ({ id: "m1-restaurante", description: "Restaurante", category: "alimentacao", date: d(-1, 22), competence: m(-1), total: 9_500, payment: card(-1) }),
    occ({ id: "m1-combustivel", description: "Combustível", category: "transporte", date: d(-1, 3), competence: m(-1), total: 11_000, payment: debito }),
    occ({ id: "m1-farmacia", description: "Farmácia", category: "saude", date: d(-1, 24), competence: m(-1), total: 4_500, payment: pix }),
    occ({ id: "m1-cinema", description: "Cinema", category: "lazer", date: d(-1, 19), competence: m(-1), total: 6_000, payment: card(-1) }),
    // Day 26: before closing, stays in this invoice.
    occ({ id: "m1-padaria", description: "Padaria", category: "alimentacao", date: d(-1, 26), competence: m(-1), total: 6_500, payment: card(-1) }),
    // Purchased on closing day (27) of month -2 → invoice of month -1.
    occ({ id: "m1-livros", description: "Livros", category: "estudos", date: d(-2, 27), competence: m(-1), total: 8_500, payment: card(-1) }),

    // ── Month 0 (main scenario, 12 records) ────────────────────
    occ({ id: "m0-supermercado", description: "Supermercado compartilhado", category: "alimentacao", date: d(0, 18), competence: m(0), total: 120_000, mine: 20_000, payment: card(0) }),
    occ({ id: "m0-tablet", description: "Tablet", category: "estudos", date: d(0, 15), competence: m(0), total: 20_000, installment: { current: 2, total: 6, purchaseDate: tabletPurchase }, payment: card(0) }),
    occ({ id: "m0-internet", description: "Internet", category: "casa", date: d(0, 10), competence: m(0), total: 12_000, fixed: true, payment: debito }),
    occ({ id: "m0-mensalidade", description: "Mensalidade", category: "estudos", date: d(0, 5), competence: m(0), total: 15_000, fixed: true, payment: pix }),
    occ({ id: "m0-streaming", description: "Streaming", category: "lazer", date: d(0, 12), competence: m(0), total: 4_000, fixed: true, payment: card(0) }),
    occ({ id: "m0-mercado", description: "Mercado", category: "alimentacao", date: d(0, 16), competence: m(0), total: 18_000, payment: debito }),
    // Purchased on day 28 of month -1, after closing → invoice of month 0.
    occ({ id: "m0-restaurante", description: "Restaurante", category: "alimentacao", date: d(-1, 28), competence: m(0), total: 12_000, payment: card(0) }),
    occ({ id: "m0-combustivel", description: "Combustível", category: "transporte", date: d(0, 14), competence: m(0), total: 10_000, payment: debito }),
    occ({ id: "m0-farmacia", description: "Farmácia", category: "saude", date: d(0, 8), competence: m(0), total: 6_000, payment: pix }),
    occ({ id: "m0-transporte", description: "Transporte", category: "transporte", date: d(0, 19), competence: m(0), total: 4_000, payment: debito }),
    occ({ id: "m0-cinema", description: "Cinema", category: "lazer", date: d(0, 17), competence: m(0), total: 7_000, payment: card(0) }),
    occ({ id: "m0-padaria", description: "Padaria", category: "alimentacao", date: d(0, 20), competence: m(0), total: 8_000, payment: pix }),
  ];

  // ── Months +1..+4: forecast (fixed + remaining installments) ─
  for (let k = 1; k <= 4; k++) {
    const status = "previsto" as const;
    expenses.push(
      occ({ id: `p${k}-tablet`, description: "Tablet", category: "estudos", date: d(k, 15), competence: m(k), total: 20_000, installment: { current: 2 + k, total: 6, purchaseDate: tabletPurchase }, status, payment: card(k) }),
      occ({ id: `p${k}-internet`, description: "Internet", category: "casa", date: d(k, 10), competence: m(k), total: 12_000, fixed: true, status, payment: debito }),
      // Fixed expense adjusted only in month +1 (150 → 180 → 150).
      occ({ id: `p${k}-mensalidade`, description: "Mensalidade", category: "estudos", date: d(k, 5), competence: m(k), total: k === 1 ? 18_000 : 15_000, fixed: true, status, payment: pix }),
      occ({ id: `p${k}-streaming`, description: "Streaming", category: "lazer", date: d(k, 12), competence: m(k), total: 4_000, fixed: true, status, payment: card(k) }),
    );
  }

  const incomes: IncomeOccurrence[] = [
    { id: "i-m2-salario", description: "Salário", date: d(-2, 5), competence: m(-2), amountCents: 320_000 },
    { id: "i-m1-salario", description: "Salário", date: d(-1, 5), competence: m(-1), amountCents: 320_000 },
    { id: "i-m0-salario", description: "Salário", date: d(0, 5), competence: m(0), amountCents: 320_000 },
    { id: "i-m0-freela", description: "Trabalho extra", date: d(0, 12), competence: m(0), amountCents: 36_000 },
  ];

  return { expenses, incomes };
}
