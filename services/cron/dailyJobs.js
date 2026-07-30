const cron = require("node-cron");
const { runGovExamAgentDaily } = require("../agents/govExamAgent");
const { runNewsAgentDaily } = require("../agents/newsNotificationAgent");
const { generateDailyContent } = require("../agents/dailyContentAgent");
const DailyContent = require("../../models/DailyContent");
const User = require("../../models/User");
const Resume = require("../../models/Resume");
const PlacementReadiness = require("../../models/PlacementReadiness");
const { notifyUser } = require("../automationService");

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/** Daily job 5/6: generate + cache today's learning topic and quiz (upsert, so re-runs just refresh it). */
async function generateAndCacheDailyContent() {
  const generated = await generateDailyContent();
  const dateKey = todayKey();
  const doc = await DailyContent.findOneAndUpdate(
    { dateKey },
    { dateKey, ...generated },
    { upsert: true, new: true }
  );
  return doc;
}

/**
 * Weekly job: for every student, generate a short career/placement report
 * notification (current Placement Readiness score) and a resume-improvement
 * reminder if they have no resume on file or their latest one is 14+ days old.
 * Runs in small batches so it stays reasonable even with many users.
 */
async function runWeeklyReports() {
  const users = await User.find({}).select("_id").lean();
  const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;
  let reportsSent = 0;
  let remindersSent = 0;

  for (const u of users) {
    try {
      const readiness = await PlacementReadiness.findOne({ user: u._id }).lean();
      const overall = readiness?.overallScore ?? 0;

      await notifyUser(u._id, {
        type: "weekly_report",
        title: "Your weekly placement report",
        body:
          overall > 0
            ? `Your current Placement Readiness score is ${overall}/100. Keep building — check the breakdown for what to focus on next.`
            : "You haven't generated a Placement Readiness score yet — analyze your resume or complete a mock interview to get started.",
        link: "/mock-interview",
      });
      reportsSent++;

      const latestResume = await Resume.findOne({ user: u._id }).sort({ createdAt: -1 }).select("createdAt").lean();
      const isStale = !latestResume || Date.now() - new Date(latestResume.createdAt).getTime() > TWO_WEEKS_MS;
      if (isStale) {
        await notifyUser(u._id, {
          type: "resume_update",
          title: "Resume improvement reminder",
          body: latestResume
            ? "It's been a couple of weeks since your last resume check — re-run the ATS Analyzer to catch up on new suggestions."
            : "You haven't analyzed a resume yet — upload one to get your ATS score and personalized fixes.",
          link: "/resume",
        });
        remindersSent++;
      }
    } catch (err) {
      console.warn(`⚠️ Weekly report failed for user ${u._id}:`, err.message);
    }
  }

  return { usersProcessed: users.length, reportsSent, remindersSent };
}

/**
 * Schedules EduBuddy's background automation:
 *  - Daily (default 6 AM): Government Exam Agent, News & Notification Agent
 *    (scholarship deadlines / job listings / internships / career news feed
 *    into the same collections these agents already maintain), and the new
 *    Daily Learning Topic + Daily Quiz generator.
 *  - Weekly (default Sunday 7 AM): career/placement report + resume
 *    improvement reminders, sent to every student as personal notifications.
 * Controlled by ENABLE_CRON / DAILY_AGENT_CRON / WEEKLY_AGENT_CRON in .env,
 * off by default in local dev to avoid surprise API usage.
 */
function startDailyAgentCron() {
  if (process.env.ENABLE_CRON !== "true") {
    console.log("ℹ️  Daily/weekly agent cron is disabled (set ENABLE_CRON=true in .env to enable).");
    return;
  }

  const dailySchedule = process.env.DAILY_AGENT_CRON || "0 6 * * *"; // default: 6 AM daily
  const weeklySchedule = process.env.WEEKLY_AGENT_CRON || "0 7 * * 0"; // default: 7 AM every Sunday

  cron.schedule(dailySchedule, async () => {
    console.log(`⏰ Running daily agents (${new Date().toISOString()})...`);
    try {
      const govSummary = await runGovExamAgentDaily();
      console.log("✅ Government Exam Agent summary:", govSummary);
    } catch (err) {
      console.error("❌ Government Exam Agent cron run failed:", err.message);
    }
    try {
      const newsSummary = await runNewsAgentDaily();
      console.log("✅ News & Notification Agent summary:", newsSummary);
    } catch (err) {
      console.error("❌ News & Notification Agent cron run failed:", err.message);
    }
    try {
      const content = await generateAndCacheDailyContent();
      console.log("✅ Daily Content Agent generated:", content.learningTopic.title);
    } catch (err) {
      console.error("❌ Daily Content Agent cron run failed:", err.message);
    }
  });
  console.log(`🗓️  Daily agent cron scheduled: "${dailySchedule}"`);

  cron.schedule(weeklySchedule, async () => {
    console.log(`⏰ Running weekly reports (${new Date().toISOString()})...`);
    try {
      const summary = await runWeeklyReports();
      console.log("✅ Weekly reports summary:", summary);
    } catch (err) {
      console.error("❌ Weekly reports cron run failed:", err.message);
    }
  });
  console.log(`🗓️  Weekly report cron scheduled: "${weeklySchedule}"`);
}

module.exports = { startDailyAgentCron, generateAndCacheDailyContent, runWeeklyReports };
