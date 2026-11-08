import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AppShell } from "@/components/app/AppShell";
import { validateFilterSearch } from "@/lib/filters";

// Demo area layout. No real access protection: this is a navigable prototype.
// Filter state lives in the URL so it survives "Ver todos" and returning.
export const Route = createFileRoute("/_demo")({
  validateSearch: validateFilterSearch,
  component: DemoLayout,
});

function DemoLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
