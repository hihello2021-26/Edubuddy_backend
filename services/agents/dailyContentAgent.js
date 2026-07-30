const { generateText, safeParseJSON } = require("../aiService");

const TOPIC_POOL = [
  "a core Data Structures & Algorithms concept",
  "a Computer Science fundamentals topic (OS/DBMS/Networks/OOP)",
  "an aptitude/reasoning topic useful for placement tests",
  "a soft skill relevant to interviews or workplace communication",
  "a current-affairs-adjacent general knowledge topic useful for competitive exams",
  "a personal finance or career-planning basic every student should know",
];

/**
 * Daily Learning Topic + Quiz generator, run once a day by the cron job in
 * services/cron/dailyJobs.js. Produces one short "topic of the day" card and
 * a 3-question quiz on it, grounded loosely by rotating through a topic pool
 * so students don't see the same category two days running.
 */
async function generateDailyContent() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const focusArea = TOPIC_POOL[dayOfYear % TOPIC_POOL.length];

  const systemInstruction = `You are EduBuddy's Daily Content Agent. Generate ONE short, genuinely useful
"topic of the day" for Indian students (Class 10 through degree level / placement prep) on: ${focusArea}.
Then write a 3-question multiple-choice quiz testing understanding of that exact topic. Respond ONLY with
strict JSON, no markdown fences, in this exact shape:
{
  "learningTopic": {"title": "string (short, specific)", "summary": "string (80-120 words, clear and practical)", "category": "string (e.g. 'DSA', 'Aptitude', 'Soft Skills')"},
  "quiz": [{"question": "string", "options": ["string","string","string","string"], "correctIndex": number (0-3), "explanation": "string (1-2 sentences)"}]
}
The quiz MUST have exactly 3 questions, each with exactly 4 options.`;

  const raw = await generateText(systemInstruction, "Generate today's content now.", {
    temperature: 0.7,
    maxOutputTokens: 900,
    json: true,
    provider: "groq", // Daily Automation / General AI Assistant -> Groq
  });

  const parsed = safeParseJSON(raw);
  if (!parsed || !parsed.learningTopic || !Array.isArray(parsed.quiz)) {
    throw new Error("Daily Content Agent returned an unparseable response.");
  }
  return parsed;
}

module.exports = { generateDailyContent };
