const mongoose = require("mongoose");

const AssessmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    classLevel: { type: String, required: true },
    answers: { type: mongoose.Schema.Types.Mixed, required: true }, // raw quiz answers
    interests: [{ type: String }],
    strengths: [{ type: String }],

    // Outputs of the agentic pipeline (each agent writes its own section)
    profileSummary: { type: String, default: "" }, // Agent 1: Profile Analyzer
    streamRecommendation: {
      primary: String,
      alternatives: [String],
      reasoning: String,
    }, // Agent 2: Stream Recommender
    careerPaths: [
      {
        title: String,
        description: String,
        matchScore: Number,
        requiredCourses: [String],
      },
    ], // Agent 3: Career Path Agent
    roadmap: [
      {
        stage: String,
        title: String,
        description: String,
        timeline: String,
      },
    ], // Agent 4: Roadmap Agent

    ragSources: [{ type: String }], // titles of retrieved docs used as context
    status: { type: String, enum: ["pending", "processing", "completed", "failed"], default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Assessment", AssessmentSchema);
