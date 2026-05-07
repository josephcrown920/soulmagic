import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/marketing/LegalLayout";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Soul Studio" },
      { name: "description", content: "How Soul Studio collects, uses, and protects your data." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="May 2026">
      <p>
        We respect your privacy. This policy explains what we collect and why.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li><strong>Account data</strong>: email, authentication tokens.</li>
        <li><strong>Training content</strong>: images you upload to train Souls.</li>
        <li><strong>Generated content</strong>: prompts and outputs you create.</li>
        <li><strong>Usage data</strong>: pages visited, actions taken, error logs.</li>
        <li><strong>Billing data</strong>: handled by our payment processor; we
          store only references and last-four digits.</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To run the service (train models, generate images, deliver outputs).</li>
        <li>To enforce plan limits and prevent abuse.</li>
        <li>To send transactional and (with consent) product emails.</li>
      </ul>
      <h2>Sharing</h2>
      <p>
        We share data only with sub-processors needed to operate the service:
        cloud hosting, GPU inference, payments, and analytics. We do not sell
        your data.
      </p>
      <h2>Retention</h2>
      <p>
        Training images are retained while your Soul exists. Outputs remain in
        your library until you delete them. Account data is retained until you
        request deletion.
      </p>
      <h2>Your rights</h2>
      <p>
        You can export or delete your data anytime via Settings, or by emailing
        us. We respond within 30 days.
      </p>
      <h2>Security</h2>
      <p>
        Data is encrypted in transit and at rest. Access is restricted by
        row-level security and least-privilege roles.
      </p>
      <h2>Contact</h2>
      <p>Privacy questions? <a href="/contact">Contact us</a>.</p>
    </LegalLayout>
  );
}
