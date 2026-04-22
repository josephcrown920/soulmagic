import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Wand2, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/vibe")({
  component: () => (
    <RequireAuth>
      <Vibe />
    </RequireAuth>
  ),
});

type VibeResult = {
  preset_name: string;
  description: string;
  face_model: "gfpgan" | "codeformer";
  face_strength: number;
  saturation: number;
  contrast: number;
  warmth: number;
  sharpness: number;
  skin_smoothing: number;
  lut_recommendation: string;
  mood: string;
};

function Vibe() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<VibeResult | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResult(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [], "video/*": [] },
    multiple: false,
  });

  const analyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    try {
      // Convert to base64 (only first frame for video — best-effort: use as-is for images)
      const isImage = file.type.startsWith("image/");
      const dataUrl = isImage
        ? await fileToDataUrl(file)
        : await videoFirstFrameDataUrl(file);

      const { data, error } = await supabase.functions.invoke("vibe-match", {
        body: { imageBase64: dataUrl },
      });
      if (error) throw error;
      setResult(data as VibeResult);
      toast.success("Vibe matched");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const savePreset = async () => {
    if (!result || !user) return;
    const { error } = await supabase.from("presets").insert({
      user_id: user.id,
      name: result.preset_name,
      description: result.description,
      face_model: result.face_model,
      face_strength: result.face_strength,
      saturation: result.saturation,
      contrast: result.contrast,
      warmth: result.warmth,
      sharpness: result.sharpness,
      skin_smoothing: result.skin_smoothing,
    });
    if (error) return toast.error(error.message);
    toast.success("Preset saved");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vibe Matcher</h1>
        <p className="text-sm text-muted-foreground">
          Drop a reference clip or image. AI extracts mood, color, and grading suggestions.
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
          isDragActive ? "border-primary bg-primary/5" : "border-border bg-card/40 hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />
        <Wand2 className="mx-auto h-8 w-8 text-muted-foreground" />
        <div className="mt-3 text-sm">{file ? file.name : "Drop a reference image or video"}</div>
      </div>

      {previewUrl && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Reference</div>
            {file?.type.startsWith("image/") ? (
              <img src={previewUrl} alt="reference" className="w-full rounded-lg" />
            ) : (
              <video src={previewUrl} controls className="w-full rounded-lg bg-black" />
            )}
            <Button
              onClick={analyze}
              disabled={analyzing}
              className="mt-4 w-full bg-gradient-primary text-primary-foreground"
            >
              {analyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              Analyze vibe
            </Button>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Suggested preset</div>
            {result ? (
              <div className="space-y-3 text-sm">
                <div className="text-base font-semibold">{result.preset_name}</div>
                <div className="text-muted-foreground">{result.description}</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Stat k="Mood" v={result.mood} />
                  <Stat k="Face model" v={result.face_model} />
                  <Stat k="Strength" v={result.face_strength.toFixed(2)} />
                  <Stat k="Saturation" v={result.saturation.toFixed(2)} />
                  <Stat k="Contrast" v={result.contrast.toFixed(2)} />
                  <Stat k="Warmth" v={result.warmth.toFixed(2)} />
                  <Stat k="Sharpness" v={result.sharpness.toFixed(2)} />
                  <Stat k="Skin smoothing" v={result.skin_smoothing.toFixed(2)} />
                </div>
                <div className="rounded-md border border-border bg-background/30 p-3 text-xs">
                  <div className="text-muted-foreground">LUT recommendation</div>
                  <div>{result.lut_recommendation}</div>
                </div>
                <Button onClick={savePreset} className="w-full">
                  <Save className="mr-2 h-4 w-4" /> Save as preset
                </Button>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Click "Analyze vibe" to generate a preset draft.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md border border-border bg-background/30 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</div>
      <div className="font-medium">{v}</div>
    </div>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function videoFirstFrameDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.src = url;
    v.muted = true;
    v.playsInline = true;
    v.onloadeddata = () => {
      v.currentTime = Math.min(0.5, v.duration / 2 || 0.1);
    };
    v.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = v.videoWidth || 640;
      canvas.height = v.videoHeight || 360;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas error"));
      ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    v.onerror = () => reject(new Error("Video read error"));
  });
}
