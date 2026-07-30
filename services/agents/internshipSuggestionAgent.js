const { generateText, safeParseJSON } = require("../aiService");

/**
 * Event-Based Automation: "When skills change -> recommend internships."
 * Triggered by automationService.handleProfileUpdated whenever the
 * PATCH /api/dashboard/profile payload changes the student's `skills` array.
 */
async function suggestInternshipsForSkills({ skills = [], classLevel = "degree", interests = [] }) {
  if (!skills.length) return { suggestions: [] };

  const systemInstruction = `You are EduBuddy's Internship Recommender. Given a student's current skills
(and optionally interests), suggest 3 realistic internship types/roles they could reasonably apply for
right now in India (student class level: ${classLevel}). Respond ONLY with strict JSON, no markdown fences:
{"suggestions": [{"role": "string", "whyFit": "string (20-30 words tying it to their listed skills)", "whereToLook": "string (e.g. 'Internshala, LinkedIn, campus placement cell')"}]}`;

  const userPrompt = `Skills: ${skills.join(", ")}\nInterests: ${interests.join(", ") || "not specified"}\n\nProduce the JSON now.`;

  const raw = await generateText(systemInstruction, userPrompt, {
    temperature: 0.5,
    maxOutputTokens: 500,
    json: true,
    provider: "groq", // General AI Assistant -> Groq
  });

  const parsed = safeParseJSON(raw);
  return { suggestions: parsed?.suggestions || [] };
}

module.exports = { suggestInternshipsForSkills };
