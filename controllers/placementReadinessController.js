const { getOrCreateReadiness } = require("../services/automationService");
const PlacementReadiness = require("../models/PlacementReadiness");

// GET /api/placement/readiness -> the current student's automation-maintained readiness scores
exports.getMine = async (req, res) => {
  try {
    const doc = await getOrCreateReadiness(req.userId);
    res.json({ readiness: doc });
  } catch (err) {
    res.status(500).json({ message: "Could not load placement readiness.", error: err.message });
  }
};

// PATCH /api/placement/readiness -> self-report projectsScore / codingScore (0-100 each)
// These two sub-scores have no automatic data source yet, so the student can
// set them directly (e.g. "I've built 4 solid projects" -> a self-assessed score).
exports.updateSelfReported = async (req, res) => {
  try {
    const { projectsScore, codingScore } = req.body;
    const update = {};
    if (typeof projectsScore === "number") update.projectsScore = Math.max(0, Math.min(100, projectsScore));
    if (typeof codingScore === "number") update.codingScore = Math.max(0, Math.min(100, codingScore));

    const doc = await PlacementReadiness.findOneAndUpdate(
      { user: req.userId },
      { $set: update },
      { new: true, upsert: true }
    );
    doc.recomputeOverall();
    await doc.save();
    res.json({ readiness: doc });
  } catch (err) {
    res.status(500).json({ message: "Could not update placement readiness.", error: err.message });
  }
};
