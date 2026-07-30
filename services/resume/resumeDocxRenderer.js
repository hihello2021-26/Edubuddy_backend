const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
} = require("docx");
const { getTemplate } = require("./resumeTemplates");

function headerText(text, tpl) {
  return tpl.headerCase === "upper" ? text.toUpperCase() : text;
}

function sectionHeading(text, tpl, color = tpl.accentColor) {
  return new Paragraph({
    spacing: { before: 240, after: 100 },
    border: { bottom: { color, space: 2, style: BorderStyle.SINGLE, size: 6 } },
    children: [
      new TextRun({ text: headerText(text, tpl), bold: true, color, font: tpl.docxFont, size: 22 }),
    ],
  });
}

function bulletParagraph(text, tpl, opts = {}) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, font: tpl.docxFont, size: 20, ...opts })],
  });
}

function plainParagraph(text, tpl, opts = {}) {
  return new Paragraph({
    spacing: { after: 60 },
    children: [new TextRun({ text, font: tpl.docxFont, size: 20, ...opts })],
  });
}

/** Builds the shared body content (used by every template's main column). */
function buildBodyParagraphs(data, tpl, { includeContact = true } = {}) {
  const paragraphs = [];
  const p = data.personalInfo || {};

  paragraphs.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: p.fullName || "Your Name", bold: true, size: 40, font: tpl.docxFont, color: tpl.accentColor })],
    })
  );

  if (includeContact) {
    const contactLine = [p.email, p.phone, p.location].filter(Boolean).join("  |  ");
    if (contactLine) paragraphs.push(plainParagraph(contactLine, tpl, { size: 18 }));
    const links = [data.socialLinks?.github, data.socialLinks?.linkedin, data.socialLinks?.portfolio].filter(Boolean).join("  |  ");
    if (links) paragraphs.push(plainParagraph(links, tpl, { size: 18, italics: true }));
  }

  if (p.summary) {
    paragraphs.push(sectionHeading("Summary", tpl));
    paragraphs.push(plainParagraph(p.summary, tpl));
  }

  if (data.education?.length) {
    paragraphs.push(sectionHeading("Education", tpl));
    data.education.forEach((e) => {
      paragraphs.push(
        plainParagraph(`${e.degree || ""}${e.fieldOfStudy ? ` in ${e.fieldOfStudy}` : ""} — ${e.institution || ""}`, tpl, { bold: true })
      );
      const meta = [e.startYear && e.endYear ? `${e.startYear} - ${e.endYear}` : e.endYear, e.gradeOrCgpa].filter(Boolean).join("  •  ");
      if (meta) paragraphs.push(plainParagraph(meta, tpl, { size: 18, italics: true }));
    });
  }

  if (data.projects?.length) {
    paragraphs.push(sectionHeading("Projects", tpl));
    data.projects.forEach((proj) => {
      paragraphs.push(plainParagraph(`${proj.title || "Untitled Project"}${proj.link ? `  (${proj.link})` : ""}`, tpl, { bold: true }));
      if (proj.description) paragraphs.push(bulletParagraph(proj.description, tpl));
      if (proj.techStack?.length) paragraphs.push(plainParagraph(`Tech: ${proj.techStack.join(", ")}`, tpl, { size: 18, italics: true }));
    });
  }

  if (data.internships?.length) {
    paragraphs.push(sectionHeading("Internships / Experience", tpl));
    data.internships.forEach((i) => {
      paragraphs.push(plainParagraph(`${i.role || ""} — ${i.organization || ""}`, tpl, { bold: true }));
      const dates = [i.startDate, i.endDate].filter(Boolean).join(" - ");
      if (dates) paragraphs.push(plainParagraph(dates, tpl, { size: 18, italics: true }));
      if (i.description) paragraphs.push(bulletParagraph(i.description, tpl));
    });
  }

  if (data.certifications?.length) {
    paragraphs.push(sectionHeading("Certifications", tpl));
    data.certifications.forEach((c) => {
      paragraphs.push(bulletParagraph(`${c.title || ""}${c.issuer ? ` — ${c.issuer}` : ""}${c.year ? ` (${c.year})` : ""}`, tpl));
    });
  }

  if (data.achievements?.length) {
    paragraphs.push(sectionHeading("Achievements", tpl));
    data.achievements.forEach((a) => paragraphs.push(bulletParagraph(a, tpl)));
  }

  return paragraphs;
}

/** Sidebar content used only by the "creative" two-column template. */
function buildSidebarParagraphs(data, tpl) {
  const paragraphs = [];
  const p = data.personalInfo || {};
  const white = "FFFFFF";

  paragraphs.push(new Paragraph({ children: [new TextRun({ text: "Contact", bold: true, color: white, font: tpl.docxFont, size: 22 })], spacing: { after: 80 } }));
  [p.email, p.phone, p.location].filter(Boolean).forEach((line) =>
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: line, color: white, font: tpl.docxFont, size: 18 })], spacing: { after: 40 } }))
  );
  [data.socialLinks?.github, data.socialLinks?.linkedin, data.socialLinks?.portfolio].filter(Boolean).forEach((line) =>
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: line, color: white, font: tpl.docxFont, size: 16 })], spacing: { after: 40 } }))
  );

  if (data.skills?.length) {
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: "Skills", bold: true, color: white, font: tpl.docxFont, size: 22 })], spacing: { before: 200, after: 80 } }));
    data.skills.forEach((s) => paragraphs.push(new Paragraph({ children: [new TextRun({ text: `• ${s}`, color: white, font: tpl.docxFont, size: 18 })], spacing: { after: 30 } })));
  }

  if (data.softSkills?.length) {
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: "Soft Skills", bold: true, color: white, font: tpl.docxFont, size: 22 })], spacing: { before: 200, after: 80 } }));
    data.softSkills.forEach((s) => paragraphs.push(new Paragraph({ children: [new TextRun({ text: `• ${s}`, color: white, font: tpl.docxFont, size: 18 })], spacing: { after: 30 } })));
  }

  if (data.languages?.length) {
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: "Languages", bold: true, color: white, font: tpl.docxFont, size: 22 })], spacing: { before: 200, after: 80 } }));
    data.languages.forEach((l) => paragraphs.push(new Paragraph({ children: [new TextRun({ text: l, color: white, font: tpl.docxFont, size: 18 })], spacing: { after: 30 } })));
  }

  if (data.interests?.length) {
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: "Interests", bold: true, color: white, font: tpl.docxFont, size: 22 })], spacing: { before: 200, after: 80 } }));
    data.interests.forEach((it) => paragraphs.push(new Paragraph({ children: [new TextRun({ text: it, color: white, font: tpl.docxFont, size: 18 })], spacing: { after: 30 } })));
  }

  return paragraphs;
}

/** Skills/languages/soft-skills/interests block for single-column templates. */
function buildExtrasParagraphs(data, tpl) {
  const paragraphs = [];
  if (data.skills?.length) {
    paragraphs.push(sectionHeading("Skills", tpl));
    paragraphs.push(plainParagraph(data.skills.join("  •  "), tpl));
  }
  if (data.softSkills?.length) {
    paragraphs.push(sectionHeading("Soft Skills", tpl));
    paragraphs.push(plainParagraph(data.softSkills.join("  •  "), tpl));
  }
  if (data.languages?.length) {
    paragraphs.push(sectionHeading("Languages", tpl));
    paragraphs.push(plainParagraph(data.languages.join("  •  "), tpl));
  }
  if (data.interests?.length) {
    paragraphs.push(sectionHeading("Interests", tpl));
    paragraphs.push(plainParagraph(data.interests.join("  •  "), tpl));
  }
  return paragraphs;
}

/**
 * Renders a ResumeBuilder document into a .docx Buffer for the given
 * template name ("professional" | "ats" | "modern" | "minimal" | "creative").
 */
async function renderResumeDocx(data, templateName) {
  const tpl = getTemplate(templateName);

  let children;
  if (tpl.layout === "twoColumn") {
    const sidebarCell = new TableCell({
      width: { size: 30, type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, color: "auto", fill: tpl.accentColor },
      margins: { top: 200, bottom: 200, left: 150, right: 150 },
      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
      children: buildSidebarParagraphs(data, tpl),
    });
    const mainCell = new TableCell({
      width: { size: 70, type: WidthType.PERCENTAGE },
      margins: { top: 200, bottom: 200, left: 200, right: 150 },
      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
      children: buildBodyParagraphs(data, tpl, { includeContact: false }),
    });

    children = [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
          insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
        },
        rows: [new TableRow({ children: [sidebarCell, mainCell] })],
      }),
    ];
  } else {
    children = [...buildBodyParagraphs(data, tpl), ...buildExtrasParagraphs(data, tpl)];
  }

  const doc = new Document({
    sections: [
      {
        properties: { page: { margin: { top: 500, bottom: 500, left: 500, right: 500 } } },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

module.exports = { renderResumeDocx };
