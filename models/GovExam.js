const mongoose = require("mongoose");

// Populated daily by the Government Exam Agent (services/agents/govExamAgent.js).
// One document per notification/recruitment update.
const GovExamSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: [
        "UPSC", "KPSC", "SSC", "IBPS", "RRB", "Defence", "Banking", "Railways",
        "Police", "Teaching", "PSU", "ISRO", "DRDO", "NIC", "State PSC",
        "Forest", "Insurance", "Judiciary", "Other Central/State",
      ],
      required: true,
    },
    title: { type: String, required: true },
    organization: { type: String, default: "" },
    summary: { type: String, default: "" },
    postDate: { type: Date },
    lastDate: { type: Date },
    officialLink: { type: String, default: "" },
    sourceUrl: { type: String, default: "" },
    tags: [{ type: String }],
    // Dedup key so the daily agent doesn't create duplicate rows for the same notification
    dedupeKey: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

GovExamSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model("GovExam", GovExamSchema);
