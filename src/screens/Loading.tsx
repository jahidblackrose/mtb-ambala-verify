import { Loader2 } from "lucide-react";
import mtbLogo from "@/assets/mtb-logo.png.asset.json";
import { useFlow } from "@/flow/FlowProvider";

/** Screen 0 — splash / loading: centred logo on white with an animated gradient bar. */
export function LoadingScreen() {
  const { t } = useFlow();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-white px-8">
      <img src={mtbLogo.url} alt="Mutual Trust Bank PLC" className="h-16 w-auto" draggable={false} />
      <div className="h-1 w-48 overflow-hidden rounded-full bg-muted" role="status" aria-live="polite">
        <div className="h-full w-1/2 animate-splash-slide rounded-full bg-brand-gradient" />
      </div>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        {t("loading.text")}
      </p>
    </div>
  );
}
