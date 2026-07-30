const { runProfileAgent } = require("./profileAgent");
const { runStreamAgent } = require("./streamAgent");
const { runCareerAgent } = require("./careerAgent");
const { runRoadmapAgent } = require("./roadmapAgent");

/**
 * Agentic AI Orchestrator
 * -----------------------
 * This is the heart of EduBuddy's "agentic" behaviour: instead of one giant
 * prompt, four specialised agents run in a fixed sequence, each one
 * consuming the previous agent's structured output as its own input, and
 * each grounding its answer in RAG-retrieved facts rather than pure
 * hallucination. This mirrors a real advisory session:
 *
 *   1. Profile Analyzer   -> understands the student
 *   2. Stream Recommender -> decides Science / Commerce / Arts (RAG-grounded)
 *   3. Career Path Agent   -> shortlists concrete degree/career paths (RAG-grounded)
 *   4. Roadmap Agent       -> turns it all into a step-by-step action plan
 *
 * Every agent's sources are collected so the frontend can show the student
 * exactly which knowledge-base facts informed each recommendation.
 */
async function runAgentPipeline({ classLevel, answers, interests = [], strengths = [] }) {
  const allSources = new Set();

  // Step 1
  const profileSummary = await runProfileAgent({ classLevel, answers });

  // Step 2
  const { recommendation: streamRecommendation, sources: streamSources } = await runStreamAgent({
    classLevel,
    profileSummary,
    interests,
  });
  streamSources.forEach((s) => allSources.add(s));

  // Step 3
  const { paths: careerPaths, sources: careerSources } = await runCareerAgent({
    profileSummary,
    stream: streamRecommendation.primary,
    interests,
  });
  careerSources.forEach((s) => allSources.add(s));

  // Step 4
  const roadmap = await runRoadmapAgent({
    classLevel,
    stream: streamRecommendation.primary,
    paths: careerPaths,
  });

  return {
    profileSummary,
    streamRecommendation,
    careerPaths,
    roadmap,
    ragSources: Array.from(allSources),
  };
}

module.exports = { runAgentPipeline };
