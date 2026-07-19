import asyncio
from typing import Optional
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from app.config import get_settings
from app.schemas.ats import AtsScoreResponse
from app.services.gemini_client import score_profile
from app.services.platform_radar import (
    extract_text_from_resume,
    fetch_github_profile,
    fetch_leetcode_stats,
    parse_linkedin_text,
)

router = APIRouter(prefix="/api/ats", tags=["ats"])


@router.post("/score", response_model=AtsScoreResponse)
async def score_ats_profile(
    resume: Optional[UploadFile] = File(None),
    resume_text: str = Form(""),
    job_description: str = Form(""),
    github_username: str = Form(""),
    leetcode_username: str = Form(""),
    linkedin_text: str = Form(""),
) -> AtsScoreResponse:
    settings = get_settings()
    if not settings.gemini_api_key:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY is not configured.")

    extracted = resume_text
    if resume is not None:
        file_data = await resume.read()
        extracted = extract_text_from_resume(file_data, resume.filename or "resume.pdf")

    if not extracted.strip() and not any(
        [github_username.strip(), leetcode_username.strip(), linkedin_text.strip()]
    ):
        raise HTTPException(
            status_code=400,
            detail="Provide a resume or at least one platform profile (GitHub, LeetCode, LinkedIn).",
        )

    github = await fetch_github_profile(github_username)
    leetcode = await fetch_leetcode_stats(leetcode_username)
    linkedin = parse_linkedin_text(linkedin_text)

    try:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            score_profile,
            extracted,
            job_description,
            github,
            leetcode,
            linkedin,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Scoring failed: {exc}") from exc
