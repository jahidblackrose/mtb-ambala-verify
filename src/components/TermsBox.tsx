import { useRef } from "react";
import { CheckSquare, Square } from "lucide-react";
import { useFlow } from "@/flow/FlowProvider";

/**
 * Terms & Conditions: title + version, scrollable sanitized HTML (max ~45 vh).
 * The accept checkbox enables only after scrolling to the bottom.
 */
export function TermsBox({
  title,
  version,
  html,
  scrolled,
  onScrolled,
  accepted,
  onToggleAccept,
}: {
  title: string;
  version: string;
  html: string;
  scrolled: boolean;
  onScrolled: () => void;
  accepted: boolean;
  onToggleAccept: () => void;
}) {
  const { t } = useFlow();
  const boxRef = useRef<HTMLDivElement>(null);

  const onScroll = () => {
    const el = boxRef.current;
    if (!el || scrolled) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 12) onScrolled();
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-brand-purple">{title}</h3>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">v{version}</span>
      </div>

      <div
        ref={boxRef}
        onScroll={onScroll}
        tabIndex={0}
        role="region"
        aria-label={t("terms.title")}
        className="max-h-[45vh] overflow-y-auto rounded-xl bg-muted/40 p-3 text-sm leading-relaxed text-foreground"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {!scrolled && (
        <p className="mt-2 text-xs text-amber-600" aria-live="polite">
          {t("terms.scrollHint")}
        </p>
      )}

      <button
        type="button"
        role="checkbox"
        aria-checked={accepted}
        disabled={!scrolled}
        onClick={onToggleAccept}
        className={`mt-3 flex h-12 w-full items-center gap-3 rounded-xl px-2 text-left text-sm font-medium ${
          scrolled ? "text-foreground active:bg-accent" : "cursor-not-allowed text-muted-foreground"
        }`}
      >
        {accepted ? (
          <CheckSquare className="h-6 w-6 shrink-0 text-brand-green" aria-hidden />
        ) : (
          <Square className="h-6 w-6 shrink-0 text-muted-foreground" aria-hidden />
        )}
        {t("terms.accept")}
      </button>
    </div>
  );
}
