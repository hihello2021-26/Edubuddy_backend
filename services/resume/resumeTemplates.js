// Shared visual config for the 5 Resume Builder templates. Both the DOCX
// renderer (docx.js) and the PDF renderer (pdfkit.js) read from this single
// source so the two export formats stay visually consistent per template.
const TEMPLATES = {
  professional: {
    label: "Professional",
    description: "Classic single-column layout — safe choice for corporate roles.",
    accentColor: "1F3A5F", // navy
    accentColorHex: "#1F3A5F",
    font: "Times-Roman",
    fontBold: "Times-Bold",
    docxFont: "Times New Roman",
    headerCase: "none",
    layout: "single",
  },
  ats: {
    label: "ATS-Friendly",
    description: "Pure plain text, no colors/tables/columns — maximum parser compatibility.",
    accentColor: "000000",
    accentColorHex: "#000000",
    font: "Helvetica",
    fontBold: "Helvetica-Bold",
    docxFont: "Arial",
    headerCase: "upper",
    layout: "single",
  },
  modern: {
    label: "Modern",
    description: "Bold accent headers, confident spacing — good general-purpose choice.",
    accentColor: "0F766E", // teal
    accentColorHex: "#0F766E",
    font: "Helvetica",
    fontBold: "Helvetica-Bold",
    docxFont: "Calibri",
    headerCase: "none",
    layout: "single",
  },
  minimal: {
    label: "Minimal",
    description: "Lots of whitespace, understated typography — great for design-adjacent roles.",
    accentColor: "555555", // gray
    accentColorHex: "#555555",
    font: "Helvetica",
    fontBold: "Helvetica-Bold",
    docxFont: "Calibri",
    headerCase: "upper",
    layout: "single",
    minimalSpacing: true,
  },
  creative: {
    label: "Creative",
    description: "Two-column layout with a colored sidebar — stands out visually.",
    accentColor: "7C3AED", // violet
    accentColorHex: "#7C3AED",
    font: "Helvetica",
    fontBold: "Helvetica-Bold",
    docxFont: "Calibri",
    headerCase: "none",
    layout: "twoColumn",
  },
};

function getTemplate(name) {
  return TEMPLATES[name] || TEMPLATES.professional;
}

module.exports = { TEMPLATES, getTemplate };
