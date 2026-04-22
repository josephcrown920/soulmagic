import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Wand2, Layers, Zap, Brain, Clapperboard,
  Check, ArrowRight, Star,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Style Engine — Lock your face & vibe across every video" },
      { name: "description", content: "GPU-powered face restoration, color grading, LoRA training and vibe matching. Ship on-brand video in minutes." },
      { property: "og:title", content: "Style Engine — Consistency Studio" },
      { property: "og:description", content: "Drop a clip, lock in your style. Every output stays on-brand." },
    ],
  }),
  component: Landing,
});

function MarketingNav() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/40 bg-background/70 px-5 py-3 backdrop-blur-md md:px-12">
      <Link to="/" className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-gradient-primary shadow-elegant" />
        <span className="font-semibold tracking-tight">Style Engine</span>
      </Link>
      <nav className="hidden items-center gap-1 md:flex">
        <Link to="/pricing"><Button variant="ghost" size="sm">Pricing</Button></Link>
        <Link to="/about"><Button variant="ghost" size="sm">About</Button></Link>
        <Link to="/contact"><Button variant="ghost" size="sm">Contact</Button></Link>
      </nav>
      <div className="flex items-center gap-2">
        <Link to="/auth"><Button variant="ghost" size="sm">Sign in</Button></Link>
        <Link to="/auth">
          <Button size="sm" className="bg-gradient-primary text-primary-foreground shadow-elegant">
            Start free
          </Button>
        </Link>
      </div>
    </header>
  );
}

function Landing() {
  const { user, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && user) nav({ to: "/studio" });
  }, [loading, user, nav]);

  return (
    <div className="min-h-screen">
      <MarketingNav />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-24 text-center md:pt-28">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3" /> GPU-powered. Built for creators.
        </div>
        <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-7xl">
          One style.{" "}
          <span className="bg-gradient-primary bg-clip-text text-transparent">
            Every clip.
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
          Train a LoRA of your face, lock a color grade, run face restoration —
          and ship on-brand video without hopping between five tools.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/auth">
            <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-elegant">
              Start free <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/pricing">
            <Button size="lg" variant="outline">See pricing</Button>
          </Link>
        </div>
        <div className="mt-6 text-xs text-muted-foreground">
          No credit card · 1 free job · Watermarked output
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-10 text-center">
          <div className="text-xs uppercase tracking-widest text-primary">What's inside</div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            A full studio, in one tab.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Brain, t: "Train your own LoRA", d: "Upload 15-30 photos, get a face/style model trained on Flux in ~20 min." },
            { icon: Clapperboard, t: "Video face restoration", d: "GFPGAN + CodeFormer on every frame. Identity stays locked." },
            { icon: Layers, t: "LUTs & color sliders", d: "Saturation, contrast, warmth, sharpness — saved as reusable presets." },
            { icon: Wand2, t: "Vibe matcher", d: "Drop a reference clip, AI extracts a preset matching the mood." },
            { icon: Zap, t: "Background scenes", d: "Optional outfit/scene pass with IP-Adapter for full restyling." },
            { icon: Sparkles, t: "Image generation", d: "Generate stills with your trained LoRA at any resolution." },
          ].map((f, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card/60 p-6 text-left shadow-card transition-colors hover:border-primary/40">
              <f.icon className="h-5 w-5 text-primary" />
              <div className="mt-4 font-semibold">{f.t}</div>
              <div className="mt-1 text-sm text-muted-foreground">{f.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section className="border-y border-border/40 bg-card/30 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <div className="text-xs uppercase tracking-widest text-primary">How it works</div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Three steps from raw clip to on-brand cut.
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { n: "01", t: "Train", d: "Upload reference photos. We train a LoRA on your face or style." },
              { n: "02", t: "Preset", d: "Pick a LUT, dial in face strength, save as a one-click preset." },
              { n: "03", t: "Process", d: "Drop a clip — GPU pipeline applies it frame-by-frame, watermark-free." },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-border bg-background/40 p-6">
                <div className="text-5xl font-bold tracking-tight bg-gradient-primary bg-clip-text text-transparent">
                  {s.n}
                </div>
                <div className="mt-4 text-lg font-semibold">{s.t}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <div className="mb-2 inline-flex items-center gap-1 text-warning">
          {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
        </div>
        <p className="text-xl font-medium leading-relaxed text-foreground md:text-2xl">
          "I used to bounce between Topaz, Resolve and a face swap tool. Now it's
          one preset and a drag-and-drop. My output is finally consistent."
        </p>
        <div className="mt-4 text-sm text-muted-foreground">
          — Maya O., independent creator
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 pb-24 text-center">
        <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 to-transparent p-10 md:p-16">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Lock your look in 5 minutes.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Start free, no card required. Upgrade when you're ready to ship without watermarks.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-elegant">
                Start free
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline">Compare plans</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 px-6 py-10 md:px-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-md bg-gradient-primary" />
            <span>© {new Date().getFullYear()} Style Engine</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link to="/about" className="hover:text-foreground">About</Link>
            <Link to="/contact" className="hover:text-foreground">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Suppress unused-import warning
void Check;
