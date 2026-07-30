const fetch = require("node-fetch");

// Groq exposes an OpenAI-compatible Chat Completions API, so no extra SDK is
// needed — a plain fetch call keeps this consistent with geminiService.js.
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const BASE_URL = "https://api.groq.com/openai/v1/chat/completions";

function getApiKey() {
  const key = process.env.GROQ_API_KEY;
  if (!key || key === "your_groq_api_key_here") {
    throw new Error(
      "GROQ_API_KEY is not set. Add your key to backend/.env (get one at https://console.groq.com/keys)"
    );
  }
  return key;
}

/**
 * Calls Groq's OpenAI-compatible chat completions endpoint.
 * Same signature as geminiService.generateText so agents can switch
 * providers by changing only which service they import.
 * @param {string} systemInstruction - Role/instructions for this agent call.
 * @param {string} userPrompt - The actual prompt/context.
 * @param {object} opts - { temperature, maxOutputTokens, json }
 */
async function generateText(systemInstruction, userPrompt, opts = {}) {
  const apiKey = getApiKey();

  const messages = [];
  if (systemInstruction) messages.push({ role: "system", content: systemInstruction });
  messages.push({ role: "user", content: userPrompt });

  const body = {
    model: GROQ_MODEL,
    messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxOutputTokens ?? 1024,
  };

  // Groq supports strict JSON mode for models that allow it; harmless to
  // request even when the model ignores it, since agents already tolerate
  // stray text via safeParseJSON.
  if (opts.json) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    const err = new Error(`Groq API error (${res.status}): ${errText}`);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || "";
  return text;
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

module.exports = { generateText, safeParseJSON };
