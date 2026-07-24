import React, { useState } from "react";
import {
  BrainCircuit,
  ArrowRight,
  Code2,
  Briefcase,
  BookOpen,
  Building2
} from "lucide-react";

interface MockInterviewSetupScreenProps {
  onStart: (company: string, category: string) => void;
  onOpenCoding: () => void;
}

type CompanyName = "Google" | "Zoho" | "TCS" | "Amazon" | "Microsoft" | "Infosys" | "Accenture" | "Wipro";

const COMPANIES: Array<{ name: CompanyName; desc: string }> = [
  { name: "Google", desc: "Algorithmic depth and scalable systems" },
  { name: "Zoho", desc: "Practical problem solving and clean code" },
  { name: "TCS", desc: "Patterns, logic, and client delivery" },
  { name: "Amazon", desc: "Ownership, DSA, and leadership" },
  { name: "Microsoft", desc: "Product thinking and systems depth" },
  { name: "Infosys", desc: "Foundations and enterprise delivery" },
  { name: "Accenture", desc: "Consulting logic and communication" },
  { name: "Wipro", desc: "Applied engineering and adaptability" }
];

const CATEGORIES = [
  { name: "Coding & DSA", icon: Code2, desc: "Algorithms, data structures, complexity, and implementation." },
  { name: "Technical Questions", icon: BookOpen, desc: "CS fundamentals, databases, networks, and systems thinking." },
  { name: "Behavioral", icon: Briefcase, desc: "Leadership, conflict resolution, and impact-driven stories." }
];

function CompanyLogo({ name }: { name: CompanyName }) {
  const className = "company-logo-mark company-logo-mark--" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  switch (name) {
    case "Google":
      return (
        <svg className={className} viewBox="0 0 48 48" role="img" aria-label="Google logo">
          <path fill="#FFC107" d="M43.61 20.08H42V20H24v8h11.3c-1.65 4.66-6.08 8-11.3 8-6.63 0-12-5.37-12-12s5.37-12 12-12c3.06 0 5.84 1.15 7.96 3.04l5.66-5.66C34.05 6.05 29.27 4 24 4 12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20c0-1.34-.14-2.65-.39-3.92Z" />
          <path fill="#FF3D00" d="m6.31 14.69 6.57 4.82C14.65 15.11 18.96 12 24 12c3.06 0 5.84 1.15 7.96 3.04l5.66-5.66C34.05 6.05 29.27 4 24 4 16.32 4 9.66 8.34 6.31 14.69Z" />
          <path fill="#4CAF50" d="M24 44c5.17 0 9.86-1.98 13.41-5.19l-6.19-5.24C29.21 35.09 26.72 36 24 36c-5.2 0-9.62-3.32-11.28-7.95L6.2 33.08C9.5 39.56 16.23 44 24 44Z" />
          <path fill="#1976D2" d="M43.61 20.08H42V20H24v8h11.3a12.04 12.04 0 0 1-4.08 5.57l6.19 5.24C36.97 39.21 44 34 44 24c0-1.34-.14-2.65-.39-3.92Z" />
        </svg>
      );
    case "Zoho":
      return (
        <svg className={className} viewBox="0 0 96 34" role="img" aria-label="Zoho logo">
          {([
            ["#e42528", "Z", 2],
            ["#1b75bb", "O", 25],
            ["#39a935", "H", 49],
            ["#f6c343", "O", 72]
          ] as Array<[string, string, number]>).map(([fill, letter, x]) => (
            <g key={letter + x}>
              <rect x={Number(x)} y="3" width="22" height="28" rx="5" fill={fill} />
              <text x={Number(x) + 11} y="22.5" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="900" fill="#fff">{letter}</text>
            </g>
          ))}
        </svg>
      );
    case "TCS":
      return (
        <svg className={className} viewBox="0 0 72 36" role="img" aria-label="TCS logo">
          <text x="5" y="25" fontFamily="Arial, sans-serif" fontSize="24" fontStyle="italic" fontWeight="900" fill="#e01b84">tcs</text>
        </svg>
      );
    case "Amazon":
      return (
        <svg className={className} viewBox="0 0 98 36" role="img" aria-label="Amazon logo">
          <text x="4" y="20" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="800" fill="#111827">amazon</text>
          <path d="M27 27c12 5 30 4 42-4" fill="none" stroke="#ff9900" strokeWidth="3" strokeLinecap="round" />
          <path d="M65 20h9l-4 8" fill="none" stroke="#ff9900" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "Microsoft":
      return (
        <svg className={className} viewBox="0 0 42 42" role="img" aria-label="Microsoft logo">
          <rect x="4" y="4" width="15" height="15" fill="#f25022" />
          <rect x="23" y="4" width="15" height="15" fill="#7fba00" />
          <rect x="4" y="23" width="15" height="15" fill="#00a4ef" />
          <rect x="23" y="23" width="15" height="15" fill="#ffb900" />
        </svg>
      );
    case "Infosys":
      return (
        <svg className={className} viewBox="0 0 92 36" role="img" aria-label="Infosys logo">
          <text x="4" y="23" fontFamily="Georgia, serif" fontSize="20" fontWeight="700" fill="#007cc3">Infosys</text>
        </svg>
      );
    case "Accenture":
      return (
        <svg className={className} viewBox="0 0 102 36" role="img" aria-label="Accenture logo">
          <path d="M48 3 65 11 48 19v-6l8-2-8-2V3Z" fill="#a100ff" />
          <text x="3" y="27" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="800" fill="#111827">accenture</text>
        </svg>
      );
    case "Wipro":
      return (
        <svg className={className} viewBox="0 0 56 56" role="img" aria-label="Wipro logo">
          {[
            [28, 6, "#7c3aed"], [39, 9, "#2563eb"], [48, 18, "#0891b2"], [50, 30, "#16a34a"],
            [43, 42, "#65a30d"], [31, 50, "#eab308"], [18, 48, "#f97316"], [8, 39, "#ef4444"],
            [5, 26, "#db2777"], [10, 14, "#9333ea"]
          ].map(([cx, cy, fill], index) => <circle key={index} cx={cx} cy={cy} r="4" fill={fill as string} />)}
          <text x="28" y="33" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="900" fill="#111827">W</text>
        </svg>
      );
  }
}

export default function MockInterviewSetupScreen({ onStart, onOpenCoding }: MockInterviewSetupScreenProps) {
  const [selectedCompany, setSelectedCompany] = useState("Google");
  const [selectedCategory, setSelectedCategory] = useState("Coding & DSA");

  return (
    <div className="cinematic-page cinematic-tool-page max-w-6xl mx-auto px-6 py-16 text-white relative min-h-screen flex flex-col justify-center">
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] glow-spot-violet rounded-full pointer-events-none" />

      <div className="cinematic-tool-title text-center space-y-4 mb-14">
        <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-tr from-brand-indigo to-brand-violet p-0.5 shadow-xl shadow-brand-indigo/10 mx-auto">
          <div className="w-full h-full bg-brand-bg rounded-[1.1rem] flex items-center justify-center">
            <BrainCircuit className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="font-sans text-3xl md:text-4xl font-extrabold tracking-tight">Choose your interview arena.</h1>
        <p className="font-sans text-sm text-gray-400 max-w-lg mx-auto">
          Match the company bar, the interview mode, and the way you want to sharpen your edge.
        </p>
      </div>

      <div className="glass-card rounded-[2rem] p-6 md:p-10 border-white/5 shadow-2xl space-y-9">
        <section className="space-y-4" aria-labelledby="company-selection-title">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-brand-indigo" />
            <h2 id="company-selection-title" className="font-sans text-xs font-bold text-gray-400 uppercase tracking-widest">Target company</h2>
          </div>
          <div className="company-card-grid">
            {COMPANIES.map((company) => {
              const selected = selectedCompany === company.name;
              return (
                <button
                  key={company.name}
                  type="button"
                  onClick={() => setSelectedCompany(company.name)}
                  aria-pressed={selected}
                  className={'company-card ' + (selected ? 'company-card--selected' : '')}
                >
                  <span className="company-logo-shell" aria-hidden="true">
                    <CompanyLogo name={company.name} />
                  </span>
                  <span className="min-w-0 text-left">
                    <span className="block truncate font-sans text-xs font-bold text-white">{company.name}</span>
                    <span className="mt-0.5 block text-[10px] leading-snug text-gray-500">{company.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-4 border-t border-white/5 pt-8" aria-labelledby="category-selection-title">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-brand-violet" />
            <h2 id="category-selection-title" className="font-sans text-xs font-bold text-gray-400 uppercase tracking-widest">Interview category</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              const selected = selectedCategory === category.name;
              return (
                <button
                  type="button"
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  aria-pressed={selected}
                  className={'p-5 rounded-2xl border text-left transition-all ' + (selected ? 'bg-brand-indigo/10 border-brand-indigo text-white shadow-lg shadow-brand-indigo/10' : 'bg-white/[0.01] border-white/10 text-gray-400 hover:border-white/20 hover:text-white')}
                >
                  <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">
                    <Icon className={'h-4 w-4 ' + (selected ? 'text-brand-indigo' : 'text-gray-400')} />
                  </span>
                  <span className="mb-1 block font-sans text-sm font-semibold">{category.name}</span>
                  <span className="block text-[11px] leading-relaxed text-gray-500">{category.desc}</span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-3 border-t border-white/5 pt-8 sm:grid-cols-2">
          <button
            type="button"
            onClick={onOpenCoding}
            className="rounded-xl border border-white/10 bg-white/5 py-4 text-sm font-bold text-white transition-all hover:border-brand-indigo/40 hover:bg-white/10 flex items-center justify-center gap-2"
          >
            <Code2 className="h-4 w-4 text-brand-violet" />
            <span>Open Coding &amp; DSA Lab</span>
          </button>
          <button
            type="button"
            onClick={() => onStart(selectedCompany, selectedCategory)}
            className="w-full py-4 rounded-xl primary-gradient text-white font-bold text-sm shadow-lg shadow-brand-indigo/20 hover:scale-[1.01] active:scale-[0.98] transition-transform cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Start {selectedCompany} Practice</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
