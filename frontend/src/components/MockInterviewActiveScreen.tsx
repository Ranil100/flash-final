import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  BrainCircuit,
  Clock,
  Lightbulb,
  Play,
  Send,
  Code2,
  Sparkles,
  AlertCircle,
  CheckCircle,
  XCircle,
  HelpCircle,
  ArrowRight,
  BookOpen
} from "lucide-react";
import { InterviewQuestion, InterviewHistoryItem, InterviewEvaluation } from "../types";

interface MockInterviewActiveScreenProps {
  company: string;
  category: string;
  onComplete: (evaluation: InterviewEvaluation) => void;
  onCancel: () => void;
}

export default function MockInterviewActiveScreen({ company, category, onComplete, onCancel }: MockInterviewActiveScreenProps) {
  // Session parameters
  const TOTAL_QUESTIONS = 10;

  // Active state variables
  const [history, setHistory] = useState<InterviewHistoryItem[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
  const [userResponse, setUserResponse] = useState("");

  // Operations
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [loadingEvaluation, setLoadingEvaluation] = useState(false);
  const [evaluatingAnswer, setEvaluatingAnswer] = useState(false);
  const [requestingHint, setRequestingHint] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Per-question feedback (shown after each submit, before next question)
  const [questionFeedback, setQuestionFeedback] = useState<{
    verdict: 'CORRECT' | 'PARTIAL' | 'WRONG';
    feedback: string;
    pendingHistory: InterviewHistoryItem[];
  } | null>(null);

  // Pre-load the first question on mount
  useEffect(() => {
    fetchNextQuestion([]);
  }, []);

  const fetchNextQuestion = async (currentHistory: InterviewHistoryItem[]) => {
    setLoadingQuestion(true);
    setError(null);
    setHint(null);

    try {
      const response = await fetch("/api/interview/generate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, category, history: currentHistory })
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.isMissingKey) {
          throw new Error("Gemini API key is missing. Add it in Settings > Secrets.");
        }
        throw new Error(data.error || "Failed to load question.");
      }

      setCurrentQuestion(data);
      // Pre-fill answer with template snippet if there is any
      if (data.codeSnippet) {
        setUserResponse(data.codeSnippet);
      } else {
        setUserResponse("");
      }
    } catch (err: any) {
      setError(err.message || "Failed to retrieve next interview prompt.");
    } finally {
      setLoadingQuestion(false);
    }
  };

  const handleFetchHint = async () => {
    if (!currentQuestion) return;
    setRequestingHint(true);
    setError(null);

    try {
      const response = await fetch("/api/interview/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          category,
          questionText: currentQuestion.questionText,
          codeSnippet: currentQuestion.codeSnippet,
          userResponse
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to retrieve hint.");
      }
      setHint(data.hint);
    } catch (err: any) {
      setHint("Try dividing the problem into smaller functions and optimizing loops.");
    } finally {
      setRequestingHint(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentQuestion) return;
    if (!userResponse.trim()) {
      setError("Please input a response before submitting.");
      return;
    }

    const nextHistoryItem: InterviewHistoryItem = {
      questionText: currentQuestion.questionText,
      userResponse: userResponse,
      difficulty: currentQuestion.difficulty,
      aiFocusTips: currentQuestion.aiFocusTips,
      codeSnippet: currentQuestion.codeSnippet
    };

    const updatedHistory = [...history, nextHistoryItem];

    // First: get per-question feedback before proceeding
    setEvaluatingAnswer(true);
    setError(null);
    try {
      const evalRes = await fetch("/api/interview/quick-eval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          category,
          questionText: currentQuestion.questionText,
          userAnswer: userResponse
        })
      });
      const evalData = await evalRes.json();
      if (!evalRes.ok) throw new Error(evalData.error || "Evaluation failed.");

      setHistory(updatedHistory);
      setQuestionFeedback({
        verdict: evalData.verdict,
        feedback: evalData.feedback,
        pendingHistory: updatedHistory
      });
    } catch (err: any) {
      console.error("Quick Eval Error:", err);
      // Fallback: show error instead of silently skipping
      setError("Feedback generation failed: " + (err.message || "Please try submitting again."));
    } finally {
      setEvaluatingAnswer(false);
    }
  };

  const handleNextQuestion = () => {
    if (!questionFeedback) return;
    const { pendingHistory } = questionFeedback;
    setQuestionFeedback(null);
    if (pendingHistory.length >= TOTAL_QUESTIONS) {
      handleFinalEvaluation(pendingHistory);
    } else {
      fetchNextQuestion(pendingHistory);
    }
  };

  const handleFinalEvaluation = async (finalHistory: InterviewHistoryItem[]) => {
    setLoadingEvaluation(true);
    setError(null);

    try {
      const response = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, category, history: finalHistory })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to compile evaluation.");
      }

      onComplete(data);
    } catch (err: any) {
      setError(err.message || "Failed to compile post-session evaluation.");
    } finally {
      setLoadingEvaluation(false);
    }
  };

  return (
    <div className="cinematic-page cinematic-session max-w-[90rem] mx-auto px-6 md:px-12 py-10 text-white relative min-h-screen flex flex-col justify-between">
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] glow-spot-indigo rounded-full pointer-events-none" />

      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-white/5 pb-4">
        <div>
          <span className="text-xs font-semibold text-brand-violet tracking-widest uppercase font-mono">{category} PRACTICE</span>
          <h1 className="font-sans text-2xl font-bold text-white">{company} Mock Interview</h1>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            Quit Session
          </button>
        </div>
      </div>

      {loadingQuestion && (
        /* LOADING NEXT QUESTION */
        <div className="glass-card rounded-[2rem] p-12 flex flex-col items-center justify-center flex-1 border-white/5 min-h-[400px] my-6">
          <div className="w-12 h-12 rounded-full border-4 border-brand-indigo border-t-transparent animate-spin mb-6" />
          <p className="font-sans text-base font-semibold mb-1 text-white">Synthesizing Next Task</p>
          <p className="font-sans text-xs text-gray-500">Formulating custom challenge adaptive to previous inputs...</p>
        </div>
      )}

      {loadingEvaluation && (
        /* COMPILING COMMITTEE RESULTS */
        <div className="glass-card rounded-[2rem] p-12 flex flex-col items-center justify-center flex-1 border-white/5 min-h-[400px] my-6">
          <div className="relative w-16 h-16 flex items-center justify-center mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-brand-violet/20" />
            <div className="absolute inset-0 rounded-full border-4 border-brand-violet border-t-transparent animate-spin" />
            <Sparkles className="w-5 h-5 text-brand-violet animate-pulse" />
          </div>
          <p className="font-sans text-lg font-bold mb-2 text-white">Assembling Hiring Committee Reports</p>
          <p className="font-sans text-xs text-brand-violet animate-pulse font-medium">Scoring communication, structure, correctness, and placement index...</p>
        </div>
      )}

      {evaluatingAnswer && (
        /* EVALUATING SINGLE ANSWER */
        <div className="glass-card rounded-[2rem] p-12 flex flex-col items-center justify-center flex-1 border-white/5 min-h-[400px] my-6">
          <div className="relative w-14 h-14 flex items-center justify-center mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-brand-indigo/20" />
            <div className="absolute inset-0 rounded-full border-4 border-brand-indigo border-t-transparent animate-spin" />
            <Sparkles className="w-5 h-5 text-brand-indigo animate-pulse" />
          </div>
          <p className="font-sans text-base font-semibold mb-1 text-white">Evaluating Your Answer</p>
          <p className="font-sans text-xs text-gray-500">Analysing correctness, structure, and depth...</p>
        </div>
      )}

      {!loadingQuestion && !loadingEvaluation && !evaluatingAnswer && !questionFeedback && !currentQuestion && (
        <div className="glass-card rounded-[2rem] p-8 md:p-12 flex flex-col items-center justify-center flex-1 border-white/5 min-h-[400px] my-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-5">
            <AlertCircle className="w-7 h-7 text-rose-400" />
          </div>
          <p className="font-sans text-lg font-bold mb-2 text-white">Interview question could not load</p>
          <p className="font-sans text-sm text-gray-400 max-w-xl leading-relaxed">
            {error || "The session did not receive a valid prompt. Retry will generate a fresh adaptive question for the selected company and category."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-7">
            <button
              onClick={() => fetchNextQuestion(history)}
              className="px-7 py-3 rounded-xl primary-gradient text-white font-bold text-sm shadow-lg shadow-brand-indigo/20 hover:scale-[1.01] active:scale-[0.98] transition-transform cursor-pointer"
            >
              Retry Question
            </button>
            <button
              onClick={onCancel}
              className="px-7 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              Back to Setup
            </button>
          </div>
        </div>
      )}

      {questionFeedback && !evaluatingAnswer && (
        /* PER-QUESTION FEEDBACK PANEL */
        <div className="glass-card rounded-[2rem] p-8 md:p-10 border-white/5 my-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-[10px] font-bold text-gray-500 uppercase tracking-widest">Question {history.length} of {TOTAL_QUESTIONS} — Feedback</span>
              <h2 className="font-sans text-xl font-bold text-white mt-1">Answer Evaluation</h2>
            </div>
            {/* Verdict Badge */}
            {questionFeedback.verdict === 'CORRECT' && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="font-sans text-sm font-bold text-emerald-400">Correct</span>
              </div>
            )}
            {questionFeedback.verdict === 'PARTIAL' && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                <span className="font-sans text-sm font-bold text-amber-400">Partial</span>
              </div>
            )}
            {questionFeedback.verdict === 'WRONG' && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <XCircle className="w-5 h-5 text-rose-400" />
                <span className="font-sans text-sm font-bold text-rose-400">Incorrect</span>
              </div>
            )}
          </div>

          {/* Feedback Text */}
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
            <p className="font-sans text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">AI Feedback</p>
            <p className="font-sans text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{questionFeedback.feedback}</p>
          </div>

          {/* Next Action */}
          <div className="flex justify-end">
            <button
              onClick={handleNextQuestion}
              className="px-8 py-3.5 rounded-xl primary-gradient text-white font-bold text-sm shadow-lg shadow-brand-indigo/20 hover:scale-[1.01] active:scale-[0.98] transition-transform cursor-pointer flex items-center gap-2"
            >
              <span>{history.length >= TOTAL_QUESTIONS ? 'View Full Report' : 'Next Question'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {!loadingQuestion && !loadingEvaluation && !evaluatingAnswer && !questionFeedback && currentQuestion && (
        /* ACTIVE CHALLENGE PANEL */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-4 flex-1">
          {/* Question Description - Left Column */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-6">
            <div className="glass-card rounded-[2rem] p-6.5 md:p-8 space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-brand-indigo uppercase tracking-widest font-mono">
                    Question {history.length + 1} of {TOTAL_QUESTIONS}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-brand-violet/10 border border-brand-violet/20 text-brand-violet text-[10px] font-bold uppercase font-mono">
                    {currentQuestion.difficulty}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full primary-gradient rounded-full"
                    style={{ width: `${((history.length + 1) / TOTAL_QUESTIONS) * 100}%` }}
                  />
                </div>

                {/* Question Text */}
                <div className="space-y-3 pt-2">
                  <p className="font-sans text-sm text-gray-300 leading-relaxed font-semibold">
                    {currentQuestion.questionText}
                  </p>
                </div>
              </div>

              {/* AI Coaching Tips inside left box */}
              <div className="p-4 rounded-xl bg-brand-indigo/5 border border-brand-indigo/10 text-xs text-indigo-300 space-y-1 mt-4">
                <p className="font-sans font-bold uppercase text-[9px] tracking-wider text-brand-indigo">Interview Tip</p>
                <p className="font-sans leading-relaxed">{currentQuestion.aiFocusTips}</p>
              </div>
            </div>
          </div>

          {/* Code Editor / Response area - Right Column */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-6 h-full">
            <div className="glass-card rounded-[2rem] p-6.5 border-brand-indigo/10 flex flex-col justify-between gap-5 flex-1 min-h-[450px]">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="font-sans text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-brand-indigo" />
                  {category === 'Coding & DSA' ? 'Integrated Editor Canvas' : 'Response Sandbox'}
                </span>
                <span className="font-mono text-[10px] text-gray-500">TypeScript / UTF-8</span>
              </div>

              {/* Text Input / Editor */}
              <div className="flex-1 relative mt-1">
                <textarea
                  value={userResponse}
                  onChange={(e) => setUserResponse(e.target.value)}
                  placeholder={category === 'Coding & DSA' ? "Write your complete function logic here..." : "Type your thorough response and explanation here. Be structured and detailed..."}
                  className="w-full h-full min-h-[300px] bg-black/40 border border-white/10 rounded-2xl p-4 font-mono text-xs text-indigo-200 placeholder-gray-600 focus:outline-none focus:border-brand-indigo/50 transition-all resize-none custom-scrollbar leading-relaxed"
                />
              </div>

              {/* Hint output */}
              {hint && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 flex items-start gap-2.5">
                  <Lightbulb className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <p className="font-sans leading-relaxed">{hint}</p>
                </div>
              )}

              {error && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-4">
                <button
                  onClick={handleFetchHint}
                  disabled={requestingHint}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span>{requestingHint ? "Querying..." : "Get AI Hint"}</span>
                </button>

                <button
                  onClick={handleSubmitAnswer}
                  disabled={evaluatingAnswer}
                  className="px-8 py-3 rounded-xl primary-gradient text-white font-bold text-xs shadow-lg shadow-brand-indigo/20 hover:scale-[1.01] active:scale-[0.98] transition-transform cursor-pointer flex items-center gap-1.5 disabled:opacity-60 disabled:scale-100"
                >
                  <span>Submit Answer</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
