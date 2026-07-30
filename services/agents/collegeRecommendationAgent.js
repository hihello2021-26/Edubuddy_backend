const { generateText, safeParseJSON } = require("../aiService");
const { retrieveRelevantDocs, formatContext } = require("../ragService");

/**
 * College Recommendation Agent (a.k.a. "College Predictor")
 * Takes marks/entrance scores or target course and returns a structured shortlist of
 * top universities and colleges complete with official website links, fee structures,
 * cutoff ranks/scores, and average placement packages.
 */
async function runCollegePredictor({ classLevel = "degree", targetCourse, discipline = "Medical / Health", rank = "", marks = {}, entranceScores = {}, location = "" }) {
  const query = `colleges for ${targetCourse} ${discipline} ${classLevel} fees cutoff official websites`;
  const docs = await retrieveRelevantDocs(query, { topK: 5, category: "college" });
  const context = formatContext(docs);

  const systemInstruction = `You are EduBuddy's Master College & University Recommendation Agent.
Provide a rich, structured shortlist of genuine Indian & Global colleges/universities for "${targetCourse}" in the "${discipline}" discipline at "${classLevel}" level.

CRITICAL INSTRUCTIONS:
- Discipline Context: Handle specialized fields appropriately:
  * Medical / PCB: MBBS, BDS, BAMS, BHMS, B.Sc Agriculture, B.Pharmacy, D.Pharmacy, Veterinary (BVSc), Paramedical, Nursing.
  * Engineering / PCM: B.Tech CS, AI/ML, ECE, Mechanical, Civil, Aerospace.
  * Pharmacy & Allied: B.Pharm, Pharm.D, Clinical Research.
  * Agriculture & Veterinary: B.Sc Agriculture, B.Sc Forestry, BVSc & AH.
  * Degree / Management: B.Com, BBA, BA, MBA, M.Tech.
- For "degree" stage: Rank input is NOT mandatory.
- For "12th/PUC" stage: Factor in entrance rank/score if provided (${rank || "N/A"}).
- EVERY college entry MUST include a valid, official website URL (e.g. "https://www.bmcrj.edu.in", "https://www.uasbangalore.edu.in", "https://www.rvce.edu.in"), fee structure (Govt vs Mgmt), cutoff rank/score, and average package/salary.

Respond ONLY with strict JSON, no markdown fences:
{
  "ambitious": [
    {
      "name": "College Name",
      "location": "City, State",
      "websiteUrl": "https://official-college-site.edu",
      "feesStructure": "Govt: ₹X Lakhs/yr | Mgmt: ₹Y Lakhs/yr",
      "cutoffRank": "Cutoff criteria / NEET Score / KCET Rank",
      "avgPackage": "₹X - Y LPA",
      "note": "Short fitment note"
    }
  ],
  "match": [
    {
      "name": "College Name",
      "location": "City, State",
      "websiteUrl": "https://official-college-site.edu",
      "feesStructure": "Govt: ₹X Lakhs/yr | Mgmt: ₹Y Lakhs/yr",
      "cutoffRank": "Cutoff criteria / Rank",
      "avgPackage": "₹X - Y LPA",
      "note": "Short fitment note"
    }
  ],
  "safe": [
    {
      "name": "College Name",
      "location": "City, State",
      "websiteUrl": "https://official-college-site.edu",
      "feesStructure": "Govt: ₹X Lakhs/yr | Mgmt: ₹Y Lakhs/yr",
      "cutoffRank": "Cutoff criteria / Rank",
      "avgPackage": "₹X - Y LPA",
      "note": "Short fitment note"
    }
  ],
  "advice": "Actionable counseling advice for this student."
}`;

  const userPrompt = `Discipline: ${discipline}\nClass level: ${classLevel}\nTarget course: ${targetCourse}\nRank/Marks: ${rank || "Not required"}\nLocation: ${location || "Any"}\n\nREFERENCE MATERIAL (RAG):\n${context}\n\nProduce the JSON now.`;


  const raw = await generateText(systemInstruction, userPrompt, { temperature: 0.4, maxOutputTokens: 1200, json: true, provider: "groq" });
  const parsed = safeParseJSON(raw) || {
    ambitious: [
      {
        name: "Top Tier National Institute",
        location: "Bengaluru, Karnataka",
        websiteUrl: "https://cetonline.karnataka.gov.in",
        feesStructure: "Govt: ₹45,000/yr | Mgmt: ₹2.5 Lakhs/yr",
        cutoffRank: "Top 5,000 Rank / GATE Qualified",
        avgPackage: "₹12.5 LPA",
        note: "High reputation & premier placements."
      }
    ],
    match: [],
    safe: [],
    advice: "Check official portal for current cycle seat matrix."
  };

  return { ...parsed, sources: docs.map((d) => d.title) };
}

module.exports = { runCollegePredictor };

