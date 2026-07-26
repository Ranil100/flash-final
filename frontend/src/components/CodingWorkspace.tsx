import React, { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, Bot, Braces, Check, CheckCircle2, ChevronDown, CircleAlert,
  Clock3, Code2, Copy, FlaskConical, Gauge, Lightbulb, LoaderCircle,
  Maximize2, Minimize2, Play, RefreshCcw, Send, Terminal, TestTube2, XCircle
} from "lucide-react";
import { PROBLEMS, generateTemplate, LanguageId, CodingProblem, CodingTest } from "../data/codingProblems";

type WorkspaceTab = "problem" | "tests" | "ai-tests";

interface CodingWorkspaceProps {
  onBack: () => void;
}

interface TestResult {
  id: string; input: string; expected: string; actual?: string; passed: boolean;
  hidden?: boolean; status?: string; message?: string; time?: number; memory?: number;
}

interface RunResult {
  status: "accepted" | "rejected" | "error"; passed: number; total: number;
  tests: TestResult[]; compileError?: string; runtimeError?: string;
  executionTime?: number; memory?: number; score?: number; judge?: string;
}

interface ChatMessage {
  role: "assistant" | "user"; content: string;
}

const LANGUAGE_OPTIONS: Array<{ id: LanguageId; label: string; extension: string }> = [
  { id: "java", label: "Java", extension: "java" },
  { id: "javascript", label: "JavaScript", extension: "js" },
  { id: "python", label: "Python", extension: "py" },
  { id: "csharp", label: "C#", extension: "cs" },
  { id: "cpp", label: "C++", extension: "cpp" },
  { id: "c", label: "C", extension: "c" },
  { id: "typescript", label: "TypeScript", extension: "ts" },
  { id: "go", label: "Go", extension: "go" }
];

function highlightCode(source: string) {
  const tokenPattern = /(\b(?:function|const|let|var|return|if|else|for|while|class|public|private|static|bool|boolean|int|string|import|from|def|package|func|using|new|true|false|null|None)\b|\/\/.*$|#.*$|".*?"|'.*?'|\b\d+\b)/gm;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0; let match: RegExpExecArray | null; let key = 0;
  while ((match = tokenPattern.exec(source)) !== null) {
    if (match.index > lastIndex) nodes.push(source.slice(lastIndex, match.index));
    const value = match[0];
    const tone = value.startsWith("//") || value.startsWith("#") ? "text-gray-600" : value.startsWith("'") || value.startsWith('"') ? "text-emerald-300" : /^(true|false|null|None|\d)/.test(value) ? "text-amber-300" : "text-violet-300";
    nodes.push(<span className={tone} key={key++}>{value}</span>);
    lastIndex = match.index + value.length;
  }
  if (lastIndex < source.length) nodes.push(source.slice(lastIndex));
  return nodes;
}

export default function CodingWorkspace({ onBack }: CodingWorkspaceProps) {
  const highlightLayerRef = useRef<HTMLPreElement>(null);
  // Pick 5 random problems for this session
  const [sessionProblems] = useState<CodingProblem[]>(() => {
    return [...PROBLEMS].sort(() => 0.5 - Math.random()).slice(0, 5);
  });

  const [problemId, setProblemId] = useState<string>(() => sessionProblems[0].id);
  const problem = sessionProblems.find(p => p.id === problemId)!;

  const [language, setLanguage] = useState<LanguageId>("javascript");
  const [codes, setCodes] = useState<Record<LanguageId, string>>(() => {
    return LANGUAGE_OPTIONS.reduce((acc, opt) => {
      acc[opt.id] = generateTemplate(opt.id, problem.funcName, problem.returnType);
      return acc;
    }, {} as Record<LanguageId, string>);
  });

  useEffect(() => {
    const fallback = LANGUAGE_OPTIONS.reduce((acc, opt) => {
      acc[opt.id] = generateTemplate(opt.id, problem.funcName, problem.returnType);
      return acc;
    }, {} as Record<LanguageId, string>);
    try {
      const saved = localStorage.getItem(`flash-coding-${problem.id}`);
      if (saved) setCodes({ ...fallback, ...JSON.parse(saved) });
      else setCodes(fallback);
    } catch {
      setCodes(fallback);
    }
  }, [problem.id, problem.funcName, problem.returnType]);

  useEffect(() => {
    localStorage.setItem(`flash-coding-${problem.id}`, JSON.stringify(codes));
  }, [codes, problem.id]);

  const [tab, setTab] = useState<WorkspaceTab>("problem");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [generatedTests, setGeneratedTests] = useState<CodingTest[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");

  useEffect(() => {
    if (problem && chatMessages.length === 0) {
      setChatMessages([{ role: "assistant", content: `I can clarify this ${problem.title} problem, walk through an example, or offer a small hint. I will not provide the full solution.` }]);
    }
  }, [problem, chatMessages.length]);

  const source = codes[language] || "";
  const selectedLanguage = LANGUAGE_OPTIONS.find((item) => item.id === language)!;
  const lineNumbers = useMemo(() => source.split("\n").map((_, index) => index + 1), [source]);

  const updateSource = (nextValue: string) => { setCodes((current) => ({ ...current, [language]: nextValue })); setResult(null); };

  const insertAtSelection = (value: string, cursorOffset: number) => {
    const editor = document.getElementById("coding-editor") as HTMLTextAreaElement | null;
    if (!editor) return; const start = editor.selectionStart; const end = editor.selectionEnd;
    const next = source.slice(0, start) + value + source.slice(end);
    updateSource(next);
    window.requestAnimationFrame(() => { editor.focus(); editor.selectionStart = start + cursorOffset; editor.selectionEnd = start + cursorOffset; });
  };

  const handleEditorKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Tab") { event.preventDefault(); insertAtSelection("  ", 2); return; }
    if ("([{".includes(event.key)) { event.preventDefault(); const pairs: Record<string, string> = { "(": ")", "[": "]", "{": "}" }; insertAtSelection(event.key + pairs[event.key], 1); return; }
    if (event.key === "Enter") {
      event.preventDefault(); const editor = event.currentTarget; const before = source.slice(0, editor.selectionStart);
      const currentLine = before.split("\n").pop() || ""; const indent = (currentLine.match(/^\s*/) || [""])[0];
      const extraIndent = /[({[]\s*$/.test(currentLine) ? "  " : "";
      insertAtSelection("\n" + indent + extraIndent, 1 + indent.length + extraIndent.length);
    }
  };

  const execute = async (mode: "run" | "submit") => {
    setIsRunning(true); setResult(null);
    try {
      const response = await fetch("/api/coding/execute", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, source, mode, generatedTests, problemId: problem.id })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The code runner could not evaluate this submission.");
      setResult(data);
    } catch (error) {
      setResult({ status: "error", passed: 0, total: 0, tests: [], runtimeError: error instanceof Error ? error.message : "The code runner could not be reached." });
    } finally { setIsRunning(false); }
  };

  const generateTests = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/coding/test-cases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ problemId: problem.id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "AI test generation failed.");
      setGeneratedTests(data.tests || []); setTab("ai-tests");
    } catch (error) {
      setGeneratedTests([]); setResult({ status: "error", passed: 0, total: 0, tests: [], runtimeError: error instanceof Error ? error.message : "AI test generation failed." });
    } finally { setIsGenerating(false); }
  };

  const sendChat = async () => {
    const question = chatInput.trim(); if (!question || isChatting) return;
    const nextMessages: ChatMessage[] = [...chatMessages, { role: "user", content: question }];
    setChatMessages(nextMessages); setChatInput(""); setIsChatting(true);
    try {
      const response = await fetch("/api/coding/explain", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.slice(-8), problemId: problem.id })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The AI tutor is unavailable.");
      setChatMessages((current) => [...current, { role: "assistant", content: data.reply }]);
    } catch (error) { setChatMessages((current) => [...current, { role: "assistant", content: error instanceof Error ? error.message : "The AI tutor is unavailable. Please try again." }]); } finally { setIsChatting(false); }
  };

  const copySource = async () => {
    try { await navigator.clipboard.writeText(source); setCopyMessage("Copied"); window.setTimeout(() => setCopyMessage(""), 1600); }
    catch { setCopyMessage("Copy unavailable"); }
  };

  return (
    <div className="coding-workspace cinematic-page min-h-screen px-4 py-6 sm:px-6 md:px-10 lg:px-12">
      <div className="mx-auto max-w-[100rem]">
        <header className="coding-workspace-header mb-6 flex flex-col gap-5 rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <button type="button" onClick={onBack} className="icon-action mt-0.5" aria-label="Back to dashboard" title="Back to dashboard"><ArrowLeft className="h-4 w-4" /></button>
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="coding-kicker"><Code2 className="h-3.5 w-3.5" /> Coding &amp; DSA</span>
                <span className={`difficulty-badge difficulty-badge--${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span>
              </div>
              <div className="flex items-center">
                <select
                  className="appearance-none bg-transparent text-2xl font-black tracking-tight text-white sm:text-3xl focus:outline-none focus:ring-2 focus:ring-brand-violet rounded-md py-1 pr-6 cursor-pointer"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right center' }}
                  value={problemId} onChange={(e) => {
                    setProblemId(e.target.value);
                    setResult(null);
                    setGeneratedTests([]);
                    const newProb = sessionProblems.find(p => p.id === e.target.value)!;
                    setChatMessages([{ role: "assistant", content: `I can clarify this ${newProb.title} problem, walk through an example, or offer a small hint. I will not provide the full solution.` }]);
                  }}
                >
                  {sessionProblems.map(p => <option key={p.id} value={p.id} className="text-base bg-zinc-900 text-white font-sans">{p.title}</option>)}
                </select>
              </div>
              <p className="mt-1 text-sm text-gray-400">A focused lab with a local draft, AI test design, and execution feedback.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
            <span className="metric-chip"><Clock3 className="h-3.5 w-3.5 text-brand-indigo" /> {problem.targetTime} min target</span>
            <span className="metric-chip"><Gauge className="h-3.5 w-3.5 text-brand-violet" /> {problem.acceptance}% acceptance</span>
            <span className="metric-chip"><Braces className="h-3.5 w-3.5 text-emerald-400" /> {problem.topic}</span>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(20rem,0.82fr)_minmax(34rem,1.35fr)_minmax(19rem,0.72fr)]">
          <aside className="glass-card min-w-0 rounded-[2rem] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-1 border-b border-white/5 pb-3">
              {[{ id: "problem" as WorkspaceTab, label: "Problem" }, { id: "tests" as WorkspaceTab, label: "Test cases" }, { id: "ai-tests" as WorkspaceTab, label: "AI Test Lab" }].map((item) => (
                <button type="button" key={item.id} onClick={() => setTab(item.id)} className={'coding-tab ' + (tab === item.id ? 'coding-tab--active' : '')}>{item.label}</button>
              ))}
            </div>

            {tab === "problem" && (
              <div className="problem-copy space-y-6">
                <section><h2>{problem.descriptionTitle}</h2><p>{problem.description}</p></section>
                <section>
                  <h3>Input and output</h3>
                  <p><strong>Input:</strong> {problem.inputFormat}</p>
                  <p><strong>Output:</strong> {problem.outputFormat}</p>
                </section>
                <section>
                  <h3>Constraints</h3>
                  <ul>{problem.constraints.map((c, i) => <li key={i}><code>{c}</code></li>)}</ul>
                </section>
                <section>
                  <h3>Example</h3>
                  <div className="sample-io"><span>Input</span><code>{problem.example.input}</code><span>Output</span><code>{problem.example.output}</code></div>
                  <p>{problem.example.explanation}</p>
                </section>
                <section>
                  <h3>Expected complexity</h3>
                  <p><strong>Time:</strong> {problem.complexity.time} &nbsp; <strong>Space:</strong> {problem.complexity.space}</p>
                  <div className="mt-3 flex flex-wrap gap-2">{problem.tags.map((tag) => <span className="topic-tag" key={tag}>{tag}</span>)}</div>
                </section>
              </div>
            )}

            {tab === "tests" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-white"><TestTube2 className="h-4 w-4 text-brand-indigo" /> Visible test cases</div>
                {problem.initialTests.map((test) => (
                  <article className="test-case-card" key={test.id}>
                    <div className="mb-2 flex items-center justify-between"><span>{test.label}</span><Check className="h-3.5 w-3.5 text-emerald-400" /></div>
                    <code>{test.input || "(empty string)"}</code>
                    <p>Expected: <strong>{test.expected}</strong></p>
                  </article>
                ))}
                <p className="text-xs leading-relaxed text-gray-500">Run validates visible cases. Submit also evaluates protected boundary and performance cases.</p>
              </div>
            )}

            {tab === "ai-tests" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-white"><FlaskConical className="h-4 w-4 text-brand-violet" /> AI-generated cases</div>
                {generatedTests.length === 0 ? (
                  <div className="empty-state">
                    <FlaskConical className="h-6 w-6 text-brand-violet" />
                    <p>Generate a fresh set of boundary, edge, and unusual cases for this problem.</p>
                  </div>
                ) : generatedTests.map((test) => (
                  <article className="test-case-card" key={test.id}>
                    <div className="mb-2 flex items-center justify-between"><span>{test.label}</span><span className="text-brand-violet">AI checked</span></div>
                    <code>{test.input || "(empty string)"}</code>
                    <p>Expected: <strong>{test.expected}</strong></p>
                  </article>
                ))}
                <button type="button" onClick={generateTests} disabled={isGenerating} className="secondary-action w-full">
                  {isGenerating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                  {isGenerating ? "Validating test cases..." : "Generate and validate cases"}
                </button>
              </div>
            )}
          </aside>

          <section className={'coding-editor-shell glass-card min-w-0 rounded-[2rem] p-4 sm:p-5 ' + (isFullscreen ? 'coding-editor-shell--fullscreen' : '')}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
              <div className="flex items-center gap-2"><Terminal className="h-4 w-4 text-brand-indigo" /><span className="text-sm font-bold text-white">Solution editor</span><span className="hidden rounded-md bg-white/5 px-2 py-1 font-mono text-[10px] text-gray-500 sm:inline">{selectedLanguage.extension}</span></div>
              <div className="flex items-center gap-2">
                <div className="language-select-shell">
                  <label className="sr-only" htmlFor="coding-language">Language</label>
                  <select id="coding-language" value={language} onChange={(event) => setLanguage(event.target.value as LanguageId)}>{LANGUAGE_OPTIONS.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select>
                  <ChevronDown className="pointer-events-none h-3.5 w-3.5 text-gray-400" />
                </div>
                <button type="button" onClick={copySource} className="icon-action" title="Copy code" aria-label="Copy code"><Copy className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => setIsFullscreen((current) => !current)} className="icon-action" title={isFullscreen ? "Exit full screen" : "Full screen editor"} aria-label={isFullscreen ? "Exit full screen" : "Full screen editor"}>{isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}</button>
              </div>
            </div>

            {copyMessage && <div className="editor-toast" role="status">{copyMessage}</div>}

            <div className="code-editor" aria-label="Code editor with syntax highlighting">
              <div className="line-numbers" aria-hidden="true">{lineNumbers.map((line) => <span className={result?.status === "error" && line === 1 ? "line-number--error" : ""} key={line}>{line}</span>)}</div>
              <div className="code-editor-layer">
                <pre ref={highlightLayerRef} aria-hidden="true">{highlightCode(source)}</pre>
                <textarea id="coding-editor" value={source} spellCheck={false} onChange={(event) => updateSource(event.target.value)} onKeyDown={handleEditorKeyDown} onScroll={(event) => { if (!highlightLayerRef.current) return; highlightLayerRef.current.scrollTop = event.currentTarget.scrollTop; highlightLayerRef.current.scrollLeft = event.currentTarget.scrollLeft; }} aria-label="Solution code" />
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-white/5 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" onClick={() => updateSource(generateTemplate(language, problem.funcName, problem.returnType))} className="text-button"><RefreshCcw className="h-3.5 w-3.5" /> Reset {selectedLanguage.label} starter</button>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={generateTests} disabled={isGenerating} className="secondary-action">{isGenerating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />} AI test cases</button>
                <button type="button" onClick={() => execute("run")} disabled={isRunning} className="secondary-action">{isRunning ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} {isRunning ? "Analysing..." : "Run code"}</button>
                <button type="button" onClick={() => execute("submit")} disabled={isRunning} className="primary-action">{isRunning ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} {isRunning ? "Judging..." : "Submit"}</button>
              </div>
            </div>

            {result && (
              <section className={'run-results mt-4 ' + (result.status === "accepted" ? "run-results--success" : result.status === "error" ? "run-results--error" : "run-results--rejected")} aria-live="polite">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold">{result.status === "accepted" ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <CircleAlert className="h-4 w-4 text-amber-400" />}<span>{result.status === "accepted" ? "Accepted" : result.status === "rejected" ? "Needs another pass" : result.judge ? "AI judge issue" : "Runner unavailable"}</span></div>
                  <div className="flex flex-wrap items-center justify-end gap-2">{result.judge && <span className="rounded-full border border-brand-violet/20 bg-brand-violet/10 px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-wider text-brand-violet">{result.judge}</span>}<span className="font-mono text-xs text-gray-400">{result.passed}/{result.total} cases · {result.score ?? 0}%</span></div>
                </div>
                {(result.compileError || result.runtimeError) && <pre className="runner-error">{result.compileError || result.runtimeError}</pre>}
                <div className="mt-3 space-y-2">
                  {result.tests.map((test) => (
                    <div className="result-case" key={test.id}>
                      {test.passed ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <XCircle className="h-3.5 w-3.5 text-rose-400" />}
                      <span>{test.hidden ? "Protected test" : "Input: " + (test.input || "(empty string)")}</span>
                      {!test.passed && <span className="ml-auto text-right text-gray-400">expected {test.expected}, got {test.actual || "no output"}</span>}
                    </div>
                  ))}
                </div>
                {(result.executionTime || result.memory) && <div className="mt-3 flex gap-4 text-[11px] text-gray-500"><span>{result.executionTime || 0} ms</span><span>{result.memory || 0} KB</span></div>}
              </section>
            )}
          </section>

          <aside className="glass-card min-w-0 rounded-[2rem] p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2 border-b border-white/5 pb-4"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-violet/10"><Bot className="h-4 w-4 text-brand-violet" /></span><div><h2 className="text-sm font-bold text-white">Problem guide</h2><p className="text-[11px] text-gray-500">Scoped to {problem.title}</p></div></div>
            <div className="chat-thread custom-scrollbar" role="log" aria-label="AI problem guide conversation">
              {chatMessages.map((message, index) => (<div className={'chat-message chat-message--' + message.role} key={index}>{message.content}</div>))}
              {isChatting && <div className="chat-message chat-message--assistant"><LoaderCircle className="h-4 w-4 animate-spin text-brand-violet" /></div>}
            </div>
            <div className="mt-4 border-t border-white/5 pt-4">
              <label className="sr-only" htmlFor="problem-guide-input">Ask about this problem</label>
              <textarea id="problem-guide-input" value={chatInput} onChange={(event) => setChatInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendChat(); } }} placeholder="Ask for a hint or clarification..." rows={3} className="w-full resize-none rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white placeholder-gray-600" />
              <button type="button" onClick={sendChat} disabled={!chatInput.trim() || isChatting} className="primary-action mt-3 w-full"><Send className="h-4 w-4" /> Ask problem guide</button>
              <p className="mt-3 flex items-start gap-2 text-[10px] leading-relaxed text-gray-500"><Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" /> Hints, examples, terminology, and failure analysis only. No complete solution output.</p>
            </div>
          </aside>
        </div>
      </div >
    </div >
  );
}
