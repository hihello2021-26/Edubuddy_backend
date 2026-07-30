const { generateText, safeParseJSON } = require("../aiService");
const { retrieveRelevantDocs, formatContext } = require("../ragService");

/**
 * Career Path Agent
 * Takes the recommended stream + profile and, grounded in RAG-retrieved
 * course/career documents, proposes 3-5 concrete degree/career paths with
 * a match score, so the student sees *why* each path fits them.
 */
async function runCareerAgent({ profileSummary, stream, interests }) {
  const query = `career options and degree courses after choosing ${stream} stream, interests: ${interests.join(", ")}`;
  const [careerDocs, courseDocs] = await Promise.all([
    retrieveRelevantDocs(query, { topK: 4, category: "career" }),
    retrieveRelevantDocs(query, { topK: 3, category: "course" }),
  ]);
  const allDocs = [...careerDocs, ...courseDocs];
  const context = formatContext(allDocs);

  const systemInstruction = `You are the Career Path Agent inside EduBuddy. Using the student profile,
their recommended stream, and the RAG reference material, propose 3 to 5 concrete
career paths (mix of degree-course + eventual job roles), each realistic for a
government-college student in India. Respond ONLY with strict JSON, no markdown
fences, in this exact shape:
{"paths": [{"title": "string", "description": "string (35-55 words)", "matchScore": number (0-100), "requiredCourses": ["string"]}]}`;

  const userPrompt = `STUDENT PROFILE:\n${profileSummary}\n\nRECOMMENDED STREAM: ${stream}\n\nREFERENCE MATERIAL (RAG):\n${context}\n\nProduce the JSON now.`;

  const raw = await generateText(systemInstruction, userPrompt, {
    temperature: 0.5,
    maxOutputTokens: 800,
    json: true,
    provider: "groq", // Career Guidance -> Groq
  });

  const parsed = safeParseJSON(raw) || { paths: [] };

  return { paths: parsed.paths || [], sources: allDocs.map((d) => d.title) };
}

module.exports = { runCareerAgent };
