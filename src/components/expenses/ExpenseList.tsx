import { motion } from "motion/react";
import { AlertCircle, Inbox, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDate, formatDayMonthShort } from "@/lib/format";
import type { ExpenseOccurrence, ListStatus } from "@/types/finance";
import { CategoryTag, ExpenseAmount, ExpenseBadges, expenseContext } from "./ExpenseParts";

interface ExpenseListProps {
  items: ExpenseOccurrence[];
  /** Changes when filters change, to softly refresh the list. */
  listKey: string;
  status?: ListStatus;
  emptyMessage: string;
  onRetry?: (() => void) | undefined;
}

const enter = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.18, ease: "easeOut" as const },
};

export function ExpenseList({ items, listKey, status = "ready", emptyMessage, onRetry }: ExpenseListProps) {
  if (status === "error") return <ExpenseListError onRetry={onRetry} />;
  if (items.length === 0) return <ExpenseListEmpty message={emptyMessage} />;

  return (
    <>
      {/* Tablet / desktop table */}
      <div className="hidden xl:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border text-xs font-medium uppercase tracking-wide text-subtle-foreground">
              <th scope="col" className="py-3 pl-5 pr-3 font-medium sm:pl-6">Data</th>
              <th scope="col" className="px-3 py-3 font-medium">Motivo</th>
              <th scope="col" className="px-3 py-3 font-medium">Tipo/Categoria</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Valor</th>
              <th scope="col" className="py-3 pl-3 pr-5 font-medium sm:pr-6">Identificação</th>
            </tr>
          </thead>
          <motion.tbody key={listKey} {...enter}>
            {items.map((e) => (
              <tr key={e.id} className="border-b border-border last:border-0 transition-colors hover:bg-surface-raised/50">
                <td className="num whitespace-nowrap py-4 pl-5 pr-3 align-top text-sm text-muted-foreground sm:pl-6">
                  {formatDate(e.date)}
                </td>
                <td className="px-3 py-4 align-top">
                  <p className="font-medium text-foreground">{e.description}</p>
                  <p className="mt-0.5 text-xs text-subtle-foreground">{expenseContext(e)}</p>
                </td>
                <td className="px-3 py-4 align-top">
                  <CategoryTag category={e.category} />
                </td>
                <td className="px-3 py-4 align-top">
                  <ExpenseAmount expense={e} />
                </td>
                <td className="py-4 pl-3 pr-5 align-top sm:pr-6">
                  <ExpenseBadges expense={e} />
                </td>
              </tr>
            ))}
          </motion.tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <motion.ul key={`m-${listKey}`} {...enter} className="divide-y divide-border xl:hidden">
        {items.map((e) => (
          <li key={e.id} className="px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words font-medium text-foreground">{e.description}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                  <span className="num">
                    <span className="sr-only">Data: </span>
                    {formatDayMonthShort(e.date)}
                  </span>
                  <span aria-hidden="true" className="text-subtle-foreground">·</span>
                  <CategoryTag category={e.category} />
                </p>
              </div>
              {!e.shared && (
                <div className="shrink-0">
                  <ExpenseAmount expense={e} />
                </div>
              )}
            </div>
            {e.shared && (
              <div className="mt-3 rounded-lg bg-surface-raised/60 px-3 py-2">
                <ExpenseAmount expense={e} align="left" />
              </div>
            )}
            <ExpenseBadges expense={e} className="mt-3" />
            <p className="mt-2 text-xs text-subtle-foreground">{expenseContext(e)}</p>
          </li>
        ))}
      </motion.ul>
    </>
  );
}

export function ExpenseListEmpty({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-surface-raised text-subtle-foreground">
        <Inbox className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-3 max-w-sm text-[0.95rem] text-muted-foreground">{message}</p>
    </div>
  );
}

/** Ready for a future data source. Neutral wording: no fake bank failure. */
export function ExpenseListError({ onRetry }: { onRetry?: (() => void) | undefined }) {
  return (
    <div role="alert" className="flex flex-col items-center px-6 py-14 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-danger/10 text-danger">
        <AlertCircle className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-3 font-medium text-foreground">Não foi possível exibir os gastos.</p>
      <p className="mt-1 text-sm text-muted-foreground">Tente novamente em instantes.</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RotateCcw />
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
