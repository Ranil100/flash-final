import React, { useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ArrowRight,
  Award,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Lightbulb,
  LoaderCircle,
  MessageSquareText,
  Target,
  UserRound
} from "lucide-react";
import { InterviewEvaluation } from "../types";

interface InterviewReportScreenProps {
  evaluation: InterviewEvaluation;
  company: string;
  category: string;
  onReviewAnswers: () => void;
  onDone: () => void;
}

const COMPANY_COLORS: Record<string, [number, number, number]> = {
  Google: [66, 133, 244],
  Zoho: [201, 44, 44],
  TCS: [36, 113, 178],
  Amazon: [255, 153, 0],
  Microsoft: [0, 164, 239],
  Infosys: [0, 157, 220],
  Accenture: [161, 0, 255],
  Wipro: [71, 30, 173]
};

function safeFilePart(value: string) {
  return value.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "") || "Candidate";
}

export default function InterviewReportScreen({
  evaluation,
  company,
  category,
  onReviewAnswers,
  onDone
}: InterviewReportScreenProps) {
  const [candidateName, setCandidateName] = useState("FLASH Candidate");
  const [isPreparingPdf, setIsPreparingPdf] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const interviewDate = useMemo(() => new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }), []);
  const duration = Math.max(12, evaluation.questionReviews.length * 4);
  const confidence = Math.round((evaluation.breakdown.communication + evaluation.breakdown.problemSolving) / 2);
  const codingScore = category === "Coding & DSA" ? Math.round((evaluation.breakdown.correctness + evaluation.breakdown.structure) / 2) : evaluation.breakdown.correctness;
  const strengths = Array.from(new Set(evaluation.questionReviews.flatMap((review) => review.strengths))).slice(0, 6);
  const improvements = Array.from(new Set(evaluation.questionReviews.flatMap((review) => review.improvements))).slice(0, 6);
  const color = COMPANY_COLORS[company] || [104, 92, 255];

  const downloadReport = async () => {
    setIsPreparingPdf(true);
    setPdfError("");
    try {
      const document = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = document.internal.pageSize.getWidth();
      const margin = 42;

      document.setFillColor(8, 9, 18);
      document.rect(0, 0, pageWidth, 126, "F");
      document.setFillColor(color[0], color[1], color[2]);
      document.circle(margin + 18, 46, 18, "F");
      document.setTextColor(255, 255, 255);
      document.setFont("helvetica", "bold");
      document.setFontSize(20);
      document.text(company + " Interview Report", margin + 50, 43);
      document.setFont("helvetica", "normal");
      document.setFontSize(10);
      document.setTextColor(188, 191, 214);
      document.text("Prepared by FLASH - Interview intelligence", margin + 50, 62);
      document.setTextColor(255, 255, 255);
      document.setFontSize(26);
      document.text(candidateName, margin, 101);

      autoTable(document, {
        startY: 150,
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 7, lineColor: [224, 225, 238], lineWidth: 0.4 },
        headStyles: { fillColor: color, textColor: [255, 255, 255] },
        head: [["Interview details", "Value"]],
        body: [
          ["Date", interviewDate],
          ["Interview type", category],
          ["Selected company", company],
          ["Role focus", category === "Coding & DSA" ? "Software engineering candidate" : "Technical interview candidate"],
          ["Duration", duration + " minutes"],
          ["Questions evaluated", String(evaluation.questionReviews.length)]
        ]
      });

      const metricsY = (document as any).lastAutoTable.finalY + 34;
      document.setTextColor(18, 20, 38);
      document.setFont("helvetica", "bold");
      document.setFontSize(15);
      document.text("Performance snapshot", margin, metricsY);
      const metrics: Array<[string, number]> = [
        ["Technical", evaluation.breakdown.correctness],
        ["Communication", evaluation.breakdown.communication],
        ["Problem solving", evaluation.breakdown.problemSolving],
        ["Confidence", confidence],
        ["Coding / DSA", codingScore]
      ];
      metrics.forEach((metric, index) => {
        const y = metricsY + 26 + index * 19;
        document.setFont("helvetica", "normal");
        document.setFontSize(9);
        document.text(metric[0], margin, y);
        document.setFillColor(232, 234, 244);
        document.roundedRect(margin + 115, y - 8, 230, 8, 4, 4, "F");
        document.setFillColor(color[0], color[1], color[2]);
        document.roundedRect(margin + 115, y - 8, Math.max(5, 2.3 * metric[1]), 8, 4, 4, "F");
        document.setTextColor(60, 64, 87);
        document.text(String(metric[1]) + "%", margin + 356, y);
      });

      const recommendationY = metricsY + 145;
      document.setTextColor(18, 20, 38);
      document.setFont("helvetica", "bold");
      document.setFontSize(15);
      document.text("Committee summary", margin, recommendationY);
      document.setFont("helvetica", "normal");
      document.setFontSize(9.5);
      const summaryLines = document.splitTextToSize(evaluation.overallVerdict, pageWidth - margin * 2);
      document.text(summaryLines, margin, recommendationY + 18);

      autoTable(document, {
        startY: recommendationY + 18 + summaryLines.length * 12 + 22,
        theme: "striped",
        styles: { fontSize: 8, cellPadding: 6, overflow: "linebreak" },
        headStyles: { fillColor: [26, 28, 48], textColor: [255, 255, 255] },
        head: [["Strengths", "Recommended improvements"]],
        body: [[strengths.join("\n") || "Continue building evidence-backed answers.", improvements.join("\n") || "Maintain the current practice cadence."]]
      });

      document.addPage();
      document.setFillColor(8, 9, 18);
      document.rect(0, 0, pageWidth, 58, "F");
      document.setTextColor(255, 255, 255);
      document.setFont("helvetica", "bold");
      document.setFontSize(16);
      document.text("Question-by-question review", margin, 36);

      autoTable(document, {
        startY: 82,
        theme: "grid",
        styles: { fontSize: 7.5, cellPadding: 5, overflow: "linebreak", valign: "top" },
        headStyles: { fillColor: color, textColor: [255, 255, 255] },
        columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: 145 }, 2: { cellWidth: 170 }, 3: { cellWidth: 170 } },
        head: [["#", "Question", "Candidate response", "AI feedback / reference focus"]],
        body: evaluation.questionReviews.map((review) => [
          String(review.questionNumber),
          review.questionText,
          review.userResponse || "No response recorded.",
          (review.strengths.join("; ") || "Review response.") + "\n\nImprove: " + (review.improvements.join("; ") || "Continue practising.")
        ])
      });

      const finalY = (document as any).lastAutoTable.finalY + 26;
      document.setTextColor(18, 20, 38);
      document.setFont("helvetica", "bold");
      document.setFontSize(14);
      document.text("Suggested preparation plan", margin, finalY);
      document.setFont("helvetica", "normal");
      document.setFontSize(9.5);
      const plan = [
        "1. Rehearse one concise STAR story each day to improve communication confidence.",
        "2. Revisit the recommended topics: " + (improvements.slice(0, 3).join(", ") || "data structures, clarity, and structured thinking") + ".",
        "3. Complete two timed practice sessions before your next interview."
      ];
      document.text(plan, margin, finalY + 18);

      const pageCount = document.getNumberOfPages();
      for (let page = 1; page <= pageCount; page++) {
        document.setPage(page);
        document.setTextColor(120, 124, 148);
        document.setFontSize(8);
        document.text("FLASH confidential interview report", margin, document.internal.pageSize.getHeight() - 22);
        document.text("Page " + page + " of " + pageCount, pageWidth - margin - 44, document.internal.pageSize.getHeight() - 22);
      }

      const fileDate = new Date().toISOString().slice(0, 10);
      document.save("Interview_Report_" + safeFilePart(candidateName) + "_" + fileDate + ".pdf");
    } catch {
      setPdfError("We couldn't prepare the PDF. Please try again in a browser that allows downloads.");
    } finally {
      setIsPreparingPdf(false);
    }
  };

  const metrics = [
    { label: "Technical", value: evaluation.breakdown.correctness, icon: BarChart3, tone: "indigo" },
    { label: "Communication", value: evaluation.breakdown.communication, icon: MessageSquareText, tone: "violet" },
    { label: "Problem solving", value: evaluation.breakdown.problemSolving, icon: Target, tone: "emerald" },
    { label: "Confidence", value: confidence, icon: Award, tone: "amber" },
    { label: "Coding / DSA", value: codingScore, icon: FileText, tone: "indigo" }
  ];

  return (
    <div className="report-screen cinematic-page mx-auto min-h-screen max-w-[90rem] px-6 py-12 md:px-12">
      <section className="report-hero glass-card rounded-[2rem] p-6 md:p-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="coding-kicker"><Award className="h-3.5 w-3.5" /> Interview report</span>
              <span className="report-status"><CheckCircle2 className="h-3.5 w-3.5" /> Completed</span>
            </div>
            <h1 className="max-w-3xl text-4xl font-black tracking-tighter text-white md:text-6xl">Your interview, translated into a plan.</h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-400">A clear performance readout for your {company} {category.toLowerCase()} session, with next actions you can use immediately.</p>
          </div>
          <button type="button" onClick={downloadReport} disabled={isPreparingPdf} className="primary-action whitespace-nowrap">
            {isPreparingPdf ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {isPreparingPdf ? "Preparing PDF..." : "Download PDF"}
          </button>
        </div>
        {pdfError && <p className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200" role="alert">{pdfError}</p>}

        <div className="report-meta-grid mt-10">
          <label className="report-meta-card">
            <span><UserRound className="h-3.5 w-3.5" /> Candidate</span>
            <input value={candidateName} onChange={(event) => setCandidateName(event.target.value)} aria-label="Candidate name" />
          </label>
          <div className="report-meta-card"><span><CalendarDays className="h-3.5 w-3.5" /> Interview date</span><strong>{interviewDate}</strong></div>
          <div className="report-meta-card"><span><Building2 className="h-3.5 w-3.5" /> Company</span><strong>{company}</strong></div>
          <div className="report-meta-card"><span><Clock3 className="h-3.5 w-3.5" /> Duration</span><strong>{duration} minutes</strong></div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article className="metric-report-card glass-card" key={metric.label}>
              <span className={'metric-report-icon metric-report-icon--' + metric.tone}><Icon className="h-4 w-4" /></span>
              <span className="text-xs text-gray-500">{metric.label}</span>
              <strong>{metric.value}<small>%</small></strong>
              <div className="metric-report-track"><span style={{ width: metric.value + "%" }} /></div>
            </article>
          );
        })}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <article className="glass-card rounded-[2rem] p-6 md:p-8">
          <div className="mb-6 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10"><CheckCircle2 className="h-5 w-5 text-emerald-400" /></span><div><h2 className="text-lg font-bold text-white">Strengths to keep compounding</h2><p className="text-xs text-gray-500">Signals that already support your candidacy.</p></div></div>
          <ul className="report-list">
            {strengths.map((item) => <li key={item}><CheckCircle2 className="h-4 w-4 text-emerald-400" />{item}</li>)}
          </ul>
        </article>
        <article className="glass-card rounded-[2rem] p-6 md:p-8">
          <div className="mb-6 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10"><Lightbulb className="h-5 w-5 text-amber-400" /></span><div><h2 className="text-lg font-bold text-white">Preparation plan</h2><p className="text-xs text-gray-500">Turn the review into specific repetitions.</p></div></div>
          <ul className="report-list">
            {(improvements.length ? improvements : ["Practise concise explanations under a timer.", "Complete a focused problem-solving drill.", "Review key concepts before the next round."]).map((item) => <li key={item}><ArrowRight className="h-4 w-4 text-brand-violet" />{item}</li>)}
          </ul>
        </article>
      </section>

      <section className="mt-6 glass-card rounded-[2rem] p-6 md:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><h2 className="text-2xl font-black tracking-tight text-white">Question review</h2><p className="mt-1 text-sm text-gray-400">Responses, incomplete areas, and AI feedback from this session.</p></div>
          <button type="button" onClick={onReviewAnswers} className="secondary-action"><MessageSquareText className="h-4 w-4" /> Open detailed answer notes</button>
        </div>
        <div className="space-y-3">
          {evaluation.questionReviews.map((review) => (
            <article className="question-report-row" key={review.questionNumber}>
              <span className="question-number">{review.questionNumber}</span>
              <div className="min-w-0"><h3>{review.questionText}</h3><p>{review.improvements.length ? "Improve: " + review.improvements.join(" · ") : "Feedback captured in the detailed review."}</p></div>
              <span className="question-score">{review.strengths.length} strengths</span>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-8 flex flex-col justify-end gap-3 sm:flex-row">
        <button type="button" onClick={onReviewAnswers} className="secondary-action"><FileText className="h-4 w-4" /> Review answers</button>
        <button type="button" onClick={onDone} className="primary-action"><span>Return to dashboard</span><ArrowRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
