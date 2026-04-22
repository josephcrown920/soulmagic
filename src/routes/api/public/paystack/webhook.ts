import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/paystack/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.PAYSTACK_SECRET_KEY;
        if (!secret) {
          return new Response("Server misconfigured", { status: 500 });
        }

        const signature = request.headers.get("x-paystack-signature");
        const body = await request.text();

        const expected = createHmac("sha512", secret).update(body).digest("hex");
        if (!signature || signature.length !== expected.length) {
          return new Response("Invalid signature", { status: 401 });
        }
        try {
          if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
            return new Response("Invalid signature", { status: 401 });
          }
        } catch {
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: any;
        try {
          payload = JSON.parse(body);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const event = String(payload?.event ?? "");
        const data = payload?.data ?? {};
        const meta = data?.metadata ?? {};
        const userId = meta?.user_id as string | undefined;
        const planSlug = meta?.plan_slug as string | undefined;
        const reference = data?.reference as string | undefined;
        const eventId = `${event}_${reference ?? data?.id ?? Date.now()}`;

        // Log raw event (best-effort, dedup on event_id)
        await supabaseAdmin.from("payment_events").upsert(
          {
            paystack_event_id: eventId,
            event_type: event,
            user_id: userId ?? null,
            reference: reference ?? null,
            amount: data?.amount ?? null,
            currency: data?.currency ?? null,
            raw: payload,
          },
          { onConflict: "paystack_event_id" }
        );

        if (event === "charge.success" && userId && planSlug) {
          const periodEnd = new Date();
          periodEnd.setMonth(periodEnd.getMonth() + 1);
          await supabaseAdmin.from("user_subscriptions").upsert(
            {
              user_id: userId,
              plan_slug: planSlug,
              status: "active",
              currency: data?.currency ?? "USD",
              paystack_customer_code: data?.customer?.customer_code ?? null,
              current_period_start: new Date().toISOString(),
              current_period_end: periodEnd.toISOString(),
              cancel_at_period_end: false,
            },
            { onConflict: "user_id" }
          );
        } else if (event === "subscription.disable" && userId) {
          await supabaseAdmin
            .from("user_subscriptions")
            .update({ status: "canceled", cancel_at_period_end: true })
            .eq("user_id", userId);
        } else if (event === "invoice.payment_failed" && userId) {
          await supabaseAdmin
            .from("user_subscriptions")
            .update({ status: "past_due" })
            .eq("user_id", userId);
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
