# SkillMatch AI
## AI-Based Job–Candidate Matching and Skill Gap Analysis

SkillMatch AI is a proposed academic capstone project that helps candidates understand how their CV aligns with a job description and helps recruiters review relevant candidates. It extracts skills from CVs and job descriptions, combines skill overlap with semantic similarity, and explains matched, partial, and missing skills.

> **Project status:** Academic capstone project. Features and scoring weights are proposed and must be validated during implementation and testing.

## Problem Statement
Candidates may find it difficult to identify skills missing for a role, while recruiters may spend substantial time comparing CVs with job requirements manually. SkillMatch AI aims to support these tasks through skill extraction, explainable matching, and skill-gap feedback.

## Objectives
- Extract candidate information and skills from CV files or pasted text.
- Extract required skills from job descriptions.
- Compare candidates and jobs using skill overlap and semantic similarity.
- Show matched, partially matched, and missing skills with explanations.
- Rank candidates for a job and help candidates understand skill gaps.
- Recommend learning resources from a curated collection.
- Keep match history and support PDF reports where implemented.

## Key Features

### Candidate
- Register and log in securely.
- Upload a CV in PDF or DOCX format, or provide text where supported.
- Review extracted candidate information and skills.
- Compare a profile with a job description.
- View matched, partial, and missing skills plus suggested learning resources.
- Review previous matching results and export a report where implemented.

### Recruiter
- Create, update, view, and manage job postings.
- Extract skills from job descriptions.
- View and rank candidates against a selected job.
- Review explanations behind matching results.

### Administration
- Role-based access and basic user/job management, subject to final implementation.

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React, Vite, Tailwind CSS, Axios | UI and API communication |
| Main backend | Node.js, Express.js | REST APIs and application logic |
| Authentication | JWT, bcrypt | Token-based authentication and password hashing |
| Database | MongoDB Atlas, Mongoose | Users, CV/job data, skills, and match history |
| AI service | Python, FastAPI | AI and matching endpoints |
| Language model | Mistral API, LangChain | Structured skill extraction and explanations |
| Embeddings | Sentence Transformers `all-MiniLM-L6-v2` | Local text embeddings for semantic comparison |
| Document processing | PyMuPDF, `python-docx` | PDF and DOCX text extraction |
| Data/ML utilities | NumPy, scikit-learn | Similarity and evaluation utilities |

Confirm exact package versions against the repository's dependency files before deployment.

## System Architecture

```text
Candidate / Recruiter
        |
        v
React + Vite + Tailwind CSS
        |
        v
Node.js + Express REST API
  |         |           |
  |         |           +--> JWT / bcrypt authentication
  |         +--------------> MongoDB Atlas
  +------------------------> Python FastAPI AI Service
                                  |
                                  +--> PDF / DOCX text extraction
                                  +--> Mistral API via LangChain
                                  +--> Sentence Transformers embeddings
                                  +--> Skill matching and explanations
```

The frontend should communicate with the main backend, which calls the AI service as needed. Keep API keys on the server side; never place them in frontend code.

## How Matching Works
1. Extract text from a candidate CV and a job description.
2. Identify and normalize skills in both documents.
3. Calculate a weighted skill-overlap score.
4. Generate text embeddings and calculate semantic similarity.
5. Combine the signals into a configurable match score.
6. Return matched, partial, and missing skills with explanations.
7. Optionally rank candidates and suggest learning resources.

A provisional formula discussed for the project is:

`Final Score = 0.60 × Skill Overlap + 0.40 × Semantic Similarity`

These weights are starting points, not validated results. Tune and evaluate them using suitable test cases. **A similarity score is not a probability of being hired or a guarantee of candidate quality.**

## Getting Started

The commands below are a setup guide. Adjust paths and scripts to match the actual repository.

### Prerequisites
- Node.js and npm
- Python version supported by the project's dependencies (Python 3.11 is a reasonable starting point)
- MongoDB Atlas database
- Mistral API key for LLM-based extraction/explanations
- Git

### 1. Clone the repository
```bash
git clone <YOUR_REPOSITORY_URL>
cd <YOUR_PROJECT_DIRECTORY>
```

### 2. Install and run the frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Install and run the backend
In another terminal:
```bash
cd backend
npm install
npm run dev
```
If `dev` is not defined in `package.json`, use the script provided by the project, such as `npm start`.

### 4. Set up the Python AI service
Enter the actual AI-service directory (for example, `ai-service/`):
```bash
python -m venv .venv
```

Activate it on Windows PowerShell:
```powershell
.\.venv\Scripts\Activate.ps1
```

Activate it on macOS/Linux:
```bash
source .venv/bin/activate
```

If a `requirements.txt` exists:
```bash
pip install -r requirements.txt
```

Run the service using the real module path. For example, if the entry point is `main.py`:
```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
Confirm the actual folder and module names in the repository; these are examples.

## Environment Variables

Create local `.env` files in the appropriate service directories. Use the exact names your code reads. Example backend configuration:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
AI_SERVICE_URL=http://127.0.0.1:8000
```

Example AI-service configuration:

```env
MISTRAL_API_KEY=<your-mistral-api-key>
MISTRAL_MODEL=mistral-small-latest
AI_SERVICE_HOST=127.0.0.1
AI_SERVICE_PORT=8000
MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2
LOG_LEVEL=info
```

These names are examples; check what the code actually reads. Add `.env`, virtual environments, uploaded private CVs, and secrets to `.gitignore`. You may commit a `.env.example` with placeholders only—never real credentials.

## Typical Workflow
1. Candidate registers and logs in.
2. Candidate uploads a CV or provides CV text.
3. The system extracts and stores relevant candidate information.
4. Recruiter creates a job description.
5. The AI service extracts and normalizes job skills.
6. The system generates embeddings and calculates match scores.
7. The interface displays match results and skill gaps.
8. The candidate reviews suggested learning resources; authorized users may review or export results.

The exact workflow depends on which features have been implemented.

## Suggested Project Structure

This is a suggested layout; update it to match the actual repository.

```text
SkillMatch-AI/
├── frontend/           # React + Vite + Tailwind CSS
├── backend/            # Node.js + Express API
├── ai-service/         # Python + FastAPI
├── docs/               # Proposal, diagrams, and documentation
├── .gitignore
└── README.md
```

## Security and Responsible Use
- Never commit Mistral keys, database credentials, JWT secrets, or other secrets.
- Keep CVs and personal information private; collect and retain only necessary data.
- Validate uploads, restrict accepted file types and sizes, and handle malformed documents safely.
- Apply authentication and authorization checks to protected routes.
- Use HTTPS and appropriate secret management in deployment.
- Explain matching results and let users correct inaccurate extracted information where feasible.
- Treat results as decision-support information only. Do not automatically reject or hire a person solely from an AI score.
- Test for bias and uneven performance across CV formats, languages, and candidate groups.

## Limitations and Future Work

### Initial-scope limitations
- Full Bangla CV processing may be outside the initial scope.
- Extraction quality depends on CV formatting, document quality, and the language model.
- The semantic model may miss domain-specific context.
- Scores and thresholds require evaluation; they must not be presented as calibrated hiring probabilities.
- Live job scraping, external ATS integration, voice/video interviews, and native mobile apps are outside the initial scope.

### Possible future improvements
- Better multilingual CV parsing.
- Evaluated and calibrated scoring methods.
- More transparent explanations and candidate feedback.
- Expanded learning-resource recommendations.
- External ATS integrations and carefully governed job-source integrations.

## Team and Collaboration

This is a group capstone project. Keep the README, proposal, diagrams, and other project documents in the shared team workspace or repository so all team members can access the current versions.

Before sharing files outside the team or submitting them, verify team member names and IDs, instructor details, repository links, and project scope. **Never share `.env` files, API keys, passwords, private CVs, or database credentials.** If the proposal PDF is shared with teammates or submitted through the course platform, make sure everyone uses the same final version.

### Proposed responsibilities
- **AI/ML and backend/database:** AI pipeline, matching logic, API integration, and data model.
- **Frontend and documentation:** UI, API integration, README, diagrams, and project documentation.
- **Testing and quality assurance:** test plans, functional testing, bug reports, and validation of matching results.

Confirm final names, student IDs, and responsibilities with the group before submission.

## License
No license has been specified. Add one only after the team agrees on how the project may be reused or distributed.
