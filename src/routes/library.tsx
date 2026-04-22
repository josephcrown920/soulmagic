import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
};

function Library() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [open, setOpen] = useState<Job | null>(null);
  const [beforeUrl, setBeforeUrl] = useState<string>("");
  const [afterUrl, setAfterUrl] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("jobs")
        .select("id,source_filename,output_path,input_path,duration_seconds,created_at")
        .eq("status", "done")
        .order("completed_at", { ascending: false });
      setJobs(data ?? []);
    })();
  }, [user]);

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
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="h-10 w-10 text-foreground/70 transition-transform group-hover:scale-110" />
                </div>
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
