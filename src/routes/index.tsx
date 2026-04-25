import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Reveal, RevealStagger, RevealItem } from "@/components/motion/Reveal";
import {
  Sparkles, Wand2, Layers, Zap, Brain, Clapperboard,
  Check, ArrowRight, Star, X as XIcon, Quote, Youtube, Mic, Building2, Briefcase,
} from "lucide-react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import heroCreator from "@/assets/hero-creator.jpg";
import beforeClip from "@/assets/before-clip.jpg";
import afterClip from "@/assets/after-clip.jpg";
import stepTrain from "@/assets/step-train.jpg";
import stepPreset from "@/assets/step-preset.jpg";
import stepGenerate from "@/assets/step-generate.jpg";
import portraitLinkedin from "@/assets/portrait-linkedin.jpg";
import portraitInstagram from "@/assets/portrait-instagram.jpg";
import portraitPodcast from "@/assets/portrait-podcast.jpg";
import portraitCinematic from "@/assets/portrait-cinematic.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Soul Studio — One face. Every frame." },
      { name: "description", content: "The consistency studio for video creators. Train your face, lock your grade, ship on-brand video in minutes." },
      { property: "og:title", content: "Soul Studio — One face. Every frame." },
      { property: "og:description", content: "Train your face. Lock your grade. Every clip on-brand." },
      { property: "og:image", content: "/og-image.jpg" },
      { property: "twitter:image", content: "/og-image.jpg" },
    ],
  }),
  component: Landing,
});

function MarketingNav() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/40 bg-background/70 px-5 py-3 backdrop-blur-md md:px-12">
      <Link to="/" className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-gradient-primary shadow-elegant" />
        <span className="font-semibold tracking-tight">Soul</span>
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

      {/* Hero — split layout with image */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 pt-16 pb-24 md:grid-cols-2 md:pt-24">
        <Reveal>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" /> GPU-powered. Built for creators.
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-6xl">
            One style.{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Every clip.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
            Train a LoRA of your face, lock a color grade, run face restoration —
            and ship on-brand video without hopping between five tools.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
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
        </Reveal>

        <Reveal delay={0.15} className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border shadow-elegant">
            <img
              src={heroCreator}
              alt="A creator portrait lit by Soul's signature magenta key light"
              width={1600}
              height={2000}
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
          </div>
          {/* Glow accent behind image */}
          <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-primary opacity-20 blur-3xl" />
        </Reveal>
      </section>

      {/* BEFORE → AFTER story */}
      <section className="border-y border-border/40 bg-card/30 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="mb-12 text-center">
            <div className="text-xs uppercase tracking-widest text-primary">The transformation</div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Raw clip in. Cinema-grade out.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Same person. Same upload. One pipeline. Watch the difference Style
              Engine makes between what your phone shoots and what your audience sees.
            </p>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-2">
            <Reveal>
              <div className="group relative overflow-hidden rounded-2xl border border-border bg-card/60 shadow-card">
                <div className="absolute left-4 top-4 z-10 rounded-full bg-background/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground backdrop-blur">
                  Before · raw phone clip
                </div>
                <img
                  src={beforeClip}
                  alt="Raw smartphone clip with harsh lighting and flat color"
                  width={1080}
                  height={1920}
                  loading="lazy"
                  className="aspect-[9/16] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="group relative overflow-hidden rounded-2xl border border-primary/40 bg-card/60 shadow-elegant">
                <div className="absolute left-4 top-4 z-10 rounded-full bg-gradient-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground">
                  After · Soul
                </div>
                <img
                  src={afterClip}
                  alt="Same clip after Soul: cinematic grade, restored face, locked vibe"
                  width={1080}
                  height={1920}
                  loading="lazy"
                  className="aspect-[9/16] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <Reveal className="mb-10 text-center">
          <div className="text-xs uppercase tracking-widest text-primary">What's inside</div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            A full studio, in one tab.
          </h2>
        </Reveal>
        <RevealStagger className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Brain, t: "Train your own LoRA", d: "Upload 15-30 photos, get a face/style model trained on Flux in ~20 min." },
            { icon: Clapperboard, t: "Video face restoration", d: "GFPGAN + CodeFormer on every frame. Identity stays locked." },
            { icon: Layers, t: "LUTs & color sliders", d: "Saturation, contrast, warmth, sharpness — saved as reusable presets." },
            { icon: Wand2, t: "Vibe matcher", d: "Drop a reference clip, AI extracts a preset matching the mood." },
            { icon: Zap, t: "Background scenes", d: "Optional outfit/scene pass with IP-Adapter for full restyling." },
            { icon: Sparkles, t: "Image generation", d: "Generate stills with your trained LoRA at any resolution." },
          ].map((f, i) => (
            <RevealItem key={i} className="rounded-2xl border border-border bg-card/60 p-6 text-left shadow-card transition-colors hover:border-primary/40">
              <f.icon className="h-5 w-5 text-primary" />
              <div className="mt-4 font-semibold">{f.t}</div>
              <div className="mt-1 text-sm text-muted-foreground">{f.d}</div>
            </RevealItem>
          ))}
        </RevealStagger>
      </section>

      {/* Workflow with imagery */}
      <section className="border-y border-border/40 bg-card/30 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="mb-12 text-center">
            <div className="text-xs uppercase tracking-widest text-primary">How it works</div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Three steps from raw clip to on-brand cut.
            </h2>
          </Reveal>
          <RevealStagger className="grid gap-8 md:grid-cols-3" stagger={0.12}>
            {[
              { n: "01", t: "Train", d: "Upload 15-30 reference photos. We train a LoRA on your face or style.", img: stepTrain, alt: "A scattered set of polaroid reference photos" },
              { n: "02", t: "Preset", d: "Pick a LUT, dial in face strength, save as a one-click preset.", img: stepPreset, alt: "Hands adjusting a glowing color grading panel" },
              { n: "03", t: "Process", d: "Drop a clip — GPU pipeline applies it frame-by-frame, watermark-free.", img: stepGenerate, alt: "Editor workstation with a graded portrait timeline" },
            ].map((s) => (
              <RevealItem key={s.n} className="overflow-hidden rounded-2xl border border-border bg-background/40 shadow-card">
                <div className="aspect-[4/3] w-full overflow-hidden">
                  <img
                    src={s.img}
                    alt={s.alt}
                    width={1024}
                    height={768}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="text-4xl font-bold tracking-tight bg-gradient-primary bg-clip-text text-transparent">
                    {s.n}
                  </div>
                  <div className="mt-3 text-lg font-semibold">{s.t}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{s.d}</div>
                </div>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      {/* Portrait set — the headline payoff */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <Reveal className="mb-12 text-center">
          <div className="text-xs uppercase tracking-widest text-primary">One LoRA. Every channel.</div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Same face. Four entirely different stories.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Once your LoRA is trained, every prompt becomes on-brand content. LinkedIn
            headshot at 9 AM, Instagram lifestyle by lunch, podcast cover at 5,
            cinematic teaser by midnight — all visibly the same person.
          </p>
        </Reveal>
        <RevealStagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.1}>
          {[
            { img: portraitLinkedin, label: "LinkedIn", sub: "Trust" },
            { img: portraitInstagram, label: "Instagram", sub: "Lifestyle" },
            { img: portraitPodcast, label: "Podcast", sub: "Authority" },
            { img: portraitCinematic, label: "Cinematic", sub: "Story" },
          ].map((p) => (
            <RevealItem key={p.label} className="group relative overflow-hidden rounded-2xl border border-border bg-card/60 shadow-card">
              <div className="aspect-[4/5] w-full overflow-hidden">
                <img
                  src={p.img}
                  alt={`${p.label} portrait generated from a single trained LoRA`}
                  width={1024}
                  height={1280}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/60 to-transparent p-4 pt-12">
                <div className="text-[10px] uppercase tracking-widest text-primary">{p.sub}</div>
                <div className="text-base font-semibold">{p.label}</div>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>
      </section>

      {/* Social proof */}
      <section className="border-t border-border/40 bg-card/30 py-20">
        <Reveal className="mx-auto max-w-4xl px-6 text-center">
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
        </Reveal>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <Reveal>
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
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 px-6 py-10 md:px-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-md bg-gradient-primary" />
            <span>© {new Date().getFullYear()} Soul</span>
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
