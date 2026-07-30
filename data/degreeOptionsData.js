// Options shown on the Degree-level dashboard: what to do after a bachelor's degree.
module.exports = {
  higherStudies: [
    { key: "mtech", name: "M.Tech", entrance: "GATE", notes: "Best for research/technical depth; GATE score also unlocks PSU recruitment." },
    { key: "mba", name: "MBA", entrance: "CAT / XAT / CMAT / State MBA CETs", notes: "Best ROI from IIMs/top govt B-schools; also strong from state government B-schools." },
    { key: "ms", name: "MS (Abroad)", entrance: "GRE + IELTS/TOEFL", notes: "Research/technical specialisation abroad; look for university assistantships to offset cost." },
    { key: "phd", name: "PhD", entrance: "NET/GATE + institute interview", notes: "For research/academia careers; UGC-NET/CSIR-NET JRF gives a stipend." },
  ],
  governmentJobs: [
    { key: "upsc", name: "UPSC Civil Services (IAS/IPS/IFS)", eligibility: "Any bachelor's degree" },
    { key: "banking", name: "Banking (IBPS PO/Clerk, SBI PO)", eligibility: "Any bachelor's degree" },
    { key: "ssc_cgl", name: "SSC CGL", eligibility: "Any bachelor's degree" },
    { key: "psu", name: "PSU (via GATE for technical, or direct recruitment)", eligibility: "Relevant engineering/science degree" },
    { key: "defence_cds", name: "CDS (Defence, after graduation)", eligibility: "Any bachelor's degree, physical fitness" },
  ],
  privateJobs: [
    "Software Development", "Data Analytics/Science", "Product Management",
    "Sales & Business Development", "Consulting", "Core-branch engineering roles",
    "Digital Marketing", "Finance & Investment Banking",
  ],
  internships: [
    "AICTE Internship Portal", "Government e-internship scheme", "Startup internships via LinkedIn/Internshala-style portals",
    "Research internships (summer fellowships at IISc/IITs/CSIR labs)",
  ],
  certifications: [
    { key: "cloud", name: "Cloud (AWS/Azure/GCP fundamentals)", relevance: "High for software/data roles" },
    { key: "data", name: "Data Analytics (SQL, Python, Power BI)", relevance: "High for analyst roles" },
    { key: "pm", name: "Product Management basics", relevance: "For product-track careers" },
    { key: "digital_marketing", name: "Google/Meta Digital Marketing certs", relevance: "For marketing roles" },
  ],
};
