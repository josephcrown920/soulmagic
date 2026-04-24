import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { UpgradeBanner } from "@/components/UpgradeBanner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Sparkles, Loader2, Brain, Download, RefreshCw, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Reveal, RevealStagger, RevealItem } from "@/components/motion/Reveal";

export const Route = createFileRoute("/generate")({
  head: () => ({
    meta: [
      { title: "Generate — Style Engine" },
      { name: "description", content: "Generate consistent on-brand images from your trained LoRA using prompt templates." },
      { property: "og:title", content: "Generate — Style Engine" },
      { property: "og:description", content: "Generate consistent on-brand images from your trained LoRA using prompt templates." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Generate />
    </RequireAuth>
  ),
});

type LoRA = {
  id: string;
  name: string;
  trigger_word: string | null;
  status: string;
  kind: string;
};

type GenImage = {
  id: string;
  file_path: string;
  prompt: string;
  created_at: string;
  lora_id: string | null;
};

type Template = {
  id: string;
  label: string;
  emoji: string;
  aspect: string;
  /** Use {trigger} placeholder; replaced at submit time. */
  prompt: string;
};

const TEMPLATES: Template[] = [
  {
    id: "linkedin",
    label: "LinkedIn headshot",
    emoji: "💼",
    aspect: "1:1",
    prompt:
      "A polished professional headshot of {trigger}, sharp focus, soft studio lighting, neutral grey background, confident relaxed smile, business casual blazer, shot on 85mm portrait lens, magazine quality",
  },
  {
    id: "podcast",
    label: "Podcast cover",
    emoji: "🎙️",
    aspect: "1:1",
    prompt:
      "A bold podcast cover portrait of {trigger}, dramatic side lighting, deep navy background, looking directly at camera, cinematic mood, editorial photography, 35mm film grain",
  },
  {
    id: "lifestyle",
    label: "IG lifestyle",
    emoji: "📸",
    aspect: "4:5",
    prompt:
      "A candid lifestyle photo of {trigger} in a sun-drenched modern cafe, golden hour window light, warm tones, shallow depth of field, shot on Sony A7 IV, natural and unposed",
  },
  {
    id: "ceo",
    label: "CEO / founder",
    emoji: "🏙️",
    aspect: "3:4",
    prompt:
      "A confident editorial portrait of {trigger} in a minimalist modern office, large floor-to-ceiling windows, soft natural light, tailored dark outfit, arms crossed, looking off-camera, Forbes magazine style",
  },
  {
    id: "street",
    label: "Tokyo street",
    emoji: "🌃",
    aspect: "9:16",
    prompt:
      "A cinematic street portrait of {trigger} on a Tokyo backstreet at night, neon reflections in puddles, moody atmosphere, light rain, shot on 35mm anamorphic, Wong Kar-wai inspired",
  },
  {
    id: "outdoor",
    label: "Golden hour",
    emoji: "🌅",
    aspect: "3:2",
    prompt:
      "A cinematic portrait of {trigger} outdoors at golden hour, warm rim light, soft bokeh of distant trees, natural smile, shot on Canon R5 with 85mm f/1.2, film-like color grade",
  },
  {
    id: "youtube",
    label: "YouTube thumbnail",
    emoji: "▶️",
    aspect: "16:9",
    prompt:
      "A vibrant YouTube thumbnail style shot of {trigger}, expressive surprised face, bright punchy lighting, high contrast, bold colorful background, sharp eyes, ultra-detailed",
  },
  {
    id: "bw",
    label: "B&W editorial",
    emoji: "🖤",
    aspect: "4:5",
    prompt:
      "A high-contrast black and white editorial portrait of {trigger}, dramatic chiaroscuro lighting, deep shadows, looking thoughtfully off camera, Peter Lindbergh style, fine art photography",
  },
  {
    id: "custom",
    label: "Custom prompt",
    emoji: "✨",
    aspect: "1:1",
    prompt: "",
  },
];

function Generate() {
  const { user } = useAuth();
  const [loras, setLoras] = useState<LoRA[]>([]);
  const [loraId, setLoraId] = useState<string>("");
  const [templateId, setTemplateId] = useState<string>("linkedin");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [aspect, setAspect] = useState<string>("1:1");
  const [count, setCount] = useState<number>(2);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ url: string; id: string; prompt: string }[]>([]);
  const [recent, setRecent] = useState<GenImage[]>([]);
  const [recentUrls, setRecentUrls] = useState<Record<string, string>>({});

  const lora = loras.find((l) => l.id === loraId);
  const template = TEMPLATES.find((t) => t.id === templateId)!;

  // Load LoRAs + recent images
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: ls } = await supabase
        .from("loras")
        .select("id, name, trigger_word, status, kind")
        .eq("status", "ready")
        .order("created_at", { ascending: false });
      const ready = (ls ?? []) as LoRA[];
      setLoras(ready);
      if (ready.length && !loraId) setLoraId(ready[0].id);
    })();
    loadRecent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadRecent = async () => {
    const { data } = await supabase
      .from("generated_images")
      .select("id, file_path, prompt, created_at, lora_id")
      .order("created_at", { ascending: false })
      .limit(12);
    const list = (data ?? []) as GenImage[];
    setRecent(list);
    // sign URLs
    const next: Record<string, string> = {};
    await Promise.all(
      list.map(async (g) => {
        const { data: s } = await supabase.storage
          .from("generated-images")
          .createSignedUrl(g.file_path, 3600);
        if (s?.signedUrl) next[g.id] = s.signedUrl;
      }),
    );
    setRecentUrls(next);
  };

  // Sync aspect when template changes
  useEffect(() => {
    if (template && template.id !== "custom") setAspect(template.aspect);
  }, [templateId]); // eslint-disable-line react-hooks/exhaustive-deps

  const finalPrompt = useMemo(() => {
    const trigger = lora?.trigger_word?.trim() || "TOK";
    if (template.id === "custom") {
      return customPrompt.includes(trigger)
        ? customPrompt
        : customPrompt
          ? `${trigger}, ${customPrompt}`
          : "";
    }
    return template.prompt.replaceAll("{trigger}", trigger);
  }, [template, customPrompt, lora]);

  const generate = async () => {
    if (!loraId) return toast.error("Pick a LoRA first");
    if (!finalPrompt.trim()) return toast.error("Write a prompt");
    setBusy(true);
    setResults([]);
    try {
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: {
          loraId,
          prompt: finalPrompt,
          aspectRatio: aspect,
          numOutputs: count,
        },
      });
      if (error) throw error;
      const imgs = (data?.images ?? []) as { id: string; file_path: string; prompt: string }[];
      const signed = await Promise.all(
        imgs.map(async (im) => {
          const { data: s } = await supabase.storage
            .from("generated-images")
            .createSignedUrl(im.file_path, 3600);
          return { id: im.id, url: s?.signedUrl ?? "", prompt: im.prompt };
        }),
      );
      setResults(signed.filter((s) => s.url));
      toast.success(`${imgs.length} image${imgs.length > 1 ? "s" : ""} generated`);
      loadRecent();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setBusy(false);
    }
  };

  const rePrompt = (prompt: string) => {
    setTemplateId("custom");
    setCustomPrompt(prompt);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <UpgradeBanner kind="images" />

      <Reveal>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Generate</h1>
            <p className="text-sm text-muted-foreground">
              Pick a LoRA, choose a template, and create on-brand images in seconds.
            </p>
          </div>
          <Link to="/library">
            <Button variant="outline" size="sm">
              <ImageIcon className="mr-1 h-4 w-4" /> Library
            </Button>
          </Link>
        </div>
      </Reveal>

      {loras.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <Brain className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="mb-1 text-sm font-medium">No ready LoRAs yet</p>
          <p className="mb-4 text-xs text-muted-foreground">
            Train a LoRA first — it takes ~20 minutes. Come back here to generate.
          </p>
          <Link to="/train">
            <Button className="bg-gradient-primary text-primary-foreground">
              <Brain className="mr-1 h-4 w-4" /> Train a LoRA
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Controls */}
          <Reveal delay={0.05}>
          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <div className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-card">
              <div>
                <Label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
                  LoRA
                </Label>
                <Select value={loraId} onValueChange={setLoraId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a LoRA" />
                  </SelectTrigger>
                  <SelectContent>
                    {loras.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}{" "}
                        <span className="text-muted-foreground">
                          · {l.trigger_word || "TOK"}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">
                  Template
                </Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTemplateId(t.id)}
                      className={cn(
                        "rounded-xl border p-3 text-left text-xs transition-all",
                        templateId === t.id
                          ? "border-primary bg-primary/5 shadow-elegant"
                          : "border-border hover:border-primary/40 hover:bg-muted/40",
                      )}
                    >
                      <div className="mb-1 text-base">{t.emoji}</div>
                      <div className="font-medium">{t.label}</div>
                      <div className="text-[10px] text-muted-foreground">{t.aspect}</div>
                    </button>
                  ))}
                </div>
              </div>

              {template.id === "custom" && (
                <div>
                  <Label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
                    Custom prompt
                  </Label>
                  <Textarea
                    rows={4}
                    placeholder="A cinematic portrait at golden hour, 35mm film, warm tones…"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Trigger word{" "}
                    <code className="rounded bg-muted px-1 text-foreground">
                      {lora?.trigger_word || "TOK"}
                    </code>{" "}
                    is auto-prepended if missing.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
                    Aspect
                  </Label>
                  <Select value={aspect} onValueChange={setAspect}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1:1">Square 1:1</SelectItem>
                      <SelectItem value="4:5">Portrait 4:5</SelectItem>
                      <SelectItem value="9:16">Vertical 9:16</SelectItem>
                      <SelectItem value="3:4">3:4</SelectItem>
                      <SelectItem value="3:2">3:2</SelectItem>
                      <SelectItem value="16:9">Wide 16:9</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
                    Variations
                  </Label>
                  <Select value={String(count)} onValueChange={(v) => setCount(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                size="lg"
                disabled={busy || !finalPrompt.trim()}
                onClick={generate}
                className="w-full bg-gradient-primary text-primary-foreground"
              >
                {busy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating {count}…
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" /> Generate {count} image
                    {count > 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </div>

            {/* Preview / Results */}
            <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-card">
              <div>
                <Label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
                  Final prompt
                </Label>
                <div className="rounded-md bg-muted/50 p-3 text-xs text-foreground">
                  {finalPrompt || (
                    <span className="text-muted-foreground">
                      Pick a template or write a custom prompt…
                    </span>
                  )}
                </div>
              </div>

              <div
                className={cn(
                  "grid gap-3",
                  count === 1 ? "grid-cols-1" : count === 2 ? "grid-cols-2" : "grid-cols-2",
                )}
              >
                {busy &&
                  Array.from({ length: count }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square animate-pulse rounded-lg border border-border bg-muted/40"
                    />
                  ))}
                {!busy &&
                  results.map((r) => (
                    <div
                      key={r.id}
                      className="group relative overflow-hidden rounded-lg border border-border"
                    >
                      <img src={r.url} alt="" className="w-full" />
                      <a
                        href={r.url}
                        download
                        className="absolute right-2 top-2 rounded-md bg-black/70 p-1.5 opacity-0 transition-opacity group-hover:opacity-100"
                        title="Download"
                      >
                        <Download className="h-3.5 w-3.5 text-white" />
                      </a>
                    </div>
                  ))}
                {!busy && results.length === 0 && (
                  <div className="col-span-full flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                    Results will appear here
                  </div>
                )}
              </div>
            </div>
          </div>
          </Reveal>

          {/* Recent */}
          {recent.length > 0 && (
            <div className="space-y-3">
              <Reveal>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Recent generations
                  </h2>
                  <Link to="/library" className="text-xs text-primary hover:underline">
                    View all →
                  </Link>
                </div>
              </Reveal>
              <RevealStagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6" stagger={0.04}>
                {recent.map((g) => (
                  <RevealItem
                    key={g.id}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted/30"
                  >
                    {recentUrls[g.id] ? (
                      <img src={recentUrls[g.id]} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    <button
                      onClick={() => rePrompt(g.prompt)}
                      className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/70 py-1.5 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
                      title="Re-prompt"
                    >
                      <RefreshCw className="h-3 w-3" /> Re-prompt
                    </button>
                  </RevealItem>
                ))}
              </RevealStagger>
            </div>
          )}
        </>
      )}
    </div>
  );
}
