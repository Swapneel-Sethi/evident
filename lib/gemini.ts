// lib/gemini.ts - multi-provider AI router with fast automatic failover & ultra-low latency model priority.
// Order: Gemini -> Groq -> Mistral (override with AI_PROVIDER_ORDER).
// Any 429/5xx/network/bad output automatically falls over to next ultra-fast model / provider.

type Provider = "gemini" | "groq" | "mistral";

function providerOrder(): Provider[] {
  const raw = (process.env.AI_PROVIDER_ORDER || "gemini,groq,mistral").toLowerCase();
  const list = raw.split(",").map((s) => s.trim()).filter((s) => s === "gemini" || s === "groq" || s === "mistral") as Provider[];
  return list.length > 0 ? list : ["gemini", "groq", "mistral"];
}

function stripFences(text: string): string {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  return cleaned;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function callGeminiSingleKey(prompt: string, apiKey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt + "\n\nReturn ONLY valid JSON. No markdown fences. No explanation." }] }],
    generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000); // 6s timeout for Gemini
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const errText = await res.text();
      if (res.status === 429) throw new Error("gemini_RATE_LIMITED: " + errText.substring(0, 200));
      throw new Error(`gemini request failed: ${res.status} - ${errText.substring(0, 200)}`);
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string" || !text.trim()) throw new Error("gemini: empty response");
    return stripFences(text);
  } finally {
    clearTimeout(timer);
  }
}

async function callGemini(prompt: string): Promise<string> {
  const rawKeys = process.env.GEMINI_API_KEY || "";
  const keys = rawKeys.split(",").map((k) => k.trim()).filter(Boolean);
  if (keys.length === 0) throw new Error("No GEMINI_API_KEY provided");

  const errors: string[] = [];
  for (const k of keys) {
    try {
      return await callGeminiSingleKey(prompt, k);
    } catch (e: any) {
      errors.push(e.message || String(e));
    }
  }
  throw new Error("All Gemini keys failed: " + errors.join(" | ").substring(0, 300));
}

async function callGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("No GROQ_API_KEY provided");

  // Ultra-fast model priority list for sub-second responses under Vercel function timeout limits
  const models = [
    process.env.GROQ_MODEL,
    "qwen/qwen3.8-27b",
    "groq/compound-mini",
    "openai/gpt-oss-20b",
    "groq/compound",
    "openai/gpt-oss-120b",
  ].filter((m, i, self) => Boolean(m) && self.indexOf(m) === i) as string[];

  const errors: string[] = [];
  for (const model of models) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000); // 5s timeout per model
    try {
      const reqBody = {
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: "Return ONLY valid JSON. No markdown fences. No explanation." },
          { role: "user", content: prompt },
        ],
        max_completion_tokens: 3000,
      };
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(reqBody),
        signal: controller.signal,
      });
      if (!res.ok) {
        const errText = await res.text();
        if (res.status === 429) {
          errors.push(`groq_${model}_RATE_LIMITED: ` + errText.substring(0, 150));
          continue;
        }
        errors.push(`groq_${model}_ERR_${res.status}: ` + errText.substring(0, 150));
        continue;
      }
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (typeof text !== "string" || !text.trim()) {
        errors.push(`groq_${model}_EMPTY`);
        continue;
      }
      return stripFences(text);
    } catch (e: any) {
      errors.push(`groq_${model}_EXCEPTION: ` + (e.message || String(e)).substring(0, 150));
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error("All Groq models failed: " + errors.join(" | ").substring(0, 400));
}

async function callMistral(prompt: string): Promise<string> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("No MISTRAL_API_KEY provided");

  const models = [
    process.env.MISTRAL_MODEL,
    "mistral-small-latest",
    "open-mistral-7b",
  ].filter((m, i, self) => Boolean(m) && self.indexOf(m) === i) as string[];

  const errors: string[] = [];
  for (const model of models) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const reqBody = {
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: "Return ONLY valid JSON. No markdown fences. No explanation." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        max_tokens: 3000,
      };
      const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(reqBody),
        signal: controller.signal,
      });
      if (!res.ok) {
        const errText = await res.text();
        if (res.status === 429) {
          errors.push(`mistral_${model}_RATE_LIMITED`);
          continue;
        }
        errors.push(`mistral_${model}_ERR_${res.status}`);
        continue;
      }
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (typeof text !== "string" || !text.trim()) {
        errors.push(`mistral_${model}_EMPTY`);
        continue;
      }
      return stripFences(text);
    } catch (e: any) {
      errors.push(`mistral_${model}_EXCEPTION: ` + (e.message || String(e)));
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error("All Mistral models failed: " + errors.join(" | ").substring(0, 400));
}

export async function fetchGemini(prompt: string): Promise<string> {
  const errors: string[] = [];
  for (const p of providerOrder()) {
    try {
      if (p === "gemini" && process.env.GEMINI_API_KEY) {
        const out = await callGemini(prompt);
        console.log("AI provider used: gemini");
        return out;
      }
      if (p === "groq" && process.env.GROQ_API_KEY) {
        const out = await callGroq(prompt);
        console.log("AI provider used: groq");
        return out;
      }
      if (p === "mistral" && process.env.MISTRAL_API_KEY) {
        const out = await callMistral(prompt);
        console.log("AI provider used: mistral");
        return out;
      }
    } catch (e: any) {
      const msg = e.message || String(e);
      console.warn(`AI provider ${p} failed, failing over to next provider.`, msg.substring(0, 200));
      errors.push(`${p}: ${msg}`);
    }
  }

  if (errors.length === 0) {
    throw new Error("No AI provider API keys configured in environment.");
  }

  const allRateLimited = errors.every((e) => e.includes("RATE_LIMITED") || e.includes("429"));
  if (allRateLimited) {
    throw new Error("GEMINI_RATE_LIMITED: All configured AI providers are currently rate-limited.");
  }

  throw new Error("All AI providers failed: " + errors.join(" | ").substring(0, 500));
}
