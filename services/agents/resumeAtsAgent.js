const { generateText, safeParseJSON } = require("../aiService");

/**
 * Resume & ATS Agent
 * Analyzes raw resume text (extracted upstream via pdf-parse) against a
 * target role and produces an ATS-style compatibility score plus concrete,
 * actionable feedback — the kind a real Applicant Tracking System check
 * would flag before a human recruiter ever sees the resume.
 *
 * Enhanced beyond the basic score: a category breakdown for visual
 * analytics, grammar issues, weak action-verb detection with stronger
 * replacements, targeted skill recommendations, and an AI-rewritten
 * "improved version" of the resume's summary/top section.
 */
async function runResumeAtsAgent({ resumeText, targetRole }) {
  const systemInstruction = `You are the Resume & ATS Agent inside EduBuddy. Analyze the resume text
against the target role the way an Applicant Tracking System + a strict recruiter would. Respond ONLY
with strict JSON, no markdown fences, in EXACTLY this shape:
{
  "atsScore": number (0-100, overall),
  "categoryScores": {
    "formatting": number (0-100, ATS-parseability: no tables/columns/graphics assumed, clear section headers, standard fonts),
    "keywords": number (0-100, role-relevant keyword density/coverage),
    "content": number (0-100, quality/impact/specificity of bullet points and achievements),
    "structure": number (0-100, logical section order, consistent dates, appropriate length)
  },
  "strengths": ["string", ...] (2-4 items),
  "gaps": ["string", ...] (2-4 items, specific and actionable),
  "missingKeywords": ["string", ...] (role-relevant keywords/skills absent from the resume),
  "suggestions": ["string", ...] (3-5 concrete rewrite/formatting suggestions),
  "grammarIssues": ["string", ...] (0-5 items, each quoting the problematic phrase and the fix, e.g. "'was responsible for managing' -> 'managed'"),
  "weakActionVerbs": [{"found": "string (weak verb/phrase actually in the resume)", "replaceWith": "string (2-3 stronger action verb alternatives, comma-separated)"}] (0-6 items),
  "recommendedSkills": ["string", ...] (2-5 in-demand skills for this target role NOT currently on the resume, distinct from missingKeywords which is about phrasing/ATS matching — this is about actual skill gaps),
  "improvedSummary": "string (a rewritten, stronger 2-3 sentence professional summary based on what's actually in the resume — do not invent experience that isn't implied by the original text)"
}
Be honest and specific — cite actual words/phrases from the resume where relevant, don't give generic filler.`;

  const userPrompt = `TARGET ROLE: ${targetRole || "General entry-level role"}\n\nRESUME TEXT:\n${resumeText.slice(
    0,
    6000
  )}\n\nProduce the JSON now.`;

  const raw = await generateText(systemInstruction, userPrompt, {
    temperature: 0.3,
    maxOutputTokens: 1400,
    json: true,
    provider: "gemini", // Resume Analysis / ATS Score -> Gemini
  });

  const parsed = safeParseJSON(raw) || {
    atsScore: 0,
    categoryScores: { formatting: 0, keywords: 0, content: 0, structure: 0 },
    strengths: [],
    gaps: ["Could not parse AI response — please retry."],
    missingKeywords: [],
    suggestions: [],
    grammarIssues: [],
    weakActionVerbs: [],
    recommendedSkills: [],
    improvedSummary: "",
  };

  // Defensive defaults in case the model omits a field despite the schema.
  parsed.categoryScores = parsed.categoryScores || { formatting: 0, keywords: 0, content: 0, structure: 0 };
  parsed.grammarIssues = parsed.grammarIssues || [];
  parsed.weakActionVerbs = parsed.weakActionVerbs || [];
  parsed.recommendedSkills = parsed.recommendedSkills || [];
  parsed.improvedSummary = parsed.improvedSummary || "";

  return parsed;
}

module.exports = { runResumeAtsAgent };
