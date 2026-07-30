const groqService = require("./groqService");
const geminiService = require("./geminiService");

/**
 * AI Service Router
 * ------------------
 * Every agent in EduBuddy calls generateText() through this file instead of
 * hitting Groq or Gemini directly. That gives us one place to enforce the
 * project's dual-provider architecture:
 *
 *   Groq   -> AI Chatbot, Career Guidance, Interview Questions, Study
 *             Planning, Roadmaps, General AI Assistant, Resume Builder text
 *   Gemini -> Resume Analysis, ATS Score, Resume Improvement Suggestions,
 *             PDF/Image Analysis, Complex reasoning
 *
 * Each agent picks its provider by passing opts.provider ("groq" | "gemini").
 * If that provider fails (quota exceeded, 429, 5xx, timeout, missing key),
 * this router automatically retries briefly, then falls back to the OTHER
 * provider so a single vendor outage never breaks the feature for the user.
 */

const PROVIDERS = { groq: groqService, gemini: geminiService };

const RETRYABLE_PATTERN = /429|quota|rate.?limit|RESOURCE_EXHAUSTED|5\d\d|ECONNRESET|ETIMEDOUT|ENOTFOUND|network|fetch failed/i;

function isRetryableError(err) {
  const msg = (err && err.message) || "";
  return RETRYABLE_PATTERN.test(msg) || (err && err.status && err.status >= 429);
}

function isMissingKeyError(err) {
  const msg = (err && err.message) || "";
  return /API_KEY is not set/i.test(msg);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calls a single provider with a couple of quick retries for transient
 * failures (network blips, momentary rate limiting) before giving up on it.
 */
async function callWithRetry(providerName, systemInstruction, userPrompt, opts, maxAttempts = 2) {
  const provider = PROVIDERS[providerName];
  let lastErr;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const text = await provider.generateText(systemInstruction, userPrompt, opts);
      return text;
    } catch (err) {
      lastErr = err;

      // No point retrying if the key is simply missing/misconfigured.
      if (isMissingKeyError(err)) break;

      if (attempt < maxAttempts && isRetryableError(err)) {
        console.warn(
          `⚠️ ${providerName} attempt ${attempt} failed (${err.message.slice(0, 120)}), retrying...`
        );
        await sleep(400 * attempt); // small linear backoff
        continue;
      }
      break;
    }
  }

  throw lastErr;
}

/**
 * Unified text-generation entry point used by every agent.
 * @param {string} systemInstruction
 * @param {string} userPrompt
 * @param {object} opts - { temperature, maxOutputTokens, json, provider }
 *   opts.provider: "groq" (default) or "gemini" — which provider this
 *   feature is assigned to per the architecture above.
 */
async function generateText(systemInstruction, userPrompt, opts = {}) {
  const primaryName = opts.provider === "gemini" ? "gemini" : "groq";
  const fallbackName = primaryName === "groq" ? "gemini" : "groq";

  try {
    const text = await callWithRetry(primaryName, systemInstruction, userPrompt, opts);
    return text;
  } catch (primaryErr) {
    console.warn(
      `⚠️ ${primaryName} failed for this request (${primaryErr.message.slice(
        0,
        160
      )}). Falling back to ${fallbackName}...`
    );
    try {
      const text = await callWithRetry(fallbackName, systemInstruction, userPrompt, opts, 1);
      return text;
    } catch (fallbackErr) {
      console.error(
        `❌ Both providers failed. ${primaryName}: ${primaryErr.message} | ${fallbackName}: ${fallbackErr.message}`
      );
      throw new Error(
        `AI generation failed on both providers. Please check your GROQ_API_KEY and GEMINI_API_KEY in backend/.env.`
      );
    }
  }
}

/** Embeddings only exist on Gemini today (used by ragService for RAG retrieval). */
async function embedText(text) {
  return geminiService.embedText(text);
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
