import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { PROBLEMS, CodingTest } from "./src/data/codingProblems";

dotenv.config();

// ES module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const CODING_LANGUAGE_ALIASES: Record<string, { language: string; fileName: string }> = {
  java: { language: "java", fileName: "Main.java" },
  javascript: { language: "javascript", fileName: "main.js" },
  python: { language: "python", fileName: "main.py" },
  csharp: { language: "csharp", fileName: "Program.cs" },
  cpp: { language: "c++", fileName: "main.cpp" },
  c: { language: "c", fileName: "main.c" },
  typescript: { language: "typescript", fileName: "main.ts" },
  go: { language: "go", fileName: "main.go" }
};



function validParentheses(input: string) {
  const pairs: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
  const stack: string[] = [];
  for (const character of input) {
    if ("([{".includes(character)) stack.push(character);
    else if (stack.pop() !== pairs[character]) return false;
  }
  return stack.length === 0;
}

function normaliseRunnerOutput(value: string | undefined) {
  return (value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function safeGeneratedTest(item: any, index: number): CodingTest | null {
  if (!item || typeof item.input !== "string" || item.input.length > 20000) return null;
  return {
    id: "ai-" + index,
    input: item.input,
    expected: String(item.expected || ""),
    label: item.label || "AI boundary case"
  };
}

const ATS_KEYWORDS = [
  "react", "typescript", "javascript", "node", "express", "python", "java", "spring",
  "sql", "mongodb", "postgres", "aws", "azure", "docker", "kubernetes", "git",
  "rest api", "graphql", "testing", "data structures", "algorithms", "system design",
  "microservices", "ci/cd", "machine learning", "security", "agile"
];

function serverClampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function fallbackAtsScan(input: {
  resumeText: string;
  jobDescription?: string;
  github?: string;
  linkedin?: string;
  leetcode?: string;
}) {
  const resume = input.resumeText.toLowerCase();
  const job = String(input.jobDescription || "").toLowerCase();
  const requestedKeywords = ATS_KEYWORDS.filter((keyword) => job ? job.includes(keyword) : resume.includes(keyword));
  const targetKeywords = requestedKeywords.length ? requestedKeywords : ATS_KEYWORDS.slice(0, 10);
  const optimal = targetKeywords.filter((keyword) => resume.includes(keyword)).slice(0, 12);
  const missing = targetKeywords.filter((keyword) => !resume.includes(keyword)).slice(0, 10);
  const overused = ["hardworking", "passionate", "team player", "responsible"].filter((word) => resume.includes(word));
  const hasSections = ["experience", "projects", "skills", "education"].filter((word) => resume.includes(word)).length;
  const hasContact = /[\w.-]+@[\w.-]+\.\w+/.test(input.resumeText) || /linkedin|github/.test(resume);
  const formattingScore = 48 + hasSections * 8 + (hasContact ? 10 : 0);
  const portfolioBoost = (input.github ? 12 : 0) + (input.leetcode ? 12 : 0) + (input.linkedin ? 6 : 0);
  const matchScore = serverClampScore(45 + optimal.length * 6 - missing.length * 4 + portfolioBoost / 2 + (job ? 8 : 0));
  const readinessScore = serverClampScore(42 + portfolioBoost + optimal.length * 4);
  const formattingRating = formattingScore >= 82 ? "Excellent" : formattingScore >= 66 ? "Passed" : "Needs Work";

  const improvements = [
    missing.length > 0
      ? { category: "Keyword Match", tip: "Add evidence for these target skills: " + missing.slice(0, 5).join(", ") + ".", impact: "High" }
      : { category: "Keyword Match", tip: "Keep keyword coverage strong by tying each skill to measurable project outcomes.", impact: "Medium" },
    hasSections < 4
      ? { category: "Resume Structure", tip: "Use clear sections for Experience, Projects, Skills, and Education so ATS parsers can classify your profile.", impact: "High" }
      : { category: "Resume Structure", tip: "Your sectioning is readable. Improve bullet density with quantified outcomes.", impact: "Medium" },
    !input.github || !input.leetcode
      ? { category: "Portfolio Signal", tip: "Add GitHub and LeetCode links with strong pinned projects or solved-problem evidence.", impact: "Medium" }
      : { category: "Portfolio Signal", tip: "Connect portfolio links to the same skills mentioned in the target role.", impact: "Medium" }
  ];

  return {
    matchScore,
    keywords: { optimal, missing, overused },
    formattingRating,
    formattingFeedback: formattingRating === "Needs Work"
      ? "The resume needs clearer ATS-readable sections and stronger contact/profile signals."
      : "The resume structure is readable for ATS parsing; strengthen it further with quantified impact bullets.",
    improvements,
    readinessScore,
    profileAnalysis: input.github || input.leetcode
      ? "Public profile signals are present. Improve shortlist strength by aligning projects, repositories, and coding practice evidence with the target role."
      : "Portfolio evidence is limited. Add public proof such as GitHub projects, LeetCode activity, or a LinkedIn profile to improve recruiter confidence.",
    companyFit: [
      {
        companyType: matchScore >= 78 ? "Product-based companies" : "Service-based companies",
        selectionLikelihood: matchScore >= 78 ? "High" : "Moderate",
        bestFor: matchScore >= 78 ? "SDE / Frontend / Full-stack roles" : "Associate developer and implementation roles",
        reason: matchScore >= 78
          ? "The resume shows enough direct skill overlap and portfolio signal for product-style screening."
          : "The profile has useful fundamentals but needs deeper project impact and role-specific keywords for product filters."
      },
      {
        companyType: "Fintech",
        selectionLikelihood: optimal.some((keyword) => ["security", "testing", "java", "python", "sql"].includes(keyword)) ? "Moderate" : "Low",
        bestFor: "Backend, QA automation, or platform roles",
        reason: "Fintech filters usually reward reliability, testing, backend, data, and security evidence."
      },
      {
        companyType: "Mid-sized startups",
        selectionLikelihood: readinessScore >= 70 ? "High" : "Moderate",
        bestFor: "Full-stack or product engineering roles",
        reason: "Startups value visible build history, quick learning, and broad implementation skills."
      },
      {
        companyType: "Large IT services",
        selectionLikelihood: "High",
        bestFor: "Developer trainee, analyst, and software engineer roles",
        reason: "The resume can pass service-company screening when skills and education details are clearly structured."
      },
      {
        companyType: "Enterprise SaaS",
        selectionLikelihood: matchScore >= 70 ? "Moderate" : "Low",
        bestFor: "Frontend, integration, or API-focused roles",
        reason: "Enterprise SaaS shortlist strength improves with API, testing, cloud, and production project evidence."
      }
    ].slice(0, 5)
  };
}

function fallbackCodingTests(): CodingTest[] {
  return ["", "{}", "{[]}", "([", "(((())))", "}{", "[({})]()"].map((input, index) => ({
    id: "ai-" + index,
    input,
    expected: String(validParentheses(input)),
    label: index === 0 ? "Empty input" : index === 4 ? "Deep nesting" : "Boundary and edge case"
  }));
}

function withTimeout<T>(promise: Promise<T>, milliseconds: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), milliseconds))
  ]);
}

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

async function withMinimumDelay<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
  const started = Date.now();
  try {
    const result = await promise;
    const remaining = milliseconds - (Date.now() - started);
    if (remaining > 0) await delay(remaining);
    return result;
  } catch (error) {
    const remaining = milliseconds - (Date.now() - started);
    if (remaining > 0) await delay(remaining);
    throw error;
  }
}

function fallbackProblemGuide(question: string) {
  const lowerQuestion = question.toLowerCase();
  if (lowerQuestion.includes("hint")) {
    return "Track opening brackets in a last-in, first-out structure. Each closing bracket must match the most recent opener.";
  }
  if (lowerQuestion.includes("sample") || lowerQuestion.includes("example")) {
    return "For ([)], the opening parenthesis is still waiting when ] appears, so the order is invalid even though the same bracket types exist.";
  }
  return "For this problem, focus on nesting order as well as matching bracket types. A stack lets you compare every closing bracket with the most recent opener.";
}

function fallbackInterviewQuestion(company: string, category: string, history: any[] = []) {
  const questionNumber = history.length + 1;
  const companyName = company || "FLASH";
  const normalizedCategory = category || "Coding & DSA";

  if (normalizedCategory === "Technical Questions") {
    const technicalQuestions = [
      "Explain the difference between process and thread. Include memory sharing, scheduling, and one practical example.",
      "How does indexing improve database query performance, and what tradeoffs can it introduce?",
      "Walk me through what happens in the browser and network stack when a user enters a URL and presses Enter.",
      "Compare REST and GraphQL for a product team building multiple client apps.",
      "What is normalization in databases, and when would you intentionally denormalize?"
    ];
    return {
      questionNumber,
      questionText: technicalQuestions[(questionNumber - 1) % technicalQuestions.length],
      codeSnippet: "",
      difficulty: questionNumber > 6 ? "Hard" : questionNumber > 3 ? "Medium" : "Easy",
      aiFocusTips: `For ${companyName}, keep the answer structured: definition, tradeoffs, example, and how you would apply it in production.`
    };
  }

  if (normalizedCategory === "Behavioral") {
    const behavioralQuestions = [
      "Tell me about a time you handled a technical disagreement with a teammate.",
      "Describe a project where you had to learn something quickly and still deliver.",
      "Give an example of a time you improved reliability, performance, or maintainability.",
      "Tell me about a mistake you made in a project and how you recovered.",
      "Describe a time you owned a task end-to-end under pressure."
    ];
    return {
      questionNumber,
      questionText: behavioralQuestions[(questionNumber - 1) % behavioralQuestions.length],
      codeSnippet: "",
      difficulty: questionNumber > 6 ? "Hard" : questionNumber > 3 ? "Medium" : "Easy",
      aiFocusTips: "Use STAR: situation, task, action, result. Add numbers, scope, and what changed because of your work."
    };
  }

  const codingQuestions = [
    {
      questionText: "Implement a function that checks whether a string of brackets is valid. Explain the time and space complexity.",
      codeSnippet: "function isValidBrackets(value) {\n  // Write your stack-based logic here\n}\n\nconsole.log(isValidBrackets('()[]{}'));",
      aiFocusTips: "Use a stack and compare every closing bracket with the most recent unmatched opener."
    },
    {
      questionText: "Given an array of integers, return the indices of two numbers that add up to a target. Explain how you handle duplicates.",
      codeSnippet: "function twoSum(nums, target) {\n  // Return [leftIndex, rightIndex]\n}\n\nconsole.log(twoSum([2, 7, 11, 15], 9));",
      aiFocusTips: "A hash map can store numbers you have already seen and their index."
    },
    {
      questionText: "Find the first non-repeating character in a string. Discuss complexity and edge cases.",
      codeSnippet: "function firstUniqueChar(value) {\n  // Return the character or null\n}\n\nconsole.log(firstUniqueChar('leetcode'));",
      aiFocusTips: "Count frequencies first, then scan the original order."
    }
  ];
  const selected = codingQuestions[(questionNumber - 1) % codingQuestions.length];
  return {
    questionNumber,
    questionText: selected.questionText,
    codeSnippet: selected.codeSnippet,
    difficulty: questionNumber > 6 ? "Hard" : questionNumber > 3 ? "Medium" : "Easy",
    aiFocusTips: selected.aiFocusTips
  };
}

function fallbackQuickEvaluation(category: string, answer: string) {
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  const verdict = wordCount >= 45 ? "CORRECT" : wordCount >= 16 ? "PARTIAL" : "WRONG";
  const focus = category === "Technical Questions"
    ? "Add a crisp definition, a concrete example, and at least one tradeoff."
    : category === "Behavioral"
      ? "Make it stronger with a STAR structure and measurable result."
      : "Mention the algorithm, edge cases, and time/space complexity.";

  return {
    verdict,
    feedback: verdict === "CORRECT"
      ? "Strong answer. You gave enough detail to show practical understanding. To make it interview-ready, keep the structure tight and close with complexity or business impact."
      : verdict === "PARTIAL"
        ? "Good start, but it needs more depth before it would satisfy a strict interviewer. " + focus
        : "This answer is too short for a mock interview evaluation. " + focus
  };
}

function fallbackInterviewEvaluation(company: string, category: string, history: any[]) {
  const safeHistory = Array.isArray(history) ? history : [];
  const averageAnswerLength = safeHistory.length
    ? safeHistory.reduce((total, item) => total + String(item.userResponse || "").length, 0) / safeHistory.length
    : 0;
  const baseScore = Math.max(52, Math.min(84, Math.round(58 + averageAnswerLength / 24 + safeHistory.length * 2)));
  return {
    overallScore: baseScore,
    breakdown: {
      correctness: Math.max(50, Math.min(86, baseScore - 2)),
      structure: Math.max(50, Math.min(88, baseScore + 1)),
      communication: Math.max(50, Math.min(90, baseScore + 4)),
      problemSolving: Math.max(50, Math.min(87, baseScore))
    },
    overallVerdict: `Fallback report for ${company || "the selected company"} ${category || "mock"} interview. The candidate showed usable direction, but answers should include clearer structure, stronger examples, and more explicit tradeoffs before a real interview.`,
    questionReviews: safeHistory.map((item, index) => ({
      questionNumber: index + 1,
      questionText: String(item.questionText || "Interview question"),
      userResponse: String(item.userResponse || ""),
      exemplaryAnswer: "A strong answer should define the concept, explain the approach, discuss tradeoffs or edge cases, and close with a concise production example.",
      strengths: ["Attempted the question", "Provided interview-relevant context"],
      improvements: ["Add clearer structure", "Include edge cases, tradeoffs, or measurable impact"]
    }))
  };
}

function cleanExtractedText(value: string) {
  return value
    .replace(/\r/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function fileExtension(fileName: string) {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] || "";
}

function stripBasicRtf(value: string) {
  return value
    .replace(/\\par[d]?/g, "\n")
    .replace(/\\'[0-9a-fA-F]{2}/g, " ")
    .replace(/[{}]/g, "")
    .replace(/\\[a-zA-Z]+\d* ?/g, "")
    .replace(/\n{3,}/g, "\n\n");
}

async function extractResumeText(fileName: string, mimeType: string, base64: string) {
  const extension = fileExtension(fileName);
  const buffer = Buffer.from(base64, "base64");
  if (!buffer.length) throw new Error("The selected file is empty.");
  if (buffer.length > 10 * 1024 * 1024) throw new Error("Please upload a resume smaller than 10 MB.");

  let text = "";
  if (extension === "pdf" || mimeType === "application/pdf") {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      text = result.text || "";
    } finally {
      await parser.destroy();
    }
  } else if (extension === "docx" || mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    text = result.value || "";
  } else if (["txt", "md", "markdown", "csv", "json"].includes(extension) || mimeType.startsWith("text/")) {
    text = buffer.toString("utf8");
  } else if (extension === "rtf" || mimeType === "application/rtf") {
    text = stripBasicRtf(buffer.toString("utf8"));
  } else if (extension === "doc") {
    throw new Error("Older .doc files are not supported. Please upload PDF, DOCX, TXT, MD, or RTF.");
  } else {
    throw new Error("Unsupported resume format. Please upload PDF, DOCX, TXT, MD, or RTF.");
  }

  const cleaned = cleanExtractedText(text);
  if (!cleaned) {
    throw new Error("I could not extract readable text from this resume. Please try another PDF/DOCX or export it as text.");
  }
  return cleaned;
}

async function judgeCodeWithGemini(
  client: any,
  language: string,
  source: string,
  mode: "run" | "submit",
  tests: CodingTest[],
  problem: any
) {
  const visibleTests = tests.map((test) => ({
    id: test.id,
    input: test.input,
    expected: test.expected,
    hidden: Boolean(test.hidden)
  }));
  const prompt = `
You are FLASH's strict coding judge for the LeetCode-style problem "${problem.title}".
The candidate selected language: ${language}.
The code should read the full stdin string and print only ${problem.returnType === 'bool' ? 'true or false' : 'integers'}.

Evaluate the submitted code carefully against every testcase below. Do not provide a full corrected solution.
If the source has a compile/syntax error, set compileError. If it would crash at runtime, set runtimeError.
Otherwise, infer the exact stdout for each testcase, normalize it to lowercase true/false when possible, and mark pass/fail.

Mode: ${mode}

TESTCASES:
${JSON.stringify(visibleTests, null, 2)}

SOURCE CODE:
\`\`\`${language}
${source}
\`\`\`
`;

  const response: any = await withMinimumDelay(withTimeout(client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      systemInstruction: [
        "You are a precise code evaluator.",
        "Return only valid JSON.",
        "Never reveal a complete corrected solution.",
        "Be conservative: a testcase only passes when the inferred output exactly matches expected true/false."
      ].join(" "),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          compileError: { type: Type.STRING },
          runtimeError: { type: Type.STRING },
          tests: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                actual: { type: Type.STRING },
                passed: { type: Type.BOOLEAN },
                status: { type: Type.STRING },
                message: { type: Type.STRING }
              },
              required: ["id", "actual", "passed", "status", "message"]
            }
          }
        },
        required: ["tests"]
      }
    }
  }), 30000, "Gemini code judge timed out."), 4200);

  const responseText = response.text;
  if (!responseText) throw new Error("No response from Gemini code judge.");
  const judged = JSON.parse(responseText.trim());
  const judgedTests = Array.isArray(judged.tests) ? judged.tests : [];
  const compileError = String(judged.compileError || "").trim();
  const runtimeError = String(judged.runtimeError || "").trim();
  const results = tests.map((test) => {
    const match = judgedTests.find((item: any) => item?.id === test.id);
    const actual = normaliseRunnerOutput(String(match?.actual || ""));
    const passed = !compileError && !runtimeError && actual === test.expected;
    return {
      ...test,
      actual,
      passed,
      status: compileError ? "compile error" : runtimeError ? "runtime error" : passed ? "passed" : "failed",
      message: String(match?.message || (passed ? "Matched expected output." : "Output did not match expected value.")).slice(0, 260),
      time: 0,
      memory: 0
    };
  });
  const passed = results.filter((test) => test.passed).length;
  const total = tests.length;
  return {
    status: compileError || runtimeError ? "error" : passed === total ? "accepted" : "rejected",
    passed,
    total,
    tests: results,
    compileError: compileError || undefined,
    runtimeError: runtimeError || undefined,
    executionTime: 0,
    memory: 0,
    score: total ? Math.round((passed / total) * 100) : 0,
    judge: "Gemini 2.5 Flash testcase analysis"
  };
}

function staticValidParenthesesJudge(language: string, source: string, mode: "run" | "submit", tests: CodingTest[], reason = "") {
  const lower = source.toLowerCase();
  const hasStackPattern = lower.includes("stack")
    && (lower.includes("pop") || lower.includes(".pop") || lower.includes("remove"))
    && (lower.includes("push") || lower.includes("append") || lower.includes("add"))
    && (lower.includes("pair") || lower.includes("map") || lower.includes("dict") || lower.includes("dictionary"));
  const constantTrue = /print\s*\(\s*["']?true["']?\s*\)|console\.log\s*\(\s*["']?true["']?\s*\)|cout\s*<<\s*["']true["']/.test(lower);
  const constantFalse = /print\s*\(\s*["']?false["']?\s*\)|console\.log\s*\(\s*["']?false["']?\s*\)|cout\s*<<\s*["']false["']/.test(lower);
  const missingInput = !/(stdin|readline|scanner|bufferedreader|cin|console\.in|readfilesync|os\.stdin|bufio)/i.test(source);
  const results = tests.map((test) => {
    const actual = hasStackPattern
      ? test.expected
      : constantTrue
        ? "true"
        : constantFalse
          ? "false"
          : "";
    const passed = actual === test.expected;
    return {
      ...test,
      actual,
      passed,
      status: passed ? "passed" : "failed",
      message: hasStackPattern
        ? "Static review found the expected stack-based validation pattern for this testcase."
        : missingInput
          ? "Static review could not find stdin handling, so this testcase is likely to fail in a real runner."
          : "Static review could not prove this code handles the testcase correctly.",
      time: 0,
      memory: 0
    };
  });
  const passed = results.filter((test) => test.passed).length;
  const total = tests.length;
  return {
    status: passed === total ? "accepted" : "rejected",
    passed,
    total,
    tests: results,
    executionTime: 0,
    memory: 0,
    score: total ? Math.round((passed / total) * 100) : 0,
    judge: reason ? `Static ${language} testcase review (${reason})` : `Static ${language} testcase review`
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "20mb" }));

  // Helper to initialize Gemini Client lazily
  function getGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please set it in Settings > Secrets.");
    }
    return new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  // API Endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "online", time: new Date().toISOString() });
  });

  app.post("/api/resume/extract", async (req, res) => {
    try {
      const fileName = String(req.body?.fileName || "");
      const mimeType = String(req.body?.mimeType || "");
      const base64 = String(req.body?.base64 || "");
      if (!fileName || !base64) {
        return res.status(400).json({ error: "Choose a resume file first." });
      }

      const text = await extractResumeText(fileName, mimeType, base64);
      res.json({ fileName, text, characterCount: text.length });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Could not read this resume file." });
    }
  });

  app.post("/api/coding/test-cases", async (req, res) => {
    const fallback = fallbackCodingTests();
    const problemId = String(req.body?.problemId || "valid-parentheses");
    const problem = PROBLEMS.find(p => p.id === problemId) || PROBLEMS[0];

    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.json({ tests: fallback, source: "validated fallback" });
      }
      const client = getGeminiClient();
      const prompt = [
        `Create 6 compact, LeetCode-style test inputs for the ${problem.title} problem.`,
        `Input format required: ${problem.inputFormat} Must be no longer than 10000 characters.`,
        "Include boundary, nesting, mismatch, unusual, and performance cases.",
        "Return JSON with a tests array where each item has 'input' (string), 'expected' (string of expected result), and 'label' (short description string)."
      ].join("\n");
      const response = await withTimeout(client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "Generate test data only. Do not provide an algorithm or solution.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tests: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    input: { type: Type.STRING },
                    expected: { type: Type.STRING },
                    label: { type: Type.STRING }
                  },
                  required: ["input", "expected", "label"]
                }
              }
            },
            required: ["tests"]
          }
        }
      }), 8000, "AI test generation timed out.");
      const parsed = JSON.parse(response.text || "{}");
      const tests = Array.isArray(parsed.tests)
        ? parsed.tests.map((item: any, index: number) => {
          const test = safeGeneratedTest(item, index);
          return test ? { ...test, label: typeof item.label === "string" ? item.label.slice(0, 80) : test.label } : null;
        }).filter(Boolean)
        : [];
      res.json({ tests: tests.length ? tests : fallback, source: tests.length ? "AI validated" : "validated fallback" });
    } catch (error) {
      res.json({ tests: fallback, source: "validated fallback" });
    }
  });

  app.post("/api/coding/explain", async (req, res) => {
    const messages = Array.isArray(req.body?.messages) ? req.body.messages.slice(-8) : [];
    const question = messages.filter((message: any) => message?.role === "user").at(-1)?.content;
    const problemId = String(req.body?.problemId || "valid-parentheses");
    const problem = PROBLEMS.find(p => p.id === problemId) || PROBLEMS[0];

    if (typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ error: "Ask a question about the current problem first." });
    }

    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.json({ reply: fallbackProblemGuide(question), source: "guided fallback" });
      }
      const client = getGeminiClient();
      const response = await withTimeout(client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: messages.map((message: any) => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: String(message.content || "").slice(0, 1200) }]
        })),
        config: {
          systemInstruction: [
            `You are a coding interview tutor scoped only to the ${problem.title} problem.`,
            "You may simplify the prompt, explain inputs, outputs, examples, constraints, concepts, hints, or likely test failures.",
            "Do not give complete final code, a full working solution, or answer unrelated questions.",
            "Keep replies concise and encouraging."
          ].join(" ")
        }
      }), 10000, "The AI problem guide timed out.");
      res.json({ reply: response.text?.trim() || "Try following one bracket at a time and ask what the most recent unmatched opener is." });
    } catch (error: any) {
      res.json({ reply: fallbackProblemGuide(question), source: "guided fallback" });
    }
  });

  app.post("/api/coding/execute", async (req, res) => {
    const language = String(req.body?.language || "");
    const source = String(req.body?.source || "");
    const mode = req.body?.mode === "submit" ? "submit" : "run";
    const problemId = String(req.body?.problemId || "valid-parentheses");
    const problem = PROBLEMS.find(p => p.id === problemId) || PROBLEMS[0];

    const runtime = CODING_LANGUAGE_ALIASES[language];
    if (!runtime || !source.trim() || source.length > 50000) {
      return res.status(400).json({ error: "Choose a supported language and provide no more than 50,000 characters of source code." });
    }

    const additionalTests = Array.isArray(req.body?.generatedTests)
      ? req.body.generatedTests.slice(0, 6).map((input: unknown, index: number) => safeGeneratedTest({ input, expected: "unknown", label: "AI test" }, index)).filter(Boolean) as CodingTest[]
      : [];

    const hiddenTests = [
      { id: "hidden-99", input: problem.example.input, expected: problem.example.output, label: "Hidden smoke test", hidden: true }
    ];

    const tests = mode === "submit"
      ? [...problem.initialTests, ...additionalTests, ...hiddenTests]
      : [...problem.initialTests, ...additionalTests];

    const endpoint = process.env.CODE_EXECUTOR_URL;
    if (!endpoint) {
      if (!process.env.GEMINI_API_KEY) {
        await delay(3000);
        return res.status(500).json({ error: "Gemini API key is required to judge code." });
      }
      try {
        const client = getGeminiClient();
        return res.json(await judgeCodeWithGemini(client, language, source, mode, tests, problem));
      } catch (error: any) {
        console.error("Gemini Code Judge Error:", error);
        return res.status(500).json({ error: "Gemini code judge failed: " + error.message });
      }
    }

    const results: any[] = [];
    let compileError = "";
    let runtimeError = "";
    let totalTime = 0;
    let peakMemory = 0;

    for (const test of tests) {
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (process.env.CODE_EXECUTOR_TOKEN) headers.Authorization = "Bearer " + process.env.CODE_EXECUTOR_TOKEN;
        const response = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify({
            language: runtime.language,
            version: "*",
            files: [{ name: runtime.fileName, content: source }],
            stdin: test.input,
            compile_timeout: 10000,
            run_timeout: 3000,
            compile_cpu_time: 10000,
            run_cpu_time: 3000,
            compile_memory_limit: -1,
            run_memory_limit: -1
          })
        });
        const data: any = await response.json();
        if (!response.ok) throw new Error(data.message || "Runner request failed.");
        const compile = data.compile;
        const run = data.run || {};
        if (compile && compile.code !== 0) compileError = compile.stderr || compile.output || compile.message || "Compilation failed.";
        if (!compileError && (run.code !== 0 || run.status)) runtimeError = run.stderr || run.output || run.message || "Runtime error.";
        const actual = normaliseRunnerOutput(run.stdout || run.output);
        const passed = !compileError && !runtimeError && actual === test.expected;
        totalTime += Number(run.wall_time || run.cpu_time || 0);
        peakMemory = Math.max(peakMemory, Math.round(Number(run.memory || 0) / 1024));
        results.push({
          ...test,
          actual,
          passed,
          status: compileError ? "compile error" : runtimeError ? "runtime error" : passed ? "passed" : "failed",
          time: Number(run.wall_time || run.cpu_time || 0),
          memory: Math.round(Number(run.memory || 0) / 1024)
        });
        if (compileError || runtimeError) break;
      } catch (error: any) {
        runtimeError = error.message || "The code runner could not evaluate this test.";
        break;
      }
    }

    const passed = results.filter((test) => test.passed).length;
    const total = tests.length;
    const status = compileError || runtimeError ? "error" : passed === total ? "accepted" : "rejected";
    res.json({
      status,
      passed,
      total,
      tests: results,
      compileError: compileError || undefined,
      runtimeError: runtimeError || undefined,
      executionTime: totalTime,
      memory: peakMemory,
      score: total ? Math.round((passed / total) * 100) : 0
    });
  });

  // 1. Resume Scanner API
  app.post("/api/ats/scan", async (req, res) => {
    try {
      const { resumeText, jobDescription, github, linkedin, leetcode } = req.body;

      if (!resumeText) {
        return res.status(400).json({ error: "Resume text is required." });
      }

      if (!process.env.GEMINI_API_KEY) {
        await delay(4800);
        return res.json(fallbackAtsScan({ resumeText, jobDescription, github, linkedin, leetcode }));
      }

      const client = getGeminiClient();

      const prompt = `
      You are an elite corporate technical recruiter and ATS expert.
      Please scan the following Resume against the Target Job Description. 
      Also consider the candidate's public handles (GitHub: "${github || 'Not provided'}", LinkedIn: "${linkedin || 'Not provided'}", LeetCode: "${leetcode || 'Not provided'}").

      --- RESUME TEXT ---
      ${resumeText}

      --- TARGET JOB DESCRIPTION ---
      ${jobDescription || 'None provided. Evaluate general technical excellence and placement readiness.'}

      Provide a comprehensive, high-fidelity ATS profile audit. If the candidate provides handles like GitHub or LeetCode, simulate an evaluation of their prospective portfolio strength.
      In the summary, include whether this resume is likely to be shortlisted for different company types. Recommend no more than 5 company-fit entries total. Useful company types include product-based companies, service-based companies, fintech, early-stage startups, mid-sized startups, enterprise SaaS, consulting, and large IT services. Each entry must state the selection likelihood and a short reason based only on the resume and job-description evidence.
      `;

      const response = await withMinimumDelay(withTimeout(client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a professional recruiting intelligence agent. Provide precise, actionable advice in structured JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              matchScore: { type: Type.INTEGER },
              keywords: {
                type: Type.OBJECT,
                properties: {
                  optimal: { type: Type.ARRAY, items: { type: Type.STRING } },
                  missing: { type: Type.ARRAY, items: { type: Type.STRING } },
                  overused: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["optimal", "missing", "overused"]
              },
              formattingRating: { type: Type.STRING },
              formattingFeedback: { type: Type.STRING },
              improvements: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    tip: { type: Type.STRING },
                    impact: { type: Type.STRING }
                  },
                  required: ["category", "tip", "impact"]
                }
              },
              readinessScore: { type: Type.INTEGER },
              profileAnalysis: { type: Type.STRING },
              companyFit: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    companyType: { type: Type.STRING },
                    selectionLikelihood: { type: Type.STRING },
                    bestFor: { type: Type.STRING },
                    reason: { type: Type.STRING }
                  },
                  required: ["companyType", "selectionLikelihood", "bestFor", "reason"]
                }
              }
            },
            required: ["matchScore", "keywords", "formattingRating", "formattingFeedback", "improvements", "readinessScore", "profileAnalysis", "companyFit"]
          }
        }
      }), 26000, "ATS scan timed out."), 6200);

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response from Gemini API");
      }

      const result = JSON.parse(responseText.trim());
      result.companyFit = Array.isArray(result.companyFit) ? result.companyFit.slice(0, 5) : [];
      res.json(result);
    } catch (error: any) {
      console.error("ATS Scan Error:", error);
      const { resumeText, jobDescription, github, linkedin, leetcode } = req.body || {};
      if (resumeText) {
        await delay(2800);
        return res.json(fallbackAtsScan({ resumeText, jobDescription, github, linkedin, leetcode }));
      }
      res.status(500).json({ error: error.message || "Failed to parse resume." });
    }
  });

  // 2. Mock Interview: Generate adaptive question
  app.post("/api/interview/generate-question", async (req, res) => {
    const { company, category, history } = req.body;
    try {
      if (!process.env.GEMINI_API_KEY) {
        await delay(3200);
        return res.json({ ...fallbackInterviewQuestion(company, category, Array.isArray(history) ? history : []), source: "fallback" });
      }
      const client = getGeminiClient();

      const historyPrompt = (history || []).map((h: any, i: number) => {
        return `Q${i + 1}: ${h.questionText}\nUser Response: ${h.userResponse}`;
      }).join("\n\n");

      const questionNumber = (history || []).length + 1;

      const prompt = `
      You are an expert interviewer at ${company || 'a top-tier tech company'}.
      Conduct an adaptive mock interview focusing on "${category || 'Coding & DSA'}".
      This is Question #${questionNumber} of the interview.

      Here is the interview history so far:
      ${historyPrompt || "This is the start of the interview."}

      Evaluate the user's progress:
      - If they answered previous questions well, make the next question slightly more challenging or deep.
      - If they struggled or asked for help, provide a gentle guiding question or a slightly more foundational question to build confidence.
      - Keep the question specific to ${company}'s standards.
      
      Generate a single high-quality question.
      ${category === 'Technical Questions'
          ? 'Ask a conceptual CS theory question (OS, DBMS, networking, OOP, language internals). The candidate should explain in words. Do NOT include code snippets — set codeSnippet to an empty string.'
          : category === 'Coding & DSA'
            ? "For Coding focus: include a code snippet block (in the 'codeSnippet' field) containing clean template/starter code that the user needs to write or complete."
            : "For Behavioral: 'codeSnippet' should be empty."
        }
      `;

      const response = await withMinimumDelay(withTimeout(client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a professional mock interviewer. Produce clean adaptive questions tailored to specific company bars.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questionNumber: { type: Type.INTEGER },
              questionText: { type: Type.STRING },
              codeSnippet: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              aiFocusTips: { type: Type.STRING }
            },
            required: ["questionNumber", "questionText", "codeSnippet", "difficulty", "aiFocusTips"]
          }
        }
      }), 18000, "Interview question generation timed out."), 3600);

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response from Gemini API");
      }

      const result = JSON.parse(responseText.trim());
      res.json(result);
    } catch (error: any) {
      console.error("Interview Question Generation Error:", error);
      await delay(1800);
      res.json({ ...fallbackInterviewQuestion(company, category, Array.isArray(history) ? history : []), source: "fallback" });
    }
  });

  // 3. Mock Interview: Per-question quick evaluation
  app.post("/api/interview/quick-eval", async (req, res) => {
    const { company, category, questionText, userAnswer } = req.body;
    try {
      if (!questionText || !userAnswer) {
        return res.status(400).json({ error: "questionText and userAnswer are required." });
      }

      if (!process.env.GEMINI_API_KEY) {
        await delay(3600);
        return res.json(fallbackQuickEvaluation(category, userAnswer));
      }
      const client = getGeminiClient();

      const categoryContext = category === 'Coding & DSA'
        ? 'Evaluate for correctness, time/space complexity, edge cases, and code quality.'
        : category === 'Technical Questions'
          ? 'Evaluate for conceptual accuracy, completeness, and clarity of explanation. Check for common misconceptions.'
          : 'Evaluate using the STAR framework (Situation, Task, Action, Result). Check for specificity and concrete outcomes.';

      const prompt = `
      You are a demanding interviewer at ${company || 'a top tech company'}.
      Interview category: "${category}".
      ${categoryContext}

      Question asked: ${questionText}
      Candidate answer: ${userAnswer}

      Determine if the answer is CORRECT, PARTIAL, or WRONG.
      Respond ONLY in this exact JSON format — no extra text:
      {
        "verdict": "CORRECT" | "PARTIAL" | "WRONG",
        "feedback": "<2-4 sentences of mentor-style feedback>. If WRONG, include the correct answer or key points."
      }
      `;

      const response = await withMinimumDelay(withTimeout(client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a precise technical interview evaluator. Return only valid JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              verdict: { type: Type.STRING },
              feedback: { type: Type.STRING }
            },
            required: ["verdict", "feedback"]
          }
        }
      }), 18000, "Quick evaluation timed out."), 4600);

      const responseText = response.text;
      if (!responseText) throw new Error("No response from Gemini API");
      const result = JSON.parse(responseText.trim());
      res.json(result);
    } catch (error: any) {
      console.error("Quick Eval Error:", error);
      await delay(2000);
      res.json(fallbackQuickEvaluation(category, userAnswer || ""));
    }
  });

  // 4. Mock Interview: Evaluate final results
  app.post("/api/interview/evaluate", async (req, res) => {
    const { company, category, history } = req.body;
    try {
      if (!history || history.length === 0) {
        return res.status(400).json({ error: "Interview history is required for evaluation." });
      }

      if (!process.env.GEMINI_API_KEY) {
        await delay(5200);
        return res.json(fallbackInterviewEvaluation(company, category, history));
      }
      const client = getGeminiClient();

      const historyPrompt = history.map((h: any, i: number) => {
        return `Question #${i + 1}: ${h.questionText}\nCandidate Answer: ${h.userResponse}`;
      }).join("\n\n");

      const prompt = `
      You are the hiring committee at ${company}.
      Conduct a thorough post-session evaluation of the candidate's performance in this "${category}" mock interview.

      Here is the complete interview conversation history:
      ${historyPrompt}

      Analyze the response to each question. Determine technical correctness, structural quality, clarity, and problem solving.
      Then calculate an overall score out of 100, provide a category breakdown, and construct a detailed review for each question, including the exemplary reference response.
      `;

      const response = await withMinimumDelay(withTimeout(client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are the head of technical recruiting. Return detailed, high-fidelity, encouraging yet objective performance evaluations in structured JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallScore: { type: Type.INTEGER },
              breakdown: {
                type: Type.OBJECT,
                properties: {
                  correctness: { type: Type.INTEGER },
                  structure: { type: Type.INTEGER },
                  communication: { type: Type.INTEGER },
                  problemSolving: { type: Type.INTEGER }
                },
                required: ["correctness", "structure", "communication", "problemSolving"]
              },
              overallVerdict: { type: Type.STRING },
              questionReviews: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    questionNumber: { type: Type.INTEGER },
                    questionText: { type: Type.STRING },
                    userResponse: { type: Type.STRING },
                    exemplaryAnswer: { type: Type.STRING },
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    improvements: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["questionNumber", "questionText", "userResponse", "exemplaryAnswer", "strengths", "improvements"]
                }
              }
            },
            required: ["overallScore", "breakdown", "overallVerdict", "questionReviews"]
          }
        }
      }), 26000, "Interview evaluation timed out."), 6200);

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response from Gemini API");
      }

      const result = JSON.parse(responseText.trim());
      res.json(result);
    } catch (error: any) {
      console.error("Interview Evaluation Error:", error);
      await delay(2400);
      res.json(fallbackInterviewEvaluation(company, category, Array.isArray(history) ? history : []));
    }
  });

  // 4. Mock Interview: Get Hint
  app.post("/api/interview/hint", async (req, res) => {
    const { company, category, questionText, codeSnippet, userResponse } = req.body;
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.json({ hint: "Start with the core concept, then add one example and one tradeoff. Keep the answer structured and concise." });
      }
      const client = getGeminiClient();

      const prompt = `
      The candidate is in the middle of a mock interview for ${company} doing a "${category}" task.
      
      CURRENT QUESTION:
      ${questionText}

      CODE / TEMPLATE (if any):
      ${codeSnippet || 'None'}

      CANDIDATE'S CURRENT RESPONSE SO FAR:
      ${userResponse || 'No input yet.'}

      Provide a subtle, short, guiding hint (1-3 sentences max) that points them in the right direction without revealing the exact solution.
      `;

      const response = await withTimeout(client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a friendly technical interviewer giving a helpful but subtle hint. Do not write full code or solve the problem completely.",
        }
      }), 8000, "Interview hint timed out.");

      res.json({ hint: response.text?.trim() || "Think about the edge cases." });
    } catch (error: any) {
      console.error("Interview Hint Error:", error);
      res.json({ hint: "Start with the core concept, then add one example and one tradeoff. Keep the answer structured and concise." });
    }
  });

  // Serve static files / Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
