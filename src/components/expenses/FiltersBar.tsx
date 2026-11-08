import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Info } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { selectCategory, selectInterval, selectMonth, type FilterSearch } from "@/lib/filters";
import { formatMonthLabel, MONTH_SHORT, parseMonthKey, toMonthKey } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CATEGORIES, INTERVAL_OPTIONS, type CategoryId, type MonthKey } from "@/types/finance";

interface FiltersBarProps {
  search: FilterSearch;
  /** Month used when neither month nor interval is chosen. */
  defaultMonth: MonthKey;
  onChange: (next: FilterSearch) => void;
  /** Show "Categoria aplicada somente à lista" when a category is set. */
  showCategoryHint?: boolean;
  className?: string;
}

const controlClass =
  "press flex min-h-11 w-full py-2 items-center gap-2 rounded-lg border border-input bg-surface px-3.5 text-left text-[0.95rem] text-foreground hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function FiltersBar({
  search,
  defaultMonth,
  onChange,
  showCategoryHint,
  className,
}: FiltersBarProps) {
  const activeMonth = search.dias ? undefined : (search.mes ?? defaultMonth);

  return (
    <div className={cn("lume-filters space-y-2", className)}>
      <div
        role="group"
        aria-label="Filtros"
        className="lume-filters-grid grid gap-3"
      >
        <MonthPicker
          value={activeMonth}
          defaultMonth={defaultMonth}
          onSelect={(m) => onChange(selectMonth(search, m))}
        />

        <div className="lume-interval-field min-w-0 space-y-1.5">
          <span id="filtro-intervalo" className="block text-sm font-medium text-muted-foreground">
            Intervalo
          </span>
          <div
            role="group"
            aria-labelledby="filtro-intervalo"
            className="lume-interval-options grid grid-cols-4 gap-1 rounded-lg border border-input bg-surface p-1"
          >
            {INTERVAL_OPTIONS.map((d) => {
              const active = search.dias === d;
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={active}
                  aria-label={`Últimos ${d} dias`}
                  onClick={() => onChange(selectInterval(search, d))}
                  className={cn(
                    "press min-h-11 rounded-md px-2 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-surface-raised hover:text-foreground",
                  )}
                >
                  {d} dias
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <span id="filtro-categoria" className="block text-sm font-medium text-muted-foreground">
            Tipo
          </span>
          <Select
            value={search.categoria ?? "todas"}
            onValueChange={(v) =>
              onChange(selectCategory(search, v === "todas" ? undefined : (v as CategoryId)))
            }
          >
            <SelectTrigger aria-labelledby="filtro-categoria" className={cn(controlClass, "justify-between")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as categorias</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {showCategoryHint && search.categoria && (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Info className="size-4 text-subtle-foreground" aria-hidden="true" />
          Categoria aplicada somente à lista
        </p>
      )}
    </div>
  );
}

function MonthPicker({
  value,
  defaultMonth,
  onSelect,
}: {
  value?: MonthKey | undefined;
  defaultMonth: MonthKey;
  onSelect: (m: MonthKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const base = parseMonthKey(defaultMonth);
  const [year, setYear] = useState(parseMonthKey(value ?? defaultMonth).year);
  const minYear = base.year - 1;
  const maxYear = base.year + 1;

  return (
    <div className="space-y-1.5">
      <span id="filtro-mes" className="block text-sm font-medium text-muted-foreground">
        Mês
      </span>
      <Popover
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (o) setYear(parseMonthKey(value ?? defaultMonth).year);
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-labelledby="filtro-mes filtro-mes-valor"
            className={controlClass}
          >
            <CalendarDays className="size-4 shrink-0 text-subtle-foreground" aria-hidden="true" />
            <span id="filtro-mes-valor" className={cn("flex-1 truncate", !value && "text-subtle-foreground")}>
              {value ? formatMonthLabel(value) : "Selecionar mês"}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[17.5rem] max-w-[calc(100vw-2rem)] p-3">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              aria-label="Ano anterior"
              disabled={year <= minYear}
              onClick={() => setYear((y) => y - 1)}
              className="press inline-flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-raised hover:text-foreground disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="num text-sm font-semibold text-foreground" aria-live="polite">
              {year}
            </span>
            <button
              type="button"
              aria-label="Próximo ano"
              disabled={year >= maxYear}
              onClick={() => setYear((y) => y + 1)}
              className="press inline-flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-raised hover:text-foreground disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {MONTH_SHORT.map((label, i) => {
              const key = toMonthKey(year, i + 1);
              const selected = key === value;
              const isBase = key === defaultMonth;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={selected}
                  aria-label={`${formatMonthLabel(key)}${isBase ? " (mês atual)" : ""}`}
                  onClick={() => {
                    onSelect(key);
                    setOpen(false);
                  }}
                  className={cn(
                    "press relative min-h-11 rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-surface-raised",
                  )}
                >
                  {label}
                  {isBase && !selected && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-primary"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
