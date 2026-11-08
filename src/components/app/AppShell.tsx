import { useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Menu, PlusCircle, ReceiptText } from "lucide-react";

import { LumeLogo } from "@/components/brand/LumeMark";
import { DemoBadge } from "@/components/common/PrototypeNotice";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useDemoSession } from "@/state/demo-session";

const navItemClass =
  "press flex min-h-11 items-center gap-3 py-2 leading-relaxed [&>svg]:shrink-0 rounded-lg px-3 text-[0.95rem] font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const navActiveClass = "bg-sidebar-accent text-foreground [&>svg]:text-primary";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Navegação principal" className="flex flex-col gap-1">
      <Link
        to="/dashboard"
        search={true}
        onClick={onNavigate}
        className={navItemClass}
        activeProps={{ className: navActiveClass, "aria-current": "page" }}
      >
        <LayoutDashboard className="size-[1.125rem]" aria-hidden="true" />
        Dashboard
      </Link>
      <Link
        to="/gastos/novo"
        search={true}
        onClick={onNavigate}
        className={navItemClass}
        activeProps={{ className: navActiveClass, "aria-current": "page" }}
      >
        <PlusCircle className="size-[1.125rem]" aria-hidden="true" />
        Cadastrar gasto
      </Link>
      <Link
        to="/gastos"
        search={true}
        onClick={onNavigate}
        className={navItemClass}
        activeOptions={{ exact: true, includeSearch: false }}
        activeProps={{ className: navActiveClass, "aria-current": "page" }}
      >
        <ReceiptText className="size-[1.125rem]" aria-hidden="true" />
        Gastos
      </Link>
    </nav>
  );
}

function ExitDemo({ onDone }: { onDone?: () => void }) {
  const { exit } = useDemoSession();
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => {
        exit();
        onDone?.();
        navigate({ to: "/login" });
      }}
      className={navItemClass + " w-full"}
    >
      <LogOut className="size-[1.125rem]" aria-hidden="true" />
      Sair da demonstração
    </button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="lume-app min-h-dvh lg:pl-64">
      <a href="#lume-main" className="lume-skip-link">Pular para o conteúdo</a>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col overflow-y-auto overscroll-contain border-r border-sidebar-border bg-sidebar px-4 py-6 lg:flex">
        <div className="px-2">
          <LumeLogo />
        </div>
        <div className="mt-10 flex-1">
          <NavLinks />
        </div>
        <div className="border-t border-sidebar-border pt-4">
          <ExitDemo />
        </div>
      </aside>

      {/* Mobile / tablet top bar */}
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
        <LumeLogo />
        <Button
          variant="ghost"
          size="icon"
          ref={menuButtonRef}
          aria-label="Abrir menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <Menu />
        </Button>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          onCloseAutoFocus={(event) => { event.preventDefault(); menuButtonRef.current?.focus(); }}
          className="flex w-[17rem] max-w-[calc(100vw-2rem)] flex-col border-sidebar-border bg-sidebar px-4 py-6 data-[state=closed]:duration-200 data-[state=open]:duration-250"
        >
          <SheetTitle className="pl-2 pr-12">
            <LumeLogo />
          </SheetTitle>
          <SheetDescription className="sr-only">Menu de navegação</SheetDescription>
          <div className="mt-6 flex-1">
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
          <div className="border-t border-sidebar-border pt-4">
            <ExitDemo onDone={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <main id="lume-main" tabIndex={-1} className="lume-page mx-auto min-w-0 w-full max-w-[90rem] px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-8">
        {children}
      </main>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  before,
}: {
  title: string;
  description?: string;
  before?: ReactNode;
}) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4 lg:mb-8">
      <div className="min-w-0">
        {before}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
            {title}
          </h1>
          <DemoBadge />
        </div>
        {description && <p className="mt-1.5 text-[0.95rem] text-muted-foreground">{description}</p>}
      </div>
      <ThemeToggle />
    </header>
  );
}
