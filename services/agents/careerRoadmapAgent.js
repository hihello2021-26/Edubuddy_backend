const { generateText, safeParseJSON } = require("../aiService");
const { retrieveRelevantDocs, formatContext } = require("../ragService");

/**
 * Career Roadmap Agent (a.k.a. the "Roadmap Generator")
 * ------------------------------------------------------
 * Given any field/course/career the student names (e.g. "Engineering", "Medicine",
 * "Chartered Accountancy", "Data Science", "Law", "Diploma", "ITI", "Civil Services"),
 * this agent produces a tailored, highly specific breakdown — overview, course branches,
 * exact entrance exams, college tiers, job roles, core skills, professional certifications,
 * realistic salary range, higher-studies options, future scope, and step-by-step roadmap
 * grounded in EduBuddy's RAG knowledge base.
 */
async function runCareerRoadmapAgent({ field, classLevel = "puc12" }) {
  const baseQuery = `${field} career course breakdown entrance exams syllabus colleges skills certifications salary higher studies scholarships roadmap steps`;
  const degreeQuery = `${field} postgraduate PG higher studies research career course breakdown entrance exams syllabus colleges skills certifications salary roadmap steps`;
  const query = classLevel === "degree" ? degreeQuery : baseQuery;

  const [careerDocs, examDocs, collegeDocs, courseDocs, scholarshipDocs] = await Promise.all([
    retrieveRelevantDocs(query, { topK: 3, category: "career" }),
    retrieveRelevantDocs(query, { topK: 3, category: "exam" }),
    retrieveRelevantDocs(query, { topK: 2, category: "college" }),
    retrieveRelevantDocs(query, { topK: 2, category: "course" }),
    retrieveRelevantDocs(`scholarships for ${field} students`, { topK: 3, category: "scholarship" }),
  ]);
  const allDocs = [...careerDocs, ...examDocs, ...collegeDocs, ...courseDocs, ...scholarshipDocs];
  const context = formatContext(allDocs);

  const systemInstruction = `You are EduBuddy's Master Career & Course Advisor.
Using the RAG reference material as grounding, build a comprehensive, highly customized, course-specific roadmap for "${field}" for a student currently at "${classLevel}" level.

Your output must be deeply tailored to "${field}". For example:
- If "${field}" is Engineering: include JEE, KCET, COMEDK, core branches (CSE, ECE, Mech, Civil), coding & lab skills, GATE, M.Tech/MS, IT & Product roles.
- If "${field}" is Medicine: include NEET-UG, MBBS/BDS/BAMS/BHMS, rotations, NEET-PG/USMLE, residency, specialization.
- If "${field}" is Commerce & CA: include CA Foundation/Intermediate/Final, B.Com/BBA, CS/CMA, Articleship, Financial Modeling, Audit & Accounting roles.
- If "${field}" is Law: include CLAT, AILET, 5-Year BA LLB, Moot Court, Bar Council Exam, Corporate Law / Litigation.
- If "${field}" is Diploma / ITI: include Polytechnic Entrance, Trade Certifications, Practical Apprenticeship, Junior Engineer / Technician roles.
- If "${field}" is Civil Services: include UPSC/KPSC prelims, mains, optional subjects, ethics, essay writing, interview.
- If "${classLevel}" is "degree": focus on postgraduate and career-stage pathways, including M.Tech, MBA, CUET PG, UGC NET, GRE/GMAT, LLM, PhD, PG Diploma, PSU entry, research & higher education, and professional specialization.

Respond ONLY with strict JSON, no markdown fences, no explanation, no extra fields, matching this structure exactly:
{
  "field": "${field}",
  "overview": "Detailed overview of ${field} (45-65 words), explaining why it matters and what studying it entails.",
  "subjectsOrBranches": ["branch 1", "branch 2", "branch 3"],
  "entranceExams": [{"name": "string", "level": "National|State|Institute", "notes": "string"}],
  "collegeTiers": [{"tier": "string e.g. Tier 1 (IITs/NITs/AIIMS)", "description": "string", "examplesGeneric": "string"}],
  "jobRoles": ["job role 1", "job role 2", ...],
  "skillsRequired": ["skill 1", "skill 2", ...],
  "certifications": ["certification 1", "certification 2", ...],
  "salaryRange": {"entryLevel": "e.g. ₹4-8 LPA", "midCareer": "e.g. ₹12-20 LPA", "senior": "e.g. ₹30+ LPA"},
  "higherStudies": ["option 1", "option 2", ...],
  "futureScope": "Detailed outlook on industry demand, emerging tech/trends (40-60 words).",
  "roadmapSteps": [
    "Step 1: Foundational preparation & Subject focus",
    "Step 2: Entrance Exams & College Admission",
    "Step 3: Core Academic & Skill Building",
    "Step 4: Projects & Practical Apprenticeship / Internships",
    "Step 5: Professional Certifications & Networking",
    "Step 6: Career Launch & First Job / Higher Education"
  ],
  "applicableScholarships": ["scholarship 1", "scholarship 2", ...],
  "officialSourcesNote": "Verification note regarding cutoffs and official exam websites."
}

Output constraints:
- overview: max 65 words
- subjectsOrBranches: max 6 items
- entranceExams: max 8 items
- collegeTiers: max 4 items
- jobRoles, skillsRequired, certifications: max 8 items each
- higherStudies: max 6 items
- applicableScholarships: max 6 items
- roadmapSteps: exactly 6 concise steps
- use short, precise strings for arrays
- do NOT include any field names other than those above.

REFERENCE MATERIAL (RAG):
${context}`;

  // Enforce concise outputs to avoid token truncation: limit list lengths and text sizes.
  // - overview: max 80 words
  // - subjectsOrBranches: max 8 items
  // - entranceExams: top 8 entries only
  // - collegeTiers: max 4 tiers
  // - jobRoles/skills/certifications: max 10 items each
  // - roadMapSteps: keep to 6 concise steps

  const userPrompt = `Generate the exact JSON object only. Do not add any explanation or text outside the JSON.`;

  let raw;
  try {
    raw = await generateText(systemInstruction, userPrompt, {
      temperature: 0.0,
      maxOutputTokens: 1200,
      json: true,
      provider: "gemini",
    });
  } catch (err) {
    console.warn(`Career Roadmap Agent generation failed for field="${field}" classLevel="${classLevel}". Falling back to static roadmap.`, err.message);
    return buildFallbackRoadmap(field, classLevel, allDocs);
  }

  // Helper: try to extract the largest balanced {...} JSON substring from raw text
  function extractBalancedJSON(text) {
    if (!text) return null;
    const start = text.indexOf('{');
    if (start === -1) return null;
    let depth = 0;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
    return null;
  }

  // Try to parse the raw output, preferring a balanced-extraction when possible
  let parsed = null;
  // If model output is truncated (missing trailing braces), attempt to auto-close it.
  function autoCloseJSON(text) {
    if (!text) return null;
    const start = text.indexOf('{');
    if (start === -1) return null;
    let depth = 0;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
    }
    if (depth > 0) {
      return text + '}'.repeat(depth);
    }
    return null;
  }
  const balanced = extractBalancedJSON(raw);
  if (balanced) parsed = safeParseJSON(balanced);
  if (!parsed) parsed = safeParseJSON(raw);
  if (!parsed) {
    const closed = autoCloseJSON(raw);
    if (closed) parsed = safeParseJSON(closed);
  }
  if (!parsed) {
    // Retry once with Gemini and a stricter instruction to force JSON-only output
    try {
      const retrySystem = `IMPORTANT: Respond ONLY with strict JSON matching the requested structure. Do NOT include any explanatory text outside the JSON object.`;
      const retryRaw = await generateText(retrySystem + '\n' + systemInstruction, userPrompt, {
        temperature: 0.2,
        maxOutputTokens: 2000,
        json: true,
        provider: "gemini",
      });
      parsed = safeParseJSON(retryRaw);
      if (!parsed) {
        // Try one final, compact single-line JSON attempt with minimal temperature
        const compactSystem = `RETURN A SINGLE-LINE COMPACT JSON OBJECT ONLY. NO EXPLANATION OR EXTRA TEXT.`;
        const compactRaw = await generateText(compactSystem + '\n' + systemInstruction, userPrompt, {
          temperature: 0.0,
          maxOutputTokens: 3000,
          json: true,
          provider: "gemini",
        });
        parsed = safeParseJSON(compactRaw);
        if (!parsed) {
          const err = new Error("Career Roadmap Agent could not parse structured response after retries.");
          err.raw = compactRaw || retryRaw;
          throw err;
        }
      }
    } catch (retryErr) {
      console.error("Career Roadmap Agent parsing failed. Raw output:", retryErr.raw || raw || retryErr.message);
      return buildFallbackRoadmap(field, classLevel, allDocs);
    }
  }

  return { ...parsed, sources: allDocs.map((d) => d.title) };
}

function buildFallbackRoadmap(field, classLevel, allDocs = []) {
  const normalized = (field || "").toLowerCase();
  const category = normalized.includes("engineering") || /\b(cse|ece|mech|civil|electrical|computer|mechanical|aerospace)\b/.test(normalized)
    ? "engineering"
    : normalized.includes("medicine") || normalized.includes("mbbs") || normalized.includes("neet")
    ? "medicine"
    : normalized.includes("commerce") || normalized.includes("ca") || normalized.includes("finance") || normalized.includes("account")
    ? "commerce"
    : normalized.includes("law") || normalized.includes("clat") || normalized.includes("legal")
    ? "law"
    : normalized.includes("civil services") || normalized.includes("upsc") || normalized.includes("ias")
    ? "civilservices"
    : "general";

  const fallbackMap = {
    engineering: {
      overview: `A practical ${field} roadmap from ${classLevel} level, with college entrance exam prep, branch selection, core skills, internships and progression toward engineering roles.`,
      subjectsOrBranches: ["Computer Science", "Electronics", "Mechanical", "Civil", "Electrical"],
      entranceExams: [
        { name: "JEE Main", level: "National", notes: "Key national exam for engineering colleges." },
        { name: "JEE Advanced", level: "National", notes: "For admission to IITs after JEE Main." },
        { name: "KCET / COMEDK", level: "State|Institute", notes: "Popular state and private college entrance exams." },
      ],
      collegeTiers: [
        { tier: "Tier 1 (IITs/NITs)", description: "Top national engineering institutes with strong placement support.", examplesGeneric: "IIT Bombay, NIT Trichy, IIIT Hyderabad" },
        { tier: "Tier 2 (State & Private)", description: "Good quality state colleges and reputable private universities.", examplesGeneric: "PES University, RV College, BMS College" },
      ],
      jobRoles: ["Software Engineer", "Embedded Engineer", "Design Engineer", "Project Manager", "Data Analyst"],
      skillsRequired: ["Problem Solving", "Programming", "Engineering Maths", "Lab Work", "System Design"],
      certifications: ["NPTEL", "Cisco CCNA", "AWS Cloud", "Autodesk", "Lean Six Sigma"],
      salaryRange: { entryLevel: "₹4-8 LPA", midCareer: "₹12-20 LPA", senior: "₹25+ LPA" },
      higherStudies: ["M.Tech", "MBA", "MS abroad", "PhD", "Certification courses"],
      futureScope: "Engineering continues to grow with AI, automation, renewable energy and manufacturing demand, offering strong technical and product career options.",
      roadmapSteps: [
        "Step 1: Build strong foundation in maths, physics and subject basics.",
        "Step 2: Prepare for JEE/State college exams and shortlist target colleges.",
        "Step 3: Focus on core branch subjects, labs and project-based learning.",
        "Step 4: Join internships, competitions and technical certifications.",
        "Step 5: Apply for final year projects, internships and summer training.",
        "Step 6: Launch into campus placement, PSU exams or higher studies.",
      ],
      applicableScholarships: ["National Scholarship", "State Merit Scholarship", "Technical Education Grant"],
    },
    medicine: {
      overview: `A focused ${field} roadmap for ${classLevel} students, outlining medical entrance prep, college selection, clinical skills and career progression.`,
      subjectsOrBranches: ["MBBS", "BDS", "Ayurveda", "Homeopathy", "Nursing"],
      entranceExams: [
        { name: "NEET-UG", level: "National", notes: "Required for most medical and dental admissions." },
        { name: "AIIMS MBBS", level: "Institute", notes: "Separate entrance for AIIMS institutions (where available)." },
      ],
      collegeTiers: [
        { tier: "Tier 1 (AIIMS/NIMS)", description: "Leading government medical colleges with highest standards.", examplesGeneric: "AIIMS Delhi, JIPMER, CMC Vellore" },
        { tier: "Tier 2 (State Medical)", description: "Reputable state colleges and private medical schools.", examplesGeneric: "KMC Manipal, St Johns, Government Medical Colleges" },
      ],
      jobRoles: ["Doctor", "Clinical Researcher", "Healthcare Manager", "Medical Officer", "Public Health Specialist"],
      skillsRequired: ["Medical Knowledge", "Patient Care", "Scientific Thinking", "Communication", "Ethics"],
      certifications: ["BLS/ACLS", "Clinical Research", "Public Health", "Nutrition", "Hospital Management"],
      salaryRange: { entryLevel: "₹6-10 LPA", midCareer: "₹15-25 LPA", senior: "₹30+ LPA" },
      higherStudies: ["MD/MS", "DM/MCh", "MHA", "PhD in Biomedical", "Public Health"],
      futureScope: "Medical careers remain stable with demand for doctors, clinical researchers, healthcare leadership and specialist care. ",
      roadmapSteps: [
        "Step 1: Strengthen biology, chemistry and physics foundations.",
        "Step 2: Prepare for NEET and related medical entrance exams.",
        "Step 3: Choose the right medical course and college seat.",
        "Step 4: Focus on clinical exposure, internships and medical electives.",
        "Step 5: Pursue specialty training, research or public health practice.",
        "Step 6: Enter healthcare practice, higher studies or hospital leadership.",
      ],
      applicableScholarships: ["Health Science Scholarship", "State Medical Grant", "Women in Medicine Scholarship"],
    },
    commerce: {
      overview: `A practical ${field} roadmap for ${classLevel} learners, covering commerce foundations, professional exams and finance career paths.`,
      subjectsOrBranches: ["Accounting", "Finance", "Economics", "Business", "Taxation"],
      entranceExams: [
        { name: "CA Foundation", level: "Institute", notes: "First step to become a Chartered Accountant." },
        { name: "CMA Foundation", level: "Institute", notes: "For Commerce & Management Accountant certification." },
        { name: "CET/BBA", level: "State|Institute", notes: "Used for B.Com/BBA admissions." },
      ],
      collegeTiers: [
        { tier: "Tier 1 (Top commerce colleges)", description: "Leading colleges with strong business and finance programs.", examplesGeneric: "Shri Ram, Christ, St Xaviers" },
        { tier: "Tier 2 (Regional colleges)", description: "Good commerce colleges with local placement ties.", examplesGeneric: "Government Colleges, Private Universities" },
      ],
      jobRoles: ["Accountant", "Financial Analyst", "Auditor", "Tax Consultant", "Business Analyst"],
      skillsRequired: ["Accounting", "Excel", "Financial Analysis", "Communication", "Tax Law"],
      certifications: ["CA", "CMA", "CS", "Financial Modeling", "GST Certification"],
      salaryRange: { entryLevel: "₹3-6 LPA", midCareer: "₹8-15 LPA", senior: "₹18+ LPA" },
      higherStudies: ["MBA", "M.Com", "Chartered Accountancy", "CS", "CFA"],
      futureScope: "Commerce careers remain strong in finance, audit, consulting and corporate strategy as India grows economically.",
      roadmapSteps: [
        "Step 1: Master accounting, economics and business fundamentals.",
        "Step 2: Decide between CA/CMA/CS and college commerce programs.",
        "Step 3: Build Excel, analytics and taxation skills.",
        "Step 4: Gain internship experience in finance or audit.",
        "Step 5: Complete professional exams and certifications.",
        "Step 6: Start as analyst, accountant or pursue higher management studies.",
      ],
      applicableScholarships: ["Commerce Merit Scholarship", "Young Professionals Grant", "Finance Excellence Award"],
    },
    law: {
      overview: `A clear ${field} roadmap for ${classLevel} students, with law entrance exam prep, course choices and legal career steps.`,
      subjectsOrBranches: ["BA LLB", "LLB", "Corporate Law", "Criminal Law", "Intellectual Property"],
      entranceExams: [
        { name: "CLAT", level: "National", notes: "Main national entrance for top law schools." },
        { name: "AILET", level: "National", notes: "AIU Delhi's national law university exam." },
      ],
      collegeTiers: [
        { tier: "Tier 1 (NLUs)", description: "Leading national law universities with strong placement records.", examplesGeneric: "NLU Delhi, NLSIU, NLU Jodhpur" },
        { tier: "Tier 2 (State law colleges)", description: "Respected regional law schools and private colleges.", examplesGeneric: "Symbiosis Law, SLS Pune, University Law Colleges" },
      ],
      jobRoles: ["Advocate", "Corporate Counsel", "Legal Analyst", "Compliance Officer", "Policy Advisor"],
      skillsRequired: ["Legal Research", "Writing", "Argumentation", "Ethics", "Negotiation"],
      certifications: ["Bar Council License", "Mediation", "Corporate Compliance", "IP Law", "Legal Drafting"],
      salaryRange: { entryLevel: "₹3-6 LPA", midCareer: "₹8-18 LPA", senior: "₹20+ LPA" },
      higherStudies: ["LLM", "Judicial Services", "MBA Law", "LLD"],
      futureScope: "Law careers are expanding in corporate counsel, dispute resolution, policy and compliance as regulations grow.",
      roadmapSteps: [
        "Step 1: Learn law basics and use past CLAT/AILET papers.",
        "Step 2: Prepare for law entrance exams and shortlist colleges.",
        "Step 3: Study core legal subjects and engage in moot court.",
        "Step 4: Intern with law firms, NGOs or courts.",
        "Step 5: Pass professional licensing and complete clerkships.",
        "Step 6: Begin practice, corporate law, government service or higher study.",
      ],
      applicableScholarships: ["Legal Education Scholarship", "MOOT Court Award", "Law Student Grant"],
    },
    civilservices: {
      overview: `A goal-oriented ${field} roadmap for ${classLevel} students, with UPSC preparation, subject selection and administrative career progression.`,
      subjectsOrBranches: ["General Studies", "Optional Subject", "Essay", "Ethics", "Current Affairs"],
      entranceExams: [
        { name: "UPSC CSE", level: "National", notes: "India's central civil services exam for IAS, IPS and allied services." },
        { name: "State PCS", level: "State", notes: "State public service commission exams for regional administrative posts." },
      ],
      collegeTiers: [
        { tier: "Civil Services Prep", description: "Top UPSC coaching and mentorship programs.", examplesGeneric: "Vision IAS, Vajiram, Forum IAS" },
      ],
      jobRoles: ["IAS Officer", "IPS Officer", "State Admin Officer", "Policy Analyst", "District Collector"],
      skillsRequired: ["Current Affairs", "Essay Writing", "Decision Making", "Ethics", "Public Administration"],
      certifications: ["UPSC Interview Coaching", "Policy Research", "Public Management", "Ethics Training"],
      salaryRange: { entryLevel: "₹7-12 LPA", midCareer: "₹18-30 LPA", senior: "₹35+ LPA" },
      higherStudies: ["Public Policy", "MPA", "International Relations", "Law"],
      futureScope: "Civil services remain a fast career path for leadership, policy-making and public administration in India.",
      roadmapSteps: [
        "Step 1: Build strong general studies and current affairs habits.",
        "Step 2: Choose your optional subject and practice previous papers.",
        "Step 3: Attend coaching or guided mentorship programs.",
        "Step 4: Take repeated prelims tests and improve answer writing.",
        "Step 5: Clear mains, prepare interview and polish personality.",
        "Step 6: Join service and continue professional growth or specialized study.",
      ],
      applicableScholarships: ["Scholarship for Civil Service Aspirants", "Academic Excellence Grant"],
    },
    general: {
      overview: `A dependable ${field} roadmap from ${classLevel}, focused on subject foundations, exams, practical skills and career readiness.`,
      subjectsOrBranches: ["Core Concepts", "Applied Skills", "Practical Projects", "Communication"],
      entranceExams: [
        { name: "Relevant State/Institute exam", level: "State|Institute", notes: "Depending on the chosen field and local admissions." },
      ],
      collegeTiers: [
        { tier: "Tier 1", description: "Top national institutes or universities for the chosen field.", examplesGeneric: "Top institutions in the subject area" },
        { tier: "Tier 2", description: "Good regional colleges with practical exposure.", examplesGeneric: "Strong local colleges and universities" },
      ],
      jobRoles: ["Professional Trainee", "Specialist", "Analyst", "Consultant", "Coordinator"],
      skillsRequired: ["Critical Thinking", "Communication", "Project Work", "Domain Knowledge", "Teamwork"],
      certifications: ["Field-specific certification", "Online specialization", "Industry training"],
      salaryRange: { entryLevel: "₹3-7 LPA", midCareer: "₹8-15 LPA", senior: "₹18+ LPA" },
      higherStudies: ["MSc/MA", "MBA", "Professional Diploma", "Research Program"],
      futureScope: "This field can grow with practical skills, specialized training and emerging industry trends.",
      roadmapSteps: [
        "Step 1: Strengthen the fundamentals and core subjects.",
        "Step 2: Identify entrance tests or college requirements.",
        "Step 3: Build practical projects and applied experience.",
        "Step 4: Pursue internships, certifications and domain training.",
        "Step 5: Network, apply for placements or higher study programs.",
        "Step 6: Enter the career path and continue skill advancement.",
      ],
      applicableScholarships: ["General Merit Scholarship", "Learning Support Grant"],
    },
  };

  const fallback = fallbackMap[category] || fallbackMap.general;
  return { ...fallback, field, sources: allDocs.map((d) => d.title) };
}

module.exports = { runCareerRoadmapAgent };

