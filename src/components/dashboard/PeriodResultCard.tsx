import { ArrowDownRight, ArrowUpRight, CalendarClock } from "lucide-react";

import { formatBRL, formatSignedBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PeriodSummary } from "@/types/finance";
import { FadeValue } from "./FadeValue";

export function resultTone(cents: number) {
  if (cents > 0) return { label: "Sobra", className: "text-success" } as const;
  if (cents < 0) return { label: "Déficit", className: "text-danger" } as const;
  return { label: "Sobra", className: "text-foreground" } as const;
}

export function PeriodResultCard({
  summary,
  className,
}: {
  summary: PeriodSummary;
  className?: string;
}) {
  const tone = resultTone(summary.resultCents);

  return (
    <section
      aria-labelledby="resultado-titulo"
      className={cn("surface-card flex flex-col p-5 sm:p-6", className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div>
          <h2 id="resultado-titulo" className="text-sm font-medium text-muted-foreground">
            Resultado do período
          </h2>
          <p className="mt-1 font-medium text-foreground">
            {summary.label}
            {summary.detail && (
              <span className="font-normal text-muted-foreground"> · {summary.detail}</span>
            )}
          </p>
        </div>
        {summary.hasForecast && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning">
            <CalendarClock className="size-3.5" aria-hidden="true" />
            Inclui valores previstos
          </span>
        )}
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-[1fr_1fr_1.1fr]">
        <div className="bg-surface p-4">
          <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <ArrowUpRight className="size-4 text-subtle-foreground" aria-hidden="true" />
            Entradas
          </dt>
          <dd className="num mt-1.5 whitespace-nowrap text-xl font-semibold text-foreground">
            <FadeValue value={formatBRL(summary.incomeCents)} />
          </dd>
          {summary.incomeCents === 0 && (
            <dd className="mt-1 text-xs text-subtle-foreground">Nenhuma entrada registrada.</dd>
          )}
        </div>

        <div className="bg-surface p-4">
          <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <ArrowDownRight className="size-4 text-subtle-foreground" aria-hidden="true" />
            Saídas
          </dt>
          <dd className="num mt-1.5 whitespace-nowrap text-xl font-semibold text-foreground">
            <FadeValue value={formatBRL(summary.outflowTotalCents)} />
          </dd>
          <dd className="mt-1 text-xs text-subtle-foreground">Total registrado</dd>
          <dd className="mt-2.5 flex flex-wrap items-baseline justify-between gap-x-2 border-t border-border pt-2.5 text-sm">
            <span className="whitespace-nowrap text-muted-foreground">Minha parte</span>
            <span className="num whitespace-nowrap font-medium text-foreground">
              <FadeValue value={formatBRL(summary.myShareCents)} />
            </span>
          </dd>
        </div>

        <div className="bg-surface-raised/60 p-4">
          <dt className="text-sm text-muted-foreground">
            Sobra/Déficit
          </dt>
          <dd className={cn("mt-1.5 text-sm font-semibold", tone.className)}>{tone.label}</dd>
          <dd className={cn("num whitespace-nowrap text-xl font-semibold 2xl:text-2xl", tone.className)}>
            <FadeValue value={formatSignedBRL(summary.resultCents)} />
          </dd>
          <dd className="mt-1 text-xs text-subtle-foreground">Entradas − minha parte</dd>
        </div>
      </dl>
    </section>
  );
}
