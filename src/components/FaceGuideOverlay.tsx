import { Camera, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { useFlow } from "@/flow/FlowProvider";

/** Dark overlay with an oval face guide over the live camera view. */
export function FaceGuideOverlay() {
  const { t } = useFlow();
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="h-[68vw] max-h-[420px] w-[52vw] max-w-[320px] rounded-[50%] border-2 border-white/70"
          style={{ boxShadow: "0 0 0 9999px rgba(10, 8, 16, 0.55)" }}
        />
      </div>
      <p className="absolute inset-x-0 bottom-24 text-center text-sm font-medium text-white drop-shadow">
        {t("camera.instruction")}
      </p>
      <Camera className="absolute inset-x-0 top-6 mx-auto h-6 w-6 text-white/60" aria-hidden />
    </div>
  );
}

/** Live status chips under the frame. */
export function LivenessStatus({
  faceFound,
  blinkDetected,
  modelError,
  allowFallback,
}: {
  faceFound: boolean;
  blinkDetected: boolean;
  modelError: boolean;
  allowFallback: boolean;
}) {
  const { t } = useFlow();
  return (
    <div className="flex flex-wrap items-center justify-center gap-2" aria-live="polite">
      {modelError ? (
        allowFallback ? (
          <Chip tone="amber" icon={<ShieldAlert className="h-3.5 w-3.5" aria-hidden />}>
            {t("camera.livenessFallback")}
          </Chip>
        ) : (
          <Chip tone="danger" icon={<ShieldAlert className="h-3.5 w-3.5" aria-hidden />}>
            {t("error.title")}
          </Chip>
        )
      ) : (
        <>
          <Chip tone={faceFound ? "green" : "muted"} icon={faceFound ? <Eye className="h-3.5 w-3.5" aria-hidden /> : <EyeOff className="h-3.5 w-3.5" aria-hidden />}>
            {faceFound ? t("camera.faceDetected") : t("camera.noFace")}
          </Chip>
          {!blinkDetected && faceFound && (
            <Chip tone="amber" pulse>
              {t("camera.askBlink")}
            </Chip>
          )}
          {blinkDetected && (
            <Chip tone="green">{t("camera.blinkDone")}</Chip>
          )}
        </>
      )}
    </div>
  );
}

function Chip({
  tone,
  icon,
  pulse,
  children,
}: {
  tone: "green" | "amber" | "danger" | "muted";
  icon?: React.ReactNode;
  pulse?: boolean;
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    green: "bg-brand-green/15 text-brand-green border-brand-green/40",
    amber: "bg-amber-500/15 text-amber-600 border-amber-500/40",
    danger: "bg-destructive/15 text-destructive border-destructive/40",
    muted: "bg-white/10 text-white/80 border-white/25",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${tones[tone]} ${
        pulse ? "animate-pulse" : ""
      }`}
    >
      {icon}
      {children}
    </span>
  );
}
