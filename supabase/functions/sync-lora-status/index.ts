// Manually pull current Replicate training state and update the row.
// Used by the LoRAs page "Refresh status" button when a training has been
// stuck in 'training' for too long (webhook missed, network hiccup, etc).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { loraId } = await req.json();
    if (!loraId) throw new Error("loraId required");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const REPLICATE_API_TOKEN = Deno.env.get("REPLICATE_API_TOKEN")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: lora } = await admin.from("loras")
      .select("id, user_id, replicate_training_id, status").eq("id", loraId).maybeSingle();
    if (!lora) {
      return new Response(JSON.stringify({ status: "not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!lora.replicate_training_id) {
      // Training hasn't been created on Replicate yet — treat as no-op, not an error.
      return new Response(
        JSON.stringify({ status: lora.status, note: "No Replicate training id yet" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const r = await fetch(
      `https://api.replicate.com/v1/trainings/${lora.replicate_training_id}`,
      { headers: { Authorization: `Token ${REPLICATE_API_TOKEN}` } },
    );
    if (!r.ok) throw new Error(`Replicate: ${await r.text()}`);
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
    } else if (final.status === "failed" || final.status === "canceled") {
      await admin.from("loras").update({
        status: "failed",
        error_message: String(final.error ?? `Status: ${final.status}`),
      }).eq("id", loraId);
    } else {
      // still processing — bump progress visually
      await admin.from("loras").update({
        status: "training",
        progress: Math.min(95, (Date.now() - new Date(final.created_at).getTime()) / (20 * 60 * 1000) * 95),
      }).eq("id", loraId);
    }

    return new Response(JSON.stringify({ status: final.status }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sync-lora-status:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
