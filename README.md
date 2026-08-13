# Flash — Interview & Talent Hub

Full-stack student career prep platform: **ATS profile scoring** (resume + GitHub + LeetCode + LinkedIn) and **adaptive company-specific mock interviews** powered by Google Gemini.

## Stack

| Layer | Tech |
|-------|------|
| Backend | FastAPI, LlamaIndex, Google GenAI (`gemini-2.5-flash`, `gemini-embedding-001`) |
| Frontend | Next.js 16, TypeScript, Tailwind CSS 4 |

## Prerequisites

- Python 3.11+
- Node.js 20+
- A [Google Gemini API key](https://aistudio.google.com/apikey)

## Local setup

### 1. Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=your_key_here

uvicorn app.main:app --reload --port 8000
```

Verify: `curl http://localhost:8000/health` → `{"status":"ok"}`

### 2. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local

npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features

### ATS Profile Radar
- Upload resume (PDF/TXT)
- Fetch GitHub and LeetCode stats by username
- Paste LinkedIn profile text for professional signal scoring
- Optional job description for targeted gap analysis
- Returns rubric breakdown, platform signals, gaps, and learning roadmap

### Adaptive Mock Interview
- Company modes: TCS, CTS, Infosys, Deloitte, Wipro, Zoho, Capgemini, Any Company
- 3 adaptive questions with difficulty scaling (1–10)
- Per-answer verdict (CORRECT / PARTIAL / WRONG) with mentor feedback
- Post-session report: strengths, weaknesses, improvement plan, company fit notes

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/api/ats/score` | Multipart ATS scoring |
| POST | `/api/interview/sessions` | Start interview session |
| POST | `/api/interview/sessions/{id}/answer` | Submit answer |
| GET | `/api/interview/sessions/{id}/summary` | Post-interview report |

## Environment variables

**Backend** (`backend/.env`):

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key (required) |
| `CORS_ORIGINS` | Comma-separated allowed origins (default: `http://localhost:3000`) |

**Frontend** (`frontend/.env.local`):

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend URL (default: `http://localhost:8000`) |

## Project structure

```
flash/
├── backend/
│   └── app/
│       ├── api/          # FastAPI routers
│       ├── schemas/      # Pydantic models
│       ├── services/     # Gemini, platform radar, interview orchestrator
│       ├── config.py
│       └── main.py
└── frontend/
    └── src/
        ├── app/          # Next.js pages
        ├── components/   # AtsRadar, InterviewSimulator
        └── services/     # API client
```

## Notes

- **LinkedIn**: No stable public API — paste profile text for best results.
- **LeetCode**: Uses the public GraphQL endpoint; may rate-limit or change without notice.
- **Interview sessions**: Stored in-memory on the backend; sessions are lost on server restart.
- **API costs**: Each ATS run and interview session makes multiple Gemini API calls.

## License

MIT
# FLASH - AI Interview and Talent Hub

Visit the technical Blog by following the link below:
https://medium.com/@ranil8825985792/about-my-project-flash-cbc7da424648?postPublishedType=initial
