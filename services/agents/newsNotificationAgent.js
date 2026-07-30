const crypto = require("crypto");
const { webSearch } = require("../searchService");
const { generateText, safeParseJSON } = require("../aiService");
const Notification = require("../../models/Notification");
const Scholarship = require("../../models/Scholarship");

const FEED_QUERIES = [
  { type: "admission", query: "latest college admission notification India last date to apply" },
  { type: "internship", query: "latest student internship openings India apply" },
  { type: "hackathon", query: "latest student hackathon India registration open" },
  { type: "competition", query: "latest student competition olympiad India registration" },
];

const SCHOLARSHIP_QUERY = "latest scholarship for students India apply online last date";

function dedupeKeyFor(...parts) {
  return crypto.createHash("sha1").update(parts.join("|")).digest("hex");
}

/**
 * News & Notification Agent
 * Aggregates admissions, internships, hackathons, competitions, and
 * scholarships into a single unified feed (Notification + Scholarship
 * collections) that the frontend renders as daily alerts.
 */
async function runNewsAgentDaily() {
  const summary = [];

  for (const feed of FEED_QUERIES) {
    try {
      const results = await webSearch(feed.query, { numResults: 5 });
      if (!results.length) {
        summary.push({ type: feed.type, created: 0, note: "No search results (check search API key)." });
        continue;
      }

      const systemInstruction = `You are the News & Notification Agent inside EduBuddy. Given raw web
search snippets about "${feed.type}" opportunities for Indian students, extract up to 4 genuine items.
Respond ONLY with strict JSON: {"items": [{"title": "string", "body": "string (20-35 words)", "link": "string"}]}`;
      const userPrompt = results.map((r, i) => `${i + 1}. ${r.title}\n${r.snippet}\nLink: ${r.link}`).join("\n\n");

      const raw = await generateText(systemInstruction, userPrompt, { temperature: 0.4, maxOutputTokens: 600, json: true, provider: "groq" }); // General AI Assistant -> Groq
      const parsed = safeParseJSON(raw) || { items: [] };

      let created = 0;
      for (const item of parsed.items || []) {
        const dedupeKey = dedupeKeyFor(feed.type, item.title, item.link);
        await Notification.updateOne(
          { dedupeKey },
          {
            $setOnInsert: {
              type: feed.type,
              title: item.title,
              body: item.body,
              link: item.link,
              targetClassLevels: ["all"],
              dedupeKey,
            },
          },
          { upsert: true }
        );
        created++;
      }
      summary.push({ type: feed.type, created });
    } catch (err) {
      console.error(`❌ NewsAgent failed for ${feed.type}:`, err.message);
      summary.push({ type: feed.type, created: 0, error: err.message });
    }
  }

  // Scholarships get their own collection (richer schema: amount, deadline, eligibility)
  try {
    const results = await webSearch(SCHOLARSHIP_QUERY, { numResults: 6 });
    if (results.length) {
      const systemInstruction = `You are the Scholarship Agent inside EduBuddy. Given raw web search
snippets about scholarships for Indian students, extract up to 5 genuine scholarships.
Respond ONLY with strict JSON: {"scholarships": [{"title": "string", "provider": "string", "eligibility": "string (short)", "amount": "string", "applyLink": "string"}]}`;
      const userPrompt = results.map((r, i) => `${i + 1}. ${r.title}\n${r.snippet}\nLink: ${r.link}`).join("\n\n");
      const raw = await generateText(systemInstruction, userPrompt, { temperature: 0.4, maxOutputTokens: 700, json: true, provider: "groq" }); // General AI Assistant -> Groq
      const parsed = safeParseJSON(raw) || { scholarships: [] };

      let created = 0;
      for (const s of parsed.scholarships || []) {
        const dedupeKey = dedupeKeyFor("scholarship", s.title, s.applyLink);
        await Scholarship.updateOne(
          { dedupeKey },
          {
            $setOnInsert: {
              title: s.title,
              provider: s.provider,
              eligibility: s.eligibility,
              amount: s.amount,
              applyLink: s.applyLink,
              targetClassLevels: ["all"],
              dedupeKey,
            },
          },
          { upsert: true }
        );
        created++;
      }
      summary.push({ type: "scholarship", created });
    }
  } catch (err) {
    console.error("❌ ScholarshipAgent failed:", err.message);
    summary.push({ type: "scholarship", created: 0, error: err.message });
  }

  return summary;
}

module.exports = { runNewsAgentDaily };
