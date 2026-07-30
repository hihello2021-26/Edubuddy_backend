require("dotenv").config();
const crypto = require("crypto");
const connectDB = require("./config/db");
const KnowledgeDoc = require("./models/KnowledgeDoc");
const Scholarship = require("./models/Scholarship");
const { embedText } = require("./services/geminiService");
const seedData = require("./data/knowledgeSeed");
const scholarshipKB = require("./data/scholarshipKnowledgeBase");

function dedupeKeyFor(...parts) {
  return crypto.createHash("sha1").update(parts.join("|")).digest("hex");
}

async function seedKnowledgeBase() {
  console.log(`Seeding ${seedData.length} RAG knowledge documents...`);
  await KnowledgeDoc.deleteMany({});

  let embedded = 0;
  for (const item of seedData) {
    let embedding = [];
    try {
      embedding = await embedText(`${item.title}\n${item.content}`);
      embedded++;
    } catch (err) {
      console.warn(`⚠️  Could not embed "${item.title}" (will use keyword fallback at query time): ${err.message}`);
    }
    await KnowledgeDoc.create({ ...item, embedding });
  }
  console.log(`✅ RAG seed complete. ${embedded}/${seedData.length} documents embedded with Gemini.`);
}

/**
 * Seeds the structured Scholarship collection directly from
 * scholarshipKnowledgeBase.js, so the Scholarship Finder page has real,
 * curated results immediately — without needing a live search API key or a
 * News Agent run first. The News & Notification Agent can still add more
 * scholarships on top of these via its daily web-search pipeline.
 */
async function seedScholarships() {
  console.log(`Seeding ${scholarshipKB.length} curated scholarships...`);
  let created = 0;
  for (const s of scholarshipKB) {
    const dedupeKey = dedupeKeyFor("curated-scholarship", s.key);
    const result = await Scholarship.updateOne(
      { dedupeKey },
      {
        $set: {
          title: s.title,
          provider: s.provider,
          eligibility: s.eligibility,
          amount: s.benefits,
          applyLink: s.applyLink,
          targetClassLevels: s.targetClassLevels,
          tags: s.tags,
          dedupeKey,
        },
      },
      { upsert: true }
    );
    if (result.upsertedCount) created++;
  }
  console.log(`✅ Scholarship collection seeded (${created} new, ${scholarshipKB.length - created} already present).`);
}

async function run() {
  await connectDB();
  await seedKnowledgeBase();
  await seedScholarships();
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
