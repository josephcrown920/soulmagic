import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/marketing/LegalLayout";

export const Route = createFileRoute("/refunds")({
  head: () => ({
    meta: [
      { title: "Refund Policy — Soul Studio" },
      { name: "description", content: "When and how Soul Studio issues refunds." },
    ],
  }),
  component: RefundsPage,
});

function RefundsPage() {
  return (
    <LegalLayout title="Refund Policy" updated="May 2026">
      <h2>Subscriptions</h2>
      <p>
        You can cancel anytime from <a href="/settings">Settings</a>. Your plan
        stays active until the end of the current billing period; no further
        charges are made.
      </p>
      <h2>Pro-rated refunds</h2>
      <p>
        We offer a refund of the unused portion of the current period if you
        request one within <strong>7 days</strong> of the renewal charge AND you
        have not used more than 20% of your plan's monthly credits in that
        period.
      </p>
      <h2>Pay-as-you-go credits</h2>
      <p>
        Pre-purchased credits are non-refundable once consumed. Unused credits
        are refundable for 14 days from purchase.
      </p>
      <h2>Failed trainings & generations</h2>
      <p>
        If a training or generation fails due to a fault on our side, the credit
        is automatically refunded to your account within minutes.
      </p>
      <h2>How to request a refund</h2>
      <p>
        Email us via the <a href="/contact">Contact</a> page with your account
        email and the charge reference. We respond within 5 business days.
      </p>
    </LegalLayout>
  );
}
