import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

/** Fixed bottom action area, inside the safe area, like native apps. */
export function BottomAction({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 mt-auto bg-gradient-to-t from-background via-background to-background/0 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4">
      {children}
    </div>
  );
}

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  loading?: boolean;
}

/** Full-width touch target (>= 48 px) with an optional loading spinner. */
export function ActionButton({ variant = "primary", loading, className, children, disabled, ...rest }: ActionButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 ${
        variant === "primary"
          ? "bg-brand-magenta text-white shadow-sm active:bg-brand-magenta/90"
          : "border border-brand-purple bg-card text-brand-purple active:bg-brand-purple/10"
      } ${className ?? ""}`}
    >
      {loading && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
