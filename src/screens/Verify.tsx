import { ActionButton, BottomAction } from "@/components/BottomAction";
import { revokeObjectUrl } from "@/lib/image";
import { useFlow } from "@/flow/FlowProvider";
import { useLanguageAwareName } from "@/hooks/useLanguageAwareName";

/** Screen 5 — confirm and verify: sends the photo to the bank's face check. */
export function VerifyScreen() {
  const { state, dispatch, verifyFace, t } = useFlow();
  const name = useLanguageAwareName();

  const onVerify = async () => {
    dispatch({ type: "startVerify" });
    await verifyFace();
  };

  return (
    <>
      <div className="flex flex-1 flex-col items-center gap-4 px-4 py-6">
        <h2 className="text-lg font-bold text-brand-purple">{t("verify.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("verify.summary")}</p>
        <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
          {state.photo && (
            <img
              src={state.photo.objectUrl}
              alt=""
              className="h-36 w-36 rounded-2xl object-cover select-none [-webkit-touch-callout:none]"
              draggable={false}
            />
          )}
          <p className="text-center text-base font-semibold text-foreground" dir="auto">
            {name}
          </p>
        </div>
      </div>
      <BottomAction>
        <ActionButton
          onClick={() => {
            void onVerify().finally(() => {
              // The captured object URL is no longer needed once verification ran.
              if (state.photo) revokeObjectUrl(state.photo.objectUrl);
            });
          }}
          disabled={!state.photo}
        >
          {t("verify.button")}
        </ActionButton>
      </BottomAction>
    </>
  );
}
