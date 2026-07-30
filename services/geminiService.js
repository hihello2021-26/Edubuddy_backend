const fetch = require("node-fetch");

// NOTE: Google shut down gemini-2.0-flash on June 1, 2026 and deprecated
// text-embedding-004 on January 14, 2026. Any call using those model IDs
// now fails with a 404 regardless of whether the API key is valid — which
// is why every agent looked "broken" even with correct keys. gemini-2.5-flash
// and gemini-embedding-001 are the current stable replacements.
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || "gemini-embedding-001";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

function getApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "your_gemini_api_key_here") {
    throw new Error(
      "GEMINI_API_KEY is not set. Add your key to backend/.env (get one at https://aistudio.google.com/app/apikey)"
    );
  }
  return key;
}

/**
 * Calls Gemini's generateContent endpoint.
 * @param {string} systemInstruction - Role/instructions for this agent call.
 * @param {string} userPrompt - The actual prompt/context.
 * @param {object} opts - { temperature, maxOutputTokens, json }
 */
async function generateText(systemInstruction, userPrompt, opts = {}) {
  const apiKey = getApiKey();
  const url = `${BASE_URL}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    systemInstruction: systemInstruction
      ? { role: "system", parts: [{ text: systemInstruction }] }
      : undefined,
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxOutputTokens ?? 1024,
      responseMimeType: opts.json ? "application/json" : "text/plain",
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n") || "";
  return text;
}

/** Generates a vector embedding for a piece of text, used by the RAG service. */
async function embedText(text) {
  const apiKey = getApiKey();
  const url = `${BASE_URL}/${EMBED_MODEL}:embedContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: { parts: [{ text }] },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini embedding error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data?.embedding?.values || [];
}

/** Attempts to parse a JSON object out of a model response, tolerating stray text/fences. */
function safeParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

module.exports = { generateText, embedText, safeParseJSON };
