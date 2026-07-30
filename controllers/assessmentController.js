const Assessment = require("../models/Assessment");
const { runAgentPipeline } = require("../services/agents/orchestrator");

// POST /api/assessments  -> create + run the full agentic pipeline
exports.createAssessment = async (req, res) => {
  try {
    const { classLevel, answers, interests = [], strengths = [] } = req.body;
    if (!classLevel || !answers) {
      return res.status(400).json({ message: "classLevel and answers are required." });
    }

    const assessment = await Assessment.create({
      user: req.userId,
      classLevel,
      answers,
      interests,
      strengths,
      status: "processing",
    });

    const result = await runAgentPipeline({ classLevel, answers, interests, strengths });

    assessment.profileSummary = result.profileSummary;
    assessment.streamRecommendation = result.streamRecommendation;
    assessment.careerPaths = result.careerPaths;
    assessment.roadmap = result.roadmap;
    assessment.ragSources = result.ragSources;
    assessment.status = "completed";
    await assessment.save();

    res.status(201).json({ assessment });
  } catch (err) {
    console.error("Assessment pipeline error:", err);
    res.status(500).json({ message: "Could not complete the AI assessment.", error: err.message });
  }
};

// GET /api/assessments -> list current user's assessments (most recent first)
exports.getMyAssessments = async (req, res) => {
  const assessments = await Assessment.find({ user: req.userId }).sort({ createdAt: -1 });
  res.json({ assessments });
};

// GET /api/assessments/:id
exports.getAssessment = async (req, res) => {
  const assessment = await Assessment.findOne({ _id: req.params.id, user: req.userId });
  if (!assessment) return res.status(404).json({ message: "Assessment not found." });
  res.json({ assessment });
};
