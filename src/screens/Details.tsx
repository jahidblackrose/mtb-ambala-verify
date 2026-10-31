import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, FileText, RefreshCw } from "lucide-react";
import { ActionButton, BottomAction } from "@/components/BottomAction";
import { DetailsCard } from "@/components/DetailsCard";
import { TermsBox } from "@/components/TermsBox";
import { apiPost } from "@/api/client";
import { useFlow } from "@/flow/FlowProvider";
import type { DetailsData, TermsData } from "@/api/types";
import { sanitizeHtml } from "@/lib/sanitize";

interface SectionState<T> {
  data: T | null;
  error: string | null; // null = loading / ok; "expired" = go to expired screen
  loading: boolean;
}

/** Screen 3 — customer details + Terms & Conditions; both load in parallel, independent retries. */
export function DetailsScreen() {
  const { state, dispatch, t } = useFlow();
  const [details, setDetails] = useState<SectionState<DetailsData>>({ data: null, error: null, loading: true });
  const [terms, setTerms] = useState<SectionState<TermsData>>({ data: null, error: null, loading: true });
  const [scrolled, setScrolled] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const loadDetails = useCallback(async () => {
    setDetails((s) => ({ ...s, loading: true, error: null }));
    const r = await apiPost<DetailsData>("details", {}, {
      accessToken: state.accessToken,
      lang: state.lang,
    });
    if (r.kind === "ok") setDetails({ data: r.data, error: null, loading: false });
    else if (r.kind === "authExpired" || r.kind === "linkExpired" || r.kind === "invalidLink") {
      setDetails({ data: null, error: "expired", loading: false });
    } else setDetails({ data: null, error: r.message || t("details.loadFailed"), loading: false });
  }, [state.accessToken, state.lang, t]);

  const loadTerms = useCallback(async () => {
    setTerms((s) => ({ ...s, loading: true, error: null }));
    const r = await apiPost<TermsData>("terms", {}, {
      accessToken: state.accessToken,
      lang: state.lang,
    });
    if (r.kind === "ok") setTerms({ data: r.data, error: null, loading: false });
    else if (r.kind === "authExpired" || r.kind === "linkExpired" || r.kind === "invalidLink") {
      setTerms({ data: null, error: "expired", loading: false });
    } else setTerms({ data: null, error: r.message || t("terms.loadFailed"), loading: false });
  }, [state.accessToken, state.lang, t]);

  useEffect(() => {
    void loadDetails();
    void loadTerms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (details.error === "expired" || terms.error === "expired") dispatch({ type: "expired" });
  }, [details.error, terms.error, dispatch]);

  // Push the loaded details + terms into the flow state once both are in.
  useEffect(() => {
    if (details.data && terms.data) {
      dispatch({ type: "detailsLoaded", details: details.data, terms: terms.data });
    }
  }, [details.data, terms.data, dispatch]);

  const onAccept = () => {
    if (!terms.data || !accepted) return;
    dispatch({ type: "tncAccepted", tncId: terms.data.tncId });
    dispatch({ type: "setStep", step: "camera" });
  };

  const ready = !details.loading && !terms.loading;

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 px-4 py-4">
        <h2 className="text-center text-lg font-bold text-brand-purple">{t("details.title")}</h2>

        {details.loading ? (
          <SkeletonRows />
        ) : details.data ? (
          <DetailsCard />
        ) : (
          <ErrorCard message={details.error ?? ""} onRetry={() => void loadDetails()} label={t("details.retry")} />
        )}

        {terms.loading ? (
          <SkeletonRows tall />
        ) : terms.data ? (
          <TermsBox
            title={terms.data.title}
            version={terms.data.version}
            html={sanitizeHtml(terms.data.content)}
            scrolled={scrolled}
            onScrolled={() => setScrolled(true)}
            accepted={accepted}
            onToggleAccept={() => setAccepted((a) => !a)}
          />
        ) : (
          <ErrorCard message={terms.error ?? ""} onRetry={() => void loadTerms()} label={t("details.retry")} />
        )}
      </div>
      <BottomAction>
        <ActionButton onClick={onAccept} disabled={!ready || !terms.data || !accepted}>
          {t("details.accept")}
        </ActionButton>
      </BottomAction>
    </>
  );
}

function SkeletonRows({ tall }: { tall?: boolean }) {
  return (
    <div className="animate-pulse space-y-2 rounded-2xl border border-border bg-card p-4 shadow-sm" aria-hidden>
      {Array.from({ length: tall ? 5 : 4 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-3 flex-1 max-w-40 rounded bg-muted" />
        </div>
      ))}
      {tall && <div className="h-40 rounded-xl bg-muted/60" />}
      <span className="sr-only flex items-center gap-2 text-xs text-muted-foreground">
        <FileText className="h-3 w-3" /> Loading…
      </span>
    </div>
  );
}

function ErrorCard({ message, onRetry, label }: { message: string; onRetry: () => void; label: string }) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center">
      <AlertTriangle className="mx-auto h-5 w-5 text-destructive" aria-hidden />
      <p className="mt-1 text-sm text-destructive">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mx-auto mt-2 inline-flex h-11 items-center gap-2 rounded-xl border border-brand-purple px-4 text-sm font-semibold text-brand-purple active:bg-brand-purple/10"
      >
        <RefreshCw className="h-4 w-4" aria-hidden />
        {label}
      </button>
    </div>
  );
}
