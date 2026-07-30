const Scholarship = require("../models/Scholarship");

// GET /api/scholarships?classLevel=puc12
exports.list = async (req, res) => {
  const { classLevel } = req.query;
  const filter = classLevel ? { targetClassLevels: { $in: [classLevel, "all"] } } : {};
  const scholarships = await Scholarship.find(filter).sort({ createdAt: -1 }).limit(50);
  res.json({ scholarships });
};
