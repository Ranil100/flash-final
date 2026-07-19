from fastapi import APIRouter, HTTPException

from app.config import get_settings
from app.schemas.interview import (
    CreateSessionRequest,
    CreateSessionResponse,
    InterviewSummaryResponse,
    SubmitAnswerRequest,
    SubmitAnswerResponse,
)
from app.services.orchestrator import (
    MAX_INTERVIEW_QUESTIONS,
    create_session,
    generate_summary,
    get_session,
    submit_answer,
)

router = APIRouter(prefix="/api/interview", tags=["interview"])


@router.post("/sessions", response_model=CreateSessionResponse)
def start_interview(payload: CreateSessionRequest) -> CreateSessionResponse:
    settings = get_settings()
    if not settings.gemini_api_key:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY is not configured.")

    try:
        session = create_session(
            company=payload.company,
            job_description=payload.job_description,
            resume_text=payload.resume_text,
            category=payload.category,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to start session: {exc}") from exc

    return CreateSessionResponse(
        session_id=session.session_id,
        question=session.current_question,
        difficulty=session.difficulty,
        step=session.step,
        max_questions=MAX_INTERVIEW_QUESTIONS,
        category=session.category,
    )


@router.post("/sessions/{session_id}/answer", response_model=SubmitAnswerResponse)
def answer_question(session_id: str, payload: SubmitAnswerRequest) -> SubmitAnswerResponse:
    settings = get_settings()
    if not settings.gemini_api_key:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY is not configured.")

    if not payload.answer.strip():
        raise HTTPException(status_code=400, detail="Answer cannot be empty.")

    try:
        session, verdict, feedback, next_question = submit_answer(session_id, payload.answer)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Evaluation failed: {exc}") from exc

    return SubmitAnswerResponse(
        verdict=verdict,
        feedback=feedback,
        difficulty=session.difficulty,
        step=session.step if not session.done else MAX_INTERVIEW_QUESTIONS,
        done=session.done,
        next_question=next_question,
    )


@router.get("/sessions/{session_id}/summary", response_model=InterviewSummaryResponse)
def interview_summary(session_id: str) -> InterviewSummaryResponse:
    settings = get_settings()
    if not settings.gemini_api_key:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY is not configured.")

    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    if not session.done:
        raise HTTPException(status_code=400, detail="Interview not yet complete.")

    try:
        summary = generate_summary(session_id)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Summary generation failed: {exc}") from exc

    return InterviewSummaryResponse(**summary)