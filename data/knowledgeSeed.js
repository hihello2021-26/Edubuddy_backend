// Seed corpus for the RAG knowledge base. Feel free to expand this with
// real data from your state's directorate of collegiate education, AISHE
// reports, NCS (National Career Service) portal, etc.
module.exports = [
  // ---------------- STREAMS ----------------
  {
    category: "stream",
    title: "Science Stream (PCM/PCB) after Class 10",
    tags: ["science", "PCM", "PCB", "stream"],
    content:
      "Science stream splits into PCM (Physics, Chemistry, Maths) and PCB (Physics, Chemistry, Biology). PCM opens paths to engineering, architecture, data science, defence technical entries, and pure sciences. PCB opens paths to medicine, dentistry, nursing, biotechnology, pharmacy, and allied health sciences. Best suited to students strong in logical reasoning, curious about how things work, and comfortable with sustained analytical study. Government colleges typically require 60%+ in Class 10 science/maths for smooth admission, though cutoffs vary by state.",
  },
  {
    category: "stream",
    title: "Commerce Stream after Class 10",
    tags: ["commerce", "stream", "business"],
    content:
      "Commerce stream covers Accountancy, Business Studies, Economics, and often Maths or Informatics Practices as an elective. It leads to careers in chartered accountancy (CA), company secretary (CS), cost accountancy (CMA), banking, finance, business administration (BBA/BCom), and entrepreneurship. Suited to students who enjoy numbers, business logic, and structured problem-solving without wanting the intensity of pure science. Commerce with Maths keeps engineering-adjacent and actuarial-science doors open too.",
  },
  {
    category: "stream",
    title: "Arts / Humanities Stream after Class 10",
    tags: ["arts", "humanities", "stream"],
    content:
      "Arts/Humanities covers History, Political Science, Sociology, Psychology, Geography, Economics, and languages. It leads to careers in civil services (IAS/IPS/IFS), law, journalism, mass communication, design, social work, teaching, psychology, and public policy. Suited to students who enjoy reading, writing, debating current affairs, and understanding people and society. Contrary to old stereotypes, Arts graduates are strongly represented among UPSC toppers and in fast-growing fields like UX research and policy analysis.",
  },
  // ---------------- CAREERS ----------------
  {
    category: "career",
    title: "Engineering & Technology Careers",
    tags: ["engineering", "btech", "science", "technology"],
    content:
      "After PCM, students can pursue B.Tech/B.E. via JEE Main/Advanced or state CETs in fields like Computer Science, Electronics, Mechanical, Civil, or Electrical engineering from government institutes such as NITs, state government engineering colleges, and IIITs. Emerging high-growth branches include AI & Data Science, and Robotics. Government engineering college fees are typically far lower than private colleges, making merit-based entry valuable.",
  },
  {
    category: "career",
    title: "Medical & Allied Health Careers",
    tags: ["medicine", "mbbs", "nursing", "pcb", "science"],
    content:
      "After PCB, NEET-UG is the single entrance exam for MBBS, BDS, BAMS, BHMS, and other medical courses at government medical colleges, which charge a fraction of private-college fees. Allied paths like B.Sc Nursing, B.Pharm, and Physiotherapy have separate, often less competitive entrances and strong government-sector job demand (PHCs, district hospitals, public health missions).",
  },
  {
    category: "career",
    title: "Commerce & Finance Careers",
    tags: ["commerce", "ca", "finance", "banking"],
    content:
      "Commerce students can pursue B.Com from government colleges alongside professional certifications: Chartered Accountancy (CA via ICAI), Company Secretary (CS via ICSI), or Cost & Management Accountancy (CMA). These are exam-driven, relatively low-cost paths to strong careers even without an expensive private degree. Banking (via IBPS/SBI PO exams after graduation) and government finance roles are also popular, stable options.",
  },
  {
    category: "career",
    title: "Civil Services & Public Administration",
    tags: ["arts", "upsc", "civil services", "government"],
    content:
      "Arts/Humanities graduates are well represented in UPSC Civil Services (IAS, IPS, IFS) because subjects like History, Polity, Sociology and Economics overlap heavily with the exam syllabus. A B.A. from any recognised government college is fully sufficient eligibility; success depends on self-study and consistent current-affairs reading, not the college's brand name.",
  },
  {
    category: "career",
    title: "Design, Media & Communication Careers",
    tags: ["design", "media", "journalism", "arts"],
    content:
      "Both Arts and Science students can pursue design (via NID/UCEED), mass communication, and journalism degrees. Government-run institutes and university mass-comm departments offer affordable options. This field suits students who enjoy visual thinking, storytelling, or explaining complex ideas simply — growing demand exists in UX design, content strategy, and regional-language digital media.",
  },
  {
    category: "career",
    title: "Teaching & Education Careers",
    tags: ["teaching", "education", "b.ed"],
    content:
      "Any stream graduate can pursue a B.Ed to become a trained teacher, with strong government job stability (state TET/CTET exams, KVS/Navodaya recruitment). This path suits students who enjoy explaining concepts to others and value job security alongside social impact.",
  },
  // ---------------- COURSES ----------------
  {
    category: "course",
    title: "B.Sc / B.Tech options after PCM",
    tags: ["btech", "bsc", "pcm"],
    content:
      "Typical government-college degree options after PCM: B.Tech/B.E. (via JEE Main/state CET), B.Sc in Physics/Chemistry/Maths/Statistics/Computer Science, B.Arch (via NATA/JEE Paper 2), and integrated B.Sc-B.Ed. Duration is usually 3-4 years, with government college fees ranging roughly ₹10,000–₹60,000/year depending on state and course.",
  },
  {
    category: "course",
    title: "B.Sc options after PCB",
    tags: ["bsc", "pcb", "biology"],
    content:
      "Typical government-college degree options after PCB: MBBS/BDS (via NEET-UG), B.Sc Nursing, B.Pharm, B.Sc Agriculture, B.Sc Biotechnology/Microbiology/Zoology/Botany, and Physiotherapy (BPT). Agricultural universities and health-science universities often run dedicated entrance tests separate from NEET.",
  },
  {
    category: "course",
    title: "B.Com / BBA options after Commerce",
    tags: ["bcom", "bba", "commerce"],
    content:
      "Typical government-college degree options after Commerce: B.Com (General or Honours), BBA/BMS, B.Com with a CA/CS/CMA foundation running in parallel, and B.A. Economics. Many state universities also offer B.Voc programmes in Banking & Finance or Accounting with strong placement tie-ups.",
  },
  {
    category: "course",
    title: "B.A. options after Arts/Humanities",
    tags: ["ba", "arts", "humanities"],
    content:
      "Typical government-college degree options after Arts: B.A. in History, Political Science, Economics, Sociology, Psychology, English, Geography, or Journalism & Mass Communication, plus integrated B.A.-LL.B. (via CLAT) for students set on a legal career from Class 12 itself.",
  },
  // ---------------- EXAMS ----------------
  {
    category: "exam",
    title: "Key entrance exams after Class 12 Science",
    tags: ["exam", "jee", "neet"],
    content:
      "JEE Main/Advanced for engineering (NITs/IITs/state colleges), NEET-UG for MBBS/BDS/AYUSH courses, NATA/JEE Paper 2 for architecture, and CUET for central university admissions across streams. Most government engineering and medical seats are filled purely through these merit exams, keeping the cost of a government degree low relative to private capitation-fee seats.",
  },
  {
    category: "exam",
    title: "Key entrance exams after Class 12 Commerce/Arts",
    tags: ["exam", "clat", "cuet"],
    content:
      "CUET (Common University Entrance Test) is now the primary route into most central and many state universities for B.Com/B.A./BBA programmes. CLAT is the dedicated exam for 5-year integrated law programmes (B.A. LL.B.) at National Law Universities. CA Foundation (ICAI) can be attempted right after Class 12 for students committed to Chartered Accountancy.",
  },
  // ---------------- SCHOLARSHIPS ----------------
  // Generated from data/scholarshipKnowledgeBase.js — the single source of
  // truth also used to seed the structured Scholarship collection (see
  // seed.js). Keeping both derived from one file means the chatbot's RAG
  // answers and the Scholarship Finder page can never drift out of sync.
  ...require("./scholarshipKnowledgeBase").map((s) => ({
    category: "scholarship",
    title: s.title,
    tags: s.tags,
    content: `Provider: ${s.provider} (${s.type}). Eligibility: ${s.eligibility} Benefits: ${s.benefits} Typical deadline window: ${s.deadlineWindow} Official link: ${s.applyLink} Note: ${s.verifyNote}`,
  })),
  // ---------------- ENGINEERING DEEP-DIVE ----------------
  {
    category: "career",
    title: "Engineering branches/specializations explained",
    tags: ["engineering", "branches", "cse", "mechanical", "civil", "electrical", "ece"],
    content:
      "Major engineering branches in India: Computer Science Engineering (CSE) — software, algorithms, AI/ML, highest placement demand; Information Technology (IT) — closely related to CSE, systems/networks focus; Electronics & Communication (ECE) — chips, signal processing, telecom, embedded systems; Electrical & Electronics (EEE) — power systems, machines, renewable energy; Mechanical Engineering — design, thermal, manufacturing, robotics; Civil Engineering — construction, structures, infrastructure, urban planning; Chemical Engineering — process industries, petrochemicals, materials; Aerospace/Aeronautical — aircraft/spacecraft design; Biotechnology — bio-processes, pharma, genetic engineering; Artificial Intelligence & Data Science — a newer specialised branch now offered by many NITs/IITs/state colleges; Automobile Engineering — vehicle design and manufacturing. CSE/IT and AI-DS currently have the strongest private-sector placement demand; core branches (Mechanical/Civil/Electrical) have strong PSU and government-sector demand via GATE.",
  },
  {
    category: "exam",
    title: "Complete list of engineering entrance exams in India",
    tags: ["engineering", "jee", "entrance exam", "cet", "bitsat"],
    content:
      "National-level: JEE Main (for NITs/IIITs/GFTIs and as a JEE Advanced qualifier), JEE Advanced (for IITs only, must qualify JEE Main first), BITSAT (for BITS Pilani/Goa/Hyderabad), VITEEE (VIT University), SRMJEEE (SRM University). State-level CETs (each state runs its own for state government engineering colleges): KCET (Karnataka), MHT-CET (Maharashtra), WBJEE (West Bengal), TS EAMCET/AP EAPCET (Telangana/Andhra Pradesh), KEAM (Kerala), OJEE (Odisha), UPSEE/UPCET (Uttar Pradesh), and similar boards in most other states. Lateral entry (for diploma/polytechnic holders into 2nd year B.Tech): state-specific Lateral Entry Test (LET) or direct merit. Postgraduate entry: GATE (for M.Tech and PSU recruitment). Note: exact cutoff ranks/percentiles for any specific exam and college change every year based on difficulty and number of seats — always verify the current year's cutoff on the exam's official counselling portal (JoSAA/CSAB for JEE, or the respective state CET authority) rather than relying on a prior year's number.",
  },
  {
    category: "college",
    title: "Engineering college tiers in India (generic structure)",
    tags: ["engineering", "college", "iit", "nit", "iiit", "gfti", "cutoff"],
    content:
      "Engineering colleges in India are broadly grouped into tiers: Tier 1 — IITs (23 institutes, admission via JEE Advanced only) and top NITs/IIITs (via JEE Main + JoSAA counselling). Tier 2 — remaining NITs, IIITs, and Government-Funded Technical Institutes (GFTIs) via JEE Main. Tier 3 — State government engineering colleges via the respective state CET (e.g. KCET, MHT-CET). Tier 4 — well-established private/deemed universities (BITS, VIT, SRM, Manipal, and similar) via their own entrance tests. Tier 5 — other private engineering colleges, often with management-quota or direct-admission seats. Government (Tier 1-3) colleges cost a fraction of private college fees and generally offer stronger PSU/government-job pipelines, while top private universities (Tier 4) can offer strong private-sector placements at a much higher fee. Exact yearly cutoff ranks for a specific college+branch combination fluctuate with exam difficulty and applicant numbers each year — always check the official JoSAA/CSAB opening-closing rank tables or the relevant state CET's cutoff PDF for the current admission cycle rather than a fixed number.",
  },
  // ---------------- COLLEGES (sample) ----------------
  {
    category: "college",
    title: "Finding nearby government degree colleges",
    tags: ["college", "government college", "location"],
    content:
      "Government degree colleges are listed on each state's Directorate of Collegiate Education / Higher Education portal, and on the AISHE (All India Survey on Higher Education) college locator. Students should shortlist 3-4 nearby government colleges offering their chosen stream, check affiliation (usually to the state public university), and confirm the current year's admission/cutoff notification directly on the college or university website.",
  },
];
