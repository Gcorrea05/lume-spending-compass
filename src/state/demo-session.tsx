import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { demoRepository } from "@/mocks/demo-repository";

/**
 * In-memory demo state only. Not a session, not persisted, not secure.
 * Reloading the page resets everything.
 */
interface DemoSession {
  active: boolean;
  enter: () => void;
  exit: () => void;
  balanceCents: number;
  setBalanceCents: (cents: number) => void;
}

const Ctx = createContext<DemoSession | null>(null);

export function DemoSessionProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const [balanceCents, setBalanceCents] = useState(demoRepository.initialBalanceCents);

  const enter = useCallback(() => setActive(true), []);
  const exit = useCallback(() => {
    setActive(false);
    setBalanceCents(demoRepository.initialBalanceCents);
  }, []);

  const value = useMemo(
    () => ({ active, enter, exit, balanceCents, setBalanceCents }),
    [active, enter, exit, balanceCents],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDemoSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDemoSession must be used inside DemoSessionProvider");
  return ctx;
}
