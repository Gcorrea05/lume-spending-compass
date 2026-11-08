import type { ReactNode } from "react";
import { motion } from "motion/react";

import { LumeLogo } from "@/components/brand/LumeMark";
import { PrototypeNotice } from "@/components/common/PrototypeNotice";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { BRAND } from "@/config/brand";

interface AuthLayoutProps {
  title: string;
  description?: string | undefined;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="auth-backdrop min-h-dvh lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="auth-panel relative hidden overflow-hidden border-r border-border lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <LumeLogo size="lg" />
        <div className="relative z-10 max-w-md">
          <p className="text-4xl font-semibold leading-tight tracking-tight text-foreground xl:text-5xl">
            {BRAND.tagline}
          </p>
          <p className="mt-4 text-lg text-muted-foreground">{BRAND.summary}</p>
        </div>
        <p className="relative z-10 text-sm text-subtle-foreground">
          {BRAND.name} é um nome provisório deste protótipo.
        </p>
        <DecorativeRings />
      </aside>

      <main className="relative flex min-h-dvh justify-center px-5 pb-10 pt-6 sm:items-center sm:px-8 sm:py-12">
        <div className="absolute right-3 top-3 sm:right-5 sm:top-5">
          <ThemeToggle />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="w-full max-w-[25rem]"
        >
          <div className="mb-8 flex flex-col gap-1.5 lg:hidden">
            <LumeLogo />
            <p className="text-sm text-muted-foreground">{BRAND.tagline}</p>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
            {title}
          </h1>
          {description && <p className="mt-2 text-[0.95rem] text-muted-foreground">{description}</p>}

          <PrototypeNotice className="mt-5" />

          <div className="mt-6">{children}</div>

          {footer && <div className="mt-8 border-t border-border pt-6">{footer}</div>}
        </motion.div>
      </main>
    </div>
  );
}

function DecorativeRings() {
  return (
    <svg
      viewBox="0 0 400 400"
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-40 -right-32 size-[34rem] text-primary opacity-[0.14]"
    >
      {[60, 100, 140, 180].map((r) => (
        <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="currentColor" strokeWidth="1" />
      ))}
      <circle cx="200" cy="200" r="22" fill="currentColor" />
    </svg>
  );
}

export function AuthResult({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      role="status"
      className="rounded-xl border border-primary/30 bg-primary-soft px-4 py-4"
    >
      <p className="font-medium text-foreground">{title}</p>
      {children && <div className="mt-1 text-sm text-muted-foreground">{children}</div>}
    </motion.div>
  );
}
