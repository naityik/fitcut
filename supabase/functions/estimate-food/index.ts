/**
 * Supabase Edge Function — macro estimation for free-text food entries.
 *
 * Deploy:
 *   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 *   supabase functions deploy estimate-food
 *
 * The key stays on the server. The browser only ever sees the JSON result.
 */
import Anthropic from "npm:@anthropic-ai/sdk@0.30.1";

const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You estimate the macronutrients of a described food portion.

Answer with ONE JSON object and nothing else — no prose, no markdown fences:
{"name":string,"portion":string,"kcal":number,"protein_g":number,"carbs_g":number,"fat_g":number,"note":string}

Rules:
- Assume Indian home cooking and Indian brand products unless told otherwise.
- If no quantity is given, assume one typical serving and say so in "note".
- Include cooking oil in the estimate when the dish would normally be cooked in it.
- "note" is one short sentence naming the main assumption you made. Keep it under 15 words.
- Keep kcal roughly consistent with 4/4/9 kcal per gram of protein/carbs/fat.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { description } = await req.json();
    if (typeof description !== "string" || description.trim().length < 2) {
      return json({ error: "Describe the food in a few words." }, 400);
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      system: SYSTEM,
      messages: [{ role: "user", content: description.slice(0, 400) }],
    });

    const text = message.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .replace(/```json|```/g, "")
      .trim();

    return json(JSON.parse(text));
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Estimation failed." }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
