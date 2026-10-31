import { useFlow } from "@/flow/FlowProvider";
import { useLanguageAwareName } from "@/hooks/useLanguageAwareName";

/** Read-only label/value rows; text selection and long-press are disabled. */
export function DetailsCard() {
  const { state, t } = useFlow();
  const namePrimary = useLanguageAwareName();

  const rows: [string, string][] = [
    [t("label.name"), namePrimary],
    [t("label.nid"), state.nidMasked],
    [t("label.dob"), state.dobMasked],
    [t("label.mobile"), state.mobileMasked],
    [t("label.retailer"), state.retailerName],
    [t("label.applicationId"), state.applicationId],
  ];

  return (
    <dl className="select-none overflow-hidden rounded-2xl border border-border bg-card shadow-sm [-webkit-touch-callout:none]">
      {rows.map(([label, value], i) => (
        <div
          key={label}
          className={`grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-3 px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}
        >
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="min-w-0 break-words text-sm font-semibold text-foreground" dir="auto">
            {value || "—"}
          </dd>
        </div>
      ))}
    </dl>
  );
}
