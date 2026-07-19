from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class Company(str, Enum):
    TCS = "tcs"
    CTS = "cts"
    INFOSYS = "infosys"
    DELOITTE = "deloitte"
    WIPRO = "wipro"
    ZOHO = "zoho"
    CAPGEMINI = "capgemini"
    GENERIC = "generic"


class Category(str, Enum):
    BEHAVIOURAL = "behavioural"
    TECHNICAL = "technical"
    CODING = "coding"


class Verdict(str, Enum):
    CORRECT = "CORRECT"
    PARTIAL = "PARTIAL"
    WRONG = "WRONG"


class CreateSessionRequest(BaseModel):
    company: Company = Company.GENERIC
    category: Category = Category.CODING
    job_description: str = ""
    resume_text: str = ""


class CreateSessionResponse(BaseModel):
    session_id: str
    question: str
    difficulty: int
    step: int
    max_questions: int
    category: Category


class SubmitAnswerRequest(BaseModel):
    answer: str


class HistoryItem(BaseModel):
    question: str
    answer: str
    eval: str
    difficulty: int
    verdict: Verdict


class SubmitAnswerResponse(BaseModel):
    verdict: Verdict
    feedback: str
    difficulty: int
    step: int
    done: bool
    next_question: Optional[str] = None


class InterviewSummaryResponse(BaseModel):
    session_id: str
    company: Company
    category: Category
    final_difficulty: int
    history: list[HistoryItem]
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    improvement_plan: list[str] = Field(default_factory=list)
    company_fit_notes: str = ""
    overall_assessment: str = ""
