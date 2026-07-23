import React, { useRef, useState } from "react";
import { motion } from "motion/react";
import { 
  Sparkles, 
  Search, 
  Upload, 
  ShieldCheck, 
  AlertCircle, 
  ArrowLeft, 
  BarChart3,
  RefreshCw, 
  Code, 
  CheckCircle2, 
  XCircle, 
  PlusCircle, 
  Github, 
  Award
} from "lucide-react";
import { AtsScanResult } from "../types";

interface AtsProfileRadarScreenProps {
  initialData?: {
    resumeText: string;
    jobDescription: string;
    github: string;
    linkedin: string;
    leetcode: string;
  };
}

function selectionTone(likelihood: string) {
  const normalized = likelihood.toLowerCase();
  if (normalized.includes("high") || normalized.includes("strong") || normalized.includes("yes")) {
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  }
  if (normalized.includes("low") || normalized.includes("weak") || normalized.includes("unlikely")) {
    return "bg-rose-500/10 text-rose-400 border-rose-500/20";
  }
  return "bg-amber-500/10 text-amber-400 border-amber-500/20";
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0)));
}

function formattingScore(rating: string) {
  const normalized = rating.toLowerCase();
  if (normalized.includes("excellent")) return 92;
  if (normalized.includes("pass")) return 78;
  if (normalized.includes("good")) return 74;
  if (normalized.includes("needs")) return 56;
  return 64;
}

function keywordCoverageScore(scan: AtsScanResult) {
  const matched = scan.keywords.optimal.length;
  const missing = scan.keywords.missing.length;
  const total = matched + missing;
  if (!total) return scan.matchScore;
  return (matched / total) * 100;
}

function buildAtsBarGraph(scan: AtsScanResult) {
  return [
    {
      label: "ATS match",
      value: clampScore(scan.matchScore),
      caption: "Overall resume-to-role alignment",
      accent: "from-brand-indigo to-brand-violet"
    },
    {
      label: "Keyword coverage",
      value: clampScore(keywordCoverageScore(scan)),
      caption: "Matched skills versus missing role tokens",
      accent: "from-emerald-400 to-cyan-400"
    },
    {
      label: "Formatting health",
      value: clampScore(formattingScore(scan.formattingRating)),
      caption: "ATS-readable layout and structure",
      accent: "from-sky-400 to-indigo-400"
    },
    {
      label: "Portfolio signal",
      value: clampScore(scan.readinessScore),
      caption: "GitHub, LeetCode, and external proof",
      accent: "from-violet-400 to-fuchsia-400"
    },
    {
      label: "Action readiness",
      value: clampScore(100 - Math.min(scan.improvements.length, 6) * 10),
      caption: "How few critical fixes remain",
      accent: "from-amber-300 to-orange-400"
    }
  ];
}

function buildAtsPlotPoints(scan: AtsScanResult) {
  const metrics = buildAtsBarGraph(scan);
  return metrics.map((metric, index) => ({
    ...metric,
    shortLabel: ["ATS", "Keys", "Format", "Profile", "Ready"][index],
    x: 12 + index * 22,
    y: 102 - metric.value * 0.82
  }));
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.onload = () => {
      const value = String(reader.result || "");
      const base64 = value.includes(",") ? value.split(",")[1] : value;
      resolve(base64);
    };
    reader.readAsDataURL(file);
  });
}

export default function AtsProfileRadarScreen({ initialData }: AtsProfileRadarScreenProps) {
  const resumeInputRef = useRef<HTMLInputElement>(null);

  // Inputs
  const [resumeText, setResumeText] = useState(initialData?.resumeText || "");
  const [jobDescription, setJobDescription] = useState(initialData?.jobDescription || "");
  const [github, setGithub] = useState(initialData?.github || "");
  const [linkedin, setLinkedin] = useState(initialData?.linkedin || "");
  const [leetcode, setLeetcode] = useState(initialData?.leetcode || "");

  // Operational states
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AtsScanResult | null>(null);
  const [resumeFileName, setResumeFileName] = useState(initialData?.resumeText ? "Resume details loaded" : "");
  const [uploadStatus, setUploadStatus] = useState(initialData?.resumeText ? "Resume content is ready for scanning." : "");
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  const loadingSteps = [
    "Initializing recruiting intelligence engine...",
    "Injecting resume text structure...",
    "Scanning keywords against targeted job description...",
    "Simulating ATS parsing algorithms...",
    "Evaluating portfolio presence across GitHub & LeetCode...",
    "Estimating company-fit and shortlist likelihood..."
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleResumeFile = async (file: File) => {
    setIsUploadingResume(true);
    setError(null);
    setUploadStatus("Reading " + file.name + "...");
    try {
      const base64 = await fileToBase64(file);
      const response = await fetch("/api/resume/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          base64
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not extract resume text.");

      setResumeText(data.text);
      setResumeFileName(data.fileName || file.name);
      setUploadStatus("Uploaded " + (data.fileName || file.name) + " · " + (data.characterCount || data.text.length) + " characters extracted.");
    } catch (err: any) {
      setResumeText("");
      setResumeFileName("");
      setUploadStatus("");
      setError(err.message || "Could not upload this resume. Please try PDF, DOCX, TXT, MD, or RTF.");
    } finally {
      setIsUploadingResume(false);
      if (resumeInputRef.current) resumeInputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) void handleResumeFile(file);
  };

  const handleScan = async () => {
    if (!resumeText.trim()) {
      setError("Please upload your resume first.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    // Animate loading steps
    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < loadingSteps.length - 1) {
        currentStep++;
        setLoadingStep(currentStep);
      }
    }, 1500);

    try {
      const response = await fetch("/api/ats/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription, github, linkedin, leetcode })
      });

      const data = await response.json();
      clearInterval(interval);

      if (!response.ok) {
        if (data.isMissingKey) {
          throw new Error("Gemini API Key is missing. Please add it via Settings > Secrets.");
        }
        throw new Error(data.error || "An error occurred during scanning.");
      }

      setResult(data);
    } catch (err: any) {
      clearInterval(interval);
      setError(err.message || "Failed to contact Gemini server.");
    } finally {
      setLoading(false);
      setLoadingStep(0);
    }
  };

  const loadSampleData = () => {
    setResumeText(`JOHN DOE\nFull Stack Developer | john.doe@email.com | github.com/johndoe\n\nPROFESSIONAL SUMMARY\nHighly competent Full Stack Developer with 4+ years of professional experience building high-performance web applications using React, TypeScript, and Node.js. Passionate about system design, code quality, and optimizing ATS compliance.\n\nSKILLS\n- Frontend: React, Redux, TailwindCSS, Next.js, HTML5, CSS3, JavaScript (ES6+)\n- Backend: Node.js, Express.js, TypeScript, PostgreSQL, REST APIs, GraphQL\n- DevOps & Cloud: Docker, AWS (S3, EC2), CI/CD pipelines, Git\n\nPROFESSIONAL EXPERIENCE\nSenior Software Engineer | Innovation Hub (2024 - Present)\n- Led a team of 3 developers to re-architect a legacy frontend application into React 18, boosting initial load speed by 55%.\n- Integrated real-time monitoring and analytics tools resulting in 20% fewer production bugs.\n- Implemented database indexing that reduced API latency by 120ms.\n\nSoftware Developer | Codecrafters LLC (2022 - 2024)\n- Developed and maintained critical server-side features in Express and PostgreSQL.\n- Created reusable React UI components that decreased frontend developer turnaround time by 30%.`);
    setJobDescription(`We are looking for a Senior Full Stack Engineer proficient in React, Node.js, and TypeScript to join our high-growth team.\n\nKey Responsibilities:\n- Build robust, scalable web applications with high visual polish.\n- Design and optimize relational databases (PostgreSQL/MySQL).\n- Enhance application build performance and latency.\n\nRequired Skills:\n- 3+ years experience with React and TypeScript.\n- Node.js backend development with REST or GraphQL APIs.\n- Experience with AWS, Docker, and CI/CD.`);
    setGithub("johndoe-developer");
    setLeetcode("johnleetcode");
    setResumeFileName("Sample Developer Resume");
    setUploadStatus("Sample resume content is ready for scanning.");
    setError(null);
  };

  return (
    <div className="cinematic-page cinematic-tool-page max-w-[90rem] mx-auto px-6 md:px-12 py-16 text-white relative min-h-screen">
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] glow-spot-indigo rounded-full pointer-events-none" />

      {/* Screen Title Block */}
      <div className="cinematic-tool-title text-center space-y-3 mb-16">
        <div className="w-12 h-12 rounded-2xl bg-brand-indigo/10 flex items-center justify-center border border-brand-indigo/20 mx-auto">
          <Search className="w-6 h-6 text-brand-indigo" />
        </div>
        <h1 className="font-sans text-3xl md:text-4xl font-extrabold tracking-tight">ATS Profile Radar</h1>
        <p className="font-sans text-sm text-gray-400 max-w-xl mx-auto">
          Score your resume against GitHub, LeetCode, and LinkedIn signals for campus placement readiness.
        </p>
      </div>

      {!result && !loading && (
        /* INPUT PANEL */
        <div className="glass-card rounded-[2rem] p-8 md:p-12 relative overflow-hidden border-white/5 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-sans text-xs font-bold text-gray-400 uppercase tracking-widest">Resume content</label>
                  <button 
                    onClick={loadSampleData}
                    className="text-xs text-brand-indigo hover:underline font-semibold cursor-pointer"
                  >
                    Load Sample Developer Data
                  </button>
                </div>

                <input
                  ref={resumeInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.md,.markdown,.rtf,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleResumeFile(file);
                  }}
                />

                <button
                  type="button"
                  onClick={() => resumeInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  disabled={isUploadingResume}
                  className="w-full border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-white/[0.01] hover:bg-white/5 hover:border-brand-indigo/30 transition-all cursor-pointer group disabled:cursor-wait disabled:opacity-70"
                >
                  <div className="w-10 h-10 rounded-full bg-brand-indigo/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {isUploadingResume ? <RefreshCw className="w-5 h-5 text-brand-indigo animate-spin" /> : <Upload className="w-5 h-5 text-brand-indigo" />}
                  </div>
                  <p className="font-sans text-xs text-white">
                    {isUploadingResume ? "Extracting resume text..." : "Click to upload your resume, or drag and drop it here"}
                  </p>
                  <p className="font-sans text-[11px] text-gray-500">Supports PDF, DOCX, TXT, MD, and RTF files.</p>
                  {resumeFileName && (
                    <span className="font-mono text-[11px] text-gray-300">{resumeFileName}</span>
                  )}
                  {uploadStatus && (
                    <span className="mt-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-400">
                      {uploadStatus}
                    </span>
                  )}
                </button>
              </div>

              {/* Handles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="font-sans text-xs text-gray-400 font-medium">GitHub User</label>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="e.g. tech-user"
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-indigo/50 font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-sans text-xs text-gray-400 font-medium">LinkedIn Handle</label>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="e.g. john-profile"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-indigo/50 font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-sans text-xs text-gray-400 font-medium">LeetCode Handle</label>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="e.g. user102"
                      value={leetcode}
                      onChange={(e) => setLeetcode(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-indigo/50 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Job description & Action */}
            <div className="space-y-6 flex flex-col justify-between">
              <div className="space-y-2 flex-1">
                <label className="font-sans text-xs font-bold text-gray-400 uppercase tracking-widest">Target Job Description</label>
                <textarea 
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste technical requirements, role specifications, or company expectations..."
                  className="w-full h-[320px] bg-white/5 border border-white/10 rounded-2xl p-5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-indigo/50 transition-all custom-scrollbar font-sans"
                />
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button 
                onClick={handleScan}
                className="w-full py-4.5 rounded-xl primary-gradient text-white font-bold text-sm shadow-lg shadow-brand-indigo/20 hover:scale-[1.01] active:scale-[0.98] transition-transform cursor-pointer"
              >
                Scan Credentials Now
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        /* LOADING STATE */
        <div className="glass-card rounded-[2rem] p-12 flex flex-col items-center justify-center min-h-[400px] border-white/5">
          <div className="relative w-20 h-20 flex items-center justify-center mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-brand-indigo/20" />
            <div className="absolute inset-0 rounded-full border-4 border-brand-indigo border-t-transparent animate-spin" />
            <Sparkles className="w-6 h-6 text-brand-indigo animate-pulse" />
          </div>
          <p className="font-sans text-lg font-semibold mb-2 text-white">Generating Diagnostic Report</p>
          <p className="font-sans text-xs text-brand-indigo animate-pulse font-medium">{loadingSteps[loadingStep]}</p>
        </div>
      )}

      {result && (
        /* DIAGNOSTIC RESULTS DASHBOARD */
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header Action */}
          <div className="flex justify-between items-center">
            <button 
              onClick={() => setResult(null)}
              className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Rescan or Edit Data</span>
            </button>
            <div className="px-3 py-1 rounded-full bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo text-xs font-semibold">
              Grounded by Recruiting Engine
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Score Card */}
            <div className="lg:col-span-4 glass-card rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-brand-indigo/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="relative w-44 h-44 flex items-center justify-center mb-6">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle className="text-white/5" cx="50" cy="50" fill="none" r="42" stroke="currentColor" strokeWidth="6" />
                  <circle 
                    className={result.matchScore >= 80 ? "text-emerald-400" : result.matchScore >= 50 ? "text-amber-400" : "text-rose-400"} 
                    cx="50" 
                    cy="50" 
                    fill="none" 
                    r="42" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    strokeDasharray="263.8" 
                    strokeDashoffset={263.8 - (263.8 * result.matchScore) / 100} 
                    strokeLinecap="round" 
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="font-sans text-5xl font-extrabold text-white">{result.matchScore}%</span>
                  <span className="font-sans text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Match Rating</span>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${result.formattingRating === 'Excellent' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : result.formattingRating === 'Passed' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                  Layout: {result.formattingRating}
                </span>
                <p className="font-sans text-xs text-gray-400 px-4">{result.formattingFeedback}</p>
              </div>

              <div className="w-full border-t border-white/5 pt-6 flex justify-around">
                <div>
                  <p className="font-sans text-2xl font-bold text-white">{result.keywords.optimal.length}</p>
                  <p className="font-sans text-[10px] text-gray-500 font-semibold uppercase">Keywords Match</p>
                </div>
                <div className="border-l border-white/5" />
                <div>
                  <p className="font-sans text-2xl font-bold text-brand-violet">{result.keywords.missing.length}</p>
                  <p className="font-sans text-[10px] text-gray-500 font-semibold uppercase">Missing Keywords</p>
                </div>
              </div>
            </div>

            {/* Right Keyword Bento Card */}
            <div className="lg:col-span-8 glass-card rounded-3xl p-8 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-brand-violet/5 rounded-full blur-2xl pointer-events-none" />
              <div>
                <h3 className="font-sans text-lg font-bold text-white mb-1">Semantic Keyword Analytics</h3>
                <p className="font-sans text-xs text-gray-400">Analysis of critical skill tokens detected in candidate credentials relative to targeted role.</p>
              </div>

              <div className="space-y-4">
                {/* Optimal Keywords */}
                <div className="space-y-2">
                  <span className="font-sans text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
                    Optimal Skill Densities
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {result.keywords.optimal.map((word) => (
                      <span key={word} className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium">
                        {word}
                      </span>
                    ))}
                    {result.keywords.optimal.length === 0 && (
                      <span className="text-xs text-gray-500 italic">None detected yet.</span>
                    )}
                  </div>
                </div>

                {/* Missing Keywords */}
                <div className="space-y-2 pt-2">
                  <span className="font-sans text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                    <PlusCircle className="w-4.5 h-4.5 text-amber-400" />
                    Crucial Missing Skills
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {result.keywords.missing.map((word) => (
                      <span key={word} className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono font-medium">
                        {word}
                      </span>
                    ))}
                    {result.keywords.missing.length === 0 && (
                      <span className="text-xs text-emerald-400 italic">Excellent! You matched all critical skills.</span>
                    )}
                  </div>
                </div>

                {/* Overused Buzzwords */}
                {result.keywords.overused.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="font-sans text-[10px] font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                      <XCircle className="w-4.5 h-4.5 text-rose-400" />
                      Overused Buzzwords to Reduce
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {result.keywords.overused.map((word) => (
                        <span key={word} className="px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono font-medium">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ATS Selection Score Bar Graph */}
          <div className="glass-card rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-indigo/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-7">
              <div>
                <span className="font-sans text-[10px] font-bold text-brand-indigo uppercase tracking-widest flex items-center gap-1.5 mb-2">
                  <BarChart3 className="w-4.5 h-4.5 text-brand-indigo" />
                  Selection Score Plot Graph
                </span>
                <h3 className="font-sans text-lg font-bold text-white mb-1">ATS Readiness Breakdown</h3>
                <p className="font-sans text-xs text-gray-400 max-w-2xl">
                  Plotted score curve for shortlist strength, keyword coverage, formatting quality, portfolio signal, and remaining fix workload.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-right">
                <p className="font-sans text-[10px] font-bold text-gray-500 uppercase tracking-widest">Overall Score</p>
                <p className="font-sans text-2xl font-extrabold text-white">{result.matchScore}%</p>
              </div>
            </div>

            {(() => {
              const points = buildAtsPlotPoints(result);
              const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");
              return (
                <div className="relative grid grid-cols-1 xl:grid-cols-[1.25fr_0.75fr] gap-6">
                  <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4 md:p-6">
                    <svg className="h-[19rem] w-full overflow-visible" viewBox="0 0 112 112" preserveAspectRatio="none" role="img" aria-label="ATS plotted score graph">
                      {[20, 40, 60, 80, 100].map((tick) => {
                        const y = 102 - tick * 0.82;
                        return (
                          <g key={tick}>
                            <line x1="10" x2="104" y1={y} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="0.45" />
                            <text x="0" y={y + 1} fill="rgba(156,163,175,0.75)" fontSize="3.2" fontFamily="monospace">{tick}</text>
                          </g>
                        );
                      })}
                      <line x1="10" x2="104" y1="102" y2="102" stroke="rgba(255,255,255,0.16)" strokeWidth="0.65" />
                      <line x1="10" x2="10" y1="18" y2="102" stroke="rgba(255,255,255,0.16)" strokeWidth="0.65" />
                      <motion.polyline
                        points={polyline}
                        fill="none"
                        stroke="url(#atsScoreGradient)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.9, ease: "easeOut" }}
                      />
                      <defs>
                        <linearGradient id="atsScoreGradient" x1="0" x2="1" y1="0" y2="0">
                          <stop offset="0%" stopColor="#6c63ff" />
                          <stop offset="55%" stopColor="#a855f7" />
                          <stop offset="100%" stopColor="#22c55e" />
                        </linearGradient>
                      </defs>
                      {points.map((point, index) => (
                        <g key={point.label}>
                          <motion.circle
                            cx={point.x}
                            cy={point.y}
                            r="3.3"
                            fill="#0b1020"
                            stroke="#ffffff"
                            strokeWidth="0.9"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.25 + index * 0.1, type: "spring", stiffness: 260, damping: 16 }}
                          />
                          <motion.circle
                            cx={point.x}
                            cy={point.y}
                            r="1.55"
                            fill="#a78bfa"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.34 + index * 0.1 }}
                          />
                          <text x={point.x - 5} y={point.y - 5.2} fill="#ffffff" fontSize="4.2" fontWeight="800" fontFamily="Inter, sans-serif">{point.value}%</text>
                          <text x={point.x - 5.2} y="109" fill="rgba(209,213,219,0.78)" fontSize="3.6" fontFamily="Inter, sans-serif">{point.shortLabel}</text>
                        </g>
                      ))}
                    </svg>
                  </div>

                  <div className="grid gap-3">
                    {points.map((point) => (
                      <article key={point.label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <h4 className="font-sans text-sm font-bold text-white">{point.label}</h4>
                            <p className="mt-1 font-sans text-[11px] leading-relaxed text-gray-500">{point.caption}</p>
                          </div>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-xs font-bold text-white">{point.value}%</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Placement Readiness Profiles Analysis */}
          <div className="glass-card rounded-3xl p-8 grid grid-cols-1 md:grid-cols-12 gap-8 relative overflow-hidden">
            <div className="md:col-span-4 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-white/5 pb-6 md:pb-0 md:pr-8">
              <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle className="text-white/5" cx="50" cy="50" fill="none" r="40" stroke="currentColor" strokeWidth="4" />
                  <circle 
                    className="text-brand-violet" 
                    cx="50" 
                    cy="50" 
                    fill="none" 
                    r="40" 
                    stroke="currentColor" 
                    strokeWidth="6" 
                    strokeDasharray="251.2" 
                    strokeDashoffset={251.2 - (251.2 * result.readinessScore) / 100} 
                    strokeLinecap="round" 
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="font-sans text-2xl font-extrabold text-white">{result.readinessScore}%</span>
                  <span className="font-sans text-[9px] font-bold text-gray-500 uppercase tracking-widest">Portfolio Index</span>
                </div>
              </div>
              <h4 className="font-sans text-sm font-bold text-white mb-1">GitHub & LeetCode Strength</h4>
              <p className="font-sans text-xs text-gray-400">Analysis of open-source and problem-solving velocity.</p>
            </div>

            <div className="md:col-span-8 flex flex-col justify-center space-y-4">
              <div>
                <span className="font-sans text-[10px] font-bold text-brand-violet uppercase tracking-widest flex items-center gap-1.5 mb-1">
                  <Code className="w-4.5 h-4.5 text-brand-violet" />
                  Technical Presence Audit
                </span>
                <p className="font-sans text-xs text-gray-300 leading-relaxed font-medium">{result.profileAnalysis}</p>
              </div>

              {(github || leetcode) && (
                <div className="flex flex-wrap gap-4 pt-2">
                  {github && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Github className="w-4 h-4" />
                      <span>github.com/{github}</span>
                    </div>
                  )}
                  {leetcode && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span>leetcode.com/{leetcode}</span>
                    </div>
                  )}
                </div>
              )}

              {(result.companyFit?.length ?? 0) > 0 && (
                <div className="border-t border-white/5 pt-5 space-y-3">
                  <div>
                    <span className="font-sans text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                      <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
                      Company Selection Fit
                    </span>
                    <p className="font-sans text-xs text-gray-400">
                      Likely shortlist fit by company type, capped to the top 5 recommendations.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {result.companyFit.slice(0, 5).map((fit, index) => (
                      <article key={`${fit.companyType}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <h5 className="font-sans text-sm font-bold text-white">{fit.companyType}</h5>
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${selectionTone(fit.selectionLikelihood)}`}>
                            {fit.selectionLikelihood}
                          </span>
                        </div>
                        <p className="font-sans text-[11px] font-semibold text-brand-indigo">{fit.bestFor}</p>
                        <p className="mt-1 font-sans text-xs leading-relaxed text-gray-400">{fit.reason}</p>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actionable Resume Improvements Table */}
          <div className="glass-card rounded-3xl p-8 space-y-6">
            <div>
              <h3 className="font-sans text-lg font-bold text-white mb-1">Actionable Resume Adjustments</h3>
              <p className="font-sans text-xs text-gray-400">Specific structural or textual upgrades recommended to maximize pass rates.</p>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-xs">
                    <th className="py-3 px-4 font-bold uppercase tracking-wider w-1/4">Section Category</th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider w-1/2">Diagnostic Recommendation</th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider w-1/4 text-right">Scoring Weight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-gray-300">
                  {result.improvements.map((item, index) => (
                    <tr key={index} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-4 px-4 font-semibold text-white font-mono flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-indigo" />
                        {item.category}
                      </td>
                      <td className="py-4 px-4 leading-relaxed font-medium">{item.tip}</td>
                      <td className="py-4 px-4 text-right">
                        <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-bold ${item.impact.toLowerCase() === 'high' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                          {item.impact} Impact
                        </span>
                      </td>
                    </tr>
                  ))}
                  {result.improvements.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-gray-500 italic">No improvements required! Your resume is pristine.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
