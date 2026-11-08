import { useRef, useState } from "react";
import { Info, Pencil } from "lucide-react";
import { toast } from "sonner";

import { MoneyInput } from "@/components/common/MoneyInput";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FadeValue } from "./FadeValue";

interface BalanceCardProps {
  balanceCents: number;
  /** Receives the new value. In the prototype it only updates memory. */
  onAdjust: (cents: number) => void;
  className?: string;
}

export function BalanceCard({ balanceCents, onAdjust, className }: BalanceCardProps) {
  const [open, setOpen] = useState(false);
  const adjustButtonRef = useRef<HTMLButtonElement>(null);
  const [draft, setDraft] = useState(balanceCents);

  const openDialog = () => {
    setDraft(balanceCents);
    setOpen(true);
  };

  return (
    <section aria-labelledby="saldo-titulo" className={cn("lume-balance-card surface-card flex min-w-0 flex-col p-5 sm:p-6", className)}>
      <div className="flex items-center gap-1.5">
        <h2 id="saldo-titulo" className="text-sm font-medium text-muted-foreground">
          Saldo Atual
        </h2>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Sobre o Saldo Atual"
              className="press inline-flex size-7 items-center justify-center rounded-md text-subtle-foreground hover:bg-surface-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Info className="size-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 max-w-[calc(100vw-2rem)] text-sm leading-relaxed">
            É o saldo de controle do app, atualizado pelos gastos registrados. Pode ser diferente do
            saldo do seu banco. Não muda com os filtros de período ou categoria.
          </PopoverContent>
        </Popover>
      </div>

      <p className="lume-balance-value num mt-3 text-[2rem] font-semibold leading-tight tracking-tight text-foreground sm:text-[2.5rem]">
        <FadeValue value={formatBRL(balanceCents)} />
      </p>
      <p className="mt-3 text-sm text-muted-foreground">Saldo de controle após os gastos registrados.</p>

      <div className="mt-auto pt-5">
        <Button ref={adjustButtonRef} variant="secondary" size="sm" onClick={openDialog}>
          <Pencil />
          Ajustar saldo
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md" onCloseAutoFocus={(event) => { event.preventDefault(); adjustButtonRef.current?.focus(); }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onAdjust(draft);
              setOpen(false);
              toast("Saldo ajustado apenas nesta demonstração.", {
                description: "Nenhum valor foi salvo de forma definitiva.",
              });
            }}
            className="space-y-5"
          >
            <DialogHeader>
              <DialogTitle>Ajustar saldo</DialogTitle>
              <DialogDescription>
                O valor informado passa a ser o novo ponto de partida. Nesta demonstração, ele fica
                só na memória da tela e não é salvo.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <label htmlFor="ajuste-saldo" className="text-sm font-medium text-foreground">
                Novo saldo
              </label>
              <MoneyInput id="ajuste-saldo" valueCents={draft} onValueChange={setDraft} autoFocus />
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
