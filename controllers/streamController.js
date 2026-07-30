const User = require("../models/User");
const { runCareerCounselorAgent } = require("../services/agents/careerCounselorAgent");
const { runRoadmapAgent } = require("../services/agents/roadmapAgent");
const class10Streams = require("../data/class10StreamData");
const puc12Options = require("../data/puc12HigherEdData");

// POST /api/streams/counselor -> Career Agent (AI counselor) for Class 10 students
exports.getCounselorRecommendation = async (req, res) => {
  try {
    const { aptitude, interests, marks, personality, goals } = req.body;
    const result = await runCareerCounselorAgent({ aptitude, interests, marks, personality, goals });

    // attach XP + badge for completing the AI counselor assessment
    await User.findByIdAndUpdate(req.userId, {
      $inc: { xp: 25 },
      $addToSet: { badges: { code: "ai_counselor_complete", title: "Consulted the AI Counselor" } },
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Career Agent failed.", error: err.message });
  }
};

// POST /api/streams/roadmap -> Education Roadmap Agent for a chosen stream
exports.getStreamRoadmap = async (req, res) => {
  try {
    const { classLevel, stream, paths = [] } = req.body;
    const roadmap = await runRoadmapAgent({ classLevel, stream, paths: paths.map((title) => ({ title })) });
    res.json({ roadmap });
  } catch (err) {
    res.status(500).json({ message: "Roadmap Agent failed.", error: err.message });
  }
};

// GET /api/streams/class10 -> raw comparison data (no AI call, instant)
exports.getClass10Streams = (req, res) => res.json({ streams: class10Streams });

// GET /api/streams/puc12 -> raw higher-education comparison data
exports.getPuc12Options = (req, res) => res.json({ options: puc12Options });
