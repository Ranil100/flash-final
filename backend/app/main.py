import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import ats, interview
from app.config import get_settings

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Flash — Enterprise Interview & Talent Hub",
    description="Student ATS scoring and adaptive mock interview API",
    version="1.0.0",
)

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected server error occurred."},
    )


app.include_router(ats.router)
app.include_router(interview.router)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
