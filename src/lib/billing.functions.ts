import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getRequestHost } from "@tanstack/react-start/server";

const PAYSTACK_BASE = "https://api.paystack.co";

function paystackKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY not configured");
  return key;
}

/**
 * Create a Paystack checkout session for the chosen plan + currency.
 * Returns the Paystack hosted checkout URL the client should redirect to.
 */
export const createCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      planSlug: z.enum(["pro", "studio"]),
      currency: z.enum(["USD", "NGN"]),
    })
  )
  .handler(async ({ data, context }) => {
    const { userId, claims } = context;
    const email = (claims.email as string | undefined) ?? "user@example.com";

    // Look up plan + price
    const { data: plan, error: planErr } = await supabaseAdmin
      .from("subscription_plans")
      .select("*")
      .eq("slug", data.planSlug)
      .maybeSingle();

    if (planErr || !plan) {
      return { error: "Plan not found" } as const;
    }

    const amount = data.currency === "USD" ? plan.price_usd_cents : plan.price_ngn_kobo;
    if (!amount) {
      return { error: "Price not set for this currency" } as const;
    }

    const host = getRequestHost();
    const callbackUrl = `https://${host}/settings?billing=success`;
    const reference = `se_${userId.slice(0, 8)}_${Date.now()}`;

    const resp = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount,
        currency: data.currency,
        reference,
        callback_url: callbackUrl,
        metadata: {
          user_id: userId,
          plan_slug: data.planSlug,
          currency: data.currency,
        },
      }),
    });

    const body = await resp.json();
    if (!resp.ok || !body?.status) {
      console.error("Paystack init failed:", body);
      return { error: body?.message ?? "Failed to start checkout" } as const;
    }

    return {
      authorizationUrl: body.data.authorization_url as string,
      reference,
    } as const;
  });

/**
 * Verify a transaction reference after checkout redirect.
 * Updates the user's subscription on success. Webhook is the source of truth,
 * but this gives instant UI feedback.
 */
export const verifyCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ reference: z.string().min(4).max(128) }))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const resp = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(data.reference)}`, {
      headers: { Authorization: `Bearer ${paystackKey()}` },
    });
    const body = await resp.json();
    if (!resp.ok || !body?.status || body?.data?.status !== "success") {
      return { ok: false, message: body?.message ?? "Payment not confirmed" } as const;
    }

    const meta = body.data.metadata ?? {};
    const planSlug = meta.plan_slug as string | undefined;
    const currency = (meta.currency as string | undefined) ?? body.data.currency ?? "USD";
    if (!planSlug) return { ok: false, message: "Missing plan in metadata" } as const;
    if (meta.user_id && meta.user_id !== userId) {
      return { ok: false, message: "User mismatch" } as const;
    }

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await supabaseAdmin
      .from("user_subscriptions")
      .upsert(
        {
          user_id: userId,
          plan_slug: planSlug,
          status: "active",
          currency,
          paystack_customer_code: body.data.customer?.customer_code ?? null,
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
        },
        { onConflict: "user_id" }
      );

    return { ok: true, planSlug, currency } as const;
  });

/**
 * Cancel scheduled renewal — we just mark cancel_at_period_end. The webhook
 * (or a future cron) will downgrade when the period actually ends.
 */
export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await supabaseAdmin
      .from("user_subscriptions")
      .update({ cancel_at_period_end: true })
      .eq("user_id", context.userId);
    return { ok: true } as const;
  });
