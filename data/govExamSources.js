// Every category the Government Exam Agent tracks. `searchQuery` is what gets
// sent to the web search provider (services/searchService.js) each day;
// `fallbackSeed` is used if no search provider key is configured, so the app
// still has believable demo data to show out of the box.
module.exports = [
  { category: "UPSC", searchQuery: "UPSC latest notification recruitment site:upsc.gov.in" },
  { category: "KPSC", searchQuery: "KPSC Karnataka Public Service Commission latest notification" },
  { category: "SSC", searchQuery: "SSC latest recruitment notification site:ssc.nic.in" },
  { category: "IBPS", searchQuery: "IBPS latest recruitment notification" },
  { category: "RRB", searchQuery: "RRB Railway Recruitment Board latest notification" },
  { category: "Defence", searchQuery: "Indian Army Navy Air Force latest recruitment notification" },
  { category: "Banking", searchQuery: "SBI RBI bank PO clerk latest recruitment notification" },
  { category: "Railways", searchQuery: "Indian Railways latest recruitment notification" },
  { category: "Police", searchQuery: "state police constable SI latest recruitment notification India" },
  { category: "Teaching", searchQuery: "CTET TET teacher recruitment latest notification India" },
  { category: "PSU", searchQuery: "PSU recruitment through GATE latest notification" },
  { category: "ISRO", searchQuery: "ISRO recruitment latest notification" },
  { category: "DRDO", searchQuery: "DRDO recruitment latest notification" },
  { category: "NIC", searchQuery: "NIC National Informatics Centre recruitment notification" },
  { category: "State PSC", searchQuery: "state public service commission latest recruitment notification India" },
  { category: "Forest", searchQuery: "forest department recruitment forest guard ranger notification India" },
  { category: "Insurance", searchQuery: "LIC insurance sector recruitment latest notification India" },
  { category: "Judiciary", searchQuery: "judicial services civil judge recruitment latest notification India" },
  { category: "Other Central/State", searchQuery: "central state government recruitment latest notification India" },
];
