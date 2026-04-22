import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
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
import { Slider } from "@/components/ui/slider";
import { Brain, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/train")({
  component: () => (
    <RequireAuth>
      <Train />
    </RequireAuth>
  ),
});

type Photo = { file: File; preview: string };

function Train() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"face" | "style">("face");
  const [trigger, setTrigger] = useState("TOK");
  const [steps, setSteps] = useState(1000);
  const [submitting, setSubmitting] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    const next = accepted.map((f) => ({ file: f, preview: URL.createObjectURL(f) }));
    setPhotos((p) => [...p, ...next].slice(0, 25));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 25,
  });

  const removePhoto = (i: number) => {
    setPhotos((p) => p.filter((_, idx) => idx !== i));
  };

  const startTraining = async () => {
    if (!user) return;
    if (!name.trim()) return toast.error("Give your LoRA a name");
    if (photos.length < 4) return toast.error("Upload at least 4 photos (10–20 is ideal)");

    setSubmitting(true);
    try {
      // 1. Create LoRA row
      const { data: lora, error } = await supabase
        .from("loras")
        .insert({
          user_id: user.id,
          name: name.trim(),
          kind,
          trigger_word: trigger.trim() || "TOK",
          training_steps: steps,
          status: "pending",
        })
        .select()
        .single();
      if (error) throw error;

      // 2. Upload all photos to lora-training bucket
      const paths: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        const ext = photos[i].file.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${lora.id}/${i}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("lora-training")
          .upload(path, photos[i].file, { upsert: true });
        if (upErr) throw upErr;
        paths.push(path);
      }

      await supabase.from("loras").update({ training_image_paths: paths }).eq("id", lora.id);

      // 3. Kick off training (fire and forget — runs ~20min on Replicate)
      supabase.functions.invoke("train-lora", { body: { loraId: lora.id } }).catch(() => {});

      toast.success("Training started! Check the LoRAs page for progress.");
      nav({ to: "/loras" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start training");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Train a LoRA</h1>
        <p className="text-sm text-muted-foreground">
          Upload 10–20 photos of your face, a style, or a subject. Training runs on GPU and takes ~20 minutes.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>LoRA name</Label>
            <Input placeholder="My Face v1" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Kind</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as "face" | "style")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="face">Face / person</SelectItem>
                <SelectItem value="style">Style / vibe</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Trigger word</Label>
            <Input value={trigger} onChange={(e) => setTrigger(e.target.value)} />
            <p className="mt-1 text-xs text-muted-foreground">
              Unique token used in prompts to invoke the LoRA. e.g. "TOK"
            </p>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Training steps</Label>
              <span className="text-xs text-muted-foreground">{steps}</span>
            </div>
            <Slider value={[steps]} min={500} max={2500} step={100} onValueChange={(v) => setSteps(v[0])} />
            <p className="mt-1 text-xs text-muted-foreground">More steps = better fit, longer training.</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
        <div>
          <Label className="text-sm">Training photos ({photos.length}/25)</Label>
          <p className="text-xs text-muted-foreground">
            Best results: clear, well-lit photos at multiple angles. Faces should fill ~60% of frame.
          </p>
        </div>

        <div
          {...getRootProps()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
            isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
          <p className="text-sm">Drop photos here, or click to choose</p>
        </div>

        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {photos.map((p, i) => (
              <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                <img src={p.preview} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute right-1 top-1 rounded-full bg-black/70 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button
        size="lg"
        className="w-full bg-gradient-primary text-primary-foreground"
        onClick={startTraining}
        disabled={submitting}
      >
        {submitting ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting…</>
        ) : (
          <><Brain className="mr-2 h-4 w-4" /> Start training (~20 min, ~$2 GPU)</>
        )}
      </Button>
    </div>
  );
}
