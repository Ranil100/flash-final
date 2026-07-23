import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Sparkles,
  TrendingUp,
  Tv,
  Cpu,
  UploadCloud,
  Github,
  Linkedin,
  Award,
  Rocket,
  FileText,
  Terminal,
  ArrowRight,
  BrainCircuit,
  MessageSquare,
  ShieldCheck,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { ViewType } from "../types";

interface LandingScreenProps {
  onNavigate: (view: ViewType) => void;
  onQuickScan: (data: { resumeText: string; jobDescription: string; github: string; linkedin: string; leetcode: string }) => void;
  onQuickStartInterview: (company: string, category: string) => void;
}

export default function LandingScreen({ onNavigate, onQuickScan, onQuickStartInterview }: LandingScreenProps) {
  const [activeTab, setActiveTab] = useState<'ats' | 'mock'>('ats');

  // Quick scan form states
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [leetcode, setLeetcode] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  // Quick interview states
  const [selectedCompany, setSelectedCompany] = useState("Deloitte");
  const [selectedFocus, setSelectedFocus] = useState("Coding Patterns");

  const companies = ["Zoho", "TCS", "Deloitte", "Google", "Adobe", "Meta"];
  const focuses = ["Behavioral", "Coding Patterns", "Technical Questions"];

  // Handle mock file loading for demonstration
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.type === "text/plain") {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setResumeText(event.target.result as string);
            setUploadMessage(`Successfully parsed text file: ${file.name}`);
          }
        };
        reader.readAsText(file);
      } else {
        // Fallback or parser placeholder
        setResumeText(`RESUME OF A SENIOR SOFTWARE ENGINEER\n\nExperience:\n- Software Developer at TechCorp (3 years)\n- Created highly scalable distributed systems in Node.js and React.\n- Optimised database queries, resulting in 40% performance gains.\n\nSkills: React, TypeScript, Node.js, Express, Postgres, Docker, Git.`);
        setUploadMessage(`Uploaded: ${file.name} (Simulated parsing for ${file.name})`);
      }
    }
  };

  const loadSampleResume = () => {
    setResumeText(`JOHN DOE\nFull Stack Developer | john.doe@email.com | github.com/johndoe\n\nPROFESSIONAL SUMMARY\nHighly competent Full Stack Developer with 4+ years of professional experience building high-performance web applications using React, TypeScript, and Node.js. Passionate about system design, code quality, and optimizing ATS compliance.\n\nSKILLS\n- Frontend: React, Redux, TailwindCSS, Next.js, HTML5, CSS3, JavaScript (ES6+)\n- Backend: Node.js, Express.js, TypeScript, PostgreSQL, REST APIs, GraphQL\n- DevOps & Cloud: Docker, AWS (S3, EC2), CI/CD pipelines, Git\n\nPROFESSIONAL EXPERIENCE\nSenior Software Engineer | Innovation Hub (2024 - Present)\n- Led a team of 3 developers to re-architect a legacy frontend application into React 18, boosting initial load speed by 55%.\n- Integrated real-time monitoring and analytics tools resulting in 20% fewer production bugs.\n- Implemented strict database indexing that reduced API latency by 120ms.\n\nSoftware Developer | Codecrafters LLC (2022 - 2024)\n- Developed and maintained critical server-side features in Express and PostgreSQL.\n- Created reusable React UI components that decreased frontend developer turnaround time by 30%.`);
    setUploadMessage("Loaded sample Professional Full Stack Developer resume.");
  };

  return (
    <div className="cinematic-page cinematic-home relative min-h-screen text-white overflow-hidden pb-20">
      {/* Background Radial Glow spots */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] glow-spot-indigo rounded-full pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] glow-spot-violet rounded-full pointer-events-none" />

      {/* Hero Section */}
      <section className="cinematic-hero relative flex flex-col lg:flex-row items-center justify-center gap-12 py-20 px-6 max-w-[90rem] mx-auto md:px-12 lg:min-h-[calc(100vh-4.75rem)]">
        <div className="flex-1 space-y-6 text-center lg:text-left z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-brand-indigo font-sans text-xs font-medium tracking-wide"
          >
            <span className="w-2 h-2 rounded-full bg-brand-indigo animate-pulse" />
            AI-Powered Career Accelerator
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="hero-headline font-sans text-5xl md:text-7xl lg:text-[clamp(5rem,8vw,8.75rem)] font-extrabold tracking-tighter leading-[0.88]"
          >
            Land your dream role with <span className="primary-text-gradient">FLASH.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-sans text-lg text-gray-400 max-w-lg mx-auto lg:mx-0 leading-relaxed"
          >
            Elite talent platform helping you conquer ATS filters and master high-stakes technical interviews with real-time feedback.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4"
          >
            <button
              onClick={() => onNavigate('ats')}
              className="px-8 py-4 w-full sm:w-auto rounded-xl primary-gradient text-white font-semibold shadow-lg shadow-brand-indigo/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Rocket className="w-5 h-5" />
              <span>Launch ATS Radar</span>
            </button>
            <button
              onClick={() => onNavigate('mock-setup')}
              className="px-8 py-4 w-full sm:w-auto rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 hover:border-brand-indigo/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <BrainCircuit className="w-5 h-5 text-brand-violet" />
              <span>Mock Interview</span>
            </button>
          </motion.div>

          {/* Social Proof metrics */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center gap-4 text-xs text-gray-400 justify-center lg:justify-start"
          >
            <div className="flex -space-x-3">
              <img className="w-8 h-8 rounded-full border border-gray-900" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Avatar" />
              <img className="w-8 h-8 rounded-full border border-gray-900" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" alt="Avatar" />
              <img className="w-8 h-8 rounded-full border border-gray-900" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" alt="Avatar" />
              <div className="w-8 h-8 rounded-full bg-brand-indigo/30 border border-gray-900 flex items-center justify-center text-white font-bold text-[10px]">50k+</div>
            </div>
            <span>Trusted by over 50,000+ top-tier candidates worldwide.</span>
          </motion.div>
        </div>

        {/* Hero Right Visual Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex-1 w-full max-w-xl z-10"
        >
          <div className="glass-card rounded-[2.5rem] p-4 relative overflow-hidden group shadow-2xl">
            <div className="absolute inset-0 primary-gradient opacity-10 group-hover:opacity-15 transition-opacity" />
            <div className="aspect-[4/5] rounded-[2rem] overflow-hidden bg-zinc-900 shadow-2xl relative border border-white/5">
              <img
                className="w-full h-full object-cover brightness-95 contrast-105"
                referrerPolicy="no-referrer"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDAHRxhQGhsnIQdSRhmRYYnMCtPL_cgi0AklB0nDkAmn4VuqtFgP8CDnpbIdHg_wFesCSwPXqe2md7hZTiwjzA7O68Xkvqx1Rd0qxVC92m4T5c8es-VptXomXvm8OufQBU1lzZbM9wtXSKghjpSY0s4T3YMPu3O_QGo1K_SdyPE4WKBqt9tPq4hbDa9d_lm8Er37JHLe2Ysu-Pr_05kTKREzpwqlcioGA-tW7-0WWcSgn7yL3Nofru9"
                alt="Cinematic developer workspace"
              />
              <div className="absolute bottom-6 left-6 right-6 p-5 glass-card rounded-2xl flex items-center justify-between border-white/10">
                <div>
                  <p className="font-sans text-xs font-semibold text-brand-indigo tracking-wider uppercase mb-1">Interview Readiness</p>
                  <h3 className="font-sans text-lg font-bold text-white">98.4% Confidence Boost</h3>
                </div>
                <div className="w-12 h-12 rounded-full primary-gradient flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature Discovery Section (Bento Grid) */}
      <section className="cinematic-chapter py-24 px-6 max-w-[90rem] mx-auto md:px-12">
        <div className="text-center space-y-4 mb-12">
          <h2 className="chapter-headline font-sans text-4xl md:text-6xl font-extrabold tracking-tighter">Future-Proof Your Career</h2>
          <p className="font-sans text-gray-400 max-w-xl mx-auto">Advanced intelligence tools designed to bridge the gap between application and acquisition.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Bento item 1: ATS Analytics */}
          <div className="md:col-span-7 glass-card glass-card-hover rounded-3xl p-8 flex flex-col justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-indigo/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h3 className="font-sans text-xl font-bold text-white">Real-time ATS Analytics</h3>
                <p className="font-sans text-sm text-gray-400">See exactly how recruiters view your profile across major platforms.</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-brand-indigo/10 flex items-center justify-center border border-brand-indigo/20">
                <TrendingUp className="w-6 h-6 text-brand-indigo" />
              </div>
            </div>

            {/* Circular Gauge Visualization */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-10 py-6">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle className="text-white/5" cx="50" cy="50" fill="none" r="40" stroke="currentColor" strokeWidth="6" />
                  <circle
                    className="text-brand-indigo"
                    cx="50"
                    cy="50"
                    fill="none"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset="30"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="font-sans text-3xl font-extrabold text-white">88</span>
                  <span className="font-sans text-[9px] font-semibold text-gray-400 uppercase tracking-widest">Match Score</span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 rounded-full bg-brand-indigo" />
                  <div>
                    <p className="font-sans text-xs text-gray-400 font-medium">Keywords</p>
                    <p className="font-sans text-sm font-bold text-white">Optimal</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 rounded-full bg-brand-violet" />
                  <div>
                    <p className="font-sans text-xs text-gray-400 font-medium">Formatting</p>
                    <p className="font-sans text-sm font-bold text-white">Passed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bento item 2: Adaptive AI Mock Interviews */}
          <div className="md:col-span-5 glass-card glass-card-hover rounded-3xl p-8 flex flex-col justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-violet/10 rounded-full blur-3xl pointer-events-none" />
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-brand-violet/10 flex items-center justify-center border border-brand-violet/20">
                <BrainCircuit className="w-6 h-6 text-brand-violet" />
              </div>
              <h3 className="font-sans text-xl font-bold text-white">Adaptive AI Interviews</h3>
              <p className="font-sans text-sm text-gray-400">Context-aware simulations that evolve and adjust based on your real-time responses.</p>
            </div>

            <div className="space-y-3 pt-4">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs italic text-gray-300 max-w-[90%]">
                "Explain the core differences between a process and a thread in a distributed system."
              </div>

              {/* Simulated Sentiment Waveform */}
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-end gap-1 h-6">
                  <span className="w-1 h-3 bg-brand-violet rounded-full animate-pulse" />
                  <span className="w-1 h-5 bg-brand-violet rounded-full animate-pulse delay-75" />
                  <span className="w-1 h-2 bg-brand-violet rounded-full animate-pulse delay-150" />
                  <span className="w-1 h-4 bg-brand-violet rounded-full animate-pulse delay-100" />
                  <span className="w-1 h-1 bg-brand-violet rounded-full animate-pulse" />
                </div>
                <span className="font-mono text-[10px] text-brand-violet font-semibold tracking-wider uppercase">AI Analyzing Sentiment...</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Launcher Quick-Selector / Command Center */}
      <section className="cinematic-chapter py-24 px-6 max-w-[90rem] mx-auto md:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h2 className="chapter-headline font-sans text-4xl md:text-6xl font-extrabold tracking-tighter">Command Center</h2>
            <p className="font-sans text-gray-400 text-sm">Switch between strategic profile analysis and tactical mock preparation.</p>
          </div>

          {/* Segmented Sliding Toggle */}
          <div className="bg-black/40 p-1 rounded-2xl flex items-center w-full md:w-[350px] border border-white/5 relative h-12">
            <div
              className={`absolute h-[calc(100%-8px)] w-[calc(50%-4px)] bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl shadow-lg transition-all duration-300 ease-in-out`}
              style={{ left: activeTab === 'ats' ? '4px' : 'calc(50%)' }}
            />
            <button
              onClick={() => setActiveTab('ats')}
              className={`flex-1 relative z-10 font-sans text-xs font-semibold flex items-center justify-center gap-2 h-full transition-colors duration-200 cursor-pointer ${activeTab === 'ats' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <FileText className="w-4 h-4" />
              <span>ATS Radar</span>
            </button>
            <button
              onClick={() => setActiveTab('mock')}
              className={`flex-1 relative z-10 font-sans text-xs font-semibold flex items-center justify-center gap-2 h-full transition-colors duration-200 cursor-pointer ${activeTab === 'mock' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <BrainCircuit className="w-4 h-4" />
              <span>Mock Interview</span>
            </button>
          </div>
        </div>

        {/* Tab Canvas Area */}
        <div className="glass-card rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden border-white/5">
          <div className="absolute top-0 left-0 w-96 h-96 bg-brand-indigo/5 rounded-full blur-3xl pointer-events-none" />

          {activeTab === 'ats' ? (
            /* ATS Radar Command Quick Launch */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="font-sans text-[11px] font-bold text-gray-400 uppercase tracking-widest">Resume Details</label>
                    <button
                      onClick={loadSampleResume}
                      className="text-xs text-brand-indigo hover:underline font-semibold cursor-pointer"
                    >
                      Use Sample Resume
                    </button>
                  </div>

                  {/* File Upload Box */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleFileDrop}
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group ${dragOver ? 'border-brand-indigo bg-brand-indigo/5' : 'border-white/10 hover:border-brand-indigo/40 hover:bg-white/5'}`}
                  >
                    <div className="w-12 h-12 rounded-full bg-brand-indigo/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <UploadCloud className="w-6 h-6 text-brand-indigo" />
                    </div>
                    <div className="text-center">
                      <p className="font-sans text-sm text-white font-medium">Drag & drop your resume, or copy/paste below</p>
                      <p className="font-sans text-xs text-gray-500 mt-1">Accepts plain text, PDF, or simulated uploader</p>
                    </div>
                  </div>
                </div>

                {/* Social Profiles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="font-sans text-xs text-gray-400 font-medium">GitHub Handle (Optional)</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. techcoder"
                        value={github}
                        onChange={(e) => setGithub(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-indigo/50 transition-all font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="font-sans text-xs text-gray-400 font-medium">LeetCode Handle (Optional)</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. leetuser"
                        value={leetcode}
                        onChange={(e) => setLeetcode(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-indigo/50 transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Resume textarea input */}
                <div className="space-y-2">
                  <label className="font-sans text-xs text-gray-400 font-medium">Paste Resume Content Directly</label>
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste plain text resume content here if you didn't upload a file..."
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-indigo/50 transition-all custom-scrollbar font-sans"
                  />
                  {uploadMessage && (
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{uploadMessage}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Job Description right block */}
              <div className="space-y-6 flex flex-col justify-between">
                <div className="space-y-2 flex-1">
                  <label className="font-sans text-[11px] font-bold text-gray-400 uppercase tracking-widest">Target Job Description</label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the full job description or core technical role requirements you are targeting..."
                    className="w-full h-[220px] bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-indigo/50 transition-all resize-none custom-scrollbar font-sans"
                  />
                </div>

                <button
                  onClick={() => {
                    if (!resumeText) {
                      loadSampleResume();
                      return;
                    }
                    onQuickScan({ resumeText, jobDescription, github, linkedin, leetcode });
                  }}
                  className="w-full py-4 rounded-xl primary-gradient text-white font-bold shadow-lg shadow-brand-indigo/20 hover:scale-[1.01] active:scale-[0.98] transition-transform cursor-pointer flex items-center justify-center gap-2"
                >
                  <Rocket className="w-5 h-5" />
                  <span>{resumeText ? "Run Scanner with Details" : "Scan with Demo Sample Resume"}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Mock Interview Setup Quick Launch */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-5 space-y-8">
                <div className="space-y-4">
                  <label className="font-sans text-[11px] font-bold text-gray-400 uppercase tracking-widest">Target Companies</label>
                  <div className="flex flex-wrap gap-2.5">
                    {companies.map((c) => (
                      <span
                        key={c}
                        onClick={() => setSelectedCompany(c)}
                        className={`px-4 py-2.5 rounded-full text-xs font-semibold cursor-pointer transition-all duration-200 border ${selectedCompany === c ? 'bg-brand-indigo/20 border-brand-indigo text-white shadow-md shadow-brand-indigo/10' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'}`}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="font-sans text-[11px] font-bold text-gray-400 uppercase tracking-widest">Interview Focus</label>
                  <div className="flex flex-col gap-2">
                    {focuses.map((f) => (
                      <button
                        key={f}
                        onClick={() => setSelectedFocus(f)}
                        className={`w-full text-left p-4 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${selectedFocus === f ? 'bg-brand-violet/10 border-brand-violet text-brand-violet' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mock Interview Right Interactive preview */}
              <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-6">
                <div className="glass-card rounded-2xl p-6 border-brand-indigo/20 relative overflow-hidden flex-1 flex flex-col justify-between gap-6">
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                      Live Preview Session
                    </span>
                  </div>

                  <div>
                    <h3 className="font-sans text-lg font-bold text-white mb-1">Company-Specific Placement Standards</h3>
                    <p className="font-sans text-xs text-gray-400">FLASH adaptive mock interview aligns exactly with real interview rubrics from target firms like {selectedCompany}.</p>
                  </div>

                  {/* Sample code editor container for visual flair */}
                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 font-mono text-xs text-indigo-300">
                    <span className="text-purple-400">class</span> <span className="text-emerald-400">Solution</span> {"{"}
                    <br />
                    &nbsp;&nbsp;<span className="text-purple-400">public</span> <span className="text-teal-400">ListNode</span> <span className="text-yellow-300">reverseList</span>(ListNode head) {"{"}
                    <br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-teal-400">ListNode</span> prev = <span className="text-amber-400">null</span>;
                    <br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-gray-500">// AI generates company challenges...</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Est. Duration: 10 Questions</span>
                    <span className="text-brand-violet">System Grounded by Gemini 3.5</span>
                  </div>
                </div>

                <button
                  onClick={() => onQuickStartInterview(selectedCompany, selectedFocus)}
                  className="w-full py-4 rounded-xl primary-gradient text-white font-bold shadow-lg shadow-brand-violet/20 hover:scale-[1.01] active:scale-[0.98] transition-transform cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Launch Live Mock Interview</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
