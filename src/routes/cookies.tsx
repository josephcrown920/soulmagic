import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/marketing/LegalLayout";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookie Policy — Soul Studio" },
      { name: "description", content: "What cookies Soul Studio uses and why." },
    ],
  }),
  component: CookiesPage,
});

function CookiesPage() {
  return (
    <LegalLayout title="Cookie Policy" updated="May 2026">
      <p>We use a small set of cookies to make Soul Studio work.</p>
      <h2>Strictly necessary</h2>
      <ul>
        <li><strong>Session</strong>: keeps you signed in.</li>
        <li><strong>CSRF</strong>: protects you from forged requests.</li>
      </ul>
      <h2>Functional</h2>
      <ul>
        <li><strong>Preferences</strong>: remembers UI choices like theme.</li>
      </ul>
      <h2>Analytics</h2>
      <p>
        Aggregated, privacy-respecting usage analytics. No advertising cookies,
        no cross-site tracking.
      </p>
      <h2>Managing cookies</h2>
      <p>
        You can clear cookies anytime via your browser settings. Note that
        clearing the session cookie will sign you out.
      </p>
    </LegalLayout>
  );
}
