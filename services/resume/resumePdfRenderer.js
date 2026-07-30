const PDFDocument = require("pdfkit");
const { getTemplate } = require("./resumeTemplates");

function headerText(text, tpl) {
  return tpl.headerCase === "upper" ? text.toUpperCase() : text;
}

function addHeading(doc, text, tpl, x, width) {
  doc.moveDown(tpl.minimalSpacing ? 0.9 : 0.6);
  doc.font(tpl.fontBold).fontSize(12).fillColor(tpl.accentColorHex).text(headerText(text, tpl), x, doc.y, { width });
  const lineY = doc.y + 2;
  doc.moveTo(x, lineY).lineTo(x + width, lineY).strokeColor(tpl.accentColorHex).lineWidth(1).stroke();
  doc.moveDown(0.4);
  doc.fillColor("#111111");
}

function addBody(doc, text, tpl, x, width, opts = {}) {
  doc.font(opts.bold ? tpl.fontBold : tpl.font).fontSize(opts.size || 10).fillColor(opts.color || "#111111");
  doc.text(text, x, doc.y, { width, italics: opts.italics });
  doc.moveDown(0.15);
}

function addBullet(doc, text, tpl, x, width) {
  doc.font(tpl.font).fontSize(10).fillColor("#111111");
  doc.text(`•  ${text}`, x, doc.y, { width, indent: 0 });
  doc.moveDown(0.1);
}

/** Renders the main resume content (education/projects/internships/etc.) at position x with given width. */
function renderMainContent(doc, data, tpl, x, width, { includeContact = true } = {}) {
  const p = data.personalInfo || {};

  doc.font(tpl.fontBold).fontSize(22).fillColor(tpl.accentColorHex).text(p.fullName || "Your Name", x, doc.y, { width });
  doc.moveDown(0.2);

  if (includeContact) {
    const contactLine = [p.email, p.phone, p.location].filter(Boolean).join("   |   ");
    if (contactLine) addBody(doc, contactLine, tpl, x, width, { size: 9, color: "#444444" });
    const links = [data.socialLinks?.github, data.socialLinks?.linkedin, data.socialLinks?.portfolio].filter(Boolean).join("   |   ");
    if (links) addBody(doc, links, tpl, x, width, { size: 9, italics: true, color: "#444444" });
  }

  if (p.summary) {
    addHeading(doc, "Summary", tpl, x, width);
    addBody(doc, p.summary, tpl, x, width);
  }

  if (data.education?.length) {
    addHeading(doc, "Education", tpl, x, width);
    data.education.forEach((e) => {
      addBody(doc, `${e.degree || ""}${e.fieldOfStudy ? ` in ${e.fieldOfStudy}` : ""} — ${e.institution || ""}`, tpl, x, width, { bold: true });
      const meta = [e.startYear && e.endYear ? `${e.startYear} - ${e.endYear}` : e.endYear, e.gradeOrCgpa].filter(Boolean).join("   •   ");
      if (meta) addBody(doc, meta, tpl, x, width, { size: 9, italics: true, color: "#555555" });
    });
  }

  if (data.projects?.length) {
    addHeading(doc, "Projects", tpl, x, width);
    data.projects.forEach((proj) => {
      addBody(doc, `${proj.title || "Untitled Project"}${proj.link ? `  (${proj.link})` : ""}`, tpl, x, width, { bold: true });
      if (proj.description) addBullet(doc, proj.description, tpl, x, width);
      if (proj.techStack?.length) addBody(doc, `Tech: ${proj.techStack.join(", ")}`, tpl, x, width, { size: 9, italics: true, color: "#555555" });
    });
  }

  if (data.internships?.length) {
    addHeading(doc, "Internships / Experience", tpl, x, width);
    data.internships.forEach((i) => {
      addBody(doc, `${i.role || ""} — ${i.organization || ""}`, tpl, x, width, { bold: true });
      const dates = [i.startDate, i.endDate].filter(Boolean).join(" - ");
      if (dates) addBody(doc, dates, tpl, x, width, { size: 9, italics: true, color: "#555555" });
      if (i.description) addBullet(doc, i.description, tpl, x, width);
    });
  }

  if (data.certifications?.length) {
    addHeading(doc, "Certifications", tpl, x, width);
    data.certifications.forEach((c) => addBullet(doc, `${c.title || ""}${c.issuer ? ` — ${c.issuer}` : ""}${c.year ? ` (${c.year})` : ""}`, tpl, x, width));
  }

  if (data.achievements?.length) {
    addHeading(doc, "Achievements", tpl, x, width);
    data.achievements.forEach((a) => addBullet(doc, a, tpl, x, width));
  }
}

function renderExtrasSingleColumn(doc, data, tpl, x, width) {
  if (data.skills?.length) {
    addHeading(doc, "Skills", tpl, x, width);
    addBody(doc, data.skills.join("   •   "), tpl, x, width);
  }
  if (data.softSkills?.length) {
    addHeading(doc, "Soft Skills", tpl, x, width);
    addBody(doc, data.softSkills.join("   •   "), tpl, x, width);
  }
  if (data.languages?.length) {
    addHeading(doc, "Languages", tpl, x, width);
    addBody(doc, data.languages.join("   •   "), tpl, x, width);
  }
  if (data.interests?.length) {
    addHeading(doc, "Interests", tpl, x, width);
    addBody(doc, data.interests.join("   •   "), tpl, x, width);
  }
}

function renderSidebar(doc, data, tpl, x, width, topY) {
  doc.fillColor("#FFFFFF");
  let y = topY;
  doc.font(tpl.fontBold).fontSize(12).text("Contact", x, y, { width });
  y = doc.y + 4;

  const p = data.personalInfo || {};
  [p.email, p.phone, p.location].filter(Boolean).forEach((line) => {
    doc.font(tpl.font).fontSize(9).text(line, x, y, { width });
    y = doc.y + 2;
  });
  [data.socialLinks?.github, data.socialLinks?.linkedin, data.socialLinks?.portfolio].filter(Boolean).forEach((line) => {
    doc.font(tpl.font).fontSize(8).text(line, x, y, { width });
    y = doc.y + 2;
  });

  const block = (title, items) => {
    if (!items?.length) return;
    y += 10;
    doc.font(tpl.fontBold).fontSize(12).text(title, x, y, { width });
    y = doc.y + 4;
    items.forEach((it) => {
      doc.font(tpl.font).fontSize(9).text(`• ${it}`, x, y, { width });
      y = doc.y + 2;
    });
  };

  block("Skills", data.skills);
  block("Soft Skills", data.softSkills);
  block("Languages", data.languages);
  block("Interests", data.interests);
}

/**
 * Renders a ResumeBuilder document into a PDF Buffer for the given template
 * name. Assumes a single-page resume for the "creative" sidebar background
 * (a reasonable simplification for a student-project resume length).
 */
function renderResumePdf(data, templateName) {
  const tpl = getTemplate(templateName);
  const doc = new PDFDocument({ margin: 40, size: "A4" });
  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  if (tpl.layout === "twoColumn") {
    const sidebarWidth = pageWidth * 0.32;
    doc.rect(0, 0, sidebarWidth, pageHeight).fill(tpl.accentColorHex);

    renderSidebar(doc, data, tpl, 25, sidebarWidth - 50, 40);

    const mainX = sidebarWidth + 30;
    const mainWidth = pageWidth - mainX - 40;
    doc.fillColor("#111111");
    doc.x = mainX;
    doc.y = 40;
    renderMainContent(doc, data, tpl, mainX, mainWidth, { includeContact: false });
  } else {
    const x = doc.page.margins.left;
    const width = pageWidth - x - doc.page.margins.right;
    renderMainContent(doc, data, tpl, x, width, { includeContact: true });
    renderExtrasSingleColumn(doc, data, tpl, x, width);
  }

  doc.end();
  return done;
}

module.exports = { renderResumePdf };
