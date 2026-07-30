const mongoose = require("mongoose");

const ResumeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fileName: { type: String, default: "" },
    rawText: { type: String, required: true },
    targetRole: { type: String, default: "" },
    atsScore: { type: Number, default: 0 },
    categoryScores: {
      formatting: { type: Number, default: 0 },
      keywords: { type: Number, default: 0 },
      content: { type: Number, default: 0 },
      structure: { type: Number, default: 0 },
    },
    strengths: [{ type: String }],
    gaps: [{ type: String }],
    missingKeywords: [{ type: String }],
    suggestions: [{ type: String }],
    grammarIssues: [{ type: String }],
    weakActionVerbs: [
      {
        found: String,
        replaceWith: String,
      },
    ],
    recommendedSkills: [{ type: String }],
    improvedSummary: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resume", ResumeSchema);
