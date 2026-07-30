const { generateText, safeParseJSON } = require("../aiService");
const streamData = require("../../data/class10StreamData");

/**
 * Career Agent (Class 10 AI Counselor)
 * Scores every one of the 7 stream options (Science, Commerce, Arts,
 * Diploma, ITI, Polytechnic, Vocational) for suitability against the
 * student's aptitude, interests, marks, personality, and goals — powering
 * both the compare table's "AI Suitability Score" column and a single
 * top recommendation with reasoning.
 */
async function runCareerCounselorAgent({ aptitude = [], interests = [], marks = {}, personality = "", goals = "" }) {
  const streamsContext = streamData
    .map((s) => `${s.name}: skills needed = ${s.skillsRequired.join(", ")}; future scope = ${s.futureScope}`)
    .join("\n");

  const systemInstruction = `You are the Career Agent inside EduBuddy — an AI counselor for a Class 10
student choosing their next path. Score EACH of the 7 options below for suitability (0-100) given the
student's aptitude, interests, marks, personality, and goals. Respond ONLY with strict JSON, no markdown
fences:
{
  "scores": [{"key": "science|commerce|arts|diploma|iti|polytechnic|vocational", "score": number, "reason": "string (15-25 words)"}],
  "topRecommendation": "string (one of the 7 keys)",
  "counselorSummary": "string (100-140 words, warm and specific to this student, explaining the top pick and one solid alternative)"
}

OPTIONS:
${streamsContext}`;

  const userPrompt = `Aptitude: ${JSON.stringify(aptitude)}\nInterests: ${JSON.stringify(interests)}\nMarks: ${JSON.stringify(
    marks
  )}\nPersonality: ${personality || "not specified"}\nGoals: ${goals || "not specified"}\n\nProduce the JSON now.`;

  const raw = await generateText(systemInstruction, userPrompt, { temperature: 0.5, maxOutputTokens: 900, json: true, provider: "groq" }); // Career Guidance -> Groq
  const parsed = safeParseJSON(raw) || { scores: [], topRecommendation: "science", counselorSummary: "" };
  return parsed;
}

module.exports = { runCareerCounselorAgent };
