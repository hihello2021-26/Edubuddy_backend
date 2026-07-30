const { StateGraph, START, END, Annotation } = require("@langchain/langgraph");
const { generateText, safeParseJSON } = require("./aiService");
const { retrieveRelevantDocs, formatContext } = require("./ragService");
const GovExam = require("../models/GovExam");
const Scholarship = require("../models/Scholarship");

/**
 * Hybrid Agent Graph — "Pattern 5: RAG + Tools + Branching" (LangGraph)
 * -----------------------------------------------------------------------
 *   User Input -> RAG Retrieve (context) -> Tool Call (action)
 *              -> LangGraph Decision Node
 *                    -> confident?  -> Pass: Final Answer
 *                    -> not confident? -> Fail: Retry / Alt Path -> back to Decision Node
 *
 * This is the engine behind EduBuddy's General Mentor Agent (the AI
 * Router's fallback for open-ended questions). It's deliberately built as
 * an explicit graph rather than a single prompt so the branching logic —
 * "is this answer actually good enough, or do I need to look further?" —
 * is a real, inspectable decision instead of hidden inside one LLM call.
 *
 * LLM calls inside the graph go through aiService.generateText(), so they
 * automatically get the project's Groq-primary / Gemini-fallback behavior
 * for free — no separate provider wiring needed at the graph level.
 */

const MAX_RETRIES = 1; // one "Retry / Alt Path" loop before we force a final answer

const LANGUAGE_NAMES = { en: "English", hi: "Hindi (हिन्दी)", kn: "Kannada (ಕನ್ನಡ)" };

const GraphState = Annotation.Root({
  input: Annotation(),
  chatHistoryText: Annotation({ default: () => "" }),
  language: Annotation({ default: () => "en" }),
  userName: Annotation({ default: () => "" }),
  userProfile: Annotation({ default: () => ({}) }),
  userClassLevel: Annotation({ default: () => "degree" }),
  ragContext: Annotation({ default: () => "" }),
  toolUsed: Annotation({ default: () => "none" }),
  toolResult: Annotation({ default: () => "" }),
  answer: Annotation({ default: () => "" }),
  confidence: Annotation({ default: () => "insufficient" }),
  retryCount: Annotation({ default: () => 0 }),
  path: Annotation({ default: () => [], reducer: (a, b) => a.concat(b) }),
});

/** Node 1: RAG Retrieve — pulls the top-K relevant knowledge base chunks for the query. */
async function ragRetrieveNode(state) {
  const topK = state.retryCount > 0 ? 8 : 5; // broaden on retry
  const docs = await retrieveRelevantDocs(state.input, { topK });
  return { ragContext: formatContext(docs), path: ["ragRetrieve"] };
}

/** Node 2: Tool Call — deterministic routing to a live-data tool based on the query's intent. */
async function toolCallNode(state) {
  const text = state.input.toLowerCase();
  const examKeywords = /\b(upsc|ssc|kcet|comedk|neet|jee|gate|cat|nda|cds|ibps|railway|rrb|banking|psc|exam|entrance)\b/;
  const scholarshipKeywords = /\b(scholarship|scheme|fee waiver|financial aid|stipend)\b/;

  // On retry, try the *other* kind of tool than we did last time (an "alt path").
  const forceScholarship = state.retryCount > 0 && state.toolUsed === "gov_exam_lookup";
  const forceGovExam = state.retryCount > 0 && state.toolUsed === "scholarship_lookup";

  if ((examKeywords.test(text) || forceGovExam) && !forceScholarship) {
    const exams = await GovExam.find({}).sort({ createdAt: -1 }).limit(6).lean();
    const toolResult = exams.length
      ? exams.map((e) => `${e.category} — ${e.title} (last date: ${e.lastDate ? e.lastDate.toDateString() : "N/A"})`).join("\n")
      : "No stored government exam notifications match yet.";
    return { toolUsed: "gov_exam_lookup", toolResult, path: ["toolCall:gov_exam_lookup"] };
  }

  if (scholarshipKeywords.test(text) || forceScholarship) {
    const scholarships = await Scholarship.find({}).sort({ createdAt: -1 }).limit(6).lean();
    const toolResult = scholarships.length
      ? scholarships.map((s) => `${s.name} — eligibility: ${s.eligibility || "see details"}`).join("\n")
      : "No stored scholarships match yet.";
    return { toolUsed: "scholarship_lookup", toolResult, path: ["toolCall:scholarship_lookup"] };
  }

  return { toolUsed: "none", toolResult: "No specific live-data tool was needed for this query.", path: ["toolCall:none"] };
}

/** Node 3: LangGraph Decision Node — drafts an answer AND judges whether it's actually good enough. */
async function decisionNode(state) {
  const profileSummary = `Student name: ${state.userName || "unknown"}; Student profile: ${state.userClassLevel ? `Class Level ${state.userClassLevel}` : "unknown"}${state.userProfile.interests?.length ? `; Interests: ${state.userProfile.interests.join(", ")}` : ""}${state.userProfile.aptitude?.length ? `; Aptitude: ${state.userProfile.aptitude.join(", ")}` : ""}${state.userProfile.skills?.length ? `; Skills: ${state.userProfile.skills.join(", ")}` : ""}${state.userProfile.goals ? `; Goals: ${state.userProfile.goals}` : ""}${state.userProfile.targetRole ? `; Target Role: ${state.userProfile.targetRole}` : ""}`;

  const systemInstruction = `You are EduBuddy Mentor, a warm AI mentor for Indian students (Class 10
through degree level). Reply ONLY in ${LANGUAGE_NAMES[state.language] || "English"}. You are given
retrieved knowledge-base context and a live-data tool result — use them if relevant, and never invent
specific cutoffs, fees, or dates that aren't in the given context. Keep the answer under 180 words.
If the student asks about their name or profile, mention their name exactly as provided and refer to relevant profile details from their profile summary. Otherwise, use the profile summary to personalise the answer when appropriate.

Respond ONLY with strict JSON, no markdown fences:
{"answer": "string (your best answer to the student right now)", "confidence": "sufficient" | "insufficient", "reason": "string (short, why you judged it that way)"}

Judge "insufficient" ONLY if the question clearly needed specific factual grounding (a cutoff, fee,
deadline, or named scheme/exam) that neither the retrieved context nor the tool result actually contains.
For general advice/conversational questions, "sufficient" is almost always correct on the first pass.`;

  const userPrompt = `${state.chatHistoryText ? `Recent conversation:\n${state.chatHistoryText}\n\n` : ""}${profileSummary}\n\nStudent's question: ${state.input}

Retrieved knowledge base context:
${state.ragContext}

Live tool result (${state.toolUsed}):
${state.toolResult}

Produce the JSON now.`;

  const raw = await generateText(systemInstruction, userPrompt, {
    temperature: 0.5,
    maxOutputTokens: 500,
    json: true,
    provider: "groq", // General AI Assistant -> Groq (auto-falls back to Gemini inside aiService)
  });

  const parsed = safeParseJSON(raw) || { answer: raw, confidence: "sufficient", reason: "Unparsed fallback." };
  return {
    answer: parsed.answer || "I couldn't generate a confident answer — could you rephrase your question?",
    confidence: parsed.confidence === "sufficient" ? "sufficient" : "insufficient",
    path: ["decisionNode"],
  };
}

/** Node 4a: Retry / Alt Path — widened retrieval + an alternate tool, then loops back to the decision node. */
async function retryPathNode(state) {
  return { retryCount: state.retryCount + 1, path: ["retryPath"] };
}

/** Node 4b: Finalize — the "Pass -> Final Answer" terminal node. */
async function finalizeNode(state) {
  return { path: ["finalize"] };
}

/** Branching logic straight off the diagram: confident -> finalize, else -> retry (capped). */
function routeAfterDecision(state) {
  if (state.confidence === "sufficient" || state.retryCount >= MAX_RETRIES) return "finalize";
  return "retryPath";
}

function buildGraph() {
  const graph = new StateGraph(GraphState)
    .addNode("ragRetrieve", ragRetrieveNode)
    .addNode("toolCall", toolCallNode)
    .addNode("decisionNode", decisionNode)
    .addNode("retryPath", retryPathNode)
    .addNode("finalize", finalizeNode)
    .addEdge(START, "ragRetrieve")
    .addEdge("ragRetrieve", "toolCall")
    .addEdge("toolCall", "decisionNode")
    .addConditionalEdges("decisionNode", routeAfterDecision, { finalize: "finalize", retryPath: "retryPath" })
    .addEdge("retryPath", "ragRetrieve") // re-retrieve with a broadened query + alt tool, then re-decide
    .addEdge("finalize", END);

  return graph.compile();
}

let compiledGraph = null;
function getGraph() {
  if (!compiledGraph) compiledGraph = buildGraph();
  return compiledGraph;
}

/**
 * Runs the Hybrid Agent Graph for one chat turn.
 * @param {{history: Array<{role:string,text:string}>, message: string, language: string}} params
 */
async function runHybridAgent({ history = [], message, language = "en", userName = "", userProfile = {}, userClassLevel = "degree" }) {
  const chatHistoryText = history
    .slice(-6)
    .map((m) => `${m.role === "user" ? "Student" : "Mentor"}: ${m.text}`)
    .join("\n");

  const graph = getGraph();
  const result = await graph.invoke({
    input: message,
    chatHistoryText,
    language,
    userName,
    userProfile,
    userClassLevel,
    ragContext: "",
    toolUsed: "none",
    toolResult: "",
    answer: "",
    confidence: "insufficient",
    retryCount: 0,
    path: [],
  });

  return { reply: result.answer, toolsUsed: [result.toolUsed].filter((t) => t !== "none"), path: result.path, retries: result.retryCount };
}

module.exports = { runHybridAgent };
