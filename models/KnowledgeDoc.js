const mongoose = require("mongoose");

// This collection is the RAG knowledge base: streams, degree courses,
// career paths, and government colleges. Each doc is embedded with the
// Gemini embedding model so the RAG service can do vector similarity search.
const KnowledgeDocSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ["stream", "course", "career", "college", "exam", "scholarship"],
      required: true,
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    tags: [{ type: String }],
    embedding: { type: [Number], default: [] }, // vector embedding for RAG
  },
  { timestamps: true }
);

module.exports = mongoose.model("KnowledgeDoc", KnowledgeDocSchema);
