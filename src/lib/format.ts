import type { IsoDate, MonthKey } from "@/types/finance";

/** Centralized display formats (pt-BR). All money is handled as integer cents. */

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const plain = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "R$ 1.200,00" — normalizes the non-breaking space Intl emits. */
export function formatBRL(cents: number): string {
  return brl.format(cents / 100).replace(/\u00a0/g, " ");
}

/** "1.200,00" without currency symbol. */
export function formatAmount(cents: number): string {
  return plain.format(cents / 100);
}

/** "+ R$ 2.200,00" / "− R$ 540,00" / "R$ 0,00". */
export function formatSignedBRL(cents: number): string {
  if (cents === 0) return formatBRL(0);
  return `${cents > 0 ? "+" : "−"} ${formatBRL(Math.abs(cents))}`;
}

export const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export const MONTH_SHORT = MONTH_NAMES.map((m) => m.slice(0, 3));

export function parseMonthKey(key: MonthKey): { year: number; month: number } {
  const [y = 0, m = 1] = key.split("-").map(Number);
  return { year: y, month: m };
}

export function toMonthKey(year: number, month: number): MonthKey {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** "Novembro de 2026". */
export function formatMonthLabel(key: MonthKey): string {
  const { year, month } = parseMonthKey(key);
  return `${MONTH_NAMES[month - 1] ?? ""} de ${year}`;
}

/** "nov/26". */
export function formatMonthShort(key: MonthKey): string {
  const { year, month } = parseMonthKey(key);
  return `${(MONTH_SHORT[month - 1] ?? "").toLowerCase()}/${String(year).slice(-2)}`;
}

/** "20/11/2026". */
export function formatDate(iso: IsoDate): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** "20/11". */
export function formatDayMonth(iso: IsoDate): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

/** "20 nov" for compact mobile cards. */
export function formatDayMonthShort(iso: IsoDate): string {
  const [, m, d] = iso.split("-");
  return `${d} ${(MONTH_SHORT[Number(m) - 1] ?? "").toLowerCase()}`;
}

/** Money mask helpers: keep only digits, interpret as cents. */
export function digitsToCents(input: string): number {
  const digits = input.replace(/\D/g, "").slice(0, 12);
  return digits ? Number(digits) : 0;
}
