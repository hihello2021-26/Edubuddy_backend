// Manual one-off run: `npm run run:news-agent`
require("dotenv").config();
const connectDB = require("../config/db");
const { runNewsAgentDaily } = require("../services/agents/newsNotificationAgent");

(async () => {
  await connectDB();
  console.log("Running News & Notification Agent once...");
  const summary = await runNewsAgentDaily();
  console.table(summary);
  process.exit(0);
})();
