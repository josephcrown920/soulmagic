import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Star, Copy, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/presets")({
  component: () => (
    <RequireAuth>
      <Presets />
    </RequireAuth>
  ),
});

type Preset = {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  face_model: string;
  face_strength: number;
  background_upscale: boolean;
  saturation: number;
  contrast: number;
  warmth: number;
  sharpness: number;
  skin_smoothing: number;
  outfit_prompt: string | null;
  scene_prompt: string | null;
  lora_id: string | null;
};

type LoRAOption = { id: string; name: string; status: string };

function Presets() {
  const { user } = useAuth();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loras, setLoras] = useState<LoRAOption[]>([]);
  const [editing, setEditing] = useState<Preset | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("presets")
      .select("*")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    setPresets((data ?? []) as Preset[]);
    const { data: l } = await supabase
      .from("loras")
      .select("id, name, status")
      .eq("status", "ready")
      .order("created_at", { ascending: false });
    setLoras((l ?? []) as LoRAOption[]);
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const create = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("presets")
      .insert({
        user_id: user.id,
        name: "New preset",
        face_model: "gfpgan",
        face_strength: 0.7,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setPresets((p) => [data as Preset, ...p]);
    setEditing(data as Preset);
  };

  const save = async () => {
    if (!editing) return;
    const { id, ...rest } = editing;
    const { error } = await supabase.from("presets").update(rest).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    load();
  };

  const setDefault = async (id: string) => {
    if (!user) return;
    await supabase.from("presets").update({ is_default: false }).eq("user_id", user.id);
    await supabase.from("presets").update({ is_default: true }).eq("id", id);
    toast.success("Default updated");
    load();
  };

  const duplicate = async (p: Preset) => {
    if (!user) return;
    const { id, ...rest } = p;
    void id;
    const { error } = await supabase
      .from("presets")
      .insert({ ...rest, user_id: user.id, is_default: false, name: rest.name + " copy" });
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("presets").delete().eq("id", id);
    if (editing?.id === id) setEditing(null);
    load();
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[280px_1fr]">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Presets</h1>
          <Button size="sm" onClick={create} className="bg-gradient-primary text-primary-foreground">
            <Plus className="mr-1 h-4 w-4" /> New
          </Button>
        </div>
        <div className="space-y-1">
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => setEditing(p)}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                editing?.id === p.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card/60 hover:bg-card"
              }`}
            >
              <span className="truncate">{p.name}</span>
              {p.is_default && <Star className="h-3.5 w-3.5 fill-primary text-primary" />}
            </button>
          ))}
          {presets.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
              No presets yet.
            </div>
          )}
        </div>
      </div>

      {editing ? (
        <Editor
          preset={editing}
          loras={loras}
          onChange={(p) => setEditing(p)}
          onSave={save}
          onSetDefault={() => setDefault(editing.id)}
          onDuplicate={() => duplicate(editing)}
          onDelete={() => remove(editing.id)}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
          Pick a preset on the left, or create a new one.
        </div>
      )}
    </div>
  );
}

function Editor({
  preset, onChange, onSave, onSetDefault, onDuplicate, onDelete,
}: {
  preset: Preset;
  onChange: (p: Preset) => void;
  onSave: () => void;
  onSetDefault: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const set = <K extends keyof Preset>(k: K, v: Preset[K]) =>
    onChange({ ...preset, [k]: v });

  return (
    <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Input
          className="max-w-sm text-lg font-semibold"
          value={preset.name}
          onChange={(e) => set("name", e.target.value)}
        />
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onSetDefault}>
            <Star className="mr-1 h-4 w-4" /> {preset.is_default ? "Default" : "Set default"}
          </Button>
          <Button size="sm" variant="outline" onClick={onDuplicate}>
            <Copy className="mr-1 h-4 w-4" /> Duplicate
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={onSave} className="bg-gradient-primary text-primary-foreground">
            <Save className="mr-1 h-4 w-4" /> Save
          </Button>
        </div>
      </div>

      <Textarea
        placeholder="Description…"
        value={preset.description ?? ""}
        onChange={(e) => set("description", e.target.value)}
      />

      <Section title="Face enhancement">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Model</Label>
            <Select value={preset.face_model} onValueChange={(v) => set("face_model", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="gfpgan">GFPGAN</SelectItem>
                <SelectItem value="codeformer">CodeFormer</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label>Background upscale</Label>
            <Switch
              checked={preset.background_upscale}
              onCheckedChange={(v) => set("background_upscale", v)}
            />
          </div>
        </div>
        <SliderRow label="Strength" value={preset.face_strength} min={0} max={1} step={0.05} onChange={(v) => set("face_strength", v)} />
        <SliderRow label="Skin smoothing" value={preset.skin_smoothing} min={0} max={1} step={0.05} onChange={(v) => set("skin_smoothing", v)} />
      </Section>

      <Section title="Color & grade">
        <SliderRow label="Saturation" value={preset.saturation} min={-1} max={1} step={0.05} onChange={(v) => set("saturation", v)} />
        <SliderRow label="Contrast" value={preset.contrast} min={-1} max={1} step={0.05} onChange={(v) => set("contrast", v)} />
        <SliderRow label="Warmth" value={preset.warmth} min={-1} max={1} step={0.05} onChange={(v) => set("warmth", v)} />
        <SliderRow label="Sharpness" value={preset.sharpness} min={0} max={1} step={0.05} onChange={(v) => set("sharpness", v)} />
      </Section>

      <Section title="Scene & identity (optional)">
        <div className="space-y-3">
          <div>
            <Label>Outfit prompt</Label>
            <Input
              placeholder="black leather jacket, white tee"
              value={preset.outfit_prompt ?? ""}
              onChange={(e) => set("outfit_prompt", e.target.value)}
            />
          </div>
          <div>
            <Label>Scene prompt</Label>
            <Input
              placeholder="rooftop at golden hour, neon city below"
              value={preset.scene_prompt ?? ""}
              onChange={(e) => set("scene_prompt", e.target.value)}
            />
          </div>
          <div className="text-xs text-muted-foreground">
            Reference assets (face, car, actor) can be linked from the Assets page.
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-background/30 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

function SliderRow({
  label, value, min, max, step, onChange,
}: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-xs text-muted-foreground">{Number(value).toFixed(2)}</span>
      </div>
      <Slider value={[Number(value)]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}
