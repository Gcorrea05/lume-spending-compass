import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/app/AppShell";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { FiltersBar } from "@/components/expenses/FiltersBar";
import { emptyMessageFor, useExpenseFilters } from "@/components/expenses/use-expense-filters";
import { BRAND, pageTitle } from "@/config/brand";
import { formatMonthLabel } from "@/lib/format";
import { demoRepository } from "@/mocks/demo-repository";
import { categoryLabel } from "@/types/finance";

export const Route = createFileRoute("/_demo/gastos/")({
  head: () => ({
    meta: [
      { title: pageTitle("Gastos") },
      { name: "description", content: `Consulta dos gastos de demonstração no ${BRAND.name}.` },
      { property: "og:title", content: pageTitle("Gastos") },
      { property: "og:description", content: "Consulta de gastos fictícios por período e categoria." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ExpensesPage,
});

function ExpensesPage() {
  const { search, setSearch, defaultMonth, period, listKey } = useExpenseFilters();
  const { items, total } = demoRepository.getExpenses(period, search.categoria);
  const periodLabel =
    period.kind === "month" ? formatMonthLabel(period.month) : `Últimos ${period.days} dias`;

  return (
    <>
      <PageHeader
        title="Gastos"
        before={
          <Link
            to="/dashboard"
            search={true}
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Voltar ao dashboard
          </Link>
        }
      />

      <div className="space-y-5">
        <FiltersBar search={search} defaultMonth={defaultMonth} onChange={setSearch} />

        <section aria-labelledby="gastos-titulo" className="surface-card overflow-hidden">
          <div className="border-b border-border px-4 py-4 sm:px-6">
            <h2 id="gastos-titulo" className="text-lg font-semibold text-foreground">
              {periodLabel}
              {search.categoria && (
                <span className="font-normal text-muted-foreground"> · {categoryLabel(search.categoria)}</span>
              )}
            </h2>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {total === 0 ? "Sem registros" : `${total} ${total === 1 ? "registro" : "registros"}`}
            </p>
          </div>
          <ExpenseList items={items} listKey={listKey} emptyMessage={emptyMessageFor(period, search.categoria)} />
        </section>
      </div>
    </>
  );
}
