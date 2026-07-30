const mongoose = require("mongoose");

// One document per user (their single "working" resume in the builder).
// Deliberately flat/flexible sub-schemas (no _id required on subdocs isn't
// disabled — Mongoose gives each an _id automatically, which the frontend
// uses as a stable React key for edit/delete/reorder).
const ResumeBuilderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },

    personalInfo: {
      fullName: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      location: { type: String, default: "" },
      summary: { type: String, default: "" }, // can be AI-generated
    },

    education: [
      {
        institution: String,
        degree: String,
        fieldOfStudy: String,
        startYear: String,
        endYear: String,
        gradeOrCgpa: String,
      },
    ],

    projects: [
      {
        title: String,
        description: String, // can be AI-generated/improved
        techStack: [String],
        link: String,
      },
    ],

    skills: [{ type: String }],

    internships: [
      {
        organization: String,
        role: String,
        startDate: String,
        endDate: String,
        description: String, // can be AI-generated/improved
      },
    ],

    certifications: [
      {
        title: String,
        issuer: String,
        year: String,
      },
    ],

    achievements: [{ type: String }],
    languages: [{ type: String }],
    softSkills: [{ type: String }],
    interests: [{ type: String }],

    socialLinks: {
      github: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      portfolio: { type: String, default: "" },
    },

    template: {
      type: String,
      enum: ["professional", "ats", "modern", "minimal", "creative"],
      default: "professional",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ResumeBuilder", ResumeBuilderSchema);
