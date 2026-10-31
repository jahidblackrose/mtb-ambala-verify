import { useRef } from "react";
import { Globe } from "lucide-react";
import mtbLogo from "@/assets/mtb-logo.png.asset.json";
import mtbSwoosh from "@/assets/mtb-swoosh.png.asset.json";
import { config } from "@/config";
import { useFlow } from "@/flow/FlowProvider";

/**
 * White top app bar: MTB logo left (swoosh only on very small widths),
 * title + language toggle right, 3 px brand-gradient line underneath.
 * Tapping the logo 5 times opens the dev panel in mock mode.
 */
export function AppBar({ timerChip, onDevOpen }: { timerChip?: React.ReactNode; onDevOpen?: () => void }) {
  const { state, setLang, t } = useFlow();
  const taps = useRef(0);
  const lastTap = useRef(0);

  const onLogoTap = () => {
    if (!config.useMock || !onDevOpen) return;
    const now = Date.now();
    if (now - lastTap.current > 2000) taps.current = 0;
    lastTap.current = now;
    taps.current += 1;
    if (taps.current >= 5) {
      taps.current = 0;
      onDevOpen();
    }
  };

  return (
    <header className="relative z-20 shrink-0 border-b border-border bg-card">
      <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-[calc(env(safe-area-inset-top)+10px)]">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            aria-label={t("app.title")}
            onClick={onLogoTap}
            className="flex h-12 shrink-0 items-center focus-visible:outline-2 focus-visible:outline-ring"
          >
            <img
              src={mtbSwoosh.url}
              alt=""
              aria-hidden
              className="h-8 w-auto min-[380px]:hidden"
              draggable={false}
            />
            <img
              src={mtbLogo.url}
              alt="Mutual Trust Bank PLC"
              className="hidden h-8 w-auto min-[380px]:block"
              draggable={false}
            />
          </button>
          {timerChip}
        </div>
        <div className="flex min-w-0 shrink-0 items-center gap-2">
          <h1 className="truncate text-right text-xs font-semibold leading-tight text-brand-purple sm:text-sm">
            {t("app.title")}
            <span className="block font-normal text-muted-foreground">{t("app.subtitle")}</span>
          </h1>
          <button
            type="button"
            onClick={() => setLang(state.lang === "bn" ? "en" : "bn")}
            aria-label="Switch language"
            className="flex h-11 min-w-12 shrink-0 items-center justify-center gap-1 rounded-full border border-brand-purple px-2 text-xs font-semibold text-brand-purple active:bg-brand-purple/10"
          >
            <Globe className="h-3.5 w-3.5" aria-hidden />
            {state.lang === "bn" ? "EN" : "বাংলা"}
          </button>
        </div>
      </div>
      {/* 3 px brand gradient line */}
      <div aria-hidden className="h-[3px] w-full bg-brand-gradient" />
    </header>
  );
}
