const KnowledgeDoc = require("../models/KnowledgeDoc");
const { embedText } = require("./geminiService");

/** Cosine similarity between two equal-length vectors. */
function cosineSimilarity(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Retrieval-Augmented Generation core: embeds the query, compares it against
 * every embedded doc in the knowledge base, and returns the top-k most
 * relevant documents to be injected as context for the LLM agents.
 */
async function retrieveRelevantDocs(query, { topK = 5, category = null } = {}) {
  const filter = category ? { category } : {};
  const docs = await KnowledgeDoc.find(filter).lean();

  if (!docs.length) return [];

  let queryEmbedding = [];
  try {
    queryEmbedding = await embedText(query);
  } catch (err) {
    console.warn("⚠️ Embedding failed, falling back to keyword search:", err.message);
    return keywordFallback(query, docs, topK);
  }

  const scored = docs
    .filter((d) => d.embedding && d.embedding.length)
    .map((d) => ({ doc: d, score: cosineSimilarity(queryEmbedding, d.embedding) }));

  if (!scored.length) return keywordFallback(query, docs, topK);

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map((s) => s.doc);
}

/** Simple keyword-overlap fallback used if embeddings are unavailable (e.g. no API key yet). */
function keywordFallback(query, docs, topK) {
  const terms = query.toLowerCase().split(/\W+/).filter(Boolean);
  const scored = docs.map((d) => {
    const haystack = (d.title + " " + d.content + " " + (d.tags || []).join(" ")).toLowerCase();
    const score = terms.reduce((acc, t) => acc + (haystack.includes(t) ? 1 : 0), 0);
    return { doc: d, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map((s) => s.doc);
}

/** Formats retrieved docs into a context block to paste into an LLM prompt. */
function formatContext(docs) {
  if (!docs.length) return "No additional reference material found.";
  return docs
    .map((d, i) => `[Source ${i + 1}: ${d.title} | category: ${d.category}]\n${d.content}`)
    .join("\n\n");
}

module.exports = { retrieveRelevantDocs, formatContext, cosineSimilarity };
