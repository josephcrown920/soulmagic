import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Soul" },
      { name: "description", content: "Get in touch with the Soul team." },
      { property: "og:title", content: "Contact Soul" },
      { property: "og:description", content: "Questions? Bug reports? We respond within 24h." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/40 bg-background/70 px-5 py-3 backdrop-blur md:px-12">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary shadow-elegant" />
          <span className="font-semibold tracking-tight">Soul</span>
        </Link>
        <Link to="/pricing"><Button variant="ghost" size="sm">Pricing</Button></Link>
      </header>

      <section className="mx-auto max-w-2xl px-6 py-20">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Talk to us.</h1>
        <p className="mt-4 text-muted-foreground">
          We respond within 24 hours, Monday to Friday.
        </p>

        <div className="mt-10 space-y-4">
          <a
            href="mailto:hello@styleengine.app"
            className="flex items-center gap-4 rounded-2xl border border-border bg-card/60 p-5 transition-colors hover:border-primary/40"
          >
            <div className="rounded-lg bg-primary/15 p-3">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-semibold">hello@styleengine.app</div>
              <div className="text-xs text-muted-foreground">Sales, support, billing</div>
            </div>
          </a>
          <a
            href="https://twitter.com/lovable_dev"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-4 rounded-2xl border border-border bg-card/60 p-5 transition-colors hover:border-primary/40"
          >
            <div className="rounded-lg bg-primary/15 p-3">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-semibold">DM us on Twitter</div>
              <div className="text-xs text-muted-foreground">Fastest for quick questions</div>
            </div>
          </a>
        </div>
      </section>
    </div>
  );
}
