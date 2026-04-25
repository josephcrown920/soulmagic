import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { usePlan } from "@/lib/use-plan";
import { verifyCheckout, cancelSubscription } from "@/lib/billing.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useReducedMotionPref } from "@/hooks/use-reduced-motion-pref";

export const Route = createFileRoute("/settings")({
  validateSearch: (s: Record<string, unknown>) => ({
    billing: typeof s.billing === "string" ? (s.billing as string) : undefined,
    reference: typeof s.reference === "string" ? (s.reference as string) : undefined,
  }),
  component: () => (
    <RequireAuth>
      <Settings />
    </RequireAuth>
  ),
});

type Profile = {
  display_name: string | null;
  default_preset_id: string | null;
  output_format: string | null;
  output_resolution: string | null;
  notifications_enabled: boolean | null;
};

function Settings() {
  const { user } = useAuth();
  const search = useSearch({ from: "/settings" });
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
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Account, billing & defaults.</p>
      </div>

      <Tabs defaultValue={search.billing ? "billing" : "account"}>
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card">
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
                value={profile.output_format ?? "mp4"}
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
                value={profile.output_resolution ?? "1080p"}
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
              checked={profile.notifications_enabled ?? true}
              onCheckedChange={(v) => setProfile({ ...profile, notifications_enabled: v })}
            />
          </div>

          <Button onClick={save} className="bg-gradient-primary text-primary-foreground">Save</Button>
        </TabsContent>

        <TabsContent value="billing">
          <BillingTab billingParam={search.billing} reference={search.reference} />
        </TabsContent>

        <TabsContent value="advanced" className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card">
          <ReducedMotionRow />

          <div>
            <div className="text-sm font-semibold">Replicate API token</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Required for GPU video processing. Token is configured in your project secrets.
              Get one at <a className="text-primary underline" href="https://replicate.com/account/api-tokens" target="_blank" rel="noreferrer">replicate.com/account/api-tokens</a>.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BillingTab({ billingParam, reference }: { billingParam?: string; reference?: string }) {
  const { plan, subscription, usage, loading, reload } = usePlan();
  const [verifying, setVerifying] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const verify = useServerFn(verifyCheckout);
  const cancel = useServerFn(cancelSubscription);

  // Auto-verify on success redirect
  useEffect(() => {
    if (billingParam !== "success" || !reference) return;
    setVerifying(true);
    verify({ data: { reference } })
      .then(async (r: any) => {
        if (r?.ok) {
          toast.success(`Welcome to ${r.planSlug?.toUpperCase()}!`);
          await reload();
        } else {
          toast.error(r?.message ?? "Could not verify payment");
        }
      })
      .catch((e) => toast.error(e?.message ?? "Verification failed"))
      .finally(() => setVerifying(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billingParam, reference]);

  const onCancel = async () => {
    if (!confirm("Cancel renewal? You'll keep access until the end of the period.")) return;
    setCanceling(true);
    try {
      await cancel({ data: undefined });
      toast.success("Renewal canceled");
      await reload();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not cancel");
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading plan…
      </div>
    );
  }

  if (!plan) {
    return <div className="rounded-2xl border border-border bg-card p-6">No plan found.</div>;
  }

  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString()
    : null;

  return (
    <div className="space-y-4">
      {verifying && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm">
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Confirming payment…
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Current plan</div>
            <div className="mt-1 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{plan.name}</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {subscription?.status ?? "active"}
              {periodEnd && ` · renews ${periodEnd}`}
              {subscription?.cancel_at_period_end && " · cancels at period end"}
            </div>
          </div>
          {plan.slug !== "studio" && (
            <Link to="/pricing">
              <Button className="bg-gradient-primary text-primary-foreground shadow-elegant">
                Upgrade <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>

        <div className="mt-6 space-y-4">
          <UsageBar label="Video jobs" used={usage.jobs_processed} total={plan.monthly_jobs} />
          <UsageBar label="LoRA trainings" used={usage.loras_trained} total={plan.monthly_loras} />
          <UsageBar label="Image generations" used={usage.images_generated} total={plan.monthly_images} />
        </div>
      </div>

      {plan.slug !== "free" && !subscription?.cancel_at_period_end && (
        <div className="rounded-2xl border border-border bg-card/60 p-4">
          <div className="text-sm font-semibold">Cancel renewal</div>
          <div className="mt-1 text-xs text-muted-foreground">
            You'll keep access until {periodEnd ?? "the end of the billing period"}.
          </div>
          <Button
            onClick={onCancel}
            disabled={canceling}
            variant="outline"
            size="sm"
            className="mt-3"
          >
            {canceling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Cancel renewal
          </Button>
        </div>
      )}
    </div>
  );
}

function UsageBar({ label, used, total }: { label: string; used: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{used} / {total}</span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  );
}

function ReducedMotionRow() {
  const [reduced, setReduced] = useReducedMotionPref();
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-background/30 p-3">
      <div>
        <Label>Reduce motion</Label>
        <div className="text-xs text-muted-foreground">
          Disable scroll & entrance animations across the app. Saved on this device.
        </div>
      </div>
      <Switch
        checked={reduced}
        onCheckedChange={(v) => {
          setReduced(v);
          toast.success(v ? "Motion reduced" : "Motion enabled");
        }}
      />
    </div>
  );
}
