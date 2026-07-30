const KnowledgeDoc = require("../models/KnowledgeDoc");
const { retrieveRelevantDocs } = require("../services/ragService");

// GET /api/knowledge?category=career
exports.list = async (req, res) => {
  const { category } = req.query;
  const filter = category ? { category } : {};
  const docs = await KnowledgeDoc.find(filter).select("-embedding").sort({ title: 1 });
  res.json({ docs });
};

// GET /api/knowledge/search?q=...
exports.search = async (req, res) => {
  const { q, category } = req.query;
  if (!q) return res.status(400).json({ message: "Query param 'q' is required." });
  const docs = await retrieveRelevantDocs(q, { topK: 8, category: category || null });
  res.json({ docs: docs.map(({ embedding, ...rest }) => rest) });
};
