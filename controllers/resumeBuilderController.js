const ResumeBuilder = require("../models/ResumeBuilder");
const { generateSummary, improveBullet, generateProjectDescription } = require("../services/agents/resumeBuilderAgent");
const { renderResumeDocx } = require("../services/resume/resumeDocxRenderer");
const { renderResumePdf } = require("../services/resume/resumePdfRenderer");
const { TEMPLATES } = require("../services/resume/resumeTemplates");

const ALLOWED_SECTIONS = [
  "personalInfo",
  "education",
  "projects",
  "skills",
  "internships",
  "certifications",
  "achievements",
  "languages",
  "softSkills",
  "interests",
  "socialLinks",
  "template",
];

// GET /api/resume-builder -> the student's single working resume (auto-created empty if none yet)
exports.getMine = async (req, res) => {
  try {
    let doc = await ResumeBuilder.findOne({ user: req.userId });
    if (!doc) doc = await ResumeBuilder.create({ user: req.userId });
    res.json({ resume: doc, templates: TEMPLATES });
  } catch (err) {
    res.status(500).json({ message: "Could not load your resume.", error: err.message });
  }
};

// PUT /api/resume-builder -> full or partial save (whitelisted sections only)
exports.save = async (req, res) => {
  try {
    const update = {};
    for (const key of ALLOWED_SECTIONS) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    const doc = await ResumeBuilder.findOneAndUpdate({ user: req.userId }, { $set: update }, { new: true, upsert: true });
    res.json({ resume: doc });
  } catch (err) {
    res.status(500).json({ message: "Could not save your resume.", error: err.message });
  }
};

// POST /api/resume-builder/generate -> { field: "summary"|"bullet"|"project", ...payload }
// One shared endpoint for every "Generate with AI" button in the builder UI.
exports.generate = async (req, res) => {
  try {
    const { field } = req.body;

    if (field === "summary") {
      const { fullName, targetRole, skills, education, experienceHighlights } = req.body;
      const text = await generateSummary({ fullName, targetRole, skills, education, experienceHighlights });
      return res.json({ text });
    }

    if (field === "bullet") {
      const { text, context, targetRole } = req.body;
      const improved = await improveBullet({ text, context, targetRole });
      return res.json({ text: improved });
    }

    if (field === "project") {
      const { title, techStack, targetRole } = req.body;
      const text = await generateProjectDescription({ title, techStack, targetRole });
      return res.json({ text });
    }

    return res.status(400).json({ message: "Unknown field. Use 'summary', 'bullet', or 'project'." });
  } catch (err) {
    res.status(500).json({ message: "Resume Builder AI generation failed.", error: err.message });
  }
};

async function loadResumeOrFail(req, res) {
  const doc = await ResumeBuilder.findOne({ user: req.userId }).lean();
  if (!doc || !doc.personalInfo?.fullName) {
    res.status(400).json({ message: "Add at least your name before exporting — save the Personal Info section first." });
    return null;
  }
  return doc;
}

// GET /api/resume-builder/export/docx?template=modern
exports.exportDocx = async (req, res) => {
  try {
    const doc = await loadResumeOrFail(req, res);
    if (!doc) return;
    const template = req.query.template || doc.template || "professional";
    const buffer = await renderResumeDocx(doc, template);
    const fileName = `${(doc.personalInfo.fullName || "resume").replace(/\s+/g, "_")}_${template}.docx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ message: "DOCX export failed.", error: err.message });
  }
};

// GET /api/resume-builder/export/pdf?template=modern
exports.exportPdf = async (req, res) => {
  try {
    const doc = await loadResumeOrFail(req, res);
    if (!doc) return;
    const template = req.query.template || doc.template || "professional";
    const buffer = await renderResumePdf(doc, template);
    const fileName = `${(doc.personalInfo.fullName || "resume").replace(/\s+/g, "_")}_${template}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ message: "PDF export failed.", error: err.message });
  }
};
