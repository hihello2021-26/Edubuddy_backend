require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { startDailyAgentCron } = require("./services/cron/dailyJobs");

const authRoutes = require("./routes/authRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const chatRoutes = require("./routes/chatRoutes");
const knowledgeRoutes = require("./routes/knowledgeRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const streamRoutes = require("./routes/streamRoutes");
const collegeRoutes = require("./routes/collegeRoutes");
const scholarshipRoutes = require("./routes/scholarshipRoutes");
const govExamRoutes = require("./routes/govExamRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const placementRoutes = require("./routes/placementRoutes");
const skillGapRoutes = require("./routes/skillGapRoutes");
const progressRoutes = require("./routes/progressRoutes");
const careerRoadmapRoutes = require("./routes/careerRoadmapRoutes");
const resumeBuilderRoutes = require("./routes/resumeBuilderRoutes");
const dailyContentRoutes = require("./routes/dailyContentRoutes");

const app = express();

connectDB();
// Start scheduled daily agent jobs only when ENABLE_CRON is truthy
if (process.env.ENABLE_CRON && process.env.ENABLE_CRON.toLowerCase() === "true") {
  startDailyAgentCron();
} else {
  console.log("Daily agent cron disabled (ENABLE_CRON != true)");
}

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "EduBuddy backend", time: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/knowledge", knowledgeRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/streams", streamRoutes);
app.use("/api/college", collegeRoutes);
app.use("/api/scholarships", scholarshipRoutes);
app.use("/api/govexams", govExamRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/placement", placementRoutes);
app.use("/api/skills", skillGapRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/career", careerRoadmapRoutes);
app.use("/api/resume-builder", resumeBuilderRoutes);
app.use("/api/daily-content", dailyContentRoutes);

// Fallback 404
app.use((req, res) => res.status(404).json({ message: "Route not found." }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Unexpected server error.", error: err.message });
});

const BASE_PORT = Number(process.env.PORT || 5000);
const MAX_PORT = BASE_PORT + 10;

function startServer(port) {
  const server = app.listen(port, () => console.log(`🚀 EduBuddy backend running on http://localhost:${port}`));

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`⚠️ Port ${port} is already in use.`);
      const nextPort = port + 1;
      if (nextPort <= MAX_PORT) {
        console.log(`Trying port ${nextPort}...`);
        startServer(nextPort);
      } else {
        console.error(`❌ No available port found between ${BASE_PORT} and ${MAX_PORT}.`);
        process.exit(1);
      }
    } else {
      console.error("Server startup error:", err);
      process.exit(1);
    }
  });
}

startServer(BASE_PORT);

