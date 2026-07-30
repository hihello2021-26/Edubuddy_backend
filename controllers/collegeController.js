const { runCollegePredictor } = require("../services/agents/collegeRecommendationAgent");

// POST /api/college/predict -> College Recommendation Agent
exports.predict = async (req, res) => {
  try {
    const { classLevel, targetCourse, discipline, rank, marks, entranceScores, location } = req.body;
    if (!targetCourse) return res.status(400).json({ message: "targetCourse is required." });
    const result = await runCollegePredictor({ classLevel, targetCourse, discipline, rank, marks, entranceScores, location });
    res.json(result);
  } catch (err) {


    res.status(500).json({ message: "College Recommendation Agent failed.", error: err.message });
  }
};
