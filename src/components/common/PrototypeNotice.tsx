import { FlaskConical } from "lucide-react";

import { BRAND } from "@/config/brand";
import { cn } from "@/lib/utils";

export function PrototypeNotice({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5 text-sm text-foreground",
        className,
      )}
    >
      <FlaskConical className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
      <span>{BRAND.prototypeNotice}</span>
    </p>
  );
}

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-warning" aria-hidden="true" />
      Demonstração
    </span>
  );
}
