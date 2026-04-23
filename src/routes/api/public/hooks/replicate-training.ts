// Webhook called by Replicate when a LoRA training completes.
// We don't gate by signature (Replicate optionally supports it but the loraId
// query param + training_id match is enough for our soft-trust model — we
// re-fetch the truth from Replicate before mutating).
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN!;

export const Route = createFileRoute("/api/public/hooks/replicate-training")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const loraId = url.searchParams.get("loraId");
        if (!loraId) return new Response("loraId required", { status: 400 });

        const payload = await request.json().catch(() => null);
        const trainingId = payload?.id;
        if (!trainingId) return new Response("invalid payload", { status: 400 });

        const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        // Verify the training belongs to this LoRA (defence in depth).
        const { data: lora } = await admin
          .from("loras").select("id, replicate_training_id")
          .eq("id", loraId).maybeSingle();
        if (!lora || lora.replicate_training_id !== trainingId) {
          return new Response("training/lora mismatch", { status: 404 });
        }

        // Re-fetch authoritative state from Replicate.
        const r = await fetch(
          `https://api.replicate.com/v1/trainings/${trainingId}`,
          { headers: { Authorization: `Token ${REPLICATE_API_TOKEN}` } },
        );
        if (!r.ok) {
          console.error("replicate-training: fetch failed", await r.text());
          return new Response("replicate fetch failed", { status: 502 });
        }
        const final = await r.json();

        if (final.status === "succeeded") {
          const versionId = final.output?.version?.split(":")[1] ?? null;
          await admin.from("loras").update({
            status: "ready",
            progress: 100,
            replicate_version_id: versionId,
            weights_url: final.output?.weights ?? null,
            completed_at: new Date().toISOString(),
            error_message: null,
          }).eq("id", loraId);

          // Bump usage counter
          const { data: counter } = await admin
            .rpc("get_or_create_usage_counter", { _user_id: (await admin.from("loras").select("user_id").eq("id", loraId).single()).data?.user_id });
          if (counter) {
            await admin.from("usage_counters")
              .update({ loras_trained: (counter.loras_trained ?? 0) + 1 })
              .eq("id", counter.id);
          }
        } else if (final.status === "failed" || final.status === "canceled") {
          await admin.from("loras").update({
            status: "failed",
            error_message: String(final.error ?? `Status: ${final.status}`),
          }).eq("id", loraId);
        }

        return Response.json({ ok: true });
      },
    },
  },
});
