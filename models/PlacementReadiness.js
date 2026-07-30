const mongoose = require("mongoose");

// One document per user. Each sub-score is updated independently by the
// Automation Service whenever the relevant event happens (resume analyzed,
// skill gap run, mock interview completed, etc.) rather than all at once —
// `null` means "not yet measured" so the frontend can show "Not started"
// instead of a misleading 0.
const PlacementReadinessSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    resumeScore: { type: Number, default: null }, // from latest Resume & ATS Agent run
    skillsScore: { type: Number, default: null }, // from latest Skill Gap Analyzer run
    projectsScore: { type: Number, default: null }, // self-reported project count/quality
    codingScore: { type: Number, default: null }, // self-reported coding practice score
    interviewScore: { type: Number, default: null }, // average of completed mock interview scores
    communicationScore: { type: Number, default: null }, // derived from interview feedback
    overallScore: { type: Number, default: 0 }, // weighted average of whichever sub-scores exist
    history: [
      {
        overallScore: Number,
        recordedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

/** Recomputes overallScore as the average of whichever sub-scores are non-null. */
PlacementReadinessSchema.methods.recomputeOverall = function () {
  const fields = ["resumeScore", "skillsScore", "projectsScore", "codingScore", "interviewScore", "communicationScore"];
  const values = fields.map((f) => this[f]).filter((v) => typeof v === "number");
  this.overallScore = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  return this.overallScore;
};

module.exports = mongoose.model("PlacementReadiness", PlacementReadinessSchema);
