import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Sparkles, 
  Award, 
  CheckCircle2, 
  TrendingUp, 
  BookOpen, 
  ArrowRight,
  ChevronDown,
  Activity,
  Check,
  X,
  FileText
} from "lucide-react";
import { InterviewEvaluation } from "../types";

interface MockInterviewFeedbackScreenProps {
  evaluation: InterviewEvaluation;
  onDone: () => void;
}

export default function MockInterviewFeedbackScreen({ evaluation, onDone }: MockInterviewFeedbackScreenProps) {
  const [openReviewIndex, setOpenReviewIndex] = useState<number | null>(0);

  const toggleReview = (index: number) => {
    setOpenReviewIndex(openReviewIndex === index ? null : index);
  };

  return (
    <div className="cinematic-page cinematic-tool-page max-w-6xl mx-auto px-6 md:px-12 py-16 text-white relative min-h-screen">
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] glow-spot-violet rounded-full pointer-events-none" />

      {/* Title */}
      <div className="cinematic-tool-title text-center space-y-3 mb-16">
        <div className="w-12 h-12 rounded-2xl bg-brand-violet/10 flex items-center justify-center border border-brand-violet/20 mx-auto">
          <Award className="w-6 h-6 text-brand-violet" />
        </div>
        <h1 className="font-sans text-3xl md:text-4xl font-extrabold tracking-tight">Interview Performance Scorecard</h1>
        <p className="font-sans text-sm text-gray-400 max-w-xl mx-auto">
          Hiring committee diagnostics, technical scoring, and question-by-question comparative feedback.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Overall Score Meter */}
        <div className="lg:col-span-5 glass-card rounded-[2rem] p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-brand-violet/5 rounded-full blur-2xl pointer-events-none" />

          {/* Large Circle Gauge */}
          <div className="relative w-44 h-44 flex items-center justify-center mb-6">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle className="text-white/5" cx="50" cy="50" fill="none" r="42" stroke="currentColor" strokeWidth="6" />
              <circle 
                className="text-brand-violet" 
                cx="50" 
                cy="50" 
                fill="none" 
                r="42" 
                stroke="currentColor" 
                strokeWidth="8" 
                strokeDasharray="263.8" 
                strokeDashoffset={263.8 - (263.8 * evaluation.overallScore) / 100} 
                strokeLinecap="round" 
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="font-sans text-5xl font-extrabold text-white">{evaluation.overallScore}</span>
              <span className="font-sans text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Overall Score</span>
            </div>
          </div>

          <div className="space-y-4 w-full">
            <h3 className="font-sans text-base font-bold text-white">Category Breakdown</h3>
            
            {/* Category Bars */}
            <div className="space-y-3.5">
              {[
                { name: "Technical Correctness", value: evaluation.breakdown.correctness },
                { name: "Code/Logic Structure", value: evaluation.breakdown.structure },
                { name: "Clarity & Communication", value: evaluation.breakdown.communication },
                { name: "Problem Solving", value: evaluation.breakdown.problemSolving }
              ].map((cat) => (
                <div key={cat.name} className="space-y-1 text-left">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 font-medium">{cat.name}</span>
                    <span className="text-white font-bold">{cat.value}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-violet rounded-full"
                      style={{ width: `${cat.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: High Level Verdict */}
        <div className="lg:col-span-7 glass-card rounded-[2rem] p-8 md:p-10 flex flex-col justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-brand-indigo/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-4">
            <span className="font-sans text-[10px] font-bold text-brand-indigo uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <Sparkles className="w-4 h-4 text-brand-indigo" />
              Placement Committee Verdict
            </span>
            <h2 className="font-sans text-xl font-extrabold text-white leading-snug">
              Placement Readiness Assessment
            </h2>
            <p className="font-sans text-sm text-gray-300 leading-relaxed font-medium">
              {evaluation.overallVerdict}
            </p>
          </div>

          {/* Quick info specs */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-gray-500 font-bold uppercase text-[9px] tracking-wider mb-0.5">Rating Decision</p>
              <p className="text-white font-semibold">{evaluation.overallScore >= 80 ? 'Strong Hire' : evaluation.overallScore >= 60 ? 'Lean Hire' : 'No Hire'}</p>
            </div>
            <div>
              <p className="text-gray-500 font-bold uppercase text-[9px] tracking-wider mb-0.5">Focus Performance</p>
              <p className="text-white font-semibold">{evaluation.breakdown.correctness >= 80 ? 'Mastery' : 'Needs Optimization'}</p>
            </div>
          </div>

          <button 
            onClick={onDone}
            className="w-full py-4 rounded-xl primary-gradient text-white font-bold text-sm shadow-lg shadow-brand-indigo/20 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Return to Landing Center</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Comparative Question-by-Question Reviews */}
      <div className="mt-12 space-y-6">
        <div>
          <h3 className="font-sans text-xl font-extrabold text-white mb-1">Comparative Session Review</h3>
          <p className="font-sans text-xs text-gray-400">Expand each question to see a professional critique of your responses side-by-side with reference exemplars.</p>
        </div>

        <div className="space-y-4">
          {evaluation.questionReviews.map((review, i) => {
            const isOpen = openReviewIndex === i;
            return (
              <div 
                key={review.questionNumber} 
                className="glass-card rounded-2xl border-white/5 overflow-hidden shadow-md"
              >
                {/* Header Toggle */}
                <div 
                  onClick={() => toggleReview(i)}
                  className="p-5 flex justify-between items-center cursor-pointer hover:bg-white/[0.01] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-7 h-7 rounded-lg bg-brand-indigo/10 border border-brand-indigo/20 flex items-center justify-center font-mono text-xs font-bold text-brand-indigo">
                      {review.questionNumber}
                    </span>
                    <span className="font-sans text-sm font-semibold text-white max-w-xl truncate">
                      {review.questionText}
                    </span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-white' : ''}`} />
                </div>

                {/* Collapsible Content */}
                {isOpen && (
                  <div className="p-6 border-t border-white/5 space-y-6 bg-black/20 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Candidate response */}
                      <div className="space-y-2">
                        <span className="font-sans text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">Your Answer</span>
                        <div className="p-4 rounded-xl bg-zinc-900 border border-white/5 text-gray-300 font-mono text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-[250px] custom-scrollbar">
                          {review.userResponse}
                        </div>
                      </div>

                      {/* Reference answer */}
                      <div className="space-y-2">
                        <span className="font-sans text-[10px] font-bold text-brand-indigo uppercase tracking-widest font-mono">Exemplary Solution Standards</span>
                        <div className="p-4 rounded-xl bg-brand-indigo/[0.02] border border-brand-indigo/20 text-indigo-200 font-mono text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-[250px] custom-scrollbar">
                          {review.exemplaryAnswer}
                        </div>
                      </div>
                    </div>

                    {/* Strengths and Improvements lists */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                      {/* Strengths */}
                      <div className="space-y-2">
                        <span className="font-sans text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono flex items-center gap-1">
                          <Check className="w-4 h-4" /> Key Strengths
                        </span>
                        <ul className="space-y-1.5 pl-1.5 text-gray-300">
                          {review.strengths.map((s, idx) => (
                            <li key={idx} className="flex items-start gap-2 leading-relaxed">
                              <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Improvements */}
                      <div className="space-y-2">
                        <span className="font-sans text-[10px] font-bold text-brand-violet uppercase tracking-widest font-mono flex items-center gap-1">
                          <X className="w-4 h-4 text-brand-violet" /> Recommended Optimizations
                        </span>
                        <ul className="space-y-1.5 pl-1.5 text-gray-300">
                          {review.improvements.map((imp, idx) => (
                            <li key={idx} className="flex items-start gap-2 leading-relaxed">
                              <span className="w-1 h-1 rounded-full bg-brand-violet mt-1.5 shrink-0" />
                              <span>{imp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
