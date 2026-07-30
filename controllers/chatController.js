const ChatSession = require("../models/ChatSession");
const User = require("../models/User");
const { routeMessage } = require("../services/aiRouterAgent");
const { runMentorAgent } = require("../services/langchainAgent");
const { runChatAgent } = require("../services/agents/chatAgent");

/**
 * Core reply pipeline, shared by sendMessage and regenerate:
 *   1. AI Router — classifies intent (career/scholarship/college/govexam/
 *      placement/resume/interview) and answers using the matching agent's
 *      context. Returns null for "general" intent.
 *   2. LangChain Mentor Agent (tool-calling) — handles general/open-ended
 *      questions, deciding per-turn whether to use its RAG/gov-exam/
 *      scholarship tools.
 *   3. Plain RAG chat agent — last-resort fallback if LangChain errors.
 */
async function generateReply({ history, message, language, userName, userProfile, userClassLevel }) {
  try {
    const routed = await routeMessage({ message, language, userName, userProfile, userClassLevel });
    if (routed) return routed; // { reply, sources, category }
  } catch (routerErr) {
    console.warn("⚠️ AI Router failed, falling back to general mentor agent:", routerErr.message);
  }

  try {
    const result = await runMentorAgent({ history, message, language, userName, userProfile, userClassLevel });
    return { reply: result.reply, sources: result.toolsUsed || [], category: "mentor" };
  } catch (agentErr) {
    console.warn("⚠️ LangChain mentor agent failed, falling back to plain RAG chat:", agentErr.message);
    const fallback = await runChatAgent({ history, message, userName, userProfile, userClassLevel });
    return { reply: fallback.reply, sources: fallback.sources, category: "mentor" };
  }
}

// POST /api/chat/:sessionId?/message  -> { message, language }
exports.sendMessage = async (req, res) => {
  try {
    const { message, language = "en" } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: "Message text is required." });

    const user = await User.findById(req.userId).select("name classLevel preferredLanguage profile");

    let session;
    if (req.params.sessionId) {
      session = await ChatSession.findOne({ _id: req.params.sessionId, user: req.userId });
    }
    if (!session) {
      session = await ChatSession.create({ user: req.userId, title: message.slice(0, 40), language, messages: [] });
    }

    session.messages.push({ role: "user", text: message, language });

    const { reply, sources, category } = await generateReply({ history: session.messages, message, language, userName: user?.name, userProfile: user?.profile, userClassLevel: user?.classLevel });

    session.messages.push({ role: "assistant", text: reply, language, sources, agentCategory: category });
    await session.save();

    res.json({ sessionId: session._id, reply, sources, category, messages: session.messages });
  } catch (err) {
    console.error("Chat agent error:", err);
    res.status(500).json({ message: "The AI advisor could not respond right now.", error: err.message });
  }
};

// POST /api/chat/:sessionId/regenerate -> re-runs the pipeline for the last user message
exports.regenerate = async (req, res) => {
  try {
    const { language = "en" } = req.body;
    const session = await ChatSession.findOne({ _id: req.params.sessionId, user: req.userId });
    if (!session) return res.status(404).json({ message: "Conversation not found." });

    const user = await User.findById(req.userId).select("name classLevel preferredLanguage profile");

    // Find the last user message to regenerate a response for
    const lastUserMsg = [...session.messages].reverse().find((m) => m.role === "user");
    if (!lastUserMsg) return res.status(400).json({ message: "No previous message to regenerate a response for." });

    // Drop the last assistant message (the one being regenerated) if present at the tail
    if (session.messages[session.messages.length - 1]?.role === "assistant") {
      session.messages.pop();
    }

    const { reply, sources, category } = await generateReply({
      history: session.messages,
      message: lastUserMsg.text,
      language,
      userName: user?.name,
      userProfile: user?.profile,
      userClassLevel: user?.classLevel,
    });

    session.messages.push({ role: "assistant", text: reply, language, sources, agentCategory: category });
    await session.save();

    res.json({ sessionId: session._id, reply, sources, category, messages: session.messages });
  } catch (err) {
    console.error("Chat regenerate error:", err);
    res.status(500).json({ message: "Could not regenerate a response.", error: err.message });
  }
};

// PATCH /api/chat/:sessionId/messages/:messageId/feedback -> { feedback: "like"|"dislike"|null }
exports.setFeedback = async (req, res) => {
  try {
    const { feedback } = req.body;
    if (!["like", "dislike", null].includes(feedback)) {
      return res.status(400).json({ message: "feedback must be 'like', 'dislike', or null." });
    }
    const session = await ChatSession.findOne({ _id: req.params.sessionId, user: req.userId });
    if (!session) return res.status(404).json({ message: "Conversation not found." });

    const msg = session.messages.id(req.params.messageId);
    if (!msg) return res.status(404).json({ message: "Message not found." });

    msg.feedback = feedback;
    await session.save();
    res.json({ message: msg });
  } catch (err) {
    res.status(500).json({ message: "Could not save feedback.", error: err.message });
  }
};

// GET /api/chat -> list sessions
exports.getSessions = async (req, res) => {
  const sessions = await ChatSession.find({ user: req.userId })
    .select("title createdAt updatedAt language")
    .sort({ updatedAt: -1 });
  res.json({ sessions });
};

// GET /api/chat/:sessionId
exports.getSession = async (req, res) => {
  const session = await ChatSession.findOne({ _id: req.params.sessionId, user: req.userId });
  if (!session) return res.status(404).json({ message: "Conversation not found." });
  res.json({ session });
};
