import { BRAND } from "@/config/brand";
import { cn } from "@/lib/utils";

/** Provisional monogram: an "L" with a small point of light. */
export function LumeMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8 shrink-0", className)}>
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path
        d="M11 8.5v13.25c0 .97.78 1.75 1.75 1.75H21.5"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-primary-foreground"
      />
      <circle cx="21.25" cy="10.75" r="2.25" className="fill-primary-foreground" opacity="0.9" />
    </svg>
  );
}

export function LumeLogo({ className, size = "md" }: { className?: string; size?: "md" | "lg" }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LumeMark className={size === "lg" ? "size-10" : "size-8"} />
      <span
        className={cn(
          "font-semibold tracking-tight text-foreground",
          size === "lg" ? "text-2xl" : "text-lg",
        )}
      >
        {BRAND.name}
      </span>
    </span>
  );
}
