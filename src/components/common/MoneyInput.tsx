import { forwardRef, type InputHTMLAttributes } from "react";

import { inputClass } from "@/components/common/Field";
import { digitsToCents, formatAmount } from "@/lib/format";
import { cn } from "@/lib/utils";

interface MoneyInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  valueCents: number;
  onValueChange: (cents: number) => void;
}

/** BRL mask: digits are read as cents ("120000" → "1.200,00"). */
export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput(
  { valueCents, onValueChange, className, ...props },
  ref,
) {
  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-[0.95rem] text-subtle-foreground"
      >
        R$
      </span>
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={formatAmount(valueCents)}
        onChange={(e) => onValueChange(digitsToCents(e.target.value))}
        className={cn(inputClass, "num pl-10 text-right text-base font-medium", className)}
        {...props}
      />
    </div>
  );
});
