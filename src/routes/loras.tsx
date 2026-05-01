import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Brain, Plus, Trash2, Sparkles, Loader2, CheckCircle2, AlertCircle, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/loras")({
  component: () => (
    <RequireAuth>
      <Loras />
    </RequireAuth>
  ),
});

type LoRA = {
  id: string;
  name: string;
  kind: string;
  trigger_word: string | null;
  status: string;
  progress: number | null;
  error_message: string | null;
  replicate_training_id: string | null;
  quality: string | null;
  created_at: string;
};

const STALE_PENDING_MS = 30 * 60 * 1000;

function getLoRAState(lora: LoRA) {
  const createdAt = new Date(lora.created_at).getTime();
  const ageMs = Number.isNaN(createdAt) ? 0 : Date.now() - createdAt;
  const isStalePending = lora.status === "pending" && !lora.replicate_training_id && ageMs > STALE_PENDING_MS;

  if (isStalePending) {
    return {
      status: "failed",
      message: "This training never started on the backend. Delete it and retry.",
    };
  }

  return {
    status: lora.status,
    message: lora.error_message,
  };
}

function Loras() {
  const { user } = useAuth();
  const [items, setItems] = useState<LoRA[]>([]);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("loras")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load loras", error);
      return [] as LoRA[];
    }

    const rows = (data ?? []) as LoRA[];
    setItems(rows);
    return rows;
  }, []);

  const refreshActiveTrainings = useCallback(async () => {
    const rows = await load();
    const active = rows.filter((item) =>
      (item.status === "training" || item.status === "pending") && item.replicate_training_id,
    );

    if (active.length === 0) return;

    await Promise.allSettled(
      active.map((item) =>
        supabase.functions.invoke("sync-lora-status", {
          body: { loraId: item.id },
        }),
      ),
    );

    await load();
  }, [load]);

  useEffect(() => {
    if (!user) return;

    void refreshActiveTrainings();

    const channel = supabase
      .channel("loras-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "loras" }, () => {
        void load();
      })
      .subscribe();

    const interval = window.setInterval(() => {
      void refreshActiveTrainings();
    }, 15000);

    return () => {
      window.clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [load, refreshActiveTrainings, user]);

  const remove = async (id: string) => {
    if (!confirm("Delete this LoRA?")) return;
    await supabase.from("loras").delete().eq("id", id);
    toast.success("Deleted");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">LoRAs</h1>
          <p className="text-sm text-muted-foreground">Your trained personal models.</p>
        </div>
        <Link to="/train">
          <Button className="bg-gradient-primary text-primary-foreground">
            <Plus className="mr-1 h-4 w-4" /> Train new
          </Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <Brain className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="mb-4 text-sm text-muted-foreground">No LoRAs trained yet.</p>
          <Link to="/train">
            <Button className="bg-gradient-primary text-primary-foreground">Train your first LoRA</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((l) => <LoRACard key={l.id} lora={l} onDelete={() => remove(l.id)} />)}
        </div>
      )}
    </div>
  );
}

function LoRACard({ lora, onDelete }: { lora: LoRA; onDelete: () => void }) {
  const [syncing, setSyncing] = useState(false);
  const derived = getLoRAState(lora);
  const statusIcon = {
    pending: <Clock className="h-4 w-4 text-muted-foreground" />,
    training: <Loader2 className="h-4 w-4 animate-spin text-primary" />,
    ready: <CheckCircle2 className="h-4 w-4 text-success" />,
    failed: <AlertCircle className="h-4 w-4 text-destructive" />,
  }[derived.status] ?? null;

  const sync = async () => {
    setSyncing(true);
    try {
      const { error } = await supabase.functions.invoke("sync-lora-status", {
        body: { loraId: lora.id },
      });
      if (error) throw error;
      toast.success("Status refreshed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not sync");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold">{lora.name}</div>
          <div className="text-xs text-muted-foreground">
            {lora.kind} · trigger: <code className="text-foreground">{lora.trigger_word ?? "—"}</code>
          </div>
        </div>
        <div className="flex gap-1">
          {(derived.status === "training" || derived.status === "pending") && lora.replicate_training_id && (
            <Button size="icon" variant="ghost" onClick={sync} disabled={syncing} title="Refresh status">
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            </Button>
          )}
          <Button size="icon" variant="ghost" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs">
        {statusIcon}
        <span className="capitalize">{derived.status}</span>
        {derived.status === "training" && (
          <span className="text-muted-foreground">{Math.round(Number(lora.progress ?? 0))}%</span>
        )}
      </div>

      {derived.status === "training" && (
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-gradient-primary transition-all" style={{ width: `${lora.progress ?? 0}%` }} />
        </div>
      )}

      {derived.status === "failed" && derived.message && (
        <div className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">{derived.message}</div>
      )}

      {derived.status === "ready" && <GenerateDialog loraId={lora.id} />}
    </div>
  );
}

function GenerateDialog({ loraId }: { loraId: string }) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState("1:1");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const generate = async () => {
    if (!prompt.trim()) return;
    setBusy(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { loraId, prompt: prompt.trim(), aspectRatio: aspect },
      });
      if (error) throw error;
      const filePath = data?.image?.file_path;
      if (filePath) {
        const { data: signed } = await supabase.storage
          .from("generated-images")
          .createSignedUrl(filePath, 3600);
        if (signed?.signedUrl) setResult(signed.signedUrl);
      }
      toast.success("Image generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="w-full bg-gradient-primary text-primary-foreground">
          <Sparkles className="mr-1 h-4 w-4" /> Generate image
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Generate with LoRA</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Textarea
            placeholder="A cinematic portrait, golden hour, 35mm film, neon city background…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
          />
          <Select value={aspect} onValueChange={setAspect}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1:1">Square (1:1)</SelectItem>
              <SelectItem value="9:16">Portrait (9:16)</SelectItem>
              <SelectItem value="16:9">Landscape (16:9)</SelectItem>
              <SelectItem value="3:4">3:4</SelectItem>
              <SelectItem value="4:3">4:3</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={generate} disabled={busy} className="w-full bg-gradient-primary text-primary-foreground">
            {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…</> : "Generate"}
          </Button>
          {result && (
            <div className="overflow-hidden rounded-lg border border-border">
              <img src={result} alt="generated" className="w-full" />
              <a
                href={result}
                download
                className="block bg-card p-2 text-center text-xs hover:bg-muted"
              >
                Download
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

