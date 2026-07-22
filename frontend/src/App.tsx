import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import Header from "./components/Header";
import LandingScreen from "./components/LandingScreen";
import AtsProfileRadarScreen from "./components/AtsProfileRadarScreen";
import MockInterviewSetupScreen from "./components/MockInterviewSetupScreen";
import MockInterviewActiveScreen from "./components/MockInterviewActiveScreen";
import MockInterviewFeedbackScreen from "./components/MockInterviewFeedbackScreen";
import CodingWorkspace from "./components/CodingWorkspace";
import InterviewReportScreen from "./components/InterviewReportScreen";
import { ViewType, InterviewEvaluation } from "./types";

function VisualAtmosphere() {
  const atmosphereRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frameId = 0;
    const updateParallax = () => {
      frameId = 0;
      const scroll = window.scrollY;
      const atmosphere = atmosphereRef.current;
      if (!atmosphere) return;

      atmosphere.querySelector<HTMLElement>('.atmosphere-orb--near')?.style.setProperty(
        'transform',
        'translate3d(' + scroll * 0.018 + 'px, ' + scroll * -0.09 + 'px, 0)'
      );
      atmosphere.querySelector<HTMLElement>('.atmosphere-orb--far')?.style.setProperty(
        'transform',
        'translate3d(' + scroll * -0.012 + 'px, ' + scroll * 0.045 + 'px, 0)'
      );
    };

    const onScroll = () => {
      if (!frameId) frameId = window.requestAnimationFrame(updateParallax);
    };

    updateParallax();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div ref={atmosphereRef} className="flash-atmosphere" aria-hidden="true">
      <div className="atmosphere-grid" />
      <div className="atmosphere-orb atmosphere-orb--near" />
      <div className="atmosphere-orb atmosphere-orb--far" />
      <div className="atmosphere-noise" />
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<ViewType>('landing');

  // Passing data from Landing Center Quick Launchers
  const [quickScanData, setQuickScanData] = useState<{
    resumeText: string;
    jobDescription: string;
    github: string;
    linkedin: string;
    leetcode: string;
  } | undefined>(undefined);

  const [activeInterview, setActiveInterview] = useState<{
    company: string;
    category: string;
  } | null>(null);

  const [evaluationData, setEvaluationData] = useState<InterviewEvaluation | null>(null);

  // Transition handlers
  const handleQuickScanLaunch = (data: {
    resumeText: string;
    jobDescription: string;
    github: string;
    linkedin: string;
    leetcode: string;
  }) => {
    setQuickScanData(data);
    setView('ats');
  };

  const handleQuickInterviewLaunch = (company: string, category: string) => {
    setActiveInterview({ company, category });
    setView('mock-active');
  };

  const handleStartInterviewFromSetup = (company: string, category: string) => {
    setActiveInterview({ company, category });
    setView('mock-active');
  };

  const handleInterviewComplete = (evaluation: InterviewEvaluation) => {
    setEvaluationData(evaluation);
    setView('interview-report');
  };

  const handleDoneWithFeedback = () => {
    setEvaluationData(null);
    setActiveInterview(null);
    setView('landing');
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="flash-app min-h-screen bg-brand-bg text-white font-sans flex flex-col justify-between">
        <VisualAtmosphere />
        {/* Global Header */}
        <Header currentView={view} onNavigate={(nextView) => setView(nextView)} />

        {/* Main content Router */}
        <main className="flash-main flex-grow">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(5px)" }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {view === 'landing' && (
                <LandingScreen 
                  onNavigate={(nextView) => setView(nextView)} 
                  onQuickScan={handleQuickScanLaunch}
                  onQuickStartInterview={handleQuickInterviewLaunch}
                />
              )}

              {view === 'ats' && (
                <AtsProfileRadarScreen 
                  initialData={quickScanData} 
                />
              )}

              {view === 'coding' && (
                <CodingWorkspace onBack={() => setView('landing')} />
              )}

              {view === 'mock-setup' && (
                <MockInterviewSetupScreen 
                  onStart={handleStartInterviewFromSetup} 
                  onOpenCoding={() => setView('coding')}
                />
              )}

              {view === 'mock-active' && activeInterview && (
                <MockInterviewActiveScreen 
                  company={activeInterview.company}
                  category={activeInterview.category}
                  onComplete={handleInterviewComplete}
                  onCancel={() => setView('landing')}
                />
              )}

              {view === 'mock-feedback' && evaluationData && (
                <MockInterviewFeedbackScreen 
                  evaluation={evaluationData}
                  onDone={handleDoneWithFeedback}
                />
              )}

              {view === 'interview-report' && evaluationData && activeInterview && (
                <InterviewReportScreen
                  evaluation={evaluationData}
                  company={activeInterview.company}
                  category={activeInterview.category}
                  onReviewAnswers={() => setView('mock-feedback')}
                  onDone={handleDoneWithFeedback}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Global Footer */}
        <footer className="cinematic-footer border-t border-white/5 py-12 px-6 bg-zinc-950 mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 px-6 md:px-12">
          <div className="flex flex-col gap-2 text-center md:text-left">
            <span className="font-sans text-lg font-black tracking-tighter text-white">
              FLASH
            </span>
            <p className="font-sans text-xs text-gray-500 font-medium">
              &copy; {new Date().getFullYear()} Flash AI Ecosystem. Built for the elite.
            </p>
          </div>

          <p className="max-w-md text-center text-xs leading-relaxed text-gray-500 md:text-right">
            Practice sessions, code drafts, and generated reports stay scoped to your current browser session.
          </p>
        </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
