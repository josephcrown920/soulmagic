import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Reveal, RevealStagger, RevealItem } from "@/components/motion/Reveal";
import portraitLinkedin from "@/assets/portrait-linkedin.jpg";
import portraitInstagram from "@/assets/portrait-instagram.jpg";
import portraitPodcast from "@/assets/portrait-podcast.jpg";
import portraitCinematic from "@/assets/portrait-cinematic.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Soul" },
      { name: "description", content: "Soul is a consistency studio for creators who ship video at scale." },
      { property: "og:title", content: "About Soul" },
      { property: "og:description", content: "Built for creators who need their face, vibe, and color grade locked across every clip." },
      { property: "og:image", content: "/og-image.jpg" },
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
          <span className="font-semibold tracking-tight">Soul</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/pricing"><Button variant="ghost" size="sm">Pricing</Button></Link>
          <Link to="/auth"><Button size="sm" className="bg-gradient-primary text-primary-foreground">Start free</Button></Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-20">
        <Reveal>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            We built the tool we wished existed.
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-8 space-y-5 text-base leading-relaxed text-muted-foreground">
            <p>
              Soul started as a frustration: every creator we knew was juggling
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
              That's what Soul is. A consistency studio for the creator who
              ships every week.
            </p>
          </div>
        </Reveal>
      </section>

      {/* Visual proof — same person, four contexts */}
      <section className="border-y border-border/40 bg-card/30 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="mb-10 max-w-2xl">
            <div className="text-xs uppercase tracking-widest text-primary">What "consistency" means</div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Not a filter. A locked identity.
            </h2>
            <p className="mt-3 text-muted-foreground">
              These four images came from one trained LoRA and four prompts. The
              face stays the same; the world around it changes.
            </p>
          </Reveal>
          <RevealStagger className="grid grid-cols-2 gap-3 md:grid-cols-4" stagger={0.08}>
            {[
              { img: portraitLinkedin, label: "LinkedIn" },
              { img: portraitInstagram, label: "Instagram" },
              { img: portraitPodcast, label: "Podcast" },
              { img: portraitCinematic, label: "Cinematic" },
            ].map((p) => (
              <RevealItem key={p.label} className="group overflow-hidden rounded-2xl border border-border bg-card/60 shadow-card">
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src={p.img}
                    alt={`${p.label} portrait from a single LoRA`}
                    width={1024}
                    height={1280}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="px-4 py-3 text-xs font-medium text-muted-foreground">
                  {p.label}
                </div>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-20">
        <Reveal>
          <div className="rounded-2xl border border-border bg-card/60 p-6">
            <div className="text-sm font-semibold">Built on</div>
            <div className="mt-2 text-sm text-muted-foreground">
              Replicate (GPU), Flux (LoRA training), GFPGAN + CodeFormer (face restore),
              Lovable Cloud (database + auth), Paystack (billing).
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
