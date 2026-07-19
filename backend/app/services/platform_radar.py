import io
import re
from typing import Optional

import httpx
from PyPDF2 import PdfReader

from app.schemas.ats import GitHubProfile, LeetCodeStats, LinkedInProfile

GITHUB_API = "https://api.github.com"
LEETCODE_GRAPHQL = "https://leetcode.com/graphql"
REQUEST_TIMEOUT = 15.0


def extract_github_username(input_str: str) -> str:
    """Extract GitHub username from URL or plain username."""
    input_str = input_str.strip()
    # Handle GitHub URL formats: https://github.com/username or github.com/username
    match = re.search(r'(?:https?://)?(?:www\.)?github\.com/([^/?#]+)', input_str)
    if match:
        return match.group(1)
    return input_str


def extract_leetcode_username(input_str: str) -> str:
    """Extract LeetCode username from URL or plain username."""
    input_str = input_str.strip()
    # Handle LeetCode URL formats: https://leetcode.com/u/username or leetcode.com/u/username
    match = re.search(r'(?:https?://)?(?:www\.)?leetcode\.com/(?:u/)?([^/?#]+)', input_str)
    if match:
        return match.group(1)
    return input_str


def extract_text_from_resume(file_data: bytes, file_name: str) -> str:
    name = file_name.lower()
    if name.endswith(".pdf"):
        try:
            reader = PdfReader(io.BytesIO(file_data))
            return "\n\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception:
            return ""
    try:
        return file_data.decode("utf-8", errors="ignore")
    except Exception:
        return ""


def strip_demographic_identifiers(text: str) -> str:
    header, body = text[:300], text[300:]
    header = re.sub(r"\b[A-Z][a-z]+\s[A-Z][a-z]+\b", "[CANDIDATE NAME]", header)
    return header + body


async def fetch_github_profile(username: str) -> GitHubProfile:
    username = extract_github_username(username)
    if not username:
        return GitHubProfile(
            username="",
            available=False,
            warning="No GitHub username provided.",
        )

    headers = {"Accept": "application/vnd.github+json"}
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        user_resp = await client.get(f"{GITHUB_API}/users/{username}", headers=headers)
        if user_resp.status_code == 404:
            return GitHubProfile(
                username=username,
                available=False,
                warning=f"GitHub user '{username}' not found.",
            )
        if user_resp.status_code != 200:
            return GitHubProfile(
                username=username,
                available=False,
                warning=f"GitHub API returned status {user_resp.status_code}.",
            )

        user_data = user_resp.json()
        repos_resp = await client.get(
            f"{GITHUB_API}/users/{username}/repos",
            headers=headers,
            params={"sort": "updated", "per_page": 30},
        )

    repos = repos_resp.json() if repos_resp.status_code == 200 else []
    if not isinstance(repos, list):
        repos = []

    language_counts: dict[str, int] = {}
    total_stars = 0
    repo_names: list[str] = []

    for repo in repos:
        if not isinstance(repo, dict):
            continue
        repo_names.append(repo.get("name", ""))
        total_stars += repo.get("stargazers_count", 0) or 0
        lang = repo.get("language")
        if lang:
            language_counts[lang] = language_counts.get(lang, 0) + 1

    top_languages = sorted(language_counts, key=language_counts.get, reverse=True)[:5]

    return GitHubProfile(
        username=username,
        name=user_data.get("name"),
        bio=user_data.get("bio"),
        public_repos=user_data.get("public_repos", 0) or 0,
        followers=user_data.get("followers", 0) or 0,
        top_languages=top_languages,
        total_stars=total_stars,
        repo_names=[n for n in repo_names if n][:10],
        available=True,
    )


async def fetch_leetcode_stats(username: str) -> LeetCodeStats:
    username = extract_leetcode_username(username)
    if not username:
        return LeetCodeStats(
            username="",
            available=False,
            warning="No LeetCode username provided.",
        )

    query = """
    query userPublicProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile { ranking }
        submitStatsGlobal {
          acSubmissionNum { difficulty count }
        }
      }
    }
    """
    payload = {"query": query, "variables": {"username": username}}

    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            resp = await client.post(LEETCODE_GRAPHQL, json=payload)
        if resp.status_code != 200:
            return LeetCodeStats(
                username=username,
                available=False,
                warning=f"LeetCode API returned status {resp.status_code}.",
            )

        data = resp.json()
        matched = (data.get("data") or {}).get("matchedUser")
        if not matched:
            return LeetCodeStats(
                username=username,
                available=False,
                warning=f"LeetCode user '{username}' not found.",
            )

        counts = {item["difficulty"]: item["count"] for item in matched.get("submitStatsGlobal", {}).get("acSubmissionNum", [])}
        easy = counts.get("Easy", 0)
        medium = counts.get("Medium", 0)
        hard = counts.get("Hard", 0)
        ranking = (matched.get("profile") or {}).get("ranking")

        return LeetCodeStats(
            username=username,
            total_solved=easy + medium + hard,
            easy_solved=easy,
            medium_solved=medium,
            hard_solved=hard,
            ranking=ranking,
            available=True,
        )
    except Exception as exc:
        return LeetCodeStats(
            username=username,
            available=False,
            warning=f"LeetCode fetch failed: {exc}",
        )


def parse_linkedin_text(text: str) -> LinkedInProfile:
    text = text.strip()
    if not text:
        return LinkedInProfile(
            available=False,
            warning="No LinkedIn profile text provided.",
        )

    lines = [line.strip() for line in text.splitlines() if line.strip()]
    headline = lines[0] if lines else None
    summary = "\n".join(lines[1:6]) if len(lines) > 1 else text[:500]

    skill_patterns = re.findall(
        r"\b(?:Python|Java|JavaScript|TypeScript|React|Node|SQL|AWS|Azure|Docker|Kubernetes|"
        r"C\+\+|C#|Go|Rust|Machine Learning|Data Science|Spring|Angular|Vue|DevOps|Agile|Scrum)\b",
        text,
        re.IGNORECASE,
    )
    skills = list(dict.fromkeys(s.title() for s in skill_patterns))[:15]

    experience_snippet = None
    exp_match = re.search(
        r"(experience|work history|employment)(.{0,800})",
        text,
        re.IGNORECASE | re.DOTALL,
    )
    if exp_match:
        experience_snippet = exp_match.group(0)[:800]

    return LinkedInProfile(
        headline=headline,
        summary=summary,
        experience_snippet=experience_snippet,
        skills=skills,
        available=True,
    )


def format_github_summary(profile: GitHubProfile) -> str:
    if not profile.available:
        return profile.warning or "GitHub data unavailable."
    langs = ", ".join(profile.top_languages) if profile.top_languages else "none detected"
    repos = ", ".join(profile.repo_names[:5]) if profile.repo_names else "none listed"
    return (
        f"User {profile.username}: {profile.public_repos} public repos, "
        f"{profile.total_stars} total stars, {profile.followers} followers. "
        f"Top languages: {langs}. Recent repos: {repos}."
    )


def format_leetcode_summary(stats: LeetCodeStats) -> str:
    if not stats.available:
        return stats.warning or "LeetCode data unavailable."
    rank = stats.ranking if stats.ranking else "N/A"
    return (
        f"User {stats.username}: {stats.total_solved} problems solved "
        f"(Easy {stats.easy_solved}, Medium {stats.medium_solved}, Hard {stats.hard_solved}). "
        f"Ranking: {rank}."
    )


def format_linkedin_summary(profile: LinkedInProfile) -> str:
    if not profile.available:
        return profile.warning or "LinkedIn data unavailable."
    skills = ", ".join(profile.skills) if profile.skills else "none extracted"
    headline = profile.headline or "No headline"
    return f"Headline: {headline}. Skills detected: {skills}."
