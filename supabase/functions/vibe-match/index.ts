// Vibe Matcher — analyzes a reference frame with Lovable AI
// and returns a suggested preset (color, face settings, mood).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SCHEMA = {
  type: "object",
  properties: {
    preset_name: { type: "string", description: "Short evocative name like 'Warm Cinematic' or 'TikTok Crisp'." },
    description: { type: "string" },
    mood: { type: "string", description: "1-3 word mood: e.g. 'moody', 'sun-soaked', 'high-contrast urban'." },
    face_model: { type: "string", enum: ["gfpgan", "codeformer"] },
    face_strength: { type: "number", minimum: 0, maximum: 1 },
    saturation: { type: "number", minimum: -1, maximum: 1 },
    contrast: { type: "number", minimum: -1, maximum: 1 },
    warmth: { type: "number", minimum: -1, maximum: 1 },
    sharpness: { type: "number", minimum: 0, maximum: 1 },
    skin_smoothing: { type: "number", minimum: 0, maximum: 1 },
    lut_recommendation: { type: "string", description: "Plain-English LUT suggestion." },
  },
  required: [
    "preset_name", "description", "mood", "face_model", "face_strength",
    "saturation", "contrast", "warmth", "sharpness", "skin_smoothing",
    "lut_recommendation",
  ],
  additionalProperties: false,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "imageBase64 required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a senior colorist & VFX supervisor. Analyze a reference frame (color palette, lighting, mood, lens character, skin tone) and propose a video grading preset. Be decisive, opinionated. Give numeric values within the schema ranges.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this reference frame and produce a preset draft." },
              { type: "image_url", image_url: { url: imageBase64 } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "propose_preset",
              description: "Return a Soul preset draft.",
              parameters: SCHEMA,
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "propose_preset" } },
      }),
    });

    if (res.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again shortly." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (res.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!res.ok) {
      const text = await res.text();
      console.error("AI gateway error:", res.status, text);
      throw new Error(`AI gateway ${res.status}`);
    }

    const json = await res.json();
    const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("No tool call returned");
    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("vibe-match error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
