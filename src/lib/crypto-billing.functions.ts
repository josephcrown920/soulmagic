import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * User submits a crypto payment claim (TX hash + plan + wallet they sent to).
 * Creates a `crypto_payments` row with status='pending_review' for admin to approve.
 */
export const submitCryptoPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      planSlug: z.enum(["pro", "studio"]),
      walletId: z.string().uuid(),
      txHash: z.string().min(10).max(200).regex(/^[a-zA-Z0-9]+$/),
      coin: z.string().min(2).max(20),
      network: z.string().min(2).max(40),
    })
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const { data: plan, error: planErr } = await supabaseAdmin
      .from("subscription_plans")
      .select("*")
      .eq("slug", data.planSlug)
      .maybeSingle();
    if (planErr || !plan) return { error: "Plan not found" } as const;

    const orderId = `cr_${userId.slice(0, 8)}_${Date.now()}`;

    const { error } = await supabaseAdmin.from("crypto_payments").insert({
      user_id: userId,
      plan_slug: data.planSlug,
      wallet_id: data.walletId,
      tx_hash: data.txHash,
      coin: data.coin,
      network: data.network,
      order_id: orderId,
      price_amount: plan.price_usd_cents / 100,
      price_currency: "USD",
      status: "pending_review",
    });

    if (error) {
      console.error("submitCryptoPayment failed:", error);
      return { error: "Could not submit payment. Please try again." } as const;
    }

    return { ok: true, orderId } as const;
  });

/**
 * Admin-only: approve a crypto payment, which activates the user's subscription.
 */
export const approveCryptoPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      paymentId: z.string().uuid(),
      notes: z.string().max(1000).optional(),
    })
  )
  .handler(async ({ data, context }) => {
    const { userId: adminId } = context;

    // Verify caller is admin
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", adminId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return { error: "Not authorized" } as const;

    const { data: payment, error: payErr } = await supabaseAdmin
      .from("crypto_payments")
      .select("*")
      .eq("id", data.paymentId)
      .maybeSingle();
    if (payErr || !payment) return { error: "Payment not found" } as const;

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const { error: subErr } = await supabaseAdmin
      .from("user_subscriptions")
      .upsert(
        {
          user_id: payment.user_id,
          plan_slug: payment.plan_slug,
          status: "active",
          currency: "USD",
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
        },
        { onConflict: "user_id" }
      );
    if (subErr) {
      console.error("subscription upsert failed:", subErr);
      return { error: "Approval failed at subscription step" } as const;
    }

    await supabaseAdmin
      .from("crypto_payments")
      .update({
        status: "approved",
        admin_notes: data.notes ?? null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
      })
      .eq("id", data.paymentId);

    return { ok: true } as const;
  });

export const rejectCryptoPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      paymentId: z.string().uuid(),
      notes: z.string().max(1000).optional(),
    })
  )
  .handler(async ({ data, context }) => {
    const { userId: adminId } = context;
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", adminId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return { error: "Not authorized" } as const;

    await supabaseAdmin
      .from("crypto_payments")
      .update({
        status: "rejected",
        admin_notes: data.notes ?? null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
      })
      .eq("id", data.paymentId);

    return { ok: true } as const;
  });
