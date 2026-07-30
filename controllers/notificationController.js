const Notification = require("../models/Notification");
const { runNewsAgentDaily } = require("../services/agents/newsNotificationAgent");

const CURATED_NOTIFICATIONS = {
  admission: [
    {
      _id: "adm_1",
      category: "admission",
      type: "admission",
      title: "JoSAA & CSAB B.Tech Engineering Counseling 2026",
      summary: "Official counseling registration and option entry portal open for IITs, NITs, IIITs, and GFTIs.",
      officialLink: "https://josaa.nic.in",
      createdAt: new Date()
    },
    {
      _id: "adm_2",
      category: "admission",
      type: "admission",
      title: "KEA Karnataka KCET Document Verification & Option Entry",
      summary: "Karnataka Examinations Authority verification for engineering, agriculture, and pharmacy seats.",
      officialLink: "https://cetonline.karnataka.gov.in",
      createdAt: new Date()
    },
    {
      _id: "adm_3",
      category: "admission",
      type: "admission",
      title: "MCC NEET UG All-India Quota Medical Counseling",
      summary: "Medical Counseling Committee registration for 15% All India Quota MBBS/BDS seats.",
      officialLink: "https://mcc.nic.in",
      createdAt: new Date()
    }
  ],
  internship: [
    {
      _id: "int_1",
      category: "internship",
      type: "internship",
      title: "Google Software Engineering Intern (Summer 2026)",
      summary: "Google applications open for B.Tech, M.Tech, and MCA students. Hands-on distributed systems & AI projects.",
      officialLink: "https://careers.google.com/students",
      createdAt: new Date()
    },
    {
      _id: "int_2",
      category: "internship",
      type: "internship",
      title: "ISRO & DRDO Student Research Fellowship",
      summary: "Research internship opportunities in space tech, robotics, electronics, and aerospace for engineering students.",
      officialLink: "https://www.isro.gov.in/Careers.html",
      createdAt: new Date()
    },
    {
      _id: "int_3",
      category: "internship",
      type: "internship",
      title: "Microsoft Engage & Explore Student Internship",
      summary: "Mentorship-driven software engineering program for undergraduate students with interview fast-tracking.",
      officialLink: "https://careers.microsoft.com/students",
      createdAt: new Date()
    }
  ],
  hackathon: [
    {
      _id: "hck_1",
      category: "hackathon",
      type: "hackathon",
      title: "Smart India Hackathon (SIH 2026) — Hardware & Software Edition",
      summary: "World's largest open innovation model for students to solve real problems of ministries & industries.",
      officialLink: "https://sih.gov.in",
      createdAt: new Date()
    },
    {
      _id: "hck_2",
      category: "hackathon",
      type: "hackathon",
      title: "Google Summer of Code (GSoC 2026)",
      summary: "Global online open-source coding program for university students with stipend and mentorship.",
      officialLink: "https://summerofcode.withgoogle.com",
      createdAt: new Date()
    }
  ],
  competition: [
    {
      _id: "cmp_1",
      category: "competition",
      type: "competition",
      title: "TCS CodeVita Global Coding Championship 2026",
      summary: "World's largest competitive coding contest for college students with direct interview calls.",
      officialLink: "https://campuscommune.tcs.com/intro/codevita",
      createdAt: new Date()
    },
    {
      _id: "cmp_2",
      category: "competition",
      type: "competition",
      title: "ACM ICPC International Collegiate Programming Contest",
      summary: "Premier algorithmic programming contest for university students worldwide.",
      officialLink: "https://icpc.global",
      createdAt: new Date()
    }
  ]
};

// GET /api/notifications?type=internship&classLevel=degree
function getTodayFilter() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { $gte: start, $lte: end };
}

exports.list = async (req, res) => {
  try {
    const { type, classLevel } = req.query;
    const filter = { user: null, createdAt: getTodayFilter() };
    if (type) filter.type = type;
    if (classLevel) filter.targetClassLevels = { $in: [classLevel, "all"] };

    let notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(50);

    // Fallback to curated notifications if DB has no items for this tab
    if ((!notifications || notifications.length === 0) && type && CURATED_NOTIFICATIONS[type]) {
      notifications = CURATED_NOTIFICATIONS[type];
    }

    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch notifications", error: err.message });
  }
};


// GET /api/notifications/mine -> this student's personal automation notifications
// (profile updates, scholarship eligibility changes, internship suggestions,
// resume/interview updates, weekly reports), newest first, with unread count.
exports.listMine = async (req, res) => {
  const notifications = await Notification.find({ user: req.userId }).sort({ createdAt: -1 }).limit(50);
  const unreadCount = await Notification.countDocuments({ user: req.userId, read: false });
  res.json({ notifications, unreadCount });
};

// PATCH /api/notifications/:id/read -> mark one personal notification read
exports.markRead = async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    { read: true },
    { new: true }
  );
  if (!notification) return res.status(404).json({ message: "Notification not found." });
  res.json({ notification });
};

// PATCH /api/notifications/mark-all-read
exports.markAllRead = async (req, res) => {
  await Notification.updateMany({ user: req.userId, read: false }, { read: true });
  res.json({ success: true });
};

// POST /api/notifications/run-now -> manually trigger the daily news agent (useful for demos)
exports.runNow = async (req, res) => {
  try {
    const summary = await runNewsAgentDaily();
    res.json({ summary });
  } catch (err) {
    res.status(500).json({ message: "News & Notification Agent failed.", error: err.message });
  }
};
