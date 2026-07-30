const GovExam = require("../models/GovExam");
const { runGovExamAgentDaily } = require("../services/agents/govExamAgent");
const { generateText, safeParseJSON } = require("../services/aiService");

// Curated knowledge base for major exams
const EXAM_DETAILS = {
  UPSC: {
    name: "UPSC Civil Services Examination (CSE)",
    category: "Government",
    level: "Degree",
    eligibility: "Graduate degree in any discipline from a recognized university. Age: 21–32 years.",
    conductingBody: "Union Public Service Commission (UPSC)",
    officialLink: "https://upsc.gov.in",
    stages: ["Prelims (Objective GS + CSAT)", "Mains (9 Written Papers)", "Personality Test / Interview"],
    syllabus: [
      "GS 1: History, Geography, Indian Society & Culture",
      "GS 2: Polity, Governance, Constitution, International Relations",
      "GS 3: Economy, Science & Tech, Environment, Internal Security",
      "GS 4: Ethics, Integrity & Aptitude",
      "CSAT: Quantitative Aptitude, Logical Reasoning, Comprehension"
    ]
  },
  KPSC: {
    name: "KPSC Karnataka Administrative Services (KAS)",
    category: "Government",
    level: "Degree",
    eligibility: "Bachelor's degree. Kannada language proficiency preferred. Age: 21–38 years.",
    conductingBody: "Karnataka Public Service Commission",
    officialLink: "http://kpsc.kar.nic.in",
    stages: ["Prelims (GS Paper 1 & 2)", "Mains (7 Descriptive Papers)", "Interview"],
    syllabus: [
      "Paper 1: General Studies & Karnataka History & Geography",
      "Paper 2: General Mental Ability & State Administration",
      "Mains: Kannada, English, GS 1-4, Optional Subject"
    ]
  },
  SSC: {
    name: "SSC Combined Graduate Level (CGL)",
    category: "Government",
    level: "Degree",
    eligibility: "Bachelor's degree in any discipline. Age: 18–32 years.",
    conductingBody: "Staff Selection Commission",
    officialLink: "https://ssc.nic.in",
    stages: ["Tier 1 (Computer Based Exam)", "Tier 2 (Computer Based Exam - Mains)", "Document Verification"],
    syllabus: [
      "General Intelligence & Reasoning",
      "General Awareness & Current Affairs",
      "Quantitative Aptitude & Mathematics",
      "English Comprehension & Data Entry Speed"
    ]
  },
  Banking: {
    name: "IBPS / SBI Probationary Officer (PO) & Clerk",
    category: "Government",
    level: "Degree",
    eligibility: "Graduate degree in any stream. Age: 20–30 years.",
    conductingBody: "IBPS / State Bank of India",
    officialLink: "https://ibps.in",
    stages: ["Preliminary Exam", "Main Exam + Descriptive Test", "Interview / Group Discussion"],
    syllabus: [
      "Reasoning Ability & Computer Aptitude",
      "Quantitative Aptitude & Data Interpretation",
      "English Language & Professional Knowledge",
      "General / Economy / Banking Awareness"
    ]
  },
  Railway: {
    name: "RRB Non-Technical Popular Categories (NTPC) & JE",
    category: "Government",
    level: "12th/Degree",
    eligibility: "12th Pass (Clerk/Typist) or Degree (Station Master/JE). Age: 18–33 years.",
    conductingBody: "Railway Recruitment Board",
    officialLink: "https://indianrailways.gov.in",
    stages: ["1st Stage CBT", "2nd Stage CBT", "CBAT / Typing Test", "Document Verification"],
    syllabus: [
      "General Awareness & Current Affairs",
      "Mathematics & Arithmetic Ability",
      "General Intelligence & Reasoning"
    ]
  },
  NDA: {
    name: "National Defence Academy (NDA & NA)",
    category: "Defence",
    level: "12th",
    eligibility: "12th Pass (Physics & Maths for Air Force/Navy). Unmarried candidates aged 16.5–19.5 years.",
    conductingBody: "UPSC / Ministry of Defence",
    officialLink: "https://upsc.gov.in",
    stages: ["Written Examination (Maths + GAT)", "SSB Interview (5-day testing)", "Medical Examination"],
    syllabus: [
      "Mathematics: Algebra, Trigonometry, Calculus, Statistics",
      "GAT: English, Physics, Chemistry, General Science, History, Geography"
    ]
  },
  CDS: {
    name: "Combined Defence Services (CDS)",
    category: "Defence",
    level: "Degree",
    eligibility: "Degree in Engineering (Navy/Air Force) or Any Degree (IMA/OTA). Age: 19–25 years.",
    conductingBody: "UPSC",
    officialLink: "https://upsc.gov.in",
    stages: ["Written Examination", "SSB Interview", "Medical Board"],
    syllabus: [
      "English Language",
      "General Knowledge & Current Affairs",
      "Elementary Mathematics (for IMA/INA/AFA)"
    ]
  },
  JEE: {
    name: "JEE Main & JEE Advanced",
    category: "Entrance",
    level: "12th",
    eligibility: "12th Pass/Appearing with Physics, Chemistry, Mathematics (PCM).",
    conductingBody: "National Testing Agency (NTA) & IITs",
    officialLink: "https://jeemain.nta.ac.in",
    stages: ["JEE Main (Session 1 & 2)", "JEE Advanced (For Top 2.5 Lakh Main rankers)", "JoSAA Counselling"],
    syllabus: [
      "Physics: Mechanics, Electrodynamics, Optics, Modern Physics",
      "Chemistry: Physical, Organic, Inorganic Chemistry",
      "Mathematics: Calculus, Coordinate Geometry, Algebra, Vectors"
    ]
  },
  NEET: {
    name: "National Eligibility cum Entrance Test (NEET-UG)",
    category: "Entrance",
    level: "12th",
    eligibility: "12th Pass with Physics, Chemistry, Biology/Biotechnology (PCB). Min 50% marks.",
    conductingBody: "NTA",
    officialLink: "https://neet.nta.nic.in",
    stages: ["Pen and Paper Exam (720 Marks)", "MCC / State Medical Counselling"],
    syllabus: [
      "Biology: Botany & Zoology (NCERT Class 11 & 12)",
      "Physics: Mechanics, Thermodynamics, Modern Physics",
      "Chemistry: Physical, Inorganic & Organic Chemistry"
    ]
  },
  KCET: {
    name: "Karnataka Common Entrance Test (KCET)",
    category: "Entrance",
    level: "12th",
    eligibility: "Pass in 2nd PUC / 12th with PCM/PCB. Domicile requirements apply for Karnataka seats.",
    conductingBody: "Karnataka Examinations Authority (KEA)",
    officialLink: "https://cetonline.karnataka.gov.in",
    stages: ["State Entrance Exam", "KEA Document Verification", "Option Entry & Allotment"],
    syllabus: [
      "Physics (Class 11 & 12 Karnataka State / CBSE Syllabus)",
      "Chemistry (Class 11 & 12 Syllabus)",
      "Mathematics / Biology (Class 11 & 12 Syllabus)"
    ]
  },
  COMEDK: {
    name: "COMEDK UGET",
    category: "Entrance",
    level: "12th",
    eligibility: "12th Pass with PCM from recognized board. Min 45% aggregate in PCM.",
    conductingBody: "Consortium of Medical, Engineering and Dental Colleges of Karnataka",
    officialLink: "https://comedk.org",
    stages: ["Online CBT Entrance Exam", "Online Counselling & Seat Allotment"],
    syllabus: ["Physics (120 Questions)", "Chemistry (120 Questions)", "Mathematics (120 Questions)"]
  },
  GATE: {
    name: "Graduate Aptitude Test in Engineering (GATE)",
    category: "Post-Graduate",
    level: "Degree",
    eligibility: "Engineering / Science Graduates or final year students.",
    conductingBody: "IITs & IISc Bangalore",
    officialLink: "https://gate2026.iitg.ac.in",
    stages: ["Computer-Based Test (100 Marks)", "COAP / CCMT Counselling / PSU Recruitment"],
    syllabus: [
      "General Aptitude (Numerical & Verbal)",
      "Engineering Mathematics",
      "Core Discipline Subject Papers (CS, EC, ME, CE, EE, Data Science, etc.)"
    ]
  },
  CAT: {
    name: "Common Admission Test (CAT)",
    category: "Post-Graduate",
    level: "Degree",
    eligibility: "Bachelor's Degree with minimum 50% marks.",
    conductingBody: "IIMs",
    officialLink: "https://iimcat.ac.in",
    stages: ["CBT Computerized Test", "WAT-GD-PI Rounds at IIMs"],
    syllabus: [
      "VARC: Verbal Ability & Reading Comprehension",
      "DILR: Data Interpretation & Logical Reasoning",
      "QA: Quantitative Aptitude & Arithmetic"
    ]
  },
  GRE: {
    name: "Graduate Record Examination (GRE)",
    category: "International",
    level: "Degree",
    eligibility: "Any graduate planning MS / PhD / MBA abroad.",
    conductingBody: "Educational Testing Service (ETS)",
    officialLink: "https://ets.org/gre",
    stages: ["Computer Adaptive Test (Analytical Writing, Verbal, Quant)"],
    syllabus: [
      "Analytical Writing Assessment (Issue Essay)",
      "Verbal Reasoning (Reading Comp, Text Completion)",
      "Quantitative Reasoning (Algebra, Geometry, Data Analysis)"
    ]
  },
  GMAT: {
    name: "Graduate Management Admission Test (GMAT Focus Edition)",
    category: "International",
    level: "Degree",
    eligibility: "Graduates seeking global MBA / Masters in Management.",
    conductingBody: "GMAC",
    officialLink: "https://mba.com",
    stages: ["Computer Adaptive Test"],
    syllabus: ["Quantitative Reasoning", "Verbal Reasoning", "Data Insights"]
  },
  IELTS: {
    name: "International English Language Testing System (IELTS Academic)",
    category: "International",
    level: "Degree",
    eligibility: "Students applying to universities in UK, USA, Canada, Australia, Europe.",
    conductingBody: "IDP / British Council",
    officialLink: "https://ielts.org",
    stages: ["Listening", "Reading", "Writing", "Speaking Interview"],
    syllabus: ["Academic Reading & Listening", "Task 1 Graph & Task 2 Essay Writing", "Face-to-face Speaking Test"]
  },
  TOEFL: {
    name: "Test of English as a Foreign Language (TOEFL iBT)",
    category: "International",
    level: "Degree",
    eligibility: "Students seeking English proficiency score for international admissions.",
    conductingBody: "ETS",
    officialLink: "https://ets.org/toefl",
    stages: ["Computer-Based Test"],
    syllabus: ["Reading", "Listening", "Speaking", "Writing"]
  }
};

// GET /api/govexams?category=UPSC
exports.list = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    const exams = await GovExam.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({ exams, examDetails: EXAM_DETAILS });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch exams", error: err.message });
  }
};

// GET /api/govexams/details -> returns static details for all exams
exports.getExamDetails = async (req, res) => {
  res.json({ examDetails: EXAM_DETAILS });
};

// GET /api/govexams/categories -> counts per category
exports.categoryCounts = async (req, res) => {
  const counts = await GovExam.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]);
  res.json({ counts });
};

// POST /api/govexams/run-now -> manually trigger daily agent
exports.runNow = async (req, res) => {
  try {
    const summary = await runGovExamAgentDaily();
    res.json({ summary });
  } catch (err) {
    res.status(500).json({ message: "Government Exam Agent failed.", error: err.message });
  }
};

// POST /api/govexams/roadmap -> Generate AI Preparation Roadmap for an Exam
exports.generateExamRoadmap = async (req, res) => {
  try {
    const { examKey, targetYear = "2026", availableHoursPerDay = 4 } = req.body;
    const examInfo = EXAM_DETAILS[examKey] || { name: examKey, category: "Competitive Exam" };

    const systemInstruction = `You are EduBuddy Exam Master, an expert coach for Indian competitive & entrance exams.
Generate a structured, highly actionable preparation roadmap for "${examInfo.name}".
Respond ONLY with strict JSON, no markdown fences, matching this structure:
{
  "examName": "${examInfo.name}",
  "overview": "Short summary of strategy for this exam",
  "monthlyPhases": [
    { "phase": "Phase 1: Foundation (Months 1-3)", "focus": "NCERTs & Core Concepts", "weeklyTasks": ["Task 1", "Task 2"] },
    { "phase": "Phase 2: Standard Books & Practice (Months 4-6)", "focus": "Deep Subject Mastery", "weeklyTasks": ["Task 1", "Task 2"] },
    { "phase": "Phase 3: Revision & Mocks (Months 7-8)", "focus": "Test Series & Weak Areas", "weeklyTasks": ["Task 1", "Task 2"] }
  ],
  "recommendedBooks": ["Book 1", "Book 2", "Book 3"],
  "keyDoAndDonts": { "dos": ["Do 1", "Do 2"], "donts": ["Don't 1", "Don't 2"] }
}`;

    const userPrompt = `Student wants to prepare for ${examInfo.name} targeting year ${targetYear} studying ${availableHoursPerDay} hours per day.
Official syllabus details: ${JSON.stringify(examInfo.syllabus || [])}.
Generate the JSON study plan now.`;

    const raw = await generateText(systemInstruction, userPrompt, {
      temperature: 0.4,
      maxOutputTokens: 1000,
      json: true,
      provider: "groq"
    });

    const roadmap = safeParseJSON(raw) || {
      examName: examInfo.name,
      overview: "Standard 3-phase preparation plan",
      monthlyPhases: [
        { phase: "Phase 1: Foundation", focus: "Concept Mastery", weeklyTasks: ["Complete basic syllabus", "Solve past papers"] },
        { phase: "Phase 2: Mock Tests", focus: "Speed & Accuracy", weeklyTasks: ["Take 2 mocks per week", "Analyze mistakes"] }
      ],
      recommendedBooks: ["Standard textbooks", "NCERT books", "Past 10 year solved papers"],
      keyDoAndDonts: { dos: ["Maintain consistency", "Revise regularly"], donts: ["Don't skip mock analysis"] }
    };

    res.json({ success: true, examKey, examInfo, roadmap });
  } catch (err) {
    console.error("Generate Exam Roadmap error:", err);
    res.status(500).json({ message: "Could not generate exam roadmap", error: err.message });
  }
};

