const DailyContent = require("../models/DailyContent");
const { generateDailyContent } = require("../services/agents/dailyContentAgent");

function todayKey() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

// GET /api/daily-content -> today's learning topic + quiz.
// If the cron job hasn't run yet today (e.g. ENABLE_CRON=false in local dev),
// this generates and caches it on first request instead of 404ing, so the
// feature still works without cron enabled.
exports.getToday = async (req, res) => {
  try {
    const dateKey = todayKey();
    let doc = await DailyContent.findOne({ dateKey });
    if (!doc) {
      const generated = await generateDailyContent();
      doc = await DailyContent.create({ dateKey, ...generated });
    }
    res.json({ dailyContent: doc });
  } catch (err) {
    res.status(500).json({ message: "Daily Content Agent failed.", error: err.message });
  }
};
