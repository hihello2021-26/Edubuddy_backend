const { runSkillGapAgent } = require("../services/agents/skillGapAgent");

// POST /api/skills/gap -> { currentSkills, targetRole }
exports.analyze = async (req, res) => {
  try {
    const { currentSkills, targetRole } = req.body;
    if (!targetRole) return res.status(400).json({ message: "targetRole is required." });
    const result = await runSkillGapAgent({ currentSkills, targetRole });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Skill Gap Analyzer Agent failed.", error: err.message });
  }
};
