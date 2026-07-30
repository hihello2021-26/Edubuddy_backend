const { generateText, safeParseJSON } = require("../aiService");

/**
 * Roadmap Agent
 * Final agent in the chain — synthesizes everything the earlier agents
 * produced into a concrete, ordered action plan the student can follow,
 * from "right now" through to their first job or higher studies.
 */
async function runRoadmapAgent({ classLevel, stream, paths }) {
  const systemInstruction = `You are the Roadmap Agent inside EduBuddy, the final step of a multi-agent
pipeline. Turn the chosen stream and shortlisted career paths into a clear,
motivating, chronological roadmap of 5-7 stages, starting from the student's
current class and ending at "first job / higher studies". Respond ONLY with
strict JSON, no markdown fences, in this exact shape:
{"roadmap": [{"stage": "string (e.g. 'Class 11-12')", "title": "string", "description": "string (25-40 words)", "timeline": "string (e.g. 'Next 2 years')"}]}`;

  const userPrompt = `Current class: ${classLevel}\nRecommended stream: ${stream}\nShortlisted career paths: ${JSON.stringify(
    paths.map((p) => p.title)
  )}\n\nProduce the JSON now.`;

  const raw = await generateText(systemInstruction, userPrompt, {
    temperature: 0.5,
    maxOutputTokens: 700,
    json: true,
    provider: "groq", // Roadmaps -> Groq
  });

  const parsed = safeParseJSON(raw) || { roadmap: [] };
  return parsed.roadmap || [];
}

module.exports = { runRoadmapAgent };
