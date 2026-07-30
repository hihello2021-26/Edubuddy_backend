const { generateText } = require("../aiService");

/**
 * Resume Builder text generation. Per the project's provider architecture
 * this runs on Groq (Resume Builder text generation -> Groq), separate from
 * the Gemini-powered Resume & ATS Agent which only *analyzes* text someone
 * already wrote.
 */

/** Generates a 2-3 line professional summary from the student's overall profile. */
async function generateSummary({ fullName, targetRole, skills = [], education = [], experienceHighlights = "" }) {
  const systemInstruction = `You write professional resume summaries for Indian students/early-career
candidates. Write a punchy, honest 2-3 sentence (40-55 word) professional summary. No first person
pronouns ("I"). No generic filler ("hardworking team player"). Ground it in the specific skills/education
given. Respond with ONLY the summary text — no quotes, no markdown, no preamble.`;

  const userPrompt = `Name: ${fullName || "the candidate"}
Target role: ${targetRole || "not specified"}
Key skills: ${skills.join(", ") || "not specified"}
Education: ${education.map((e) => `${e.degree || ""} ${e.fieldOfStudy || ""} at ${e.institution || ""}`).join("; ") || "not specified"}
Notable experience/projects: ${experienceHighlights || "not specified"}

Write the summary now.`;

  const text = await generateText(systemInstruction, userPrompt, {
    temperature: 0.6,
    maxOutputTokens: 150,
    provider: "groq", // Resume Builder text generation -> Groq
  });
  return text.trim().replace(/^["']|["']$/g, "");
}

/**
 * Rewrites a single bullet point (project/internship description line) to be
 * more resume-appropriate: action-verb-led, quantified where plausible,
 * ATS-friendly plain text.
 */
async function improveBullet({ text, context = "", targetRole = "" }) {
  if (!text?.trim()) return "";

  const systemInstruction = `You rewrite ONE resume bullet point to be stronger: start with a strong
past-tense action verb, keep it to one line (18-28 words), quantify impact only if it's plausible from
the given text (don't invent specific numbers that weren't implied), and keep it ATS-friendly plain text
(no special characters, no emojis). Respond with ONLY the rewritten bullet — no quotes, no bullet symbol,
no preamble.`;

  const userPrompt = `${context ? `Context: ${context}\n` : ""}${targetRole ? `Target role: ${targetRole}\n` : ""}Original bullet: "${text}"\n\nRewrite it now.`;

  const rewritten = await generateText(systemInstruction, userPrompt, {
    temperature: 0.5,
    maxOutputTokens: 100,
    provider: "groq", // Resume Builder text generation -> Groq
  });
  return rewritten.trim().replace(/^["']|["']$/g, "").replace(/^[-•*]\s*/, "");
}

/** Generates a 1-2 sentence project description from a title + tech stack. */
async function generateProjectDescription({ title, techStack = [], targetRole = "" }) {
  const systemInstruction = `You write resume project-description bullets. Given a project title and its
tech stack, write ONE strong, plausible 20-30 word description starting with a past-tense action verb,
suitable for a resume (ATS-friendly plain text, no special characters). Do not invent specific
user/traffic numbers. Respond with ONLY the description — no quotes, no preamble.`;

  const userPrompt = `Project title: ${title}\nTech stack: ${techStack.join(", ") || "not specified"}\n${
    targetRole ? `Target role: ${targetRole}\n` : ""
  }\nWrite the description now.`;

  const text = await generateText(systemInstruction, userPrompt, {
    temperature: 0.6,
    maxOutputTokens: 100,
    provider: "groq", // Resume Builder text generation -> Groq
  });
  return text.trim().replace(/^["']|["']$/g, "");
}

module.exports = { generateSummary, improveBullet, generateProjectDescription };
