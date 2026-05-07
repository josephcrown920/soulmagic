import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/marketing/LegalLayout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Soul Studio" },
      { name: "description", content: "The rules for using Soul Studio." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updated="May 2026">
      <p>
        Welcome to Soul Studio ("Soul", "we", "us"). By creating an account or
        using the service you agree to these Terms. If you do not agree, do not
        use the service.
      </p>
      <h2>1. Your account</h2>
      <p>
        You must be 18+ and provide accurate information. You are responsible for
        all activity under your account and for keeping your credentials secure.
      </p>
      <h2>2. Acceptable use</h2>
      <ul>
        <li>You may only train Souls on the likeness of a person who has
        explicitly consented in writing — including yourself.</li>
        <li>No deepfakes of public figures, minors, or non-consenting parties.</li>
        <li>No illegal, hateful, sexually explicit, or harassing content.</li>
        <li>No attempts to reverse engineer, scrape, or overload the service.</li>
      </ul>
      <h2>3. Your content</h2>
      <p>
        You retain ownership of training images and outputs. You grant us a
        limited license to process your content solely to operate the service.
      </p>
      <h2>4. Plans and billing</h2>
      <p>
        Paid plans renew automatically until cancelled. Usage in excess of your
        plan may be blocked or billed as overage. See <a href="/refunds">Refunds</a>.
      </p>
      <h2>5. Service availability</h2>
      <p>
        We aim for high uptime but do not guarantee uninterrupted service.
        Training and generation depend on third-party GPU providers.
      </p>
      <h2>6. Termination</h2>
      <p>
        We may suspend or terminate accounts that violate these Terms. You can
        cancel anytime from Settings.
      </p>
      <h2>7. Disclaimer & liability</h2>
      <p>
        The service is provided "as is" without warranties. To the maximum
        extent permitted by law, our aggregate liability is limited to the
        amount you paid us in the prior 12 months.
      </p>
      <h2>8. Contact</h2>
      <p>Questions? <a href="/contact">Contact us</a>.</p>
    </LegalLayout>
  );
}
