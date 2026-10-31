import { useCallback, useEffect, useState } from "react";
import { RefreshCw, SwitchCamera } from "lucide-react";
import { FaceGuideOverlay, LivenessStatus } from "@/components/FaceGuideOverlay";
import { capturePhoto } from "@/lib/image";
import { config } from "@/config";
import { useFlow } from "@/flow/FlowProvider";
import { useCamera } from "@/hooks/useCamera";
import { useFaceLiveness } from "@/hooks/useFaceLiveness";

/** Screen 4 — live capture with the back camera and minimal blink liveness. */
export function CameraScreen() {
  const { dispatch, t } = useFlow();
  const { stream, error, facing, starting, switchCamera, start } = useCamera();
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const [capturing, setCapturing] = useState(false);

  const liveness = useFaceLiveness(videoEl, !!stream && !error);

  useEffect(() => {
    if (videoEl && stream) {
      videoEl.srcObject = stream;
      videoEl.play().catch(() => undefined);
    }
  }, [videoEl, stream]);

  const doCapture = useCallback(async () => {
    if (!videoEl || capturing) return;
    setCapturing(true);
    try {
      const photo = await capturePhoto(videoEl);
      dispatch({
        type: "photoCaptured",
        photo: { objectUrl: photo.objectUrl, base64: photo.base64 },
        livenessMethod: liveness.blinkDetected ? "blink" : "fallback",
      });
    } catch {
      setCapturing(false);
    }
  }, [videoEl, capturing, dispatch, liveness.blinkDetected]);

  // Auto-capture once the blink is detected.
  useEffect(() => {
    if (liveness.blinkDetected) void doCapture();
  }, [liveness.blinkDetected, doCapture]);

  if (error) {
    const permission = error === "permission";
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-brand-surface px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <RefreshCw className="h-8 w-8 text-destructive" aria-hidden />
        </div>
        <h2 className="text-lg font-bold text-foreground">
          {permission ? t("camera.permissionTitle") : t("camera.errorTitle")}
        </h2>
        <p className="max-w-xs text-sm text-muted-foreground">
          {permission ? t("camera.permissionBody") : t("camera.errorBody")}
        </p>
        <button
          type="button"
          onClick={() => void start(facing)}
          className="mt-2 h-12 rounded-xl bg-brand-primary px-6 font-semibold text-white active:bg-brand-primary/90"
        >
          {t("details.retry")}
        </button>
      </div>
    );
  }

  const fallbackMode = liveness.modelError && config.allowLivenessFallback;
  const canCapture = !capturing && (liveness.blinkDetected || (fallbackMode && liveness.faceFound));

  return (
    <div className="relative flex flex-1 flex-col bg-black">
      <video
        ref={setVideoEl}
        playsInline
        muted
        autoPlay
        className="absolute inset-0 h-full w-full object-cover"
        aria-label={t("camera.instruction")}
      />
      <FaceGuideOverlay />

      <button
        type="button"
        onClick={switchCamera}
        aria-label={t("camera.switch")}
        className="absolute right-3 top-3 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white"
      >
        <SwitchCamera className="h-5 w-5" aria-hidden />
      </button>

      <div className="relative z-10 mt-auto flex flex-col items-center gap-3 bg-gradient-to-t from-black/70 to-transparent px-4 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-6">
        <LivenessStatus
          faceFound={liveness.faceFound}
          blinkDetected={liveness.blinkDetected}
          modelError={liveness.modelError}
          allowFallback={config.allowLivenessFallback}
        />
        {(starting || capturing) && <p className="text-sm text-white/80">{t("camera.starting")}</p>}
        <button
          type="button"
          onClick={() => void doCapture()}
          disabled={!canCapture}
          aria-label={t("camera.capture")}
          className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white/80 bg-white/20 disabled:opacity-40"
        >
          <span className="h-11 w-11 rounded-full bg-white" />
        </button>
      </div>
    </div>
  );
}
