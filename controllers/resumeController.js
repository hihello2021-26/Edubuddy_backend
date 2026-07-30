const pdfParse = require("pdf-parse");
const Resume = require("../models/Resume");
const { runResumeAtsAgent } = require("../services/agents/resumeAtsAgent");
const automationService = require("../services/automationService");

// POST /api/resume/analyze  (multipart/form-data: file, targetRole)
// The Resume & ATS Agent is file-upload driven: the student uploads a PDF or
// .txt resume, we extract the raw text server-side (pdf-parse), then hand
// that text to Gemini for ATS-style scoring. A rawText JSON fallback is
// still accepted for programmatic/API use, but the frontend always sends a file.
exports.analyze = async (req, res) => {
  try {
    let rawText = "";
    let fileName = "";

    if (req.file) {
      fileName = req.file.originalname;
      if (req.file.mimetype === "application/pdf") {
        const parsed = await pdfParse(req.file.buffer);
        rawText = parsed.text;
      } else {
        rawText = req.file.buffer.toString("utf-8");
      }
    } else if (req.body.rawText) {
      rawText = req.body.rawText;
    }

    if (!rawText.trim()) {
      return res.status(400).json({ message: "No resume file was received, or it appears to be empty. Please upload a PDF or .txt file." });
    }

    const analysis = await runResumeAtsAgent({ resumeText: rawText, targetRole: req.body.targetRole });

    const resume = await Resume.create({
      user: req.userId,
      fileName,
      rawText,
      targetRole: req.body.targetRole || "",
      ...analysis,
    });

    // Event-Based Automation: resume uploaded -> ATS analysis already just
    // ran above; now update Placement Readiness and notify the student.
    try {
      await automationService.handleResumeAnalyzed({ userId: req.userId, resume });
    } catch (err) {
      console.warn("⚠️ Automation (resume analyzed) failed:", err.message);
    }

    res.status(201).json({ resume });
  } catch (err) {
    res.status(500).json({ message: "Resume & ATS Agent failed.", error: err.message });
  }
};

// GET /api/resume/history
exports.history = async (req, res) => {
  const resumes = await Resume.find({ user: req.userId }).select("-rawText").sort({ createdAt: -1 });
  res.json({ resumes });
};
