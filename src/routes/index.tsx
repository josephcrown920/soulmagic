import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
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
import { MusicAdBanner, MusicAdFloatingPlayer } from "@/components/marketing/MusicAd";
import heroCreator from "@/assets/hero-creator.jpg";
import loraCoffeeWalk from "@/assets/lora-coffee-walk.jpg";
import loraBookstore from "@/assets/lora-bookstore.jpg";
import loraNeonNight from "@/assets/lora-neon-night.jpg";
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
      <Link to="/" className="flex items-center gap-2.5">
        <div className="flex flex-col leading-tight">
          <span className="font-semibold tracking-tight">Soul Studio</span>
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground">One face · Every frame</span>
        </div>
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

      {/* Social proof bar */}
      <section className="border-y border-border/40 bg-background/40 py-8">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Trusted by creators shipping on
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-70">
            {["YOUTUBE", "TIKTOK", "INSTAGRAM", "LINKEDIN", "PODCASTS", "SUBSTACK"].map((b) => (
              <span key={b} className="text-sm font-bold tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground">
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>



      {/* Stats counters */}
      <section className="border-b border-border/40 bg-card/20 py-12">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-6 md:grid-cols-4">
          {[
            { n: "10k+", l: "LoRAs trained" },
            { n: "2M+", l: "Frames restored" },
            { n: "4.9★", l: "Creator rating" },
            { n: "<20m", l: "Avg train time" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <div className="bg-gradient-primary bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-4xl">
                {s.n}
              </div>
              <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{s.l}</div>
            </div>
          ))}
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

      {/* Use-case tabs */}
      <section className="border-y border-border/40 bg-card/30 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <Reveal className="mb-10 text-center">
            <div className="text-xs uppercase tracking-widest text-primary">Built for your workflow</div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Whatever you ship, Soul keeps it on-brand.
            </h2>
          </Reveal>
          <Tabs defaultValue="youtuber" className="w-full">
            <TabsList className="mx-auto grid w-full max-w-2xl grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="youtuber"><Youtube className="mr-1 h-3 w-3" />YouTubers</TabsTrigger>
              <TabsTrigger value="coach"><Briefcase className="mr-1 h-3 w-3" />Coaches</TabsTrigger>
              <TabsTrigger value="agency"><Building2 className="mr-1 h-3 w-3" />Agencies</TabsTrigger>
              <TabsTrigger value="podcast"><Mic className="mr-1 h-3 w-3" />Podcasters</TabsTrigger>
            </TabsList>
            {[
              { v: "youtuber", t: "Same face, every thumbnail", d: "Train one LoRA, generate unlimited thumbnails and B-roll stills that look like you — without re-shooting.", b: "Cut thumbnail time from 1hr to 2 min." },
              { v: "coach", t: "Look polished on every platform", d: "LinkedIn headshot, IG carousel, course cover — one upload, every channel covered with a consistent brand grade.", b: "Show up like a pro, every post." },
              { v: "agency", t: "5 client LoRAs, one dashboard", d: "Manage trained models per client. Save grade presets. Bill faster with reusable pipelines.", b: "Triple your output per editor." },
              { v: "podcast", t: "Cinematic clips from raw Zoom", d: "Drop a recording, get face-restored, color-graded vertical clips ready for Reels and Shorts.", b: "Turn one episode into 20 cuts." },
            ].map((u) => (
              <TabsContent key={u.v} value={u.v} className="mt-8">
                <Card className="border-border bg-background/40 p-8 shadow-card">
                  <div className="text-lg font-semibold md:text-xl">{u.t}</div>
                  <p className="mt-2 text-muted-foreground">{u.d}</p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                    <Sparkles className="h-3 w-3" /> {u.b}
                  </div>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Comparison table */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <Reveal className="mb-10 text-center">
          <div className="text-xs uppercase tracking-widest text-primary">Why switch</div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            One tab beats five tools.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Stop stitching Topaz, Resolve and a face-swap into a fragile pipeline. Soul does it in one pass.
          </p>
        </Reveal>
        <Reveal>
          <div className="overflow-hidden rounded-2xl border border-border bg-card/40 shadow-card">
            <div className="grid grid-cols-5 border-b border-border bg-card/60 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <div className="p-4">Feature</div>
              <div className="p-4 text-center text-primary">Soul Studio</div>
              <div className="p-4 text-center">Topaz</div>
              <div className="p-4 text-center">Resolve</div>
              <div className="p-4 text-center">FaceSwap</div>
            </div>
            {[
              ["Identity-locked face", true, false, false, true],
              ["Color grade presets", true, false, true, false],
              ["Frame-by-frame restore", true, true, false, false],
              ["Train your own LoRA", true, false, false, false],
              ["No GPU needed locally", true, false, false, false],
              ["Avg cost / 60s clip", "$0.40", "$2.50", "Free*", "$1.20"],
              ["Time to result", "~3 min", "~25 min", "Hours", "~15 min"],
            ].map((row, i) => (
              <div key={i} className={`grid grid-cols-5 border-b border-border/50 text-sm last:border-0 ${i % 2 ? "bg-card/20" : ""}`}>
                <div className="p-4 font-medium">{row[0] as string}</div>
                {row.slice(1).map((cell, j) => (
                  <div key={j} className={`p-4 text-center ${j === 0 ? "text-primary font-semibold" : ""}`}>
                    {typeof cell === "boolean" ? (
                      cell ? <Check className="mx-auto h-4 w-4 text-primary" /> : <XIcon className="mx-auto h-4 w-4 text-muted-foreground/50" />
                    ) : cell}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="mt-3 text-center text-xs text-muted-foreground">*Resolve is free but requires a powerful local GPU + steep learning curve.</div>
        </Reveal>
      </section>

      {/* Sample gallery — masonry */}
      <section className="border-y border-border/40 bg-card/30 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="mb-10 text-center">
            <div className="text-xs uppercase tracking-widest text-primary">From the community</div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Real prompts. Real LoRAs. Real outputs.
            </h2>
          </Reveal>
          <div className="columns-2 gap-4 md:columns-4">
            {[
              { img: portraitLinkedin, p: "executive headshot, soft window light, charcoal blazer", h: "h-72" },
              { img: portraitInstagram, p: "golden hour rooftop, linen shirt, candid laugh", h: "h-96" },
              { img: portraitPodcast, p: "studio mic close-up, neon backlight, moody cinematic", h: "h-80" },
              { img: portraitCinematic, p: "anamorphic close-up, teal/orange grade, film grain", h: "h-[26rem]" },
              { img: portraitLinkedin, p: "minimal white backdrop, editorial fashion lighting", h: "h-64" },
              { img: portraitInstagram, p: "café morning, latte in hand, sunlit window bokeh", h: "h-80" },
              { img: portraitPodcast, p: "vintage record store, warm tungsten, grainy 35mm", h: "h-96" },
              { img: portraitCinematic, p: "neo-noir alley, rain reflections, deep contrast", h: "h-72" },
            ].map((g, i) => (
              <div key={i} className="group relative mb-4 break-inside-avoid overflow-hidden rounded-xl border border-border">
                <img src={g.img} alt={g.p} loading="lazy" className={cn("w-full object-cover transition-transform duration-700 group-hover:scale-105", g.h)} />
                <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-background via-background/80 to-transparent p-3 transition-transform duration-300 group-hover:translate-y-0">
                  <div className="text-[10px] uppercase tracking-widest text-primary">prompt</div>
                  <div className="line-clamp-2 text-xs text-foreground">{g.p}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <Reveal className="mb-10 text-center">
          <div className="text-xs uppercase tracking-widest text-primary">Simple pricing</div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Start free. Scale when you ship.
          </h2>
        </Reveal>
        <RevealStagger className="grid gap-6 md:grid-cols-3">
          {[
            { n: "Free", p: "$0", d: "Try every tool", f: ["1 job / month", "Watermarked output", "Community presets"], cta: "Start free", featured: false },
            { n: "Pro", p: "$29", d: "For solo creators", f: ["50 jobs / month", "No watermark", "1 trained LoRA", "Priority queue"], cta: "Go Pro", featured: true },
            { n: "Studio", p: "$99", d: "For teams & agencies", f: ["Unlimited jobs", "5 LoRAs", "Client workspaces", "API access"], cta: "Get Studio", featured: false },
          ].map((t) => (
            <RevealItem key={t.n}>
              <Card className={cn(
                "h-full p-8 transition-all",
                t.featured ? "border-primary/60 bg-gradient-to-br from-primary/10 to-transparent shadow-elegant" : "border-border bg-card/40 shadow-card"
              )}>
                {t.featured && (
                  <div className="mb-3 inline-block rounded-full bg-gradient-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground">
                    Most popular
                  </div>
                )}
                <div className="text-lg font-semibold">{t.n}</div>
                <div className="mt-1 text-sm text-muted-foreground">{t.d}</div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">{t.p}</span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                <ul className="mt-6 space-y-2 text-sm">
                  {t.f.map((feat) => (
                    <li key={feat} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/pricing" className="mt-6 block">
                  <Button className={cn("w-full", t.featured && "bg-gradient-primary text-primary-foreground shadow-elegant")} variant={t.featured ? "default" : "outline"}>
                    {t.cta}
                  </Button>
                </Link>
              </Card>
            </RevealItem>
          ))}
        </RevealStagger>
        <div className="mt-6 text-center">
          <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
            Compare full plans →
          </Link>
        </div>
      </section>

      {/* Testimonials grid */}
      <section className="border-y border-border/40 bg-card/30 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="mb-12 text-center">
            <div className="text-xs uppercase tracking-widest text-primary">Loved by creators</div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              The end of the five-tool tax.
            </h2>
          </Reveal>
          <RevealStagger className="grid gap-6 md:grid-cols-3">
            {[
              { q: "I used to bounce between Topaz, Resolve and a face swap tool. Now it's one preset and a drag-and-drop. Finally consistent.", a: "Maya O.", r: "Independent creator · 84k IG" },
              { q: "Trained my LoRA in 18 minutes. Shipped 12 thumbnails the next morning. My CTR is up 34%.", a: "Daniel K.", r: "YouTuber · 220k subs" },
              { q: "We onboarded 4 client LoRAs and cut our editing time in half. Soul Studio paid for itself in week one.", a: "Lola A.", r: "Founder · Tilt Studio" },
            ].map((t) => (
              <RevealItem key={t.a}>
                <Card className="h-full border-border bg-background/40 p-6 shadow-card">
                  <Quote className="h-5 w-5 text-primary" />
                  <p className="mt-4 text-sm leading-relaxed text-foreground">"{t.q}"</p>
                  <div className="mt-6 border-t border-border/50 pt-4">
                    <div className="text-sm font-semibold">{t.a}</div>
                    <div className="text-xs text-muted-foreground">{t.r}</div>
                  </div>
                  <div className="mt-3 inline-flex gap-0.5 text-warning">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                  </div>
                </Card>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      {/* Press / As seen in */}
      <section className="border-b border-border/40 py-12">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <div className="mb-5 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">As featured on</div>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm font-bold tracking-[0.2em] text-muted-foreground">
            <span>PRODUCT HUNT #3</span>
            <span>·</span>
            <span>INDIE HACKERS</span>
            <span>·</span>
            <span>TECHCABAL</span>
            <span>·</span>
            <span>MAKER LOG</span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-24">
        <Reveal className="mb-10 text-center">
          <div className="text-xs uppercase tracking-widest text-primary">Questions, answered</div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">FAQ</h2>
        </Reveal>
        <Reveal>
          <Accordion type="single" collapsible className="w-full">
            {[
              { q: "How long does training a LoRA take?", a: "Typically 15–25 minutes on our GPU pipeline. You'll get an email when it's ready." },
              { q: "Is my training data private?", a: "Yes. Your photos and trained models are private to your account by default. We never reuse your data to train shared models." },
              { q: "Can I use the outputs commercially?", a: "Yes. On Pro and Studio plans, you own all outputs and can use them in client work, ads, and monetized content." },
              { q: "What if I don't like the result?", a: "Free plan lets you test before paying. If your first paid month doesn't work for you, email us within 14 days for a full refund." },
              { q: "Do I need a powerful computer?", a: "No. Everything runs in our cloud. You just need a browser and an internet connection." },
              { q: "What file formats are supported?", a: "MP4, MOV, WebM for video. JPG, PNG, WebP for images. Up to 4K resolution on Pro and Studio." },
              { q: "Can I cancel any time?", a: "Yes. Subscriptions are month-to-month and can be cancelled in one click from Settings." },
            ].map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-border">
                <AccordionTrigger className="text-left text-base hover:text-primary">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </section>

      {/* Founder note */}
      <section className="border-t border-border/40 bg-gradient-to-b from-card/30 to-transparent py-24">
        <div className="mx-auto max-w-3xl px-6">
          <Reveal className="text-center">
            <div className="text-xs uppercase tracking-widest text-primary">Why I built Soul Studio</div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              I was tired of looking different in every video.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-8 space-y-4 text-base leading-relaxed text-muted-foreground">
              <p>
                I shipped 200+ videos last year. Half were great. The other half — flat lighting, washed-out skin, a face that didn't quite look like mine. I was paying for Topaz, Resolve, a face-swap tool, and still spending Sundays color-matching clips.
              </p>
              <p>
                Soul Studio is the tool I wish I had two years ago. Train your face once, lock your grade once, and every clip you ship from that point forward stays on-brand. No more five-tool tax. No more "is this even me?"
              </p>
              <p className="text-foreground">
                If you ship video and care about how it looks — this is for you.
              </p>
            </div>
            <div className="mt-8 flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-primary shadow-elegant" />
              <div>
                <div className="text-sm font-semibold">The Soul Studio team</div>
                <div className="text-xs text-muted-foreground">Lagos · Remote</div>
              </div>
            </div>
          </Reveal>
        </div>
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
            <span>© {new Date().getFullYear()} Soul Studio</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link to="/about" className="hover:text-foreground">About</Link>
            <Link to="/contact" className="hover:text-foreground">Contact</Link>
          </div>
        </div>
      </footer>

      <MusicAdFloatingPlayer />
    </div>
  );
}

// Suppress unused-import warning
void Check;
