import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Trash2, Upload, ImageIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/assets")({
  component: () => (
    <RequireAuth>
      <Assets />
    </RequireAuth>
  ),
});

type Asset = {
  id: string;
  name: string;
  kind: string;
  tags: string[] | null;
  file_path: string;
};

const KINDS = ["face", "outfit", "car", "scene", "actor", "other"] as const;

function Assets() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [name, setName] = useState("");
  const [kind, setKind] = useState<string>("face");
  const [tags, setTags] = useState("");
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  const load = async () => {
    const { data } = await supabase.from("assets").select("*").order("created_at", { ascending: false });
    const list = (data ?? []) as Asset[];
    setAssets(list);
    // generate signed URLs for thumbnails
    const map: Record<string, string> = {};
    await Promise.all(
      list.map(async (a) => {
        const { data: s } = await supabase.storage.from("assets").createSignedUrl(a.file_path, 3600);
        if (s?.signedUrl) map[a.id] = s.signedUrl;
      }),
    );
    setThumbs(map);
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const onDrop = useCallback(
    async (files: File[]) => {
      if (!user) return;
      for (const file of files) {
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${user.id}/${Date.now()}-${safe}`;
        const { error: e1 } = await supabase.storage.from("assets").upload(path, file);
        if (e1) {
          toast.error(e1.message);
          continue;
        }
        const { error: e2 } = await supabase.from("assets").insert({
          user_id: user.id,
          name: name || file.name,
          kind,
          tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
          file_path: path,
        });
        if (e2) toast.error(e2.message);
      }
      setName("");
      setTags("");
      load();
      toast.success("Uploaded");
    },
    [user, name, kind, tags],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
  });

  const remove = async (a: Asset) => {
    await supabase.storage.from("assets").remove([a.file_path]);
    await supabase.from("assets").delete().eq("id", a.id);
    load();
  };

  const visible = assets.filter((a) => filter === "all" || a.kind === filter);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Assets</h1>
        <p className="text-sm text-muted-foreground">
          Reference images for face, outfit, car, scene, and other actors.
        </p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-card md:grid-cols-[1fr_180px_1fr_auto]">
        <div>
          <Label>Name (optional)</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My face front" />
        </div>
        <div>
          <Label>Kind</Label>
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {KINDS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tags (comma)</Label>
          <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="hero, dark, b-roll" />
        </div>
      </div>

      <div
        {...getRootProps()}
        className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          isDragActive ? "border-primary bg-primary/5" : "border-border bg-card/40 hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
        <div className="mt-3 text-sm">Drop reference images here</div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-full px-3 py-1 text-xs ${filter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          all
        </button>
        {KINDS.map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`rounded-full px-3 py-1 text-xs ${filter === k ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            {k}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
          No assets yet.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((a) => (
            <div key={a.id} className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-card">
              <div className="aspect-square w-full overflow-hidden bg-muted">
                {thumbs[a.id] ? (
                  <img src={thumbs[a.id]} alt={a.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="truncate text-sm font-medium">{a.name}</div>
                <div className="text-xs text-muted-foreground">{a.kind}</div>
              </div>
              <button
                onClick={() => remove(a)}
                className="absolute right-2 top-2 rounded-md bg-background/80 p-1 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
