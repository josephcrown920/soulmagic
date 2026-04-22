import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Trash2, Download, Play } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/library")({
  component: () => (
    <RequireAuth>
      <Library />
    </RequireAuth>
  ),
});

type Job = {
  id: string;
  source_filename: string;
  output_path: string | null;
  input_path: string;
  duration_seconds: number | null;
  created_at: string;
  thumbnail_path: string | null;
};

// Public bucket: derive a stable public URL for thumbnails.
const thumbUrl = (path: string) =>
  supabase.storage.from("thumbnails").getPublicUrl(path).data.publicUrl;

// Extract the first frame of a video URL and return it as a Blob (JPEG).
async function captureVideoFrame(videoUrl: string): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = videoUrl;

    const cleanup = () => {
      video.removeAttribute("src");
      video.load();
    };

    const fail = () => { cleanup(); resolve(null); };

    video.addEventListener("error", fail, { once: true });
    video.addEventListener("loadeddata", () => {
      // Seek slightly past the first frame so we don't grab a black frame.
      try {
        video.currentTime = Math.min(0.5, (video.duration || 1) / 4);
      } catch {
        fail();
      }
    }, { once: true });

    video.addEventListener("seeked", () => {
      try {
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (!w || !h) return fail();
        // Cap resolution for a reasonable thumbnail size (~640px wide).
        const maxW = 640;
        const scale = Math.min(1, maxW / w);
        const cw = Math.round(w * scale);
        const ch = Math.round(h * scale);
        const canvas = document.createElement("canvas");
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext("2d");
        if (!ctx) return fail();
        ctx.drawImage(video, 0, 0, cw, ch);
        canvas.toBlob(
          (blob) => { cleanup(); resolve(blob); },
          "image/jpeg",
          0.82,
        );
      } catch {
        fail();
      }
    }, { once: true });

    // Safety timeout: 12s
    setTimeout(fail, 12000);
  });
}

function Library() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [open, setOpen] = useState<Job | null>(null);
  const [beforeUrl, setBeforeUrl] = useState<string>("");
  const [afterUrl, setAfterUrl] = useState<string>("");
  // Track which jobs we've already attempted in this session to avoid loops.
  const attempted = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("jobs")
        .select("id,source_filename,output_path,input_path,duration_seconds,created_at,thumbnail_path")
        .eq("status", "done")
        .order("completed_at", { ascending: false });
      setJobs(data ?? []);
    })();
  }, [user]);

  // Backfill missing thumbnails one-by-one in the background.
  useEffect(() => {
    if (!user || jobs.length === 0) return;
    let cancelled = false;

    const backfill = async () => {
      for (const job of jobs) {
        if (cancelled) return;
        if (!job.output_path) continue;
        if (job.thumbnail_path) continue;
        if (attempted.current.has(job.id)) continue;
        attempted.current.add(job.id);

        try {
          const { data: signed } = await supabase.storage
            .from("videos-output")
            .createSignedUrl(job.output_path, 3600);
          if (!signed?.signedUrl) continue;

          const blob = await captureVideoFrame(signed.signedUrl);
          if (!blob || cancelled) continue;

          const path = `${user.id}/${job.id}.jpg`;
          const { error: upErr } = await supabase.storage
            .from("thumbnails")
            .upload(path, blob, {
              upsert: true,
              contentType: "image/jpeg",
              cacheControl: "31536000",
            });
          if (upErr) continue;

          const { error: updErr } = await supabase
            .from("jobs")
            .update({ thumbnail_path: path })
            .eq("id", job.id);
          if (updErr) continue;

          if (!cancelled) {
            setJobs((prev) =>
              prev.map((j) => (j.id === job.id ? { ...j, thumbnail_path: path } : j)),
            );
          }
        } catch (e) {
          // non-fatal
          console.warn("thumbnail backfill failed for", job.id, e);
        }
      }
    };

    backfill();
    return () => { cancelled = true; };
  }, [jobs, user]);

  const openJob = async (j: Job) => {
    setOpen(j);
    const [b, a] = await Promise.all([
      supabase.storage.from("videos-input").createSignedUrl(j.input_path, 3600),
      j.output_path
        ? supabase.storage.from("videos-output").createSignedUrl(j.output_path, 3600)
        : Promise.resolve({ data: null, error: null }),
    ]);
    setBeforeUrl(b.data?.signedUrl ?? "");
    setAfterUrl(a.data?.signedUrl ?? "");
  };

  const remove = async (id: string) => {
    await supabase.from("jobs").delete().eq("id", id);
    setJobs((js) => js.filter((j) => j.id !== id));
    toast.success("Removed");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Library</h1>
        <p className="text-sm text-muted-foreground">All your processed clips.</p>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
          No finished videos yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((j) => (
            <div key={j.id} className="group rounded-2xl border border-border bg-card p-3 shadow-card">
              <button
                onClick={() => openJob(j)}
                className="relative block aspect-video w-full overflow-hidden rounded-lg bg-muted"
              >
                {j.thumbnail_path && (
                  <img
                    src={thumbUrl(j.thumbnail_path)}
                    alt={j.source_filename}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                  <Play className="h-10 w-10 text-white drop-shadow-lg" />
                </div>
                {!j.thumbnail_path && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="h-10 w-10 text-foreground/70" />
                  </div>
                )}
              </button>
              <div className="mt-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{j.source_filename}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(j.created_at).toLocaleDateString()}
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(j.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur"
          onClick={() => setOpen(null)}
        >
          <div
            className="w-full max-w-5xl rounded-2xl border border-border bg-card p-5 shadow-elegant"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="font-semibold">{open.source_filename}</div>
              <div className="flex gap-2">
                {afterUrl && (
                  <a href={afterUrl} download>
                    <Button size="sm" variant="outline">
                      <Download className="mr-2 h-4 w-4" /> Download
                    </Button>
                  </a>
                )}
                <Button size="sm" variant="ghost" onClick={() => setOpen(null)}>Close</Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">Before</div>
                {beforeUrl ? (
                  <video src={beforeUrl} controls className="w-full rounded-lg bg-black" />
                ) : (
                  <div className="aspect-video rounded-lg bg-muted" />
                )}
              </div>
              <div>
                <div className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">After</div>
                {afterUrl ? (
                  <video src={afterUrl} controls className="w-full rounded-lg bg-black" />
                ) : (
                  <div className="aspect-video rounded-lg bg-muted" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
