import { useEffect, useState } from "react";
import { X, Play, Pause, ExternalLink } from "lucide-react";
import sponsoredCover from "@/assets/sponsored-track-cover.jpg";

// === EDIT THIS BLOCK to swap the song being "advertised" ===========
// Keep this looking like a third-party promo. Do NOT reveal owner.
export const SPONSORED_TRACK = {
  title: "The One",
  artist: "NBA Josh x R3NEGAD3",
  cover: sponsoredCover,
  link: "https://open.spotify.com/track/1NGJQfOSZ2M9JSarl80KmG?si=Ghi00yDASF-FvIkTpS467w",
  tag: "Sponsored",
};
// ===================================================================

/** Inline banner — sits under the hero, clearly marked "Sponsored". */
export function MusicAdBanner() {
  return (
    <section className="border-y border-border/40 bg-gradient-to-r from-primary/10 via-card/30 to-primary/10 py-4">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-6">
        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border border-border shadow-card">
          <img
            src={SPONSORED_TRACK.cover}
            alt={`${SPONSORED_TRACK.title} cover art`}
            width={1024}
            height={1024}
            loading="lazy"
            className="h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 animate-pulse bg-primary/10" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary">
              {SPONSORED_TRACK.tag}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Now playing
            </span>
          </div>
          <div className="mt-1 truncate text-sm font-semibold">
            {SPONSORED_TRACK.title}{" "}
            <span className="text-muted-foreground">— {SPONSORED_TRACK.artist}</span>
          </div>
        </div>
        <a
          href={SPONSORED_TRACK.link}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 sm:inline-flex"
        >
          Listen <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </section>
  );
}

/** Floating mini-player — bottom-right, dismissable, with subtle animation. */
export function MusicAdFloatingPlayer() {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 2500);
    return () => clearTimeout(t);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(340px,calc(100vw-2rem))] animate-fade-in">
      <div className="group relative overflow-hidden rounded-2xl border border-border bg-card/95 shadow-elegant backdrop-blur-md">
        {/* Animated gradient sheen */}
        <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 opacity-60 blur-md" />
        <div className="relative flex items-center gap-3 p-3">
          <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-border">
            <img
              src={SPONSORED_TRACK.cover}
              alt={`${SPONSORED_TRACK.title} cover`}
              width={1024}
              height={1024}
              loading="lazy"
              className={`h-full w-full object-cover transition-transform duration-1000 ${
                playing ? "scale-110" : ""
              }`}
            />
            {playing && (
              <div className="absolute inset-0 flex items-end justify-center gap-0.5 bg-background/40 pb-1">
                <span className="h-2 w-0.5 animate-pulse bg-primary" style={{ animationDelay: "0ms" }} />
                <span className="h-3 w-0.5 animate-pulse bg-primary" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-0.5 animate-pulse bg-primary" style={{ animationDelay: "300ms" }} />
                <span className="h-2.5 w-0.5 animate-pulse bg-primary" style={{ animationDelay: "450ms" }} />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-primary">
                Ad
              </span>
              <span className="truncate text-[10px] uppercase tracking-widest text-muted-foreground">
                New release
              </span>
            </div>
            <div className="mt-0.5 truncate text-sm font-semibold">
              {SPONSORED_TRACK.title}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {SPONSORED_TRACK.artist}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? "Pause preview" : "Play preview"}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-elegant transition-transform hover:scale-105"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Dismiss"
            className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
        <a
          href={SPONSORED_TRACK.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block border-t border-border/50 bg-background/30 px-3 py-1.5 text-center text-[10px] font-semibold uppercase tracking-widest text-primary transition-colors hover:bg-primary/10"
        >
          Stream now →
        </a>
      </div>
    </div>
  );
}
