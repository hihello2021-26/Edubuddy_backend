const { generateText, safeParseJSON } = require("../aiService");

/**
 * Skill Gap Analyzer Agent
 * Compares the student's current skills to a target role and returns a
 * prioritized gap list plus a learning plan with suggested project ideas
 * (also satisfies the "AI project recommendations" requirement).
 */
async function runSkillGapAgent({ currentSkills = [], targetRole }) {
  // Normalize skills input (handle array or comma-separated string)
  let skillsArr = Array.isArray(currentSkills)
    ? currentSkills
    : String(currentSkills || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

  const systemInstruction = `You are the Skill Gap Analyzer Agent inside EduBuddy.
Compare the student's current skills to what is strictly required for the target role "${targetRole}".

CRITICAL MATCH CALCULATOR RULE:
- Do NOT automatically return 0% if the student has relevant skills!
- Identify 4-8 core skills essential for "${targetRole}".
- Check how many of those core skills match or overlap with the student's current skills: ${JSON.stringify(skillsArr)}.
- Calculate matchPercent based on overlap: (Matched Skills / Total Required Skills) * 100.
- Output "haveSkills" as skills the student already possesses (matching target role requirements).
- Output "missingSkills" as prioritized missing skills they need to learn.

Respond ONLY with strict JSON, no markdown fences:
{
  "matchPercent": number (0-100),
  "haveSkills": ["string", ...],
  "missingSkills": ["string", ...] (prioritized, most important first),
  "learningPlan": [{"skill": "string", "how": "string (concrete course/resource/action, 15-25 words)"}],
  "projectIdeas": ["string", ...] (2-4 portfolio project ideas that close the biggest skill gaps)
}`;

  const userPrompt = `Target role: ${targetRole}\nCurrent skills possessed by candidate: ${JSON.stringify(skillsArr)}\n\nAnalyze match and produce JSON now.`;
  const raw = await generateText(systemInstruction, userPrompt, { temperature: 0.3, maxOutputTokens: 800, json: true, provider: "groq" });

  const parsed = safeParseJSON(raw);
  if (parsed) return parsed;

  // Fallback calculation if AI fails
  const fallbackHave = skillsArr;
  const fallbackMissing = ["Core Domain Concepts", "Advanced Practical Tools", "Industry Project Experience"];
  return {
    matchPercent: skillsArr.length > 0 ? Math.min(85, Math.max(25, skillsArr.length * 20)) : 10,
    haveSkills: fallbackHave,
    missingSkills: fallbackMissing,
    learningPlan: [
      { skill: "Domain Mastery", how: "Complete hands-on online specialization with real-world datasets." }
    ],
    projectIdeas: ["Build an end-to-end portfolio application demonstrating target role skills."]
  };
}

module.exports = { runSkillGapAgent };

