import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Style Engine" },
      { name: "description", content: "Style Engine is a consistency studio for creators who ship video at scale." },
      { property: "og:title", content: "About Style Engine" },
      { property: "og:description", content: "Built for creators who need their face, vibe, and color grade locked across every clip." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/40 bg-background/70 px-5 py-3 backdrop-blur md:px-12">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary shadow-elegant" />
          <span className="font-semibold tracking-tight">Style Engine</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/pricing"><Button variant="ghost" size="sm">Pricing</Button></Link>
          <Link to="/auth"><Button size="sm" className="bg-gradient-primary text-primary-foreground">Start free</Button></Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          We built the tool we wished existed.
        </h1>
        <div className="mt-8 space-y-5 text-base leading-relaxed text-muted-foreground">
          <p>
            Style Engine started as a frustration: every creator we knew was juggling
            5 tools to keep their face, color grade, and overall vibe consistent across
            videos. Topaz for upscaling, DaVinci for color, ComfyUI for face restore,
            then back to Premiere for the final cut.
          </p>
          <p>
            We wanted one place where you could train a LoRA of yourself, save your
            grade as a preset, and apply it to a clip with one drag-and-drop — running
            on real GPUs, not your laptop.
          </p>
          <p>
            That's what Style Engine is. A consistency studio for the creator who
            ships every week.
          </p>
        </div>

        <div className="mt-12 rounded-2xl border border-border bg-card/60 p-6">
          <div className="text-sm font-semibold">Built on</div>
          <div className="mt-2 text-sm text-muted-foreground">
            Replicate (GPU), Flux (LoRA training), GFPGAN + CodeFormer (face restore),
            Lovable Cloud (database + auth), Paystack (billing).
          </div>
        </div>
      </section>
    </div>
  );
}
