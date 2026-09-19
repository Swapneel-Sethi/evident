// lib/gemini.ts - multi-provider AI router with automatic failover.
// Order: Gemini -> Groq -> Mistral (override with AI_PROVIDER_ORDER).
// Providers without keys are skipped. Any failure (429/5xx/network/bad
// output) falls through to the next provider. Export name kept so all
// existing orchestrator imports keep working.

type Provider = "gemini" | "groq" | "mistral";

function providerOrder(): Provider[] {
  const raw = (process.env.AI_PROVIDER_ORDER || "gemini,groq,mistral").toLowerCase();
  const list = raw.split(",").map((s) => s.trim()).filter((s) => s === "gemini" || s === "groq" || s === "mistral") as Provider[];
  return list.length > 0 ? list : ["gemini", "groq", "mistral"];
}

function stripFences(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt + "\n\nReturn ONLY valid JSON. No markdown fences. No explanation." }] }],
    generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
  };
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 429) throw new Error("gemini_RATE_LIMITED: " + errText.substring(0, 200));
    throw new Error(`gemini request failed: ${res.status} - ${errText.substring(0, 200)}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string" || !text.trim()) throw new Error("geminiKM: empty response");
  return stripFences(text);
}

async function callOpenAICompatible(
  provider: "groq" | "mistral",
  baseUrl: string,
  apiKey: string,
  model: string,
  prompt: string
): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 4000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Return ONLY valid JSON. No markdown fences. No explanation." },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 429) throw new Error(`${provider}_RATE_LIMITED: ` + errText.substring(0, 200));
    throw new Error(`${provider} request failed: ${res.status} - ${errText.substring(0, 200)}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) throw new Error(`${provider}KM: empty response`);
  return stripFences(text);
}

export async function fetchGemini(prompt: string): Promise<string> {
  const errors: string[] = [];
  for (const p of providerOrder()) {
    try {
      if (p === "gemini") {
        const k = process.env.GEMINI_API_KEY;
        if (!k) continue;
        const out = await callGemini(prompt, k);
        console.log(`AI provider used: gemini`);
        return out;
      }
      if (p === "groq") {
        const k = process.env.GROQ_API_KEY;
        if (!k) continue;
        const out = await callOpenAICompatible("groq", "https://api.groq.com/openai/v1", k, process.env.GROQ_MODEL || "llama-3.3-70b-versatile", prompt);
        console.log(`AI provider used: groq`);
        return out;
      }
      if (p === "mistral") {
        const k = process.env.MISTRAL_API_KEY;
        if (!k) continue;
        const out = await callOpenAICompatible("mistral", "https://api.mistral.ai/v1", k, process.env.MISTRAL_MODEL || "mistral-small-latest", prompt);
        console.log(`AI provider used: mistral`);
        return out;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`AI provider ${p} failed, failing over.`, msg.substring(0, 200));
      errors.push(msg);
    }
  }
  if (errors.length === 0) {
    throw new Error("GEMINI_API_KEY is not set in environment (and no GROQ_API_KEY / MISTRAL_API_KEY fallback configured)");
  }
  if (errors.some((m) => m.includes("RATE_LIMITED"))) {
    throw new Error("GEMINI_RATE_LIMITED: all configured AI providers are rate-limited right now. Wait ~40s and retry.");
  }
  throw new Error("All AI providers failed: " + errors.join(" | ").substring(0, 500));
}
