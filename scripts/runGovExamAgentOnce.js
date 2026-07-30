// Manual one-off run: `npm run run:govexam-agent`
require("dotenv").config();
const connectDB = require("../config/db");
const { runGovExamAgentDaily } = require("../services/agents/govExamAgent");

(async () => {
  await connectDB();
  console.log("Running Government Exam Agent once...");
  const summary = await runGovExamAgentDaily();
  console.table(summary);
  process.exit(0);
})();
