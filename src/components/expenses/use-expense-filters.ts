import { useNavigate, useSearch } from "@tanstack/react-router";

import { resolvePeriod, type FilterSearch } from "@/lib/filters";
import { formatMonthLabel } from "@/lib/format";
import { demoRepository } from "@/mocks/demo-repository";
import { categoryLabel, type PeriodSelection } from "@/types/finance";

export function useExpenseFilters() {
  const search = useSearch({ from: "/_demo" });
  const navigate = useNavigate();
  const defaultMonth = demoRepository.calendar.baseMonthKey;
  const period = resolvePeriod(search, defaultMonth);

  const setSearch = (next: FilterSearch) =>
    navigate({ to: ".", search: next, replace: true, resetScroll: false });

  const listKey = `${period.kind === "month" ? period.month : period.days}-${search.categoria ?? "all"}`;

  return { search, setSearch, defaultMonth, period, listKey };
}

export function emptyMessageFor(period: PeriodSelection, category?: Parameters<typeof categoryLabel>[0]) {
  const when =
    period.kind === "month" ? `em ${formatMonthLabel(period.month)}` : `nos últimos ${period.days} dias`;
  return category
    ? `Nenhum gasto de ${categoryLabel(category)} ${when}.`
    : `Nenhum gasto registrado ${when}.`;
}
