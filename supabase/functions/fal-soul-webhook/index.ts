import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, authorization" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) throw new Error("Supabase service configuration is missing");

    const soulId = new URL(req.url).searchParams.get("soulId");
    if (!soulId) throw new Error("soulId required");
    const payload = await req.json();
    const admin = createClient(url, key);

    // fal webhook payloads can vary by trainer version. Accept the common
    // result shapes while refusing to mark a Soul ready without a LoRA URL.
    const result = payload?.output ?? payload?.result ?? payload;
    const loraUrl = result?.lora_weights?.url ?? result?.lora?.url ?? result?.lora_url ?? result?.weights?.url;
    const configUrl = result?.config_file?.url ?? result?.config?.url;

    if (!loraUrl) {
      const failed = payload?.status === "FAILED" || payload?.status === "failed" || payload?.error;
      if (failed) {
        await admin.from("souls").update({ status: "failed", progress: 0, error_message: String(payload?.error ?? "fal training failed") }).eq("id", soulId);
        return new Response(JSON.stringify({ ok: true, status: "failed" }), { headers: { ...cors, "Content-Type": "application/json" } });
      }
      throw new Error("fal webhook did not contain LoRA weights");
    }

    const { error } = await admin.from("souls").update({
      status: "ready",
      progress: 100,
      lora_url: loraUrl,
      config_url: configUrl ?? null,
      error_message: null,
      metadata: { fal_webhook: payload?.status ?? "completed", completed_at: new Date().toISOString() },
    }).eq("id", soulId);
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, status: "ready", soulId }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("fal-soul-webhook", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Webhook failed" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
