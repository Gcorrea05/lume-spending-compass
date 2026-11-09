import { CATEGORIES } from "@/types/finance";
import type { ExpenseDraft, ExpenseDraftErrors, ExpenseReviewResult } from "@/types/expense-draft";

export function createExpenseDraft(): ExpenseDraft {
  return {
    description: "", amount: "", date: "", category: "", payment: "",
    invoiceMonth: "", invoiceManual: false, recurring: false,
    installment: false, installmentCount: 1, currentInstallment: 1,
    shared: false,
    participants: [
      { id: "owner", name: "Minha parte", amount: "", isOwner: true },
      { id: "participant-1", name: "", amount: "", isOwner: false },
    ],
  };
}

/** Exact BRL input parsing. Rejects negatives, exponents and ambiguous dot decimals. */
export function parseExpenseMoney(raw: string): number | null {
  const value = raw.trim();
  if (!/^(?:\d+|[1-9]\d{0,2}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ""] = value.replaceAll(".", "").split(",");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents >= 0 ? cents : null;
}

export function isExpenseDate(value: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return false;
  const y = Number(m[1]), month = Number(m[2]), day = Number(m[3]);
  if (y < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= (days[month - 1] ?? 0);
}

export function isExpenseMonth(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value) && Number(value.slice(0, 4)) > 0;
}

/** Approved demo card rule: purchase ON the closing day belongs to the NEXT invoice. */
export function suggestExpenseInvoice(date: string, closingDay = 27): string {
  if (!isExpenseDate(date) || !Number.isInteger(closingDay) || closingDay < 1 || closingDay > 31) return "";
  const [year = 0, month = 0, day = 0] = date.split("-").map(Number);
  const index = year * 12 + month - 1 + (day >= closingDay ? 1 : 0);
  const invoiceYear = Math.floor(index / 12);
  if (invoiceYear > 9999) return "";
  return `${String(invoiceYear).padStart(4, "0")}-${String(index % 12 + 1).padStart(2, "0")}`;
}

export function expenseInvoice(draft: ExpenseDraft): string {
  return draft.invoiceManual ? draft.invoiceMonth : suggestExpenseInvoice(draft.date);
}

/** Only form consistency checks; no posting, recurrence generation or balance update. */
export function reviewExpenseDraft(draft: ExpenseDraft): ExpenseReviewResult {
  const errors: ExpenseDraftErrors = {};
  const description = draft.description.trim();
  const total = parseExpenseMoney(draft.amount);
  if (!description) errors["expense-description"] = "Informe o motivo do gasto.";
  else if (description.length > 200) errors["expense-description"] = "Use até 200 caracteres no motivo.";
  if (total === null || total <= 0) errors["expense-amount"] = "Informe um valor maior que zero. Exemplo: 1.200,00.";
  if (!isExpenseDate(draft.date)) errors["expense-date"] = "Informe uma data válida.";
  if (!CATEGORIES.some(c => c.id === draft.category)) errors["expense-category"] = "Selecione uma categoria.";
  if (!["pix", "debito", "credito"].includes(draft.payment)) errors["expense-payment"] = "Selecione a forma de pagamento.";
  const invoice = expenseInvoice(draft);
  if (draft.payment === "credito" && !isExpenseMonth(invoice)) {
    errors["expense-invoice"] = "Informe o mês e ano da fatura.";
  }
  if (draft.installment) {
    if (!Number.isInteger(draft.installmentCount) || draft.installmentCount < 1 || draft.installmentCount > 12) {
      errors["expense-installments"] = "Selecione de 1 a 12 parcelas, conforme o cadastro previsto.";
    }
    if (!Number.isInteger(draft.currentInstallment) || draft.currentInstallment < 1 || draft.currentInstallment > draft.installmentCount) {
      errors["expense-current-installment"] = "A parcela atual deve estar entre 1 e a quantidade de parcelas.";
    }
  }
  let myShare = total ?? 0;
  let participants: { id: string; name: string; amountCents: number; isOwner: boolean }[] = [];
  if (draft.shared) {
    if (draft.participants.length < 2 || draft.participants.filter(p => p.isOwner).length !== 1) {
      errors["expense-shares"] = "Informe sua parte e pelo menos mais um participante.";
    }
    if (new Set(draft.participants.map(p => p.id)).size !== draft.participants.length) {
      errors["expense-shares"] = "Os participantes precisam ter identificadores distintos.";
    }
    participants = draft.participants.map((p, index) => {
      const name = p.name.trim(), amount = parseExpenseMoney(p.amount);
      if (!name || name.length > 120) errors[`expense-person-${index}`] = "Informe o nome do participante (até 120 caracteres).";
      if (amount === null) errors[`expense-share-${index}`] = "Informe um valor válido para esta parte, inclusive 0,00 se necessário.";
      return { id: p.id, name, amountCents: amount ?? 0, isOwner: p.isOwner };
    });
    const sum = participants.reduce((s, p) => s + p.amountCents, 0);
    if (!Number.isSafeInteger(sum) || (total !== null && sum !== total)) {
      errors["expense-shares"] = "A soma de todas as partes precisa ser igual ao valor total do gasto.";
    }
    myShare = participants.find(p => p.isOwner)?.amountCents ?? 0;
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  // The discriminants below were checked above. Keep this UI contract independent of API/storage.
  if (total === null || !draft.category || !draft.payment) return { ok: false, errors: { "expense-amount": "Revise os campos." } };
  return { ok: true, value: {
    description, amountCents: total, purchaseDate: draft.date, category: draft.category,
    payment: draft.payment,
    invoice: draft.payment === "credito" ? { month: invoice, manuallySelected: draft.invoiceManual, demoCard: true } : null,
    recurringMonthly: draft.recurring,
    installments: draft.installment ? { count: draft.installmentCount, current: draft.currentInstallment } : null,
    shared: draft.shared, myShareCents: myShare, participants,
  } };
}
