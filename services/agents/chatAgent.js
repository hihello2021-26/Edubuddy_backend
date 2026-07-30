const { generateText } = require("../aiService");
const { retrieveRelevantDocs, formatContext } = require("../ragService");

/**
 * Chat Advisor Agent
 * A conversational RAG agent: every user message is used as a retrieval
 * query against the knowledge base, and the top matches are injected into
 * the prompt as grounding context alongside recent conversation history.
 */
async function runChatAgent({ history = [], message, userName = "", userProfile = {}, userClassLevel = "degree" }) {
  const docs = await retrieveRelevantDocs(message, { topK: 5 });
  const context = formatContext(docs);

  const historyText = history
    .slice(-8)
    .map((m) => `${m.role === "user" ? "Student" : "EduBuddy"}: ${m.text}`)
    .join("\n");

  const profileSummary = `Student name: ${userName || "unknown"}; Student profile: ${userClassLevel ? `Class Level ${userClassLevel}` : "unknown"}${userProfile.interests?.length ? `; Interests: ${userProfile.interests.join(", ")}` : ""}${userProfile.aptitude?.length ? `; Aptitude: ${userProfile.aptitude.join(", ")}` : ""}${userProfile.skills?.length ? `; Skills: ${userProfile.skills.join(", ")}` : ""}${userProfile.goals ? `; Goals: ${userProfile.goals}` : ""}${userProfile.targetRole ? `; Target Role: ${userProfile.targetRole}` : ""}`;

  const systemInstruction = `You are EduBuddy, a warm, encouraging career & education advisor for Indian
students who just finished class 10 or 12. Answer using the REFERENCE MATERIAL
when it's relevant, and say clearly when something is general guidance rather
than a fact from the reference material. Keep answers focused, practical, and
under 180 words unless the student asks for depth. Never invent specific college
cutoffs, fees, or admission dates — recommend the student verify those on the
official site if unsure. If the student asks about their name or profile, mention
their name exactly as provided and refer to relevant profile details from the
profile summary. Use the student's profile details when they are relevant to the question.`;

  const userPrompt = `CONVERSATION SO FAR:\n${historyText}\n\n${profileSummary}\n\nREFERENCE MATERIAL (RAG):\n${context}\n\nStudent's new message: ${message}\n\nReply as EduBuddy.`;

  const reply = await generateText(systemInstruction, userPrompt, {
    temperature: 0.7,
    maxOutputTokens: 500,
    provider: "gemini", // AI Chatbot -> Gemini preferred (fallback to Groq handled by aiService)
  });

  return { reply: reply.trim(), sources: docs.map((d) => d.title) };
}

module.exports = { runChatAgent };
