import {
  CalendarClock,
  Car,
  GraduationCap,
  HeartPulse,
  House,
  Layers,
  Repeat,
  Ticket,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

import { formatBRL, formatDate, formatMonthShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import { categoryLabel, type CategoryId, type ExpenseOccurrence } from "@/types/finance";

const CATEGORY_ICONS: Record<CategoryId, LucideIcon> = {
  alimentacao: UtensilsCrossed,
  transporte: Car,
  casa: House,
  estudos: GraduationCap,
  saude: HeartPulse,
  lazer: Ticket,
};

export function CategoryTag({ category }: { category: CategoryId }) {
  const Icon = CATEGORY_ICONS[category];
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <Icon className="size-4 shrink-0 text-subtle-foreground" aria-hidden="true" />
      {categoryLabel(category)}
    </span>
  );
}

const badgeBase =
  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap";

export function ExpenseBadges({ expense, className }: { expense: ExpenseOccurrence; className?: string }) {
  const badges: { key: string; label: string; icon?: LucideIcon; tone: "neutral" | "shared" | "forecast" }[] = [];
  if (expense.installment) {
    badges.push({
      key: "parc",
      label: `Parcelado ${expense.installment.current}/${expense.installment.total}`,
      icon: Layers,
      tone: "neutral",
    });
  } else if (expense.fixed) {
    badges.push({ key: "fixo", label: "Fixo", icon: Repeat, tone: "neutral" });
  } else {
    badges.push({ key: "avulso", label: "Avulso", tone: "neutral" });
  }
  if (expense.shared) badges.push({ key: "comp", label: "Compartilhado", icon: Users, tone: "shared" });
  if (expense.status === "previsto")
    badges.push({ key: "prev", label: "Previsto", icon: CalendarClock, tone: "forecast" });

  return (
    <span className={cn("flex flex-wrap gap-1.5", className)}>
      {badges.map(({ key, label, icon: Icon, tone }) => (
        <span
          key={key}
          className={cn(
            badgeBase,
            tone === "neutral" && "border-border bg-surface-raised text-muted-foreground",
            tone === "shared" && "border-primary/25 bg-primary-soft text-primary",
            tone === "forecast" && "border-warning/30 bg-warning/10 text-warning",
          )}
        >
          {Icon && <Icon className="size-3" aria-hidden="true" />}
          {label}
        </span>
      ))}
    </span>
  );
}

/** Amount block. Shared items always show both Total and Minha parte, never in a tooltip. */
export function ExpenseAmount({ expense, align = "right" }: { expense: ExpenseOccurrence; align?: "left" | "right" }) {
  const alignClass = align === "right" ? "items-end text-right" : "items-start text-left";
  if (expense.shared) {
    return (
      <span className={cn("num flex flex-col gap-0.5", alignClass)}>
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          Total: <span>{formatBRL(expense.totalCents)}</span>
        </span>
        <span className="whitespace-nowrap font-semibold text-foreground">
          Minha parte: <span>{formatBRL(expense.myShareCents)}</span>
        </span>
      </span>
    );
  }
  return (
    <span className={cn("num flex flex-col", alignClass)}>
      <span className="whitespace-nowrap font-semibold text-foreground">{formatBRL(expense.totalCents)}</span>
      {expense.installment && <span className="text-xs text-subtle-foreground">valor da parcela</span>}
    </span>
  );
}

/** Secondary context: payment / invoice and original purchase date. */
export function expenseContext(expense: ExpenseOccurrence): string {
  const parts: string[] = [];
  const p = expense.payment;
  if (p.method === "credito") parts.push(`Crédito · fatura ${formatMonthShort(p.invoice)}`);
  else parts.push(p.method === "pix" ? "Pix" : "Débito");
  if (expense.installment) parts.push(`compra em ${formatDate(expense.installment.purchaseDate)}`);
  return parts.join(" · ");
}
