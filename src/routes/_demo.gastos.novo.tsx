import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/app/AppShell";
import { ExpenseEntryForm } from "@/components/expenses/ExpenseEntryForm";
import { BRAND, pageTitle } from "@/config/brand";
import "../styles/expense-entry.css";

export const Route = createFileRoute("/_demo/gastos/novo")({
  head: () => ({
    meta: [
      { title: pageTitle("Cadastrar gasto") },
      { name: "description", content: `Cadastro e conferência de gastos do ${BRAND.name}, em demonstração.` },
      { property: "og:title", content: pageTitle("Cadastrar gasto") },
      { property: "og:description", content: "Gastos avulsos, recorrentes, parcelados e compartilhados em uma tela." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewExpensePage,
});

function NewExpensePage() {
  return <><PageHeader title="Cadastrar gasto" /><ExpenseEntryForm /></>;
}
