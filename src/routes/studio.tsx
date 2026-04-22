import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Play, Loader2 } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/studio")({
  component: () => (
    <RequireAuth>
      <Studio />
    </RequireAuth>
  ),
});

type Preset = { id: string; name: string; is_default: boolean };
type Job = {
  id: string;
  source_filename: string;
  status: string;
  progress: number;
  created_at: string;
  thumbnail_path: string | null;
};

function Studio() {
  const { user } = useAuth();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetId, setPresetId] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [recent, setRecent] = useState<Job[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("presets")
        .select("id,name,is_default")
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      const list = data ?? [];
      setPresets(list);
      const def = list.find((p) => p.is_default) ?? list[0];
      if (def) setPresetId(def.id);
    })();
    loadRecent();
  }, [user]);

  const loadRecent = async () => {
    const { data } = await supabase
      .from("jobs")
      .select("id,source_filename,status,progress,created_at,thumbnail_path")
      .order("created_at", { ascending: false })
      .limit(8);
    setRecent(data ?? []);
  };

  const onDrop = useCallback((accepted: File[]) => {
    setFiles((prev) => [...prev, ...accepted]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "video/*": [".mp4", ".mov", ".webm", ".m4v", ".avi"] },
  });

  const removeFile = (i: number) =>
    setFiles((f) => f.filter((_, idx) => idx !== i));

  const processAll = async () => {
    if (!user || files.length === 0) return;
    if (!presetId && presets.length > 0) {
      toast.error("Pick a preset");
      return;
    }
    setUploading(true);
    try {
      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${user.id}/${Date.now()}-${safeName}`;
        const { error: upErr } = await supabase.storage
          .from("videos-input")
          .upload(path, file, { upsert: false });
        if (upErr) throw upErr;

        const { error: insErr } = await supabase.from("jobs").insert({
          user_id: user.id,
          preset_id: presetId || null,
          source_filename: file.name,
          input_path: path,
          status: "pending",
          progress: 0,
        });
        if (insErr) throw insErr;
      }
      toast.success(`Queued ${files.length} video${files.length > 1 ? "s" : ""}`);
      setFiles([]);
      loadRecent();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Studio</h1>
          <p className="text-sm text-muted-foreground">
            Drop clips. They run through your style.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Preset</span>
          <Select value={presetId} onValueChange={setPresetId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder={presets.length ? "Pick a preset" : "No presets yet"} />
            </SelectTrigger>
            <SelectContent>
              {presets.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} {p.is_default && "·  default"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div
        {...getRootProps()}
        className={`rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border bg-card/40 hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
        <div className="mt-4 text-base font-medium">
          {isDragActive ? "Drop them here" : "Drag & drop videos, or click to select"}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          MP4, MOV, WEBM — multiple files OK
        </div>
      </div>

      {files.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium">{files.length} file{files.length>1?"s":""} ready</div>
            <Button
              onClick={processAll}
              disabled={uploading}
              className="bg-gradient-primary text-primary-foreground shadow-elegant"
            >
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              Process all
            </Button>
          </div>
          <ul className="divide-y divide-border">
            {files.map((f, i) => (
              <li key={i} className="flex items-center justify-between py-2 text-sm">
                <span className="truncate">{f.name}</span>
                <button
                  onClick={() => removeFile(i)}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {presets.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-6 text-sm text-muted-foreground">
          You don't have any presets yet. Head to <a href="/presets" className="text-primary underline">Presets</a> to create your first style recipe.
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Recent jobs</h2>
          <a href="/queue" className="text-xs text-primary">View queue →</a>
        </div>
        {recent.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card/40 p-6 text-sm text-muted-foreground">
            No jobs yet.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((j) => (
              <div key={j.id} className="rounded-xl border border-border bg-card p-3 shadow-card">
                <div className="aspect-video w-full rounded-md bg-muted" />
                <div className="mt-2 truncate text-sm font-medium">{j.source_filename}</div>
                <div className="text-xs capitalize text-muted-foreground">{j.status}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
