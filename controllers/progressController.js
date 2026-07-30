const User = require("../models/User");

const LEVEL_XP = 100; // XP needed per level, kept simple & transparent

// GET /api/progress -> XP, level, badges (used by the analytics/badge shelf UI)
exports.getProgress = async (req, res) => {
  const user = await User.findById(req.userId).select("xp badges name classLevel");
  if (!user) return res.status(404).json({ message: "User not found." });

  const level = Math.floor(user.xp / LEVEL_XP) + 1;
  const xpIntoLevel = user.xp % LEVEL_XP;

  res.json({
    xp: user.xp,
    level,
    xpIntoLevel,
    xpForNextLevel: LEVEL_XP,
    badges: user.badges,
  });
};
