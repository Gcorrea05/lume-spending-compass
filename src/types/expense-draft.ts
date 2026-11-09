import type { CategoryId } from "@/types/finance";

/** Form values, not database entities. Nothing is persisted by this module. */
export interface ExpenseParticipantDraft {
  id: string;
  name: string;
  amount: string;
  isOwner: boolean;
}

export interface ExpenseDraft {
  description: string;
  amount: string;
  date: string;
  category: CategoryId | "";
  payment: "" | "pix" | "debito" | "credito";
  invoiceMonth: string;
  invoiceManual: boolean;
  recurring: boolean;
  installment: boolean;
  installmentCount: number;
  currentInstallment: number;
  shared: boolean;
  participants: ExpenseParticipantDraft[];
}

/** Frontend review contract. No API endpoint or storage schema is assumed. */
export interface ReviewedExpense {
  description: string;
  amountCents: number;
  purchaseDate: string;
  category: CategoryId;
  payment: "pix" | "debito" | "credito";
  invoice: { month: string; manuallySelected: boolean; demoCard: true } | null;
  recurringMonthly: boolean;
  installments: { count: number; current: number } | null;
  shared: boolean;
  myShareCents: number;
  participants: { id: string; name: string; amountCents: number; isOwner: boolean }[];
}

export type ExpenseDraftErrors = Record<string, string>;
export type ExpenseReviewResult =
  | { ok: true; value: ReviewedExpense }
  | { ok: false; errors: ExpenseDraftErrors };
