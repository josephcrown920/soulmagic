import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Sparkles, Wand2, Layers, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && user) nav({ to: "/studio" });
  }, [loading, user, nav]);

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary shadow-elegant" />
          <span className="font-semibold tracking-tight">Style Engine</span>
        </div>
        <Link to="/auth">
          <Button variant="ghost" size="sm">Sign in</Button>
        </Link>
      </header>

      <section className="mx-auto max-w-5xl px-6 pt-12 pb-20 text-center md:pt-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3" /> Your face. Your vibe. Every video.
        </div>
        <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-6xl">
          One style. <span className="bg-gradient-primary bg-clip-text text-transparent">Every clip.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
          Drop a video, pick your preset, and Style Engine runs face enhancement,
          color grading, and identity locking on GPU — so every output looks like
          it came from the same brand.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/auth">
            <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-elegant">
              Start free
            </Button>
          </Link>
          <Link to="/auth">
            <Button size="lg" variant="outline">I have an account</Button>
          </Link>
        </div>

        <div className="mt-20 grid gap-4 md:grid-cols-3">
          {[
            { icon: Zap, t: "GFPGAN + CodeFormer", d: "Face restoration & consistency on Replicate's GPUs." },
            { icon: Layers, t: "LUTs & sliders", d: "Lock saturation, contrast, warmth, sharpness in one preset." },
            { icon: Wand2, t: "Vibe Matcher", d: "Drop a reference clip, get a preset that matches its mood." },
          ].map((f, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card/60 p-6 text-left shadow-card">
              <f.icon className="h-5 w-5 text-primary" />
              <div className="mt-4 font-semibold">{f.t}</div>
              <div className="mt-1 text-sm text-muted-foreground">{f.d}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
