const crypto = require("crypto");
const { webSearch } = require("../searchService");
const { generateText, safeParseJSON } = require("../aiService");
const GovExam = require("../../models/GovExam");
const sources = require("../../data/govExamSources");

function dedupeKeyFor(category, title, link) {
  return crypto.createHash("sha1").update(`${category}|${title}|${link}`).digest("hex");
}

/**
 * Government Exam Agent
 * ---------------------
 * For every tracked category (UPSC, KPSC, SSC, IBPS, RRB, Defence, Banking,
 * Railways, Police, Teaching, PSU, ISRO, DRDO, NIC, State PSC, Forest,
 * Insurance, Judiciary, and general central/state recruitment), this agent:
 *   1. Runs a live web search (services/searchService.js)
 *   2. Asks Gemini to extract structured notification data from the results
 *   3. Upserts each notification into MongoDB, deduped by a hash key
 *
 * Intended to run once a day via node-cron (see services/cron/dailyJobs.js),
 * but can also be triggered manually via scripts/runGovExamAgentOnce.js or
 * the /api/admin/run-govexam-agent endpoint.
 */
async function runGovExamAgentForCategory({ category, searchQuery }) {
  const results = await webSearch(searchQuery, { numResults: 6 });

  if (!results.length) {
    return { category, created: 0, note: "No search results (check SERPER_API_KEY/TAVILY_API_KEY)." };
  }

  const systemInstruction = `You are the Government Exam Agent inside EduBuddy. Given raw web search
snippets about "${category}" government recruitment, extract up to 4 distinct, genuine notifications.
Respond ONLY with strict JSON, no markdown fences, in this exact shape:
{"notifications": [{"title": "string", "organization": "string", "summary": "string (25-40 words)", "officialLink": "string (best matching URL from the snippets)"}]}
If the snippets don't contain real recruitment notifications, return {"notifications": []}.`;

  const userPrompt = `SEARCH RESULTS:\n${results
    .map((r, i) => `${i + 1}. ${r.title}\n${r.snippet}\nLink: ${r.link}`)
    .join("\n\n")}`;

  const raw = await generateText(systemInstruction, userPrompt, { temperature: 0.3, maxOutputTokens: 700, json: true, provider: "groq" }); // Study/Exam Planning -> Groq
  const parsed = safeParseJSON(raw) || { notifications: [] };

  let created = 0;
  for (const n of parsed.notifications || []) {
    const dedupeKey = dedupeKeyFor(category, n.title, n.officialLink);
    try {
      await GovExam.updateOne(
        { dedupeKey },
        {
          $setOnInsert: {
            category,
            title: n.title,
            organization: n.organization,
            summary: n.summary,
            officialLink: n.officialLink,
            sourceUrl: results[0]?.link || "",
            dedupeKey,
          },
        },
        { upsert: true }
      );
      created++;
    } catch (err) {
      console.warn(`⚠️ Could not upsert gov exam notification: ${err.message}`);
    }
  }

  return { category, created };
}

/** Runs the agent across every tracked category. Safe to call daily via cron. */
async function runGovExamAgentDaily() {
  const summary = [];
  for (const src of sources) {
    try {
      const result = await runGovExamAgentForCategory(src);
      summary.push(result);
    } catch (err) {
      console.error(`❌ GovExamAgent failed for ${src.category}:`, err.message);
      summary.push({ category: src.category, created: 0, error: err.message });
    }
  }
  return summary;
}

module.exports = { runGovExamAgentDaily, runGovExamAgentForCategory };
