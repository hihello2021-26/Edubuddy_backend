const mongoose = require("mongoose");

// Unified feed item. Two kinds share this collection:
//  1) Broadcast items from the News & Notification Agent (admissions,
//     internships, hackathons, competitions) — `user` is left unset and
//     they're filtered by targetClassLevels for everyone.
//  2) Personal items created by the Automation Service in response to a
//     specific student's actions (profile/CGPA/skills changes, resume
//     analysis, interview completion, weekly reports) — `user` is set and
//     only that student sees them, with a `read` flag they can toggle.
const NotificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "admission",
        "internship",
        "hackathon",
        "competition",
        "exam_alert",
        "scholarship_alert",
        "profile_update",
        "resume_update",
        "interview_update",
        "learning_reminder",
        "weekly_report",
        "general",
      ],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    link: { type: String, default: "" },
    targetClassLevels: [{ type: String, enum: ["10", "puc12", "degree", "all"] }],
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    read: { type: Boolean, default: false },
    source: { type: String, enum: ["agent", "automation"], default: "agent" },
    dedupeKey: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);
