const { runHybridAgent } = require("./hybridAgentGraph");

/**
 * General Mentor Agent — EduBuddy's "General AI Assistant".
 *
 * This now runs on the Hybrid Agent Graph (services/hybridAgentGraph.js):
 * "Pattern 5 — RAG + Tools + Branching", built with LangGraph's StateGraph.
 * User input -> RAG retrieve -> tool call -> a LangGraph decision node that
 * either finalizes the answer or loops back through a broadened retry path.
 *
 * The graph's internal LLM calls go through aiService.generateText(), which
 * already implements this project's Groq-primary / Gemini-fallback logic —
 * so this agent gets that resilience automatically, with no separate
 * provider-specific model wiring needed here.
 */
async function runMentorAgent({ history = [], message, language = "en", userName = "", userProfile = {}, userClassLevel = "degree" }) {
  return runHybridAgent({ history, message, language, userName, userProfile, userClassLevel });
}

module.exports = { runMentorAgent };
