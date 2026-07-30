const { generateText, safeParseJSON } = require("../aiService");
const { retrieveRelevantDocs, formatContext } = require("../ragService");

/**
 * Stream Recommender Agent
 * Uses the profile summary from Agent 1 + RAG-retrieved facts about
 * Arts/Science/Commerce streams to recommend a primary stream with
 * grounded reasoning (reduces hallucination vs. asking the LLM blind).
 */
async function runStreamAgent({ classLevel, profileSummary, interests }) {
  const query = `stream choice for a class ${classLevel} student interested in ${interests.join(", ")}`;
  const docs = await retrieveRelevantDocs(query, { topK: 4, category: "stream" });
  const context = formatContext(docs);

  const systemInstruction = `You are the Stream Recommender Agent inside EduBuddy. Using ONLY the
student profile and the reference material provided (retrieved via RAG), recommend
ONE primary stream from {Science, Commerce, Arts/Humanities} plus up to 2 viable
alternatives. Ground every claim in the reference material where possible.
Respond ONLY with strict JSON, no markdown fences, in this exact shape:
{"primary": "string", "alternatives": ["string", "string"], "reasoning": "string (100-140 words, plain language)"}`;

  const userPrompt = `STUDENT PROFILE:\n${profileSummary}\n\nREFERENCE MATERIAL (RAG):\n${context}\n\nProduce the JSON now.`;

  const raw = await generateText(systemInstruction, userPrompt, {
    temperature: 0.4,
    maxOutputTokens: 500,
    json: true,
    provider: "groq", // Career Guidance -> Groq
  });

  const parsed = safeParseJSON(raw) || {
    primary: "Science",
    alternatives: ["Commerce"],
    reasoning: "Fallback recommendation — the AI response could not be parsed. Please retry.",
  };

  return { recommendation: parsed, sources: docs.map((d) => d.title) };
}

module.exports = { runStreamAgent };
