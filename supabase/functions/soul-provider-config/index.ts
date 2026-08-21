import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

// Central model registry. Provider adapters should consume these IDs instead of
// scattering model names through the application. Exact provider endpoints are
// intentionally configured through environment variables so we never silently
// call a different model when a provider changes its catalog.
const MODELS = {
  seedream: {
    image: Deno.env.get("SEEDREAM_IMAGE_MODEL") || "seedream-5.0-pro",
  },
  flux: {
    image: Deno.env.get("FLUX_IMAGE_MODEL") || "flux-2-max",
    lora: Deno.env.get("FLUX_LORA_MODEL") || "flux-2-pro",
  },
  wan: {
    video: Deno.env.get("WAN_VIDEO_MODEL") || "wan2.2-t2v-plus",
    character: Deno.env.get("WAN_CHARACTER_MODEL") || "wan2.2-animate-2",
  },
} as const;

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  return new Response(JSON.stringify({
    ok: true,
    soulProviders: {
      primaryImage: "seedream",
      identityImage: "flux",
      video: "wan",
    },
    models: MODELS,
  }), { headers: { ...cors, "Content-Type": "application/json" } });
});
