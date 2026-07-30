const { generateText, safeParseJSON } = require("../aiService");

/**
 * Placement Agent
 * Two jobs: (1) generate a company-wise interview prep pack, and (2) run
 * a turn-by-turn mock interview loop (used by the frontend's Mock Interview
 * page as a simple chat — no video/audio processing here, just the Q&A
 * reasoning layer).
 */
async function getCompanyPrepPack({ company, role }) {
  const systemInstruction = `You are the Placement Agent inside EduBuddy. Generate an interview
preparation pack for the given company and role. Respond ONLY with strict JSON, no markdown fences:
{
  "overview": "string (40-60 words about the company's interview process/culture)",
  "rounds": ["string", ...] (typical interview rounds in order),
  "commonQuestions": ["string", ...] (6-10 realistic questions for this company/role),
  "topicsToRevise": ["string", ...] (5-8 technical/aptitude topics)
}
If you're not confident about company-specific details, give the best general pattern for that
industry/role rather than inventing specifics.`;

  const userPrompt = `Company: ${company}\nRole: ${role}\n\nProduce the JSON now.`;
  const raw = await generateText(systemInstruction, userPrompt, {
    temperature: 0.5,
    maxOutputTokens: 700,
    json: true,
    provider: "groq", // Interview Questions -> Groq
  });
  return (
    safeParseJSON(raw) || {
      overview: "",
      rounds: [],
      commonQuestions: [],
      topicsToRevise: [],
    }
  );
}

/** One turn of a mock interview: asks the next question or evaluates the last answer. */
async function mockInterviewTurn({ company, role, history = [] }) {
  const systemInstruction = `You are a strict but encouraging mock interviewer for "${role}" at a
company like "${company}". If the last message in history is a candidate answer, briefly evaluate it
(2-3 sentences of feedback) then ask the next question. If there is no prior answer, just ask the
first question. Keep your entire reply under 90 words.`;

  const historyText = history.map((m) => `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.text}`).join("\n");
  const reply = await generateText(systemInstruction, historyText || "Begin the interview.", {
    temperature: 0.7,
    maxOutputTokens: 300,
    provider: "groq", // Interview Questions -> Groq
  });
  return reply.trim();
}

/** Scores a completed mock interview transcript for the Placement Readiness automation event. */
async function scoreInterview({ company, role, history = [] }) {
  const transcript = history.map((m) => `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.text}`).join("\n");

  const systemInstruction = `You are scoring a completed mock interview transcript for a "${role}" role at
a company like "${company}". Evaluate the candidate's answers (not the interviewer's questions) for
technical/role fit AND communication clarity. Respond ONLY with strict JSON, no markdown fences:
{
  "score": number (0-100, overall interview performance),
  "communicationScore": number (0-100, clarity/structure of answers specifically),
  "strengths": ["string", ...] (2-3 items),
  "improvementAreas": ["string", ...] (2-3 items),
  "feedback": "string (60-90 words, direct and constructive)"
}
If the transcript is too short to judge fairly, still give your best honest estimate rather than refusing.`;

  const raw = await generateText(systemInstruction, transcript || "No answers were recorded.", {
    temperature: 0.4,
    maxOutputTokens: 500,
    json: true,
    provider: "groq", // Interview Questions/scoring -> Groq
  });

  const parsed = safeParseJSON(raw) || {
    score: 50,
    communicationScore: 50,
    strengths: [],
    improvementAreas: [],
    feedback: "Could not fully parse AI response — this is a fallback estimate.",
  };
  return parsed;
}

module.exports = { getCompanyPrepPack, mockInterviewTurn, scoreInterview };
