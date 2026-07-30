const crypto = require("crypto");
const Notification = require("../models/Notification");
const PlacementReadiness = require("../models/PlacementReadiness");
const Resume = require("../models/Resume");
const Scholarship = require("../models/Scholarship");
const { suggestInternshipsForSkills } = require("./agents/internshipSuggestionAgent");

/**
 * Automation Service
 * -------------------
 * Central place for EduBuddy's event-based automation. Controllers call
 * these functions right after the triggering action succeeds; every
 * function is deliberately best-effort (wrapped in try/catch by the caller)
 * so a notification/automation failure never breaks the user-facing request
 * that triggered it.
 *
 * Event map (per the project spec):
 *   profile changed      -> handleProfileUpdated()      -> regenerate recommendations
 *   resume uploaded       -> handleResumeAnalyzed()       -> auto ATS analysis + readiness update
 *   CGPA/marks changed    -> handleProfileUpdated()       -> re-check scholarship eligibility
 *   skills changed        -> handleProfileUpdated()       -> recommend internships
 *   interview completed   -> handleInterviewCompleted()   -> update placement readiness
 */

/** Creates a personal (per-user) notification. Safe to call even if it throws — callers should try/catch. */
async function notifyUser(userId, { type, title, body = "", link = "" }) {
  return Notification.create({
    type,
    title,
    body,
    link,
    user: userId,
    source: "automation",
    dedupeKey: `${type}:${userId}:${Date.now()}:${crypto.randomBytes(4).toString("hex")}`,
  });
}

/** Fetches (or lazily creates) the PlacementReadiness doc for a user. */
async function getOrCreateReadiness(userId) {
  let doc = await PlacementReadiness.findOne({ user: userId });
  if (!doc) doc = await PlacementReadiness.create({ user: userId });
  return doc;
}

/** Applies a partial score update, recomputes the overall score, and logs a history point. */
async function updateReadiness(userId, partialScores) {
  const doc = await getOrCreateReadiness(userId);
  Object.assign(doc, partialScores);
  doc.recomputeOverall();
  doc.history.push({ overallScore: doc.overallScore });
  if (doc.history.length > 30) doc.history = doc.history.slice(-30); // keep it bounded
  await doc.save();
  return doc;
}

/**
 * Event: profile changed (dashboardController.updateProfile).
 * Diffs `before` vs `after` user.profile and fires the specific sub-events
 * the spec calls for, plus a generic "recommendations refreshed" notice.
 */
async function handleProfileUpdated({ userId, before = {}, after = {}, classLevel = "degree" }) {
  const results = { notified: [] };

  const marksChanged = JSON.stringify(before.marks || {}) !== JSON.stringify(after.marks || {});
  const skillsChanged = JSON.stringify(before.skills || []) !== JSON.stringify(after.skills || []);
  const anyChange = marksChanged || skillsChanged || before.interests !== after.interests || before.goals !== after.goals;

  if (marksChanged) {
    // Re-check scholarship eligibility: a lightweight, real check against the
    // structured Scholarship collection's CGPA/marks-style eligibility text.
    const scholarships = await Scholarship.find({}).limit(50).lean();
    const marksValue = extractHighestMark(after.marks);
    const matched = scholarships.filter((s) => scholarshipLooksEligible(s, marksValue));

    await notifyUser(userId, {
      type: "scholarship_alert",
      title: "Scholarship eligibility updated",
      body:
        matched.length > 0
          ? `Your updated marks now qualify you for ${matched.length} scholarship${matched.length === 1 ? "" : "s"} in our database — check the Scholarship Finder.`
          : "Your marks were updated. We rechecked scholarship eligibility — no new matches found in the current database, but check the Scholarship Finder for full listings.",
      link: "/scholarships",
    });
    results.notified.push("scholarship_alert");
  }

  if (skillsChanged && after.skills?.length) {
    try {
      const { suggestions } = await suggestInternshipsForSkills({
        skills: after.skills,
        classLevel,
        interests: after.interests || [],
      });
      if (suggestions.length) {
        await notifyUser(userId, {
          type: "internship",
          title: "New internship suggestions based on your skills",
          body: suggestions.map((s) => `${s.role}: ${s.whyFit}`).join(" | "),
          link: "/skill-gap",
        });
        results.notified.push("internship");
      }
    } catch (err) {
      console.warn("⚠️ Automation: internship suggestion generation failed:", err.message);
    }
  }

  if (anyChange) {
    await notifyUser(userId, {
      type: "profile_update",
      title: "Your recommendations were refreshed",
      body: "Your profile changed, so career paths, roadmap, and scholarship matches will reflect the update next time you open them.",
      link: "/dashboard",
    });
    results.notified.push("profile_update");
  }

  return results;
}

/** Event: resume uploaded & analyzed (resumeController.analyze, right after ATS scoring). */
async function handleResumeAnalyzed({ userId, resume }) {
  await updateReadiness(userId, { resumeScore: resume.atsScore });
  await notifyUser(userId, {
    type: "resume_update",
    title: `Resume analyzed — ATS score ${resume.atsScore}/100`,
    body:
      resume.atsScore >= 75
        ? "Strong score! Check the suggestions tab for the last few polish items."
        : "There's real room to improve — check strengths/gaps/suggestions on the Resume page.",
    link: "/resume",
  });
}

/** Event: mock interview marked complete (placementController.mockInterview with complete=true). */
async function handleInterviewCompleted({ userId, score, communicationScore }) {
  const doc = await getOrCreateReadiness(userId);
  const newInterviewScore =
    typeof doc.interviewScore === "number" ? Math.round((doc.interviewScore + score) / 2) : score;
  await updateReadiness(userId, {
    interviewScore: newInterviewScore,
    communicationScore: communicationScore ?? doc.communicationScore,
  });
  await notifyUser(userId, {
    type: "interview_update",
    title: `Mock interview completed — score ${score}/100`,
    body: "Your Placement Readiness score has been updated with this result.",
    link: "/mock-interview",
  });
}

/** Helper: extracts the highest numeric mark from a flexible `profile.marks` object. */
function extractHighestMark(marks = {}) {
  const values = Object.values(marks)
    .filter((v) => typeof v === "number" || (typeof v === "string" && !isNaN(parseFloat(v))))
    .map((v) => parseFloat(v));
  return values.length ? Math.max(...values) : null;
}

/** Helper: very lightweight eligibility heuristic — looks for a CGPA/percentage threshold in the scholarship's eligibility text. */
function scholarshipLooksEligible(scholarship, marksValue) {
  if (marksValue == null) return false;
  const text = (scholarship.eligibility || "").toLowerCase();
  const match = text.match(/(\d{1,3}(?:\.\d+)?)\s*%|\bcgpa\s*(?:of|above|>=)?\s*(\d(?:\.\d+)?)/);
  if (!match) return true; // no explicit numeric bar found -> don't exclude
  const threshold = parseFloat(match[1] || match[2]);
  const normalizedMarks = marksValue > 10 ? marksValue : marksValue * 10; // treat a 0-10 CGPA-style number as roughly comparable to /100
  const normalizedThreshold = threshold > 10 ? threshold : threshold * 10;
  return normalizedMarks >= normalizedThreshold;
}

module.exports = {
  notifyUser,
  getOrCreateReadiness,
  updateReadiness,
  handleProfileUpdated,
  handleResumeAnalyzed,
  handleInterviewCompleted,
};
