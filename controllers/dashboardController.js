const User = require("../models/User");
const class10Streams = require("../data/class10StreamData");
const puc12Options = require("../data/puc12HigherEdData");
const degreeOptions = require("../data/degreeOptionsData");
const automationService = require("../services/automationService");

// GET /api/dashboard - returns the right dataset bundle based on the user's classLevel
exports.getDashboard = async (req, res) => {
  const user = await User.findById(req.userId).select("-password");
  if (!user) return res.status(404).json({ message: "User not found." });

  let payload = { classLevel: user.classLevel, user };

  if (user.classLevel === "10") {
    payload.streams = class10Streams;
  } else if (user.classLevel === "puc12") {
    payload.higherEducation = puc12Options;
  } else if (user.classLevel === "degree") {
    payload.degreeOptions = degreeOptions;
  }

  res.json(payload);
};

// PATCH /api/dashboard/class-level - lets a student switch which dashboard they see
exports.updateClassLevel = async (req, res) => {
  const { classLevel } = req.body;
  if (!["10", "puc12", "degree", "other"].includes(classLevel)) {
    return res.status(400).json({ message: "Invalid classLevel." });
  }
  const user = await User.findByIdAndUpdate(req.userId, { classLevel }, { new: true }).select("-password");
  res.json({ user });
};

// PATCH /api/dashboard/profile - updates marks/aptitude/interests/personality/goals/skills
exports.updateProfile = async (req, res) => {
  const allowed = ["marks", "entranceScores", "aptitude", "interests", "personality", "goals", "skills", "targetRole"];
  const update = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[`profile.${key}`] = req.body[key];
  }

  const beforeUser = await User.findById(req.userId).select("profile classLevel");
  const beforeProfile = beforeUser ? JSON.parse(JSON.stringify(beforeUser.profile || {})) : {};

  const user = await User.findByIdAndUpdate(req.userId, { $set: update }, { new: true }).select("-password");

  // Event-Based Automation: profile/CGPA/skills changes -> re-check
  // scholarship eligibility, recommend internships, refresh recommendations.
  // Awaited (not fire-and-forget) so the notification exists as soon as this
  // request returns — best-effort: a failure here must never break the save.
  try {
    await automationService.handleProfileUpdated({
      userId: req.userId,
      before: beforeProfile,
      after: user.profile || {},
      classLevel: user.classLevel,
    });
  } catch (err) {
    console.warn("⚠️ Automation (profile update) failed:", err.message);
  }

  res.json({ user });
};

// PATCH /api/dashboard/preferences - theme + language
exports.updatePreferences = async (req, res) => {
  const update = {};
  if (req.body.theme) update.theme = req.body.theme;
  if (req.body.preferredLanguage) update.preferredLanguage = req.body.preferredLanguage;
  const user = await User.findByIdAndUpdate(req.userId, update, { new: true }).select("-password");
  res.json({ user });
};
