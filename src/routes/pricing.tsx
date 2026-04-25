import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { createCheckout } from "@/lib/billing.functions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Reveal, RevealStagger, RevealItem } from "@/components/motion/Reveal";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Soul" },
      { name: "description", content: "Simple plans for solo creators and studios. Start free, upgrade when you ship." },
      { property: "og:title", content: "Pricing — Soul" },
      { property: "og:description", content: "Free, Pro, and Studio plans. Pay in USD or NGN." },
    ],
  }),
  component: Pricing,
});

type PlanRow = {
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

function detectCurrency(): "USD" | "NGN" {
  if (typeof window === "undefined") return "USD";
  // Lightweight heuristic: timezone or language
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    if (tz.includes("Lagos") || tz.includes("Africa/Lagos")) return "NGN";
    const lang = navigator.language ?? "";
    if (lang.toLowerCase().includes("ng")) return "NGN";
  } catch {
    // ignore
  }
  return "USD";
}

function formatPrice(plan: PlanRow, currency: "USD" | "NGN") {
  if (currency === "USD") {
    return `$${(plan.price_usd_cents / 100).toFixed(0)}`;
  }
  return `₦${(plan.price_ngn_kobo / 100).toLocaleString()}`;
}

function Pricing() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [currency, setCurrency] = useState<"USD" | "NGN">(detectCurrency());
  const [busy, setBusy] = useState<string | null>(null);
  const checkoutFn = useServerFn(createCheckout);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      setPlans((data ?? []) as PlanRow[]);
    })();
  }, []);

  const sorted = useMemo(() => plans, [plans]);

  const startCheckout = async (planSlug: string) => {
    if (!user) {
      nav({ to: "/auth" });
      return;
    }
    if (planSlug === "free") {
      nav({ to: "/studio" });
      return;
    }
    setBusy(planSlug);
    try {
      const result = await checkoutFn({
        data: { planSlug: planSlug as "pro" | "studio", currency },
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      window.location.href = result.authorizationUrl;
    } catch (e: any) {
      toast.error(e?.message ?? "Could not start checkout");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/40 bg-background/70 px-5 py-3 backdrop-blur md:px-12">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary shadow-elegant" />
          <span className="font-semibold tracking-tight">Soul</span>
        </Link>
        <Link to="/auth"><Button size="sm" variant="ghost">Sign in</Button></Link>
      </header>

      <Reveal as="section" className="mx-auto max-w-5xl px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3" /> Simple, monthly. Cancel anytime.
        </div>
        <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl">Pricing</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Start free. Upgrade when your output ships at scale.
        </p>

        <div className="mt-6 inline-flex rounded-full border border-border bg-card/40 p-1">
          {(["USD", "NGN"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                currency === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {c === "USD" ? "USD ($)" : "NGN (₦)"}
            </button>
          ))}
        </div>
      </Reveal>

      <RevealStagger className="mx-auto grid max-w-6xl gap-5 px-6 pb-24 md:grid-cols-3" stagger={0.12}>
        {sorted.map((plan) => {
          const popular = plan.slug === "pro";
          const price = formatPrice(plan, currency);
          return (
            <RevealItem
              key={plan.slug}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-6 shadow-card",
                popular ? "border-primary/50 ring-1 ring-primary/30" : "border-border"
              )}
            >
              {popular && (
                <div className="absolute -top-3 right-6 rounded-full bg-gradient-primary px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                  Most popular
                </div>
              )}
              <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {plan.name}
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">{price}</span>
                {plan.slug !== "free" && <span className="text-sm text-muted-foreground">/month</span>}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>

              <ul className="mt-5 flex-1 space-y-2 text-sm">
                {(plan.features ?? []).map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => startCheckout(plan.slug)}
                disabled={busy === plan.slug}
                className={cn(
                  "mt-6 w-full",
                  popular || plan.slug === "studio"
                    ? "bg-gradient-primary text-primary-foreground shadow-elegant"
                    : ""
                )}
                variant={popular || plan.slug === "studio" ? "default" : "outline"}
              >
                {busy === plan.slug ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirecting…</>
                ) : plan.slug === "free" ? "Get started" : `Upgrade to ${plan.name}`}
              </Button>
            </RevealItem>
          );
        })}
      </RevealStagger>

      <section className="mx-auto max-w-3xl px-6 pb-24">
        <h2 className="text-xl font-semibold">FAQ</h2>
        <div className="mt-4 space-y-3 text-sm">
          {[
            { q: "Can I cancel anytime?", a: "Yes. Cancel from Settings → Billing. You'll keep access until the end of the period." },
            { q: "What happens if I exceed my plan?", a: "We show an upgrade prompt. Existing jobs in queue still complete." },
            { q: "Do you offer refunds?", a: "We offer pro-rated refunds within 7 days for unused capacity. Email us." },
            { q: "Why both USD and NGN?", a: "Paystack lets us bill locally in Nigeria and globally in USD. Pick whichever is cheaper for you." },
          ].map((f, i) => (
            <details key={i} className="rounded-xl border border-border bg-card/60 p-4">
              <summary className="cursor-pointer font-medium">{f.q}</summary>
              <p className="mt-2 text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
