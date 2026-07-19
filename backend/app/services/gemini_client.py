import os
import re
from functools import lru_cache
from typing import Optional

from llama_index.core import Document, VectorStoreIndex
from llama_index.embeddings.google_genai import GoogleGenAIEmbedding
from llama_index.llms.google_genai import GoogleGenAI

from app.config import get_settings
from app.schemas.ats import (
    AtsScoreResponse,
    AtsStatus,
    GitHubProfile,
    LeetCodeStats,
    LinkedInProfile,
    PlatformSignals,
    PlatformSummaries,
    PlatformWarnings,
    ScoreBreakdown,
)
from app.services.platform_radar import (
    format_github_summary,
    format_leetcode_summary,
    format_linkedin_summary,
    strip_demographic_identifiers,
)


@lru_cache
def get_llm() -> GoogleGenAI:
    settings = get_settings()
    os.environ["GEMINI_API_KEY"] = settings.gemini_api_key
    os.environ["GOOGLE_API_KEY"] = settings.gemini_api_key
    return GoogleGenAI(
        model=settings.llm_model,
        api_key=settings.gemini_api_key,
        temperature=0.0,
    )


@lru_cache
def get_embed_model() -> GoogleGenAIEmbedding:
    settings = get_settings()
    return GoogleGenAIEmbedding(
        model_name=settings.embedding_model,
        api_key=settings.gemini_api_key,
    )


def query_llm_direct(prompt: str) -> str:
    llm = get_llm()
    return str(llm.complete(prompt).text)


def query_with_index(prompt: str, context_text: str, label: str) -> str:
    embed_model = get_embed_model()
    llm = get_llm()
    doc = Document(text=context_text, doc_id_=label)
    index = VectorStoreIndex.from_documents([doc], embed_model=embed_model)
    engine = index.as_query_engine(llm=llm, embed_model=embed_model)
    return str(engine.query(prompt).response)


def _parse_rubric_scores(report: str) -> tuple[int, int, int, int]:
    total_match = re.search(r"TOTAL OBJECTIVE SCORE:\s*(\d+)", report, re.IGNORECASE)
    tech_match = re.search(r"Technical Alignment:\s*(\d+)", report, re.IGNORECASE)
    proj_match = re.search(r"Project Complexity:\s*(\d+)", report, re.IGNORECASE)
    logic_match = re.search(r"Logic Framework:\s*(\d+)", report, re.IGNORECASE)

    total = int(total_match.group(1)) if total_match else 0
    tech = int(tech_match.group(1)) if tech_match else 0
    proj = int(proj_match.group(1)) if proj_match else 0
    logic = int(logic_match.group(1)) if logic_match else 0
    return total, tech, proj, logic


def _parse_platform_scores(report: str) -> PlatformSignals:
    gh = re.search(r"GitHub Signal:\s*(\d+)", report, re.IGNORECASE)
    lc = re.search(r"LeetCode Signal:\s*(\d+)", report, re.IGNORECASE)
    li = re.search(r"LinkedIn Signal:\s*(\d+)", report, re.IGNORECASE)
    return PlatformSignals(
        github=int(gh.group(1)) if gh else None,
        leetcode=int(lc.group(1)) if lc else None,
        linkedin=int(li.group(1)) if li else None,
    )


def _parse_list_section(report: str, header: str) -> list[str]:
    pattern = rf"{header}:\s*\n((?:-\s*.+\n?)+)"
    match = re.search(pattern, report, re.IGNORECASE)
    if not match:
        return []
    return [
        line.strip().lstrip("- ").strip()
        for line in match.group(1).splitlines()
        if line.strip().startswith("-")
    ]


def _derive_status(score: int) -> AtsStatus:
    if score >= 75:
        return AtsStatus.STRONG_MATCH
    if score >= 50:
        return AtsStatus.NEEDS_WORK
    return AtsStatus.GAP


def _estimate_platform_scores(
    github: GitHubProfile,
    leetcode: LeetCodeStats,
    linkedin: LinkedInProfile,
) -> PlatformSignals:
    gh_score: Optional[int] = None
    if github.available:
        gh_score = min(100, github.public_repos * 3 + github.total_stars * 2 + len(github.top_languages) * 5)

    lc_score: Optional[int] = None
    if leetcode.available:
        lc_score = min(
            100,
            leetcode.easy_solved * 1
            + leetcode.medium_solved * 3
            + leetcode.hard_solved * 5,
        )

    li_score: Optional[int] = None
    if linkedin.available:
        li_score = min(100, len(linkedin.skills) * 5 + (20 if linkedin.headline else 0))

    return PlatformSignals(github=gh_score, leetcode=lc_score, linkedin=li_score)


def score_profile(
    resume_text: str,
    job_description: str,
    github: GitHubProfile,
    leetcode: LeetCodeStats,
    linkedin: LinkedInProfile,
) -> AtsScoreResponse:
    clean_resume = strip_demographic_identifiers(resume_text) if resume_text.strip() else ""
    gh_summary = format_github_summary(github)
    lc_summary = format_leetcode_summary(leetcode)
    li_summary = format_linkedin_summary(linkedin)

    context_parts = []
    if clean_resume:
        context_parts.append(f"Resume:\n{clean_resume}")
    if job_description.strip():
        context_parts.append(f"Job Description:\n{job_description}")
    context_parts.extend([
        f"GitHub:\n{gh_summary}",
        f"LeetCode:\n{lc_summary}",
        f"LinkedIn:\n{li_summary}",
    ])
    context = "\n\n".join(context_parts)

    prompt = (
        "You are an objective ATS scoring system for campus placement candidates.\n"
        "Evaluate the candidate using resume, GitHub, LeetCode, and LinkedIn signals.\n"
        "Ignore personal demographics, names, locations, graduation years, and universities.\n\n"
        "Score out of 100 using this rubric:\n"
        "1. Technical Alignment — stack & keyword fit (40 points)\n"
        "2. Project Complexity — depth, scale, relevance (40 points)\n"
        "3. Logic Framework — problem-solving & systems thinking (20 points)\n\n"
        "Also rate platform signals 0-100 each:\n"
        "- GitHub Signal (activity, languages, project quality)\n"
        "- LeetCode Signal (DSA readiness)\n"
        "- LinkedIn Signal (professional presentation)\n\n"
        "Output EXACTLY this structure:\n"
        "TOTAL OBJECTIVE SCORE: [0-100]\n"
        "RUBRIC BREAKDOWN:\n"
        "- Technical Alignment: [X]/40\n"
        "- Project Complexity: [Y]/40\n"
        "- Logic Framework: [Z]/20\n"
        "PLATFORM SIGNALS:\n"
        "- GitHub Signal: [0-100]\n"
        "- LeetCode Signal: [0-100]\n"
        "- LinkedIn Signal: [0-100]\n"
        "RECRUITMENT STATUS: [STRONG MATCH / NEEDS WORK / GAP]\n"
        "GAPS:\n"
        "- [gap 1]\n"
        "- [gap 2]\n"
        "ROADMAP:\n"
        "- [action 1]\n"
        "- [action 2]\n"
    )

    if clean_resume or job_description.strip():
        report = query_with_index(prompt, context, "ats_profile")
    else:
        report = query_llm_direct(f"{prompt}\n\nCandidate Data:\n{context}")

    total, tech, proj, logic = _parse_rubric_scores(report)
    platform_signals = _parse_platform_scores(report)
    if all(v is None for v in [platform_signals.github, platform_signals.leetcode, platform_signals.linkedin]):
        platform_signals = _estimate_platform_scores(github, leetcode, linkedin)

    gaps = _parse_list_section(report, "GAPS")
    roadmap = _parse_list_section(report, "ROADMAP")

    status_match = re.search(
        r"RECRUITMENT STATUS:\s*(STRONG MATCH|NEEDS WORK|GAP)",
        report,
        re.IGNORECASE,
    )
    if status_match:
        status = AtsStatus(status_match.group(1).upper())
    else:
        status = _derive_status(total)

    return AtsScoreResponse(
        overall_score=total,
        breakdown=ScoreBreakdown(
            technical_alignment=tech,
            project_complexity=proj,
            logic_framework=logic,
            platform_signals=platform_signals,
        ),
        status=status,
        gaps=gaps,
        roadmap=roadmap,
        platform_summaries=PlatformSummaries(
            github=gh_summary,
            leetcode=lc_summary,
            linkedin=li_summary,
        ),
        warnings=PlatformWarnings(
            github=github.warning,
            leetcode=leetcode.warning,
            linkedin=linkedin.warning,
        ),
        raw_report=report,
    )
