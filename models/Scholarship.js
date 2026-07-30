const mongoose = require("mongoose");

const ScholarshipSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    provider: { type: String, default: "" },
    eligibility: { type: String, default: "" },
    amount: { type: String, default: "" },
    deadline: { type: Date },
    applyLink: { type: String, default: "" },
    targetClassLevels: [{ type: String, enum: ["10", "puc12", "degree", "all"] }],
    tags: [{ type: String }],
    dedupeKey: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Scholarship", ScholarshipSchema);
