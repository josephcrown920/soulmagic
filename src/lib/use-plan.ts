import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type Plan = {
  slug: string;
  name: string;
  description: string | null;
  price_usd_cents: number;
  price_ngn_kobo: number;
  monthly_jobs: number;
  monthly_loras: number;
  monthly_images: number;
  watermark: boolean;
  priority_queue: boolean;
  features: string[];
  sort_order: number;
};

export type Subscription = {
  plan_slug: string;
  status: string;
  currency: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export type Usage = {
  jobs_processed: number;
  loras_trained: number;
  images_generated: number;
  period_start: string;
};

export type PlanState = {
  loading: boolean;
  plan: Plan | null;
  subscription: Subscription | null;
  usage: Usage;
  reload: () => Promise<void>;
  isAtLimit: (kind: "jobs" | "loras" | "images") => boolean;
  remaining: (kind: "jobs" | "loras" | "images") => number;
};

const EMPTY_USAGE: Usage = {
  jobs_processed: 0,
  loras_trained: 0,
  images_generated: 0,
  period_start: new Date().toISOString(),
};

export function usePlan(): PlanState {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage>(EMPTY_USAGE);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [{ data: sub }, { data: counter }] = await Promise.all([
        supabase
          .from("user_subscriptions")
          .select("plan_slug,status,currency,current_period_end,cancel_at_period_end")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("usage_counters")
          .select("jobs_processed,loras_trained,images_generated,period_start")
          .eq("user_id", user.id)
          .order("period_start", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const planSlug = sub?.plan_slug ?? "free";
      const { data: planRow } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("slug", planSlug)
        .maybeSingle();

      setSubscription(sub as Subscription | null);
      setPlan(planRow as Plan | null);
      setUsage((counter as Usage | null) ?? EMPTY_USAGE);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const isAtLimit = (kind: "jobs" | "loras" | "images") => {
    if (!plan) return false;
    if (kind === "jobs") return usage.jobs_processed >= plan.monthly_jobs;
    if (kind === "loras") return usage.loras_trained >= plan.monthly_loras;
    return usage.images_generated >= plan.monthly_images;
  };

  const remaining = (kind: "jobs" | "loras" | "images") => {
    if (!plan) return 0;
    if (kind === "jobs") return Math.max(0, plan.monthly_jobs - usage.jobs_processed);
    if (kind === "loras") return Math.max(0, plan.monthly_loras - usage.loras_trained);
    return Math.max(0, plan.monthly_images - usage.images_generated);
  };

  return { loading, plan, subscription, usage, reload: load, isAtLimit, remaining };
}
