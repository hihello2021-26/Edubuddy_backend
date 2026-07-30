// Manual one-off run: `npm run run:automation`
// Useful for demos — generates today's Daily Content and runs the weekly
// report/reminder job immediately instead of waiting for the cron schedule.
require("dotenv").config();
const connectDB = require("../config/db");
const { generateAndCacheDailyContent, runWeeklyReports } = require("../services/cron/dailyJobs");

(async () => {
  await connectDB();

  console.log("Generating today's Daily Content (learning topic + quiz)...");
  const content = await generateAndCacheDailyContent();
  console.log("✅ Daily Content:", content.learningTopic.title);

  console.log("Running weekly career/placement reports + resume reminders...");
  const summary = await runWeeklyReports();
  console.table(summary);

  process.exit(0);
})();
