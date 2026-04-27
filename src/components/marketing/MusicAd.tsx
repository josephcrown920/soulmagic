import { useEffect, useState } from "react";
import { X, ExternalLink, Flame } from "lucide-react";
import sponsoredCover from "@/assets/sponsored-track-cover.jpg";

// === EDIT THIS BLOCK to swap the song being "advertised" ===========
export const SPONSORED_TRACK = {
  title: "The One",
  artist: "NBA Josh x R3NEGAD3",
  cover: sponsoredCover,
  link: "https://open.spotify.com/track/1NGJQfOSZ2M9JSarl80KmG?si=Ghi00yDASF-FvIkTpS467w",
  tag: "Hot Drop",
};
// ===================================================================

/** Returns true only during morning (6-10) and night (19-23) windows. */
function isWithinAdWindow(): boolean {
  const h = new Date().getHours();
  return (h >= 6 && h < 10) || (h >= 19 && h < 23);
}

/** Inline banner — slim "hot drop" strip. Time-gated. */
export function MusicAdBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const check = () => setShow(isWithinAdWindow());
    check();
    const t = setInterval(check, 60_000);
    return () => clearInterval(t);
  }, []);
  if (!show) return null;

  return (
    <a
      href={SPONSORED_TRACK.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block border-y border-primary/20 bg-gradient-to-r from-primary/5 via-card/40 to-primary/5 py-2 transition-colors hover:from-primary/10 hover:to-primary/10"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-6 text-xs">
        <Flame className="h-3 w-3 text-primary" />
        <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-primary">
          {SPONSORED_TRACK.tag}
        </span>
        <span className="truncate font-medium">
          {SPONSORED_TRACK.title}{" "}
          <span className="text-muted-foreground">— {SPONSORED_TRACK.artist}</span>
        </span>
        <span className="ml-auto hidden items-center gap-1 text-[10px] uppercase tracking-widest text-primary sm:inline-flex">
          Stream before it's gone <ExternalLink className="h-3 w-3" />
        </span>
      </div>
    </a>
  );
}

/** Floating subtle "hot drop" tag — bottom-right, time-gated, dismissable. */
export function MusicAdFloatingPlayer() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isWithinAdWindow()) return;
    if (sessionStorage.getItem("musicad-dismissed") === "1") return;
    const t = setTimeout(() => setOpen(true), 4000);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem("musicad-dismissed", "1");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(220px,calc(100vw-2rem))] animate-fade-in">
      <div className="group relative overflow-hidden rounded-full border border-primary/30 bg-card/90 shadow-card backdrop-blur-md transition-shadow hover:shadow-elegant">
        <a
          href={SPONSORED_TRACK.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 py-1.5 pl-1.5 pr-7"
        >
          <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-border">
            <img
              src={SPONSORED_TRACK.cover}
              alt=""
              width={64}
              height={64}
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="flex items-center gap-1">
              <Flame className="h-2.5 w-2.5 text-primary" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-primary">
                Hot drop
              </span>
            </div>
            <div className="truncate text-[11px] font-semibold">
              {SPONSORED_TRACK.title}
            </div>
          </div>
        </a>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute right-1.5 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      </div>
    </div>
  );
}
