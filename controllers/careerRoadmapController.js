const { runCareerRoadmapAgent } = require("../services/agents/careerRoadmapAgent");
const User = require("../models/User");

// POST /api/career/roadmap -> { field, classLevel }
exports.generate = async (req, res) => {
  try {
    const { field, classLevel } = req.body;
    if (!field?.trim()) return res.status(400).json({ message: "field is required (e.g. 'Engineering', 'Medicine', 'Data Science')." });

    const roadmap = await runCareerRoadmapAgent({ field, classLevel: classLevel || "puc12" });

    await User.findByIdAndUpdate(req.userId, {
      $inc: { xp: 15 },
      $addToSet: { badges: { code: "roadmap_generated", title: "Generated a Career Roadmap" } },
    });

    res.json(roadmap);
  } catch (err) {
    res.status(500).json({ message: "Career Roadmap Agent failed.", error: err.message });
  }
};
