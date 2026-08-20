import { createFileRoute } from "@tanstack/react-router";
import { AuroraEmbedBridge } from "@/components/embed/AuroraEmbedBridge";
import { useAuth } from "@/lib/auth";
import { Studio } from "./studio";

export const Route = createFileRoute("/embed")({
  component: EmbedRoute,
});

function EmbedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Loading Soul Studio…
      </div>
    );
  }

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-background p-6 text-center text-foreground">
        <AuroraEmbedBridge />
        <div className="max-w-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Soul Studio
          </p>
          <h1 className="mt-3 text-2xl font-semibold">Sign in to continue</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Soul keeps its own secure session. Open sign-in in a new tab, then
            return to this embedded studio.
          </p>
          <a
            href="/auth"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Open Soul sign-in
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-4 text-foreground md:p-6">
      <AuroraEmbedBridge />
      <Studio embedded />
    </main>
  );
}