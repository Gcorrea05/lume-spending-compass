import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowRight, Plus } from "lucide-react";

import { PageHeader } from "@/components/app/AppShell";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { PeriodResultCard } from "@/components/dashboard/PeriodResultCard";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { FiltersBar } from "@/components/expenses/FiltersBar";
import { emptyMessageFor, useExpenseFilters } from "@/components/expenses/use-expense-filters";
import { Button } from "@/components/ui/button";
import { BRAND, pageTitle } from "@/config/brand";
import { demoRepository } from "@/mocks/demo-repository";
import { useDemoSession } from "@/state/demo-session";

export const Route = createFileRoute("/_demo/dashboard")({
  head: () => ({
    meta: [
      { title: pageTitle("Dashboard") },
      { name: "description", content: `Painel de demonstração do ${BRAND.name}: saldo, resultado do período e últimos gastos.` },
      { property: "og:title", content: pageTitle("Dashboard") },
      { property: "og:description", content: "Painel de demonstração com dados fictícios." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

const LATEST_LIMIT = 10;

const cardIn = (delay: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, delay, ease: "easeOut" as const },
});

function DashboardPage() {
  const { balanceCents, setBalanceCents } = useDemoSession();
  const { search, setSearch, defaultMonth, period, listKey } = useExpenseFilters();

  // Indicators use the whole period; category only narrows the list.
  const summary = demoRepository.getPeriodSummary(period);
  const latest = demoRepository.getExpenses(period, search.categoria, LATEST_LIMIT);

  return (
    <>
      <PageHeader title="Dashboard" />

      <div className="grid grid-cols-1 gap-4 lg:gap-5 xl:grid-cols-[minmax(18rem,1fr)_minmax(0,2.2fr)]">
        <motion.div {...cardIn(0)} className="flex">
          <BalanceCard balanceCents={balanceCents} onAdjust={setBalanceCents} className="w-full" />
        </motion.div>
        <motion.div {...cardIn(0.05)} className="flex">
          <PeriodResultCard summary={summary} className="w-full" />
        </motion.div>
      </div>

      <motion.div {...cardIn(0.1)} className="mt-8 space-y-5">
        <Button asChild size="lg">
          <Link to="/gastos/novo" search={true}>
            Cadastrar gasto
            <Plus />
          </Link>
        </Button>

        <FiltersBar search={search} defaultMonth={defaultMonth} onChange={setSearch} showCategoryHint />

        <section aria-labelledby="ultimos-titulo" className="surface-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-6">
            <div>
              <h2 id="ultimos-titulo" className="text-lg font-semibold text-foreground">
                Últimos gastos
              </h2>
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {latest.total === 0
                  ? "Sem registros"
                  : `${latest.items.length} de ${latest.total} ${latest.total === 1 ? "registro" : "registros"}`}
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary">
              <Link to="/gastos" search={true}>
                Ver todos
                <ArrowRight />
              </Link>
            </Button>
          </div>
          <ExpenseList
            items={latest.items}
            listKey={listKey}
            emptyMessage={emptyMessageFor(period, search.categoria)}
          />
        </section>
      </motion.div>
    </>
  );
}
