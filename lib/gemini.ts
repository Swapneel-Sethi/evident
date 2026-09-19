// lib/gemini.ts
// Real Gemini API wrapper used by the orchestrator.
// Reads GEMINI_API_KEY from environment and makes a POST request to the Gemini generation endpoint.
// Returns the generated text (string) from the first candidate.

export async function fetchGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment');
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt + '\n\nReturn ONLY valid JSON. No markdown fences. No explanation.' }]
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2
    }
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API request failed: ${res.status} ${res.statusText} - ${errText}`);
  }
  const data = await res.json();
  try {
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string') {
      throw new Error('Gemini response missing expected text field');
    }
    text = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    return text;
  } catch (e) {
    throw new Error('Failed to parse Gemini response: ' + (e instanceof Error ? e.message : String(e)));
  }
}
