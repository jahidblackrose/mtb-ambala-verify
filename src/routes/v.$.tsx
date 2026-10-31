import { createFileRoute } from "@tanstack/react-router";
import { FlowApp } from "@/screens/FlowApp";

/**
 * The only entry route: /v/<linkToken>.
 * FlowApp strips the token from the URL/history immediately and keeps it in memory.
 */
export const Route = createFileRoute("/v/$")({
  head: () => ({
    meta: [
      { title: "MTB Customer Verification — গ্রাহক যাচাই" },
      {
        name: "description",
        content:
          "In-store customer verification for Mutual Trust Bank PLC: OTP, customer details and a live photo check.",
      },
      { property: "og:title", content: "MTB Customer Verification — গ্রাহক যাচাই" },
      {
        property: "og:description",
        content: "In-store customer verification for Mutual Trust Bank PLC: OTP, details and live photo check.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Entry,
});

function Entry() {
  const params = Route.useParams();
  return <FlowApp linkToken={params._splat ?? ""} />;
}
