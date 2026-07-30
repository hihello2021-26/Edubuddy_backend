const {
  getCompanyPrepPack,
  mockInterviewTurn,
  scoreInterview,
} = require("../services/agents/placementAgent");

const automationService = require("../services/automationService");
const { generateText, safeParseJSON } = require("../services/aiService");

// ======================================================
// Placement Preparation
// ======================================================

// POST /api/placement/prep
exports.prep = async (req, res) => {
  try {
    const { company, role } = req.body;

    if (!company || !role) {
      return res
        .status(400)
        .json({ message: "company and role are required." });
    }

    const pack = await getCompanyPrepPack({ company, role });

    res.json(pack);
  } catch (err) {
    res.status(500).json({
      message: "Placement Agent failed.",
      error: err.message,
    });
  }
};

// ======================================================
// Mock Interview
// ======================================================

// POST /api/placement/mock-interview
exports.mockInterview = async (req, res) => {
  try {
    const { company, role, history } = req.body;

    const reply = await mockInterviewTurn({
      company,
      role,
      history,
    });

    res.json({ reply });
  } catch (err) {
    res.status(500).json({
      message: "Mock interview agent failed.",
      error: err.message,
    });
  }
};

// ======================================================
// Complete Interview
// ======================================================

// POST /api/placement/mock-interview/complete
exports.completeInterview = async (req, res) => {
  try {
    const { company, role, history } = req.body;

    if (!history || history.length === 0) {
      return res.status(400).json({
        message: "No interview history to score.",
      });
    }

    const result = await scoreInterview({
      company,
      role,
      history,
    });

    try {
      await automationService.handleInterviewCompleted({
        userId: req.userId,
        score: result.score,
        communicationScore: result.communicationScore,
      });
    } catch (automationError) {
      console.warn(
        "⚠️ Automation (interview completed) failed:",
        automationError.message
      );
    }

    return res.json(result);
  } catch (err) {
    return res.status(500).json({
      message: "Interview scoring failed.",
      error: err.message,
    });
  }
};

// ======================================================
// Generate Coding Problem
// ======================================================

// POST /api/placement/coding-generate
exports.generateCodingProblem = async (req, res) => {
  try {
    const {
      language = "Python",
      difficulty = "Medium",
      topic = "Arrays & Hashing",
    } = req.body;

    const systemInstruction = `
You are EduBuddy's Master Coding Evaluator.

Generate a structured coding interview problem.

Respond ONLY with valid JSON:

{
  "title":"Problem Title",
  "difficulty":"${difficulty}",
  "topic":"${topic}",
  "language":"${language}",
  "statement":"Detailed statement",
  "inputOutput":[
    {
      "input":"Example",
      "output":"Example",
      "explanation":"Explanation"
    }
  ],
  "constraints":[
    "Constraint 1",
    "Constraint 2"
  ],
  "starterCode":"Starter Code",
  "hint":"Helpful Hint",
  "optimalComplexity":"Time: O(...) | Space: O(...)"
}
`;

    const userPrompt = `Generate a ${difficulty} coding challenge on ${topic} using ${language}.`;

    const raw = await generateText(systemInstruction, userPrompt, {
      temperature: 0.5,
      maxOutputTokens: 900,
      json: true,
      provider: "groq",
    });

    const problem =
      safeParseJSON(raw) || {
        title: `${topic} Challenge`,
        difficulty,
        topic,
        language,
        statement: `Solve this ${difficulty} ${topic} problem using ${language}.`,
        inputOutput: [
          {
            input: "nums=[2,7,11,15], target=9",
            output: "[0,1]",
            explanation: "2+7=9",
          },
        ],
        constraints: ["1 <= N <= 100000"],
        starterCode:
          language === "Python"
            ? `def solve(nums, target):
    pass`
            : `public class Solution {
    public int[] solve(int[] nums, int target){
        return new int[]{};
    }
}`,
        hint: "Use a HashMap.",
        optimalComplexity: "Time: O(N) | Space: O(N)",
      };

    res.json({ problem });
  } catch (err) {
    res.status(500).json({
      message: "Could not generate coding problem",
      error: err.message,
    });
  }
};

// ======================================================
// Evaluate Coding Solution
// ======================================================

// POST /api/placement/coding-evaluate
exports.evaluateCodingSolution = async (req, res) => {
  try {
    const { problem, userCode, language = "Python" } = req.body;

    if (!userCode || !userCode.trim()) {
      return res.status(400).json({
        message: "User code is required.",
      });
    }

    const systemInstruction = `
You are EduBuddy's AI Code Reviewer.

Evaluate the submitted solution.

Return ONLY JSON.

{
  "score":90,
  "isCorrect":true,
  "verdict":"Accepted",
  "timeComplexity":"O(N)",
  "spaceComplexity":"O(N)",
  "feedback":"Detailed explanation",
  "optimalSolution":"Production-ready code"
}
`;

    const userPrompt = `
PROBLEM:

${JSON.stringify(problem)}

LANGUAGE:

${language}

USER CODE:

${userCode}
`;

    const raw = await generateText(systemInstruction, userPrompt, {
      temperature: 0.3,
      maxOutputTokens: 900,
      json: true,
      provider: "groq",
    });

    const evaluation =
      safeParseJSON(raw) || {
        score: 80,
        isCorrect: true,
        verdict: "Accepted",
        timeComplexity: "O(N)",
        spaceComplexity: "O(N)",
        feedback: "Good solution. Consider handling more edge cases.",
        optimalSolution: userCode,
      };

    res.json({ evaluation });
  } catch (err) {
    res.status(500).json({
      message: "Could not evaluate code",
      error: err.message,
    });
  }
};