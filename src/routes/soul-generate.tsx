import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/soul-generate")({ component: () => <RequireAuth><SoulGenerate /></RequireAuth> });

type Soul = { id: string; name: string; status: string; progress: number };

function SoulGenerate() {
  const { user } = useAuth();
  const [souls, setSouls] = useState<Soul[]>([]);
  const [soulId, setSoulId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState("square_hd");
  const [busy, setBusy] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("souls").select("id,name,status,progress").eq("status", "ready").order("created_at", { ascending: false });
      const ready = (data ?? []) as Soul[];
      setSouls(ready);
      if (!soulId && ready[0]) setSoulId(ready[0].id);
    };
    load();
  }, [user]);

  const generate = async () => {
    if (!soulId) return toast.error("Create a ready Soul first");
    if (!prompt.trim()) return toast.error("Describe the image you want");
    setBusy(true); setImages([]);
    try {
      const { data, error } = await supabase.functions.invoke("soul-generate", { body: { soulId, prompt, image_size: aspect, num_images: 1 } });
      if (error) throw error;
      const urls = (data?.result?.images ?? []).map((x: { url?: string }) => x.url).filter(Boolean);
      if (!urls.length) throw new Error("No image was returned");
      setImages(urls);
      toast.success("Soul image generated");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Generation failed"); }
    finally { setBusy(false); }
  };

  return <div className="mx-auto max-w-5xl space-y-6">
    <div><div className="flex items-center gap-2 text-primary"><Brain className="h-5 w-5" /><span className="text-sm font-semibold">AURORA SOUL</span></div><h1 className="mt-2 text-3xl font-bold">Generate with your Soul</h1><p className="mt-2 text-sm text-muted-foreground">Your trained identity stays consistent while Aurora changes the scene, outfit, lighting and camera direction.</p></div>
    {souls.length === 0 ? <div className="rounded-2xl border border-dashed border-border p-10 text-center"><Brain className="mx-auto mb-3 h-10 w-10 text-muted-foreground" /><p className="font-medium">No ready Souls yet</p><p className="mt-1 text-sm text-muted-foreground">Train your identity first, then return here to generate.</p></div> : <>
      <div className="grid gap-5 rounded-2xl border border-border bg-card p-5 shadow-card md:grid-cols-2">
        <div className="space-y-4"><div><Label>Soul</Label><Select value={soulId} onValueChange={setSoulId}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{souls.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Scene prompt</Label><Textarea className="mt-1" rows={7} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Cinematic music video still, walking through Lagos at night, black leather outfit, neon reflections, dramatic rim light, 35mm anamorphic lens…" /></div>
          <div><Label>Aspect</Label><Select value={aspect} onValueChange={setAspect}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="square_hd">1:1</SelectItem><SelectItem value="portrait_4_3">4:3</SelectItem><SelectItem value="portrait_16_9">9:16</SelectItem><SelectItem value="landscape_16_9">16:9</SelectItem></SelectContent></Select></div>
          <Button size="lg" className="w-full bg-gradient-primary text-primary-foreground" onClick={generate} disabled={busy}>{busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</> : <><Sparkles className="mr-2 h-4 w-4" />Generate with My Soul</>}</Button>
        </div>
        <div className="min-h-[420px] rounded-xl bg-muted/30 p-3">{images.length ? <div className="grid gap-3">{images.map(url => <img key={url} src={url} alt="Soul generation" className="w-full rounded-lg object-cover" />)}</div> : <div className="flex h-full min-h-[390px] items-center justify-center text-center text-sm text-muted-foreground">Your generated Soul image will appear here.</div>}</div>
      </div>
    </>}
  </div>;
}
