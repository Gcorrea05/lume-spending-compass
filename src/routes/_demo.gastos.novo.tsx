import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ClipboardList } from "lucide-react";

import { PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { BRAND, pageTitle } from "@/config/brand";

export const Route = createFileRoute("/_demo/gastos/novo")({
  head: () => ({
    meta: [
      { title: pageTitle("Cadastrar gasto") },
      { name: "description", content: `Espaço reservado para o cadastro de gastos do ${BRAND.name}.` },
      { property: "og:title", content: pageTitle("Cadastrar gasto") },
      { property: "og:description", content: "Destino reservado para o futuro formulário de cadastro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewExpensePage,
});

function NewExpensePage() {
  return (
    <>
      <PageHeader title="Cadastrar gasto" />
      <section className="surface-card flex max-w-2xl flex-col items-start p-6 sm:p-8">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <ClipboardList className="size-5" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-foreground">Formulário em definição</h2>
        <p className="mt-1.5 text-[0.95rem] text-muted-foreground">
          Este espaço está reservado para o cadastro de gastos, que será detalhado em uma próxima
          etapa.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/dashboard" search={true}>
            <ArrowLeft />
            Voltar ao dashboard
          </Link>
        </Button>
      </section>
    </>
  );
}
