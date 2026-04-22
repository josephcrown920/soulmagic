import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  component: () => (
    <RequireAuth>
      <Settings />
    </RequireAuth>
  ),
});

type Profile = {
  display_name: string | null;
  default_preset_id: string | null;
  output_format: string;
  output_resolution: string;
  notifications_enabled: boolean;
};

function Settings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [presets, setPresets] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name,default_preset_id,output_format,output_resolution,notifications_enabled")
        .eq("user_id", user.id)
        .maybeSingle();
      setProfile(
        data ?? {
          display_name: "",
          default_preset_id: null,
          output_format: "mp4",
          output_resolution: "1080p",
          notifications_enabled: true,
        },
      );
      const { data: ps } = await supabase.from("presets").select("id,name").order("name");
      setPresets(ps ?? []);
    })();
  }, [user]);

  const save = async () => {
    if (!user || !profile) return;
    const { error } = await supabase
      .from("profiles")
      .update(profile)
      .eq("user_id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Settings saved");
  };

  if (!profile) {
    return <div className="text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Account & defaults.</p>
      </div>

      <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card">
        <div>
          <Label>Display name</Label>
          <Input
            value={profile.display_name ?? ""}
            onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
          />
        </div>

        <div>
          <Label>Default preset</Label>
          <Select
            value={profile.default_preset_id ?? "none"}
            onValueChange={(v) => setProfile({ ...profile, default_preset_id: v === "none" ? null : v })}
          >
            <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {presets.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Output format</Label>
            <Select
              value={profile.output_format}
              onValueChange={(v) => setProfile({ ...profile, output_format: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mp4">MP4</SelectItem>
                <SelectItem value="mov">MOV</SelectItem>
                <SelectItem value="webm">WEBM</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Output resolution</Label>
            <Select
              value={profile.output_resolution}
              onValueChange={(v) => setProfile({ ...profile, output_resolution: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="720p">720p</SelectItem>
                <SelectItem value="1080p">1080p</SelectItem>
                <SelectItem value="4k">4K</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-background/30 p-3">
          <div>
            <Label>Notifications</Label>
            <div className="text-xs text-muted-foreground">Toast + sound on job completion</div>
          </div>
          <Switch
            checked={profile.notifications_enabled}
            onCheckedChange={(v) => setProfile({ ...profile, notifications_enabled: v })}
          />
        </div>

        <Button onClick={save} className="bg-gradient-primary text-primary-foreground">Save</Button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="text-sm font-semibold">Replicate API token</div>
        <p className="mt-1 text-xs text-muted-foreground">
          Required for GPU video processing. Add it once and Style Engine uses it for every job.
          Get a token at <a className="text-primary underline" href="https://replicate.com/account/api-tokens" target="_blank" rel="noreferrer">replicate.com/account/api-tokens</a>.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Token is configured in your project secrets — ask Lovable to set it up if you haven't yet.
        </p>
      </div>
    </div>
  );
}
