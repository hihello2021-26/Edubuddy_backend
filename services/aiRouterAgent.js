const { generateText, safeParseJSON } = require("./aiService");
const { retrieveRelevantDocs, formatContext } = require("./ragService");
const GovExam = require("../models/GovExam");
const Scholarship = require("../models/Scholarship");
const { runCareerRoadmapAgent } = require("./agents/careerRoadmapAgent");

const CATEGORIES = ["career", "scholarship", "college", "govexam", "placement", "resume", "interview", "general"];

/**
 * AI Router
 * ---------
 * The dispatcher in front of EduBuddy's specialised agents. For every chat
 * message it (1) classifies intent with a fast Gemini call, (2) gathers the
 * right grounding context from the matching agent/collection, and (3) asks
 * Gemini to write the final answer in Markdown (headings/tables/bullets as
 * appropriate) so the upgraded chat UI can render it richly, with a list of
 * sources for citation chips.
 *
 * Falls back to `category: "general"` (handled by the existing LangChain
 * Mentor Agent / plain RAG chat in chatController.js) if classification or
 * routing fails for any reason — this augments, not replaces, the existing
 * chat pipeline.
 */
async function classifyIntent(message) {
  const systemInstruction = `Classify the student's message into exactly one category from this list:
${CATEGORIES.join(", ")}.
- "career" = questions about a field/career/stream/branch/roadmap/job roles/skills for a profession
- "scholarship" = financial aid, scholarships, fee waivers
- "college" = college predictions, admissions, cutoffs, which college to choose
- "govexam" = government exams/recruitment (UPSC, SSC, banking, railways, police, PSU, etc.)
- "placement" = interview prep, company-wise prep, placement strategy
- "resume" = resume/CV writing or ATS-related questions
- "interview" = mock interview practice requests
- "general" = anything else / greetings / unclear
Respond ONLY with strict JSON: {"category": "one_of_the_above", "topic": "short extracted topic/field, e.g. 'Engineering' or empty string"}`;

  const raw = await generateText(systemInstruction, message, {
    temperature: 0.1,
    maxOutputTokens: 100,
    json: true,
    provider: "gemini",
  });
  const parsed = safeParseJSON(raw);
  if (!parsed || !CATEGORIES.includes(parsed.category)) return { category: "general", topic: "" };
  return parsed;
}

function languageName(language) {
  return { en: "English", hi: "Hindi (हिन्दी)", kn: "Kannada (ಕನ್ನಡ)" }[language] || "English";
}

async function gatherContextAndAnswer({ category, topic, message, language, userName, userProfile = {}, userClassLevel = "degree" }) {
  let contextBlock = "";
  let sources = [];

  if (category === "career") {
    try {
      const roadmap = await runCareerRoadmapAgent({ field: topic || message });
      contextBlock = `Structured roadmap data (already generated for this field):\n${JSON.stringify(roadmap, null, 2)}`;
      sources = roadmap.sources || [];
    } catch {
      const docs = await retrieveRelevantDocs(message, { topK: 5, category: "career" });
      contextBlock = formatContext(docs);
      sources = docs.map((d) => d.title);
    }
  } else if (category === "scholarship") {
    const [docs, records] = await Promise.all([
      retrieveRelevantDocs(message, { topK: 6, category: "scholarship" }),
      Scholarship.find({}).sort({ createdAt: -1 }).limit(10).lean(),
    ]);
    contextBlock = `${formatContext(docs)}\n\nDatabase records:\n${records
      .map((r) => `${r.title} — ${r.provider} — ${r.amount} — apply: ${r.applyLink}`)
      .join("\n")}`;
    sources = docs.map((d) => d.title);
  } else if (category === "college") {
    const docs = await retrieveRelevantDocs(message, { topK: 6, category: "college" });
    contextBlock = formatContext(docs);
    sources = docs.map((d) => d.title);
  } else if (category === "govexam") {
    const records = await GovExam.find({}).sort({ createdAt: -1 }).limit(12).lean();
    contextBlock = records.length
      ? records.map((r) => `${r.category} — ${r.title} (${r.organization}) — last date: ${r.lastDate || "N/A"} — ${r.officialLink}`).join("\n")
      : "No government exam notifications stored yet — advise the student to check official sites directly, or ask the admin to run the Government Exam Agent.";
    sources = ["Government Exam Agent database"];
  } else if (category === "placement" || category === "interview") {
    const docs = await retrieveRelevantDocs(message, { topK: 4, category: "career" });
    contextBlock = formatContext(docs);
    sources = docs.map((d) => d.title);
  } else if (category === "resume") {
    contextBlock =
      "General ATS best practices: use standard section headers, quantify achievements, mirror keywords from the job description, avoid tables/graphics that ATS parsers can't read, keep to 1-2 pages.";
  }

  const userProfileSummary = userProfile
    ? `Student name: ${userName || "unknown"}; Student profile: ${userClassLevel ? `Class Level ${userClassLevel}` : "unknown"}${userProfile.interests?.length ? `; Interests: ${userProfile.interests.join(", ")}` : ""}${userProfile.aptitude?.length ? `; Aptitude: ${userProfile.aptitude.join(", ")}` : ""}${userProfile.skills?.length ? `; Skills: ${userProfile.skills.join(", ")}` : ""}${userProfile.goals ? `; Goals: ${userProfile.goals}` : ""}${userProfile.targetRole ? `; Target Role: ${userProfile.targetRole}` : ""}`
    : `Student name: ${userName || "unknown"}; No profile data available.`;

  const systemInstruction = `You are EduBuddy's Mentor — an AI Router has already classified this\nmessage as category "${category}" and gathered the context below. Write a clear, well-formatted\nMarkdown answer in ${languageName(language)}: use short headings or bold labels, bullet lists, and a\nMarkdown table if comparing multiple items. Keep it focused and under 220 words unless the student asked\nfor depth. Never invent specific cutoffs/ranks/dates not present in the context — say to verify officially\ninstead. Use the student's profile details when a personalised recommendation is appropriate, especially for stream, higher-study, scholarship, or skill-gap advice. If the context suggests directing the student to a specific EduBuddy page (Scholarship Finder, College Predictor, Government Exam feed, Resume Analyzer, Mock Interview), mention it by name.\n\nSTUDENT PROFILE:\n${userProfileSummary}\n\nCONTEXT:\n${contextBlock || "No specific context retrieved — answer from general knowledge, staying cautious about specifics."}`;

  const reply = await generateText(systemInstruction, message, {
    temperature: 0.6,
    maxOutputTokens: 700,
    provider: "gemini",
  });
  return { reply: reply.trim(), sources, category };
}

async function routeMessage({ message, language = "en", userName, userProfile = {}, userClassLevel = "degree" }) {
  const { category, topic } = await classifyIntent(message);
  if (category === "general") return null; // let the caller fall back to the general mentor agent
  return gatherContextAndAnswer({ category, topic, message, language, userName, userProfile, userClassLevel });
}

module.exports = { routeMessage, classifyIntent };
