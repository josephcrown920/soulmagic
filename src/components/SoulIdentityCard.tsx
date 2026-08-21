import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Brain, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type SoulIdentity = {
  id: string;
  name: string;
  status: "pending" | "training" | "ready" | "failed";
  progress: number;
  trigger_phrase: string;
};

interface SoulIdentityCardProps {
  value: string;
  onChange: (soulId: string) => void;
  disabled?: boolean;
}

export function SoulIdentityCard({ value, onChange, disabled }: SoulIdentityCardProps) {
  const [souls, setSouls] = useState<SoulIdentity[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("souls")
      .select("id,name,status,progress,trigger_phrase")
      .order("created_at", { ascending: false });
    setSouls((data ?? []) as SoulIdentity[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!souls.some((s) => s.status === "training" || s.status === "pending")) return;
    const timer = window.setInterval(load, 5000);
    return () => window.clearInterval(timer);
  }, [souls]);

  const ready = souls.filter((s) => s.status === "ready");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Aurora Soul</Label>
        <Link to="/soul" className="text-xs text-primary hover:underline">Manage Souls</Link>
      </div>

      {loading ? (
        <div className="flex h-10 items-center justify-center rounded-lg border border-border"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
      ) : ready.length ? (
        <Select value={value} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder="Choose your identity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Soul — prompt only</SelectItem>
            {ready.map((soul) => (
              <SelectItem key={soul.id} value={soul.id}>
                <span className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-primary" />{soul.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2"><Brain className="h-4 w-4 text-primary" /></div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Create your artist identity</p>
              <p className="mt-1 text-xs text-muted-foreground">Upload 10–20 photos once and reuse your likeness across Aurora.</p>
              <Link to="/soul"><Button size="sm" className="mt-3"><Sparkles className="mr-1.5 h-3.5 w-3.5" />Create My Soul</Button></Link>
            </div>
          </div>
          {souls.some((s) => s.status === "training") && <p className="mt-3 text-xs text-muted-foreground">Your Soul is training. This panel will update automatically when it is ready.</p>}
        </div>
      )}
    </div>
  );
}
