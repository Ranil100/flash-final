import re
import uuid
from dataclasses import dataclass, field
from typing import Optional

from app.schemas.interview import Category, Company, HistoryItem, Verdict
from app.services.gemini_client import query_llm_direct

MAX_INTERVIEW_QUESTIONS = 10
DIFFICULTY_MIN = 1
DIFFICULTY_MAX = 10
DIFFICULTY_STEP = 1
DIFFICULTY_BASELINE = 1

COMPANY_PROFILES: dict[str, dict] = {
    "tcs": {
        "label": "TCS (Tata Consultancy Services)",
        "focus": ["aptitude", "Java", "SQL", "communication", "fundamentals"],
        "style": "foundational technical + HR mix, emphasis on consistency and learning agility",
    },
    "cts": {
        "label": "CTS (Cognizant)",
        "focus": ["OOP", "DBMS", "networking basics", "problem decomposition"],
        "style": "structured technical rounds with scenario-based questions",
    },
    "infosys": {
        "label": "Infosys",
        "focus": ["data structures", "system basics", "HR behavioral", "puzzle aptitude"],
        "style": "balanced DSA and communication with Infosys-specific HR themes",
    },
    "deloitte": {
        "label": "Deloitte",
        "focus": ["case reasoning", "consulting mindset", "SQL", "cloud basics"],
        "style": "analytical thinking, client scenarios, and technical fundamentals",
    },
    "wipro": {
        "label": "Wipro",
        "focus": ["programming basics", "OS", "networking", "project explanation"],
        "style": "campus-friendly technical depth with clear communication",
    },
    "zoho": {
        "label": "Zoho",
        "focus": ["strong DSA", "C/Java", "logic puzzles", "in-depth fundamentals"],
        "style": "rigorous technical depth, expect precise answers",
    },
    "capgemini": {
        "label": "Capgemini",
        "focus": ["aptitude", "pseudo-code", "SQL", "soft skills"],
        "style": "practical technical assessment with HR screening elements",
    },
    "generic": {
        "label": "Any Company",
        "focus": ["DSA", "system design basics", "projects", "behavioral"],
        "style": "adaptive campus placement interview simulation",
    },
}

CATEGORY_PROFILES: dict[str, dict] = {
    "behavioural": {
        "label": "Behavioural",
        "question_instruction": (
            "Ask ONE behavioural interview question in the style of 'Tell me about a time when...'. "
            "Focus on teamwork, conflict resolution, leadership, failure/learning, or ownership. "
            "Do NOT ask for code or technical/conceptual knowledge."
        ),
        "eval_instruction": (
            "Grade the candidate's answer using the STAR framework (Situation, Task, Action, Result). "
            "Check whether the answer is specific (not vague/generic), includes a concrete outcome, "
            "and reflects genuine self-awareness. Do not grade for technical correctness."
        ),
    },
    "technical": {
        "label": "Technical",
        "question_instruction": (
            "Ask ONE conceptual technical question — CS fundamentals such as OS, DBMS, networking, "
            "OOP, or language internals. The candidate should explain concepts in words. "
            "Do NOT ask for a live-coding / write-a-program question."
        ),
        "eval_instruction": (
            "Grade the candidate's answer for conceptual accuracy, completeness, and clarity of "
            "explanation. Check for common misconceptions."
        ),
    },
    "coding": {
        "label": "Coding & Problem Solving",
        "question_instruction": (
            "Ask ONE coding / DSA problem-solving question that requires the candidate to write "
            "or describe code (arrays, trees, graphs, DP, concurrency, etc.)."
        ),
        "eval_instruction": (
            "Grade the candidate's answer for correctness, time/space complexity, and handling of "
            "edge cases. Point out bugs or missed edge cases specifically."
        ),
    },
}


@dataclass
class InterviewSession:
    session_id: str
    company: Company
    category: Category
    job_description: str
    resume_text: str
    step: int = 0
    difficulty: int = DIFFICULTY_BASELINE
    current_question: str = ""
    history: list[dict] = field(default_factory=list)
    done: bool = False


_sessions: dict[str, InterviewSession] = {}


def evaluate_answer_quality(eval_output: str) -> Verdict:
    upper = eval_output.upper()
    if re.search(r"SCORE:\s*CORRECT", upper):
        return Verdict.CORRECT
    if re.search(r"SCORE:\s*WRONG", upper):
        return Verdict.WRONG
    return Verdict.PARTIAL


def _extract_feedback(eval_output: str, verdict: Verdict) -> str:
    match = re.search(r"FEEDBACK:\s*(.+?)(?=CORRECT ANSWER:|$)", eval_output, re.IGNORECASE | re.DOTALL)
    feedback = match.group(1).strip() if match else eval_output
    
    # Add correct answer if the verdict is WRONG
    if verdict == Verdict.WRONG:
        answer_match = re.search(r"CORRECT ANSWER:\s*(.+?)$", eval_output, re.IGNORECASE | re.DOTALL)
        if answer_match:
            correct_answer = answer_match.group(1).strip()
            feedback = f"{feedback}\n\n💡 Correct Answer:\n{correct_answer}"
    
    return feedback


def _company_context(company: Company) -> str:
    profile = COMPANY_PROFILES.get(company.value, COMPANY_PROFILES["generic"])
    focus = ", ".join(profile["focus"])
    return (
        f"Company: {profile['label']}\n"
        f"Interview style: {profile['style']}\n"
        f"Focus areas: {focus}"
    )


def _category_profile(category: Category) -> dict:
    return CATEGORY_PROFILES.get(category.value, CATEGORY_PROFILES["coding"])


def _generate_question(
    company: Company,
    category: Category,
    difficulty: int,
    job_description: str,
    direction: Optional[str] = None,
) -> str:
    direction_line = f"Direction: {direction}\n" if direction else ""
    category_instruction = _category_profile(category)["question_instruction"]
    prompt = (
        "You are a campus placement interviewer.\n"
        f"{_company_context(company)}\n"
        f"Interview category: {_category_profile(category)['label']}\n"
        f"{category_instruction}\n"
        f"Generate this question at difficulty {difficulty}/10.\n"
        f"{direction_line}"
        f"Role context:\n{job_description or 'General software engineering campus role.'}\n\n"
        "Return only the question — no preamble."
    )
    return query_llm_direct(prompt).strip()


def create_session(
    company: Company,
    category: Category = Category.CODING,
    job_description: str = "",
    resume_text: str = "",
) -> InterviewSession:
    session_id = str(uuid.uuid4())
    question = _generate_question(company, category, DIFFICULTY_BASELINE, job_description)
    session = InterviewSession(
        session_id=session_id,
        company=company,
        category=category,
        job_description=job_description,
        resume_text=resume_text,
        step=1,
        difficulty=DIFFICULTY_BASELINE,
        current_question=question,
    )
    _sessions[session_id] = session
    return session


def get_session(session_id: str) -> Optional[InterviewSession]:
    return _sessions.get(session_id)


def submit_answer(session_id: str, answer: str) -> tuple[InterviewSession, Verdict, str, Optional[str]]:
    session = _sessions.get(session_id)
    if not session:
        raise ValueError("Session not found")
    if session.done:
        raise ValueError("Interview already complete")

    category_eval_instruction = _category_profile(session.category)["eval_instruction"]
    eval_prompt = (
        "You are a demanding campus placement interviewer.\n"
        f"{_company_context(session.company)}\n"
        f"Interview category: {_category_profile(session.category)['label']}\n"
        f"{category_eval_instruction}\n"
        f"Question: {session.current_question}\n"
        f"Candidate answer: {answer}\n\n"
        "Determine if the answer is CORRECT, PARTIAL, or WRONG.\n"
        "Respond strictly in this format:\n"
        "SCORE: [CORRECT / PARTIAL / WRONG]\n"
        "FEEDBACK: [Brief mentor-style feedback]\n"
        "If WRONG, add: CORRECT ANSWER: [Provide the correct answer or key points]"
    )
    eval_output = query_llm_direct(eval_prompt)
    verdict = evaluate_answer_quality(eval_output)
    feedback = _extract_feedback(eval_output, verdict)

    if verdict == Verdict.CORRECT:
        session.difficulty = min(DIFFICULTY_MAX, session.difficulty + DIFFICULTY_STEP)
        direction = (
            "The candidate excelled. Ask a significantly harder "
            "question within this same category."
        )
    elif verdict == Verdict.WRONG:
        session.difficulty = max(DIFFICULTY_MIN, session.difficulty - DIFFICULTY_STEP)
        direction = (
            "The candidate struggled. Provide a subtle hint in the feedback, "
            "then ask an easier foundational question within this same category."
        )
    else:
        direction = (
            "The candidate was partially correct. Ask a related variant "
            "at the same conceptual level, within this same category."
        )

    session.history.append(
        {
            "question": session.current_question,
            "answer": answer,
            "eval": eval_output,
            "difficulty": session.difficulty,
            "verdict": verdict.value,
        }
    )

    next_question: Optional[str] = None
    if session.step >= MAX_INTERVIEW_QUESTIONS:
        session.done = True
        session.current_question = ""
    else:
        next_question = _generate_question(
            session.company,
            session.category,
            session.difficulty,
            session.job_description,
            direction=direction,
        )
        session.current_question = next_question
        session.step += 1

    return session, verdict, feedback, next_question


def generate_summary(session_id: str) -> dict:
    session = _sessions.get(session_id)
    if not session:
        raise ValueError("Session not found")
    if not session.done:
        raise ValueError("Interview not yet complete")

    history_text = "\n\n".join(
        f"Q{idx}: {item['question']}\n"
        f"A: {item['answer']}\n"
        f"Verdict: {item['verdict']}\n"
        f"Eval: {item['eval']}"
        for idx, item in enumerate(session.history, start=1)
    )

    prompt = (
        "You are an expert campus placement interview coach.\n"
        f"{_company_context(session.company)}\n"
        f"Interview category: {_category_profile(session.category)['label']}\n"
        f"Final difficulty reached: {session.difficulty}/10\n\n"
        "Based on this mock interview transcript, produce a detailed post-session report.\n"
        "Use EXACTLY this structure:\n"
        "OVERALL ASSESSMENT: [2-3 sentences]\n"
        "STRENGTHS:\n- [strength 1]\n- [strength 2]\n"
        "WEAKNESSES:\n- [weakness 1]\n- [weakness 2]\n"
        "IMPROVEMENT PLAN:\n- [action 1]\n- [action 2]\n- [action 3]\n"
        "COMPANY FIT: [2-3 sentences on readiness for this company's process]\n\n"
        f"Transcript:\n{history_text}"
    )
    report = query_llm_direct(prompt)

    def parse_list(header: str) -> list[str]:
        pattern = rf"{header}:\s*\n((?:-\s*.+\n?)+)"
        match = re.search(pattern, report, re.IGNORECASE)
        if not match:
            return []
        return [
            line.strip().lstrip("- ").strip()
            for line in match.group(1).splitlines()
            if line.strip().startswith("-")
        ]

    overall_match = re.search(r"OVERALL ASSESSMENT:\s*(.+?)(?=STRENGTHS:|$)", report, re.IGNORECASE | re.DOTALL)
    company_match = re.search(r"COMPANY FIT:\s*(.+?)$", report, re.IGNORECASE | re.DOTALL)

    history_items = [
        HistoryItem(
            question=item["question"],
            answer=item["answer"],
            eval=item["eval"],
            difficulty=item["difficulty"],
            verdict=Verdict(item["verdict"]),
        )
        for item in session.history
    ]

    return {
        "session_id": session.session_id,
        "company": session.company,
        "category": session.category,
        "final_difficulty": session.difficulty,
        "history": history_items,
        "strengths": parse_list("STRENGTHS"),
        "weaknesses": parse_list("WEAKNESSES"),
        "improvement_plan": parse_list("IMPROVEMENT PLAN"),
        "company_fit_notes": company_match.group(1).strip() if company_match else "",
        "overall_assessment": overall_match.group(1).strip() if overall_match else report,
    }