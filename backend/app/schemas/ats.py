from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class AtsStatus(str, Enum):
    STRONG_MATCH = "STRONG MATCH"
    NEEDS_WORK = "NEEDS WORK"
    GAP = "GAP"


class PlatformSignals(BaseModel):
    github: Optional[int] = None
    leetcode: Optional[int] = None
    linkedin: Optional[int] = None


class ScoreBreakdown(BaseModel):
    technical_alignment: int = Field(ge=0, le=40)
    project_complexity: int = Field(ge=0, le=40)
    logic_framework: int = Field(ge=0, le=20)
    platform_signals: PlatformSignals = Field(default_factory=PlatformSignals)


class PlatformSummaries(BaseModel):
    github: Optional[str] = None
    leetcode: Optional[str] = None
    linkedin: Optional[str] = None


class PlatformWarnings(BaseModel):
    github: Optional[str] = None
    leetcode: Optional[str] = None
    linkedin: Optional[str] = None


class GitHubProfile(BaseModel):
    username: str
    name: Optional[str] = None
    bio: Optional[str] = None
    public_repos: int = 0
    followers: int = 0
    top_languages: list[str] = Field(default_factory=list)
    total_stars: int = 0
    repo_names: list[str] = Field(default_factory=list)
    available: bool = True
    warning: Optional[str] = None


class LeetCodeStats(BaseModel):
    username: str
    total_solved: int = 0
    easy_solved: int = 0
    medium_solved: int = 0
    hard_solved: int = 0
    ranking: Optional[int] = None
    available: bool = True
    warning: Optional[str] = None


class LinkedInProfile(BaseModel):
    headline: Optional[str] = None
    summary: Optional[str] = None
    experience_snippet: Optional[str] = None
    skills: list[str] = Field(default_factory=list)
    available: bool = False
    warning: Optional[str] = None


class AtsScoreRequest(BaseModel):
    resume_text: str = ""
    job_description: str = ""
    github_username: str = ""
    leetcode_username: str = ""
    linkedin_text: str = ""


class AtsScoreResponse(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    breakdown: ScoreBreakdown
    status: AtsStatus
    gaps: list[str] = Field(default_factory=list)
    roadmap: list[str] = Field(default_factory=list)
    platform_summaries: PlatformSummaries = Field(default_factory=PlatformSummaries)
    warnings: PlatformWarnings = Field(default_factory=PlatformWarnings)
    raw_report: Optional[str] = None
