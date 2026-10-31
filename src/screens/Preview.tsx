import { ActionButton, BottomAction } from "@/components/BottomAction";
import { revokeObjectUrl } from "@/lib/image";
import { useFlow } from "@/flow/FlowProvider";

/** Screen 4b — preview the captured photo: retake or use. */
export function PreviewScreen() {
  const { state, dispatch, t } = useFlow();
  const photo = state.photo;

  const retake = () => {
    if (photo) revokeObjectUrl(photo.objectUrl);
    dispatch({ type: "discardPhoto" });
  };

  return (
    <>
      <div className="flex flex-1 flex-col items-center gap-4 px-4 py-6">
        {photo && (
          <img
            src={photo.objectUrl}
            alt={t("camera.capture")}
            className="max-h-[55vh] w-auto max-w-full rounded-2xl border border-border object-contain shadow-sm select-none [-webkit-touch-callout:none]"
            draggable={false}
          />
        )}
        <p className="text-center text-sm text-muted-foreground">{t("camera.instruction")}</p>
      </div>
      <BottomAction>
        <div className="flex gap-3">
          <ActionButton variant="secondary" onClick={retake} className="flex-1">
            {t("preview.retake")}
          </ActionButton>
          <ActionButton onClick={() => dispatch({ type: "setStep", step: "verify" })} className="flex-1">
            {t("preview.use")}
          </ActionButton>
        </div>
      </BottomAction>
    </>
  );
}
