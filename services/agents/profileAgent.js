const { generateText } = require("../aiService");

/**
 * Profile Analyzer Agent
 * Reads raw quiz answers and produces a structured natural-language
 * summary of the student's interests, strengths, and work-style —
 * the foundation the next agents build on.
 */
async function runProfileAgent({ classLevel, answers }) {
  const systemInstruction = `You are the Profile Analyzer Agent inside EduBuddy, a multi-agent career
advisory system for Indian students. Your only job is to read a student's quiz
answers and produce a concise, encouraging, honest profile summary (120-160 words)
covering: dominant interests, natural strengths, and preferred way of working
(hands-on / analytical / creative / people-facing). Do not recommend a stream or
career yet — that is the next agent's job. Write in plain, warm language a
16-year-old would understand.`;

  const userPrompt = `Student's current class: ${classLevel}
Quiz answers (JSON): ${JSON.stringify(answers)}

Write the profile summary now.`;

  const summary = await generateText(systemInstruction, userPrompt, {
    temperature: 0.6,
    maxOutputTokens: 400,
    provider: "groq", // General AI Assistant -> Groq
  });

  return summary.trim();
}

module.exports = { runProfileAgent };
