/** View models consumed by the UI. A future API layer only needs to return these shapes. */

export type CategoryId = "alimentacao" | "transporte" | "casa" | "estudos" | "saude" | "lazer";

export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "alimentacao", label: "Alimentação" },
  { id: "transporte", label: "Transporte" },
  { id: "casa", label: "Casa" },
  { id: "estudos", label: "Estudos" },
  { id: "saude", label: "Saúde" },
  { id: "lazer", label: "Lazer" },
];

export const categoryLabel = (id: CategoryId) =>
  CATEGORIES.find((c) => c.id === id)?.label ?? id;

export const INTERVAL_OPTIONS = [7, 15, 30, 90] as const;
export type IntervalDays = (typeof INTERVAL_OPTIONS)[number];

/** ISO date "yyyy-mm-dd". */
export type IsoDate = string;
/** Competence month "yyyy-mm". */
export type MonthKey = string;

export type PaymentInfo =
  | { method: "credito"; cardName: string; invoice: MonthKey }
  | { method: "debito" | "pix" };

export interface Installment {
  current: number;
  total: number;
  /** Original purchase date, preserved. */
  purchaseDate: IsoDate;
}

/** One monthly occurrence of an expense, as prepared by the data layer. */
export interface ExpenseOccurrence {
  id: string;
  description: string;
  category: CategoryId;
  /** Displayed and sorting date. For installments, the monthly reference date. */
  date: IsoDate;
  /** Month this occurrence belongs to (invoice month for card purchases). */
  competence: MonthKey;
  /** Total of this occurrence (for installments: the installment value). */
  totalCents: number;
  /** Owner's share of this occurrence. */
  myShareCents: number;
  shared: boolean;
  fixed: boolean;
  installment?: Installment | undefined;
  status: "registrado" | "previsto";
  payment: PaymentInfo;
}

export interface IncomeOccurrence {
  id: string;
  description: string;
  date: IsoDate;
  competence: MonthKey;
  amountCents: number;
}

export type PeriodSelection =
  | { kind: "month"; month: MonthKey }
  | { kind: "days"; days: IntervalDays };

export interface PeriodSummary {
  label: string;
  /** Extra context, e.g. "21/10 a 20/11". */
  detail?: string | undefined;
  incomeCents: number;
  outflowTotalCents: number;
  myShareCents: number;
  /** Income minus owner's share. */
  resultCents: number;
  hasForecast: boolean;
  recordCount: number;
}

export type ListStatus = "ready" | "error";
