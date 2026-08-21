import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, CheckCircle2, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/soul")({
  component: () => (
    <RequireAuth>
      <SoulPage />
    </RequireAuth>
  ),
});

type Photo = { file: File; preview: string };
type Soul = { id: string; name: string; status: string; progress: number; error_message: string | null; created_at: string };

function SoulPage() {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [name, setName] = useState("My Aurora Soul");
  const [busy, setBusy] = useState(false);
  const [souls, setSouls] = useState<Soul[]>([]);

  const loadSouls = async () => {
    const { data } = await supabase.from("souls").select("id,name,status,progress,error_message,created_at").order("created_at", { ascending: false });
    if (data) setSouls(data as Soul[]);
  };

  useEffect(() => { loadSouls(); }, []);

  useEffect(() => {
    if (!souls.some((s) => s.status === "training")) return;
    const timer = window.setInterval(loadSouls, 5000);
    return () => window.clearInterval(timer);
  }, [souls]);

  const onDrop = (files: File[]) => {
    const next = files.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setPhotos((current) => [...current, ...next].slice(0, 20));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 20,
  });

  const canTrain = useMemo(() => photos.length >= 10 && photos.length <= 20 && name.trim().length > 0, [photos.length, name]);

  const createSoul = async () => {
    if (!user || !canTrain) return;
    setBusy(true);
    let soulId: string | null = null;
    const paths: string[] = [];
    try {
      const { data: soul, error } = await supabase.from("souls").insert({
        user_id: user.id,
        name: name.trim(),
        status: "pending",
        provider: "fal",
        trainer_model: "fal-ai/flux-lora-portrait-trainer",
        trigger_phrase: "aurorasoul",
      }).select().single();
      if (error || !soul) throw error ?? new Error("Could not create Soul");
      soulId = soul.id;

      for (let i = 0; i < photos.length; i++) {
        const ext = photos[i].file.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${soul.id}/${i}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("soul-training").upload(path, photos[i].file, { upsert: true });
        if (uploadError) throw uploadError;
        paths.push(path);
      }

      const { error: updateError } = await supabase.from("souls").update({ training_image_paths: paths }).eq("id", soul.id);
      if (updateError) throw updateError;

      const { data, error: invokeError } = await supabase.functions.invoke("train-soul", { body: { soulId: soul.id } });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);

      toast.success("Your Soul is training. You can leave this page.");
      setPhotos([]);
      await loadSouls();
    } catch (error) {
      if (paths.length) await supabase.storage.from("soul-training").remove(paths).catch(() => {});
      if (soulId) await supabase.from("souls").delete().eq("id", soulId).catch(() => {});
      toast.error(error instanceof Error ? error.message : "Could not start Soul training");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <div className="flex items-center gap-2 text-primary"><Brain className="h-5 w-5" /><span className="text-sm font-semibold">AURORA SOUL</span></div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Create your persistent artist identity</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Upload 10–20 clear photos once. Aurora trains your identity so you can reuse the same artist across images, scenes, and future video workflows.</p>
      </div>

      <section className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card">
        <div>
          <Label>Soul name</Label>
          <Input className="mt-2" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Artist Soul" />
        </div>

        <div {...getRootProps()} className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
          <input {...getInputProps()} />
          <Upload className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">Drop 10–20 artist photos here</p>
          <p className="mt-1 text-xs text-muted-foreground">Use different angles, expressions, lighting and distances. Avoid blurry or heavily filtered photos.</p>
        </div>

        {photos.length > 0 && <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {photos.map((photo, index) => <div key={index} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
            <img src={photo.preview} alt="" className="h-full w-full object-cover" />
            <button type="button" onClick={() => setPhotos((p) => p.filter((_, i) => i !== index))} className="absolute right-1 top-1 rounded-full bg-black/70 p-1 opacity-0 group-hover:opacity-100"><X className="h-3 w-3 text-white" /></button>
          </div>)}
        </div>}

        <div className="flex items-center justify-between text-xs text-muted-foreground"><span>{photos.length}/20 photos</span><span>{photos.length < 10 ? `${10 - photos.length} more needed` : "Ready to train"}</span></div>
        <Button className="w-full bg-gradient-primary text-primary-foreground" size="lg" disabled={!canTrain || busy} onClick={createSoul}>
          {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating your Soul…</> : <><Brain className="mr-2 h-4 w-4" />Create My Soul</>}
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Your Souls</h2>
        {souls.length === 0 ? <p className="text-sm text-muted-foreground">No Souls yet.</p> : souls.map((soul) => <div key={soul.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-4"><div><p className="font-medium">{soul.name}</p><p className="text-xs capitalize text-muted-foreground">{soul.status}</p></div>{soul.status === "ready" ? <CheckCircle2 className="h-5 w-5 text-primary" /> : soul.status === "training" ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : null}</div>
          {(soul.status === "training" || soul.status === "pending") && <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${soul.progress}%` }} /></div>}
          {soul.error_message && <p className="mt-2 text-xs text-destructive">{soul.error_message}</p>}
        </div>)}
      </section>
    </div>
  );
}
