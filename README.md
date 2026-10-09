# SkillMatch AI — Full-Stack AI-Powered Job–Candidate Matching & Skill Gap Analysis Platform

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18%2B-blue?logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-v0.115%2B-teal?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11%2B-blue?logo=python)](https://python.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20Local-green?logo=mongodb)](https://www.mongodb.com/)
[![PyTorch](https://img.shields.io/badge/PyTorch-Sentence%20Transformers-orange?logo=pytorch)](https://sbert.net/)
[![License](https://img.shields.io/badge/License-MIT-lightgrey.svg)](LICENSE)

**SkillMatch AI** is an academic capstone platform designed to bridge the gap between job seekers and hiring teams. It combines modern full-stack web engineering with local open-weight dense embedding models and large language model (LLM) extraction to deliver explainable, evidence-based job compatibility scoring, granular skill-gap diagnosis, and curated learning resource pathways.

> **Responsible AI Notice**: SkillMatch AI is designed strictly as a **decision-support tool**. It provides transparent, explainable recommendations and **never** makes automated hiring, selection, or rejection decisions.

---

## Table of Contents
1. [Key Features](#key-features)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Matching & Scoring Methodology](#matching--scoring-methodology)
6. [Prerequisites](#prerequisites)
7. [Environment Configuration](#environment-configuration)
8. [Installation & Setup](#installation--setup)
   - [1. AI Microservice Setup](#1-ai-microservice-setup-python--fastapi)
   - [2. Backend Setup](#2-backend-setup-nodejs--express)
   - [3. Frontend Setup](#3-frontend-setup-react--vite)
9. [API Documentation](#api-documentation)
10. [Automated Testing & Verification](#automated-testing--verification)
11. [Troubleshooting & FAQ](#troubleshooting--faq)
12. [License & Acknowledgments](#license--acknowledgments)

---

## Key Features

### 👤 For Candidates
* **Multi-Format CV Ingestion**: Upload resumes in PDF or DOCX format with size and mime-type security validation, or submit CV text directly.
* **Intelligent Skill Extraction**: Identifies technical skills, tools, and methodologies with verifiable in-text evidence quotes.
* **Interactive Skill Confirmation**: Candidate-in-the-loop review interface allowing users to adjust, add, or delete skills and proficiency levels before matching.
* **Ranked Position Compatibility**: Browse open job requisitions ranked by overall compatibility from 0–100%.
* **Skill-Gap Diagnosis**: Visual breakdown of **Matched**, **Partially Matched**, and **Missing** skills.
* **Curated Learning Recommendations**: Verified, free learning pathways (documentation, tutorials, courses) retrieved directly from MongoDB to close identified gaps—**zero LLM hallucination**.
* **Downloadable Match Reports**: Instant server-side PDF report generation summarizing compatibility metrics and learning roadmaps.

### 🏢 For Recruiters
* **Requisition Management**: Full CRUD capabilities for job descriptions with custom required vs. preferred skill weighting.
* **Automated Job Skill Extraction**: Automated parsing of responsibilities and skill prerequisites.
* **Ranked Applicant Pipelines**: View candidates ranked against open roles with transparent metric breakdowns.
* **Data Privacy & Ownership**: Strict role-based access control (RBAC) ensuring recruiters can only inspect applicant pipelines for positions they own.

### 🛡️ For Administrators & System Safety
* **Role-Based Access Control**: Strict candidate, recruiter, and admin authorization backed by bcrypt-hashed passwords and signed JWT tokens.
* **Taxonomy Normalization**: Canonical normalization covering 45+ industry standard skill aliases (e.g., `k8s` → `Kubernetes`, `js` → `JavaScript`).
* **Zero Fabrication Guarantee**: Transparent, deterministic mathematical formula combining weighted skill overlap and cosine semantic similarity.

---

## System Architecture

```text
                               +----------------------------+
                               |     User Browser (SPA)     |
                               |    React + Vite + Tailwind |
                               +--------------+-------------+
                                              |
                                              | HTTP REST (JSON / Multipart)
                                              v
                               +----------------------------+
                               |    Main Express Backend    |
                               |  Port 5000 (Auth, RBAC,    |
                               |  Business Logic, PDFKit)   |
                               +-------+------------+-------+
                                       |            |
                     Mongoose / Queries|            | Internal HTTP REST (API Key)
                                       v            v
           +-----------------------------+   +------------------------------------+
           |       MongoDB Atlas /       |   |       Python FastAPI Service       |
           |     Local DB (Port 27017)   |   |        Port 8000 (AI Logic)        |
           |                             |   +------------------+-----------------+
           | - Users & Auth Credentials  |                      |
           | - Candidate Profiles & CVs  |       +--------------+--------------+
           | - Job Postings & Skills     |       |                             |
           | - Curated Learning Seeds    |       v                             v
           | - Persisted Match Results   |  +-------------------+    +-------------------+
           +-----------------------------+  |  Local Embeddings |    |    Mistral AI     |
                                            |  all-MiniLM-L6-v2 |    | (LangChain Structured|
                                            | (384-d PyTorch)   |    |    Extraction)    |
                                            +-------------------+    +-------------------+
```

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Axios, Lucide React, React Hot Toast |
| **Backend** | Node.js (v20+), Express.js, MongoDB / Mongoose, JWT, bcryptjs, Multer, PDFKit, Morgan, Helmet |
| **AI Microservice** | Python 3.11+, FastAPI, Uvicorn, Pydantic v2, PyMuPDF (fitz), python-docx |
| **Embeddings & NLP**| Sentence Transformers (`all-MiniLM-L6-v2`), PyTorch, NumPy, Scikit-learn |
| **LLM Orchestration**| LangChain, Mistral AI (`mistral-small-latest`) |
| **Testing** | Jest, Supertest (Express - 49 tests) & Pytest, HTTPX (FastAPI - 19 tests) |

---

## Project Structure

```text
SkillMatch-AI/
├── ai-service/                   # Python FastAPI AI microservice
│   ├── app/
│   │   ├── config.py             # Environment settings & service configuration
│   │   ├── document_parser.py    # PyMuPDF and python-docx text extractors
│   │   ├── embeddings.py         # all-MiniLM-L6-v2 Sentence Transformers loader
│   │   ├── extraction.py         # Mistral LangChain extraction & heuristics
│   │   ├── matching.py           # Hybrid scoring & cosine similarity engine
│   │   ├── normalization.py      # Skill alias taxonomy resolver (45+ aliases)
│   │   ├── schemas.py            # Pydantic request & response models
│   │   └── main.py               # FastAPI application & route declarations
│   ├── tests/                    # Pytest test suite (19 tests)
│   └── requirements.txt          # Python dependencies
│
├── backend/                      # Node.js Express REST API
│   ├── src/
│   │   ├── config/               # Database connection & learning resource seeders
│   │   ├── controllers/          # Auth, CV, Candidate, Job, and Match controllers
│   │   ├── middleware/           # JWT authentication, RBAC, Multer upload, errors
│   │   ├── models/               # Mongoose schemas (User, Job, Profile, MatchResult)
│   │   ├── routes/               # Express route definitions
│   │   ├── services/             # Axios client communicating with FastAPI
│   │   ├── utils/                # Server-side PDFKit report generator
│   │   └── server.js             # Express entry point
│   ├── tests/                    # Jest test suite (49 tests)
│   └── package.json
│
├── frontend/                     # React + Vite Single Page Application
│   ├── src/
│   │   ├── components/           # Reusable UI widgets & page headers
│   │   ├── contexts/             # AuthContext (JWT session state)
│   │   ├── layouts/              # AppLayout (Sidebar/Navbar) & AuthLayout
│   │   ├── pages/                # Candidate, Recruiter, Auth, and Landing views
│   │   ├── routes/               # ProtectedRoute & role guards
│   │   ├── services/             # Axios API services (auth, cv, match)
│   │   ├── App.jsx               # Main application routing
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
│
└── docs/                         # Specifications & Methodology
    ├── architecture.md           # Architecture diagrams & component flows
    └── scoring-formula.md        # Mathematical scoring formulations & proofs
```

---

## Matching & Scoring Methodology

SkillMatch AI calculates a transparent, deterministic **Hybrid Fit Score** from 0 to 100:

$$\text{Final Fit Score} = 0.60 \times \text{Skill Overlap Score} + 0.40 \times \text{Semantic Similarity Score}$$

### 1. Weighted Skill Overlap (60% Weight)
* **Required Skills**: 70% of the overlap score.
* **Preferred Skills**: 30% of the overlap score.
* **Credit per Skill**:
  - **Matched (1.0 Credit)**: Exact canonical taxonomy match OR $\text{CosineSim} \ge 0.80$.
  - **Partially Matched (0.5 Credit)**: Transferable knowledge ($0.55 \le \text{CosineSim} < 0.80$).
  - **Missing (0.0 Credit)**: No verifiable evidence found ($\text{CosineSim} < 0.55$).

### 2. Contextual Semantic Similarity (40% Weight)
* Evaluates the contextual alignment between the candidate background and the job requirements using dense embeddings:
  $$\vec{u} = \text{Embed}(\text{Candidate Context}), \quad \vec{v} = \text{Embed}(\text{Job Description})$$
* Because vectors are $L_2$ unit-normalized:
  $$\text{CosineSim}(\vec{u}, \vec{v}) = \vec{u} \cdot \vec{v}$$
* Mapped directly to a 0–100 scale: $\text{Semantic Score} = \max(0.0, \min(1.0, \text{CosineSim})) \times 100$.

For full mathematical proofs, refer to [`docs/scoring-formula.md`](docs/scoring-formula.md).

---

## Prerequisites

Before starting, ensure you have the following installed:
* **Node.js**: v20.x or v22.x+ (includes `npm`)
* **Python**: v3.11.x (recommended) or v3.12.x
* **MongoDB**: A running local MongoDB instance on port 27017 or a MongoDB Atlas connection URI.
* **Git**: Installed and configured.

---

## Environment Configuration

### 1. AI Microservice (`ai-service/.env`)
Create `ai-service/.env` by copying from `ai-service/.env.example`:
```env
MISTRAL_API_KEY=your_mistral_api_key_here
MISTRAL_MODEL=mistral-small-latest
AI_SERVICE_API_KEY=internal_dev_key
AI_SERVICE_PORT=8000
AI_SERVICE_HOST=127.0.0.1
MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2
LOG_LEVEL=info
```
> *Note*: If `MISTRAL_API_KEY` is not provided, the service automatically engages an offline heuristic skill extractor so development never blocks.

### 2. Express Backend (`backend/.env`)
Create `backend/.env` by copying from `backend/.env.example`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/skillmatch
JWT_SECRET=dev_secret_key_change_in_production_skillmatch_32char
JWT_EXPIRES_IN=7d
AI_SERVICE_URL=http://127.0.0.1:8000
AI_SERVICE_API_KEY=internal_dev_key
CLIENT_URL=http://localhost:5173
NODE_ENV=development
MAX_FILE_SIZE_MB=10
UPLOAD_PATH=./uploads
```

---

## Installation & Setup

### 1. AI Microservice Setup (Python / FastAPI)
Open a terminal in the project root:
```bash
cd ai-service

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# Linux / macOS:
source .venv/bin/activate

# Install required dependencies
pip install -r requirements.txt

# Start the FastAPI service
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Health check verification*: Open `http://127.0.0.1:8000/health`.

---

### 2. Backend Setup (Node.js / Express)
Open a second terminal window:
```bash
cd backend

# Install dependencies
npm install

# Start the Express server
npm run dev
```
*Health check verification*: Open `http://127.0.0.1:5000/api/v1/health`.  
*Database Seeding*: On initial boot, the backend automatically seeds verified learning resources for skills such as Docker, Kubernetes, React, Python, AWS, and PostgreSQL.

---

### 3. Frontend Setup (React / Vite)
Open a third terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
*Application Access*: Open [http://localhost:5173](http://localhost:5173) in your web browser.

---

## API Documentation

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Register a candidate or recruiter account |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user and receive JWT token |
| `GET` | `/api/v1/auth/me` | Private | Retrieve authenticated user profile |

### CV Upload & Extraction (`/api/v1/cvs`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/cvs/upload` | Candidate | Upload PDF or DOCX file (Multer 10MB limit) |
| `POST` | `/api/v1/cvs/manual-text` | Candidate | Submit raw CV text for skill extraction |
| `GET` | `/api/v1/cvs/my-cv` | Candidate | Retrieve current CV metadata & extracted skills |

### Candidate Profile & Skills (`/api/v1/candidates`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/candidates/profile` | Candidate | Get profile information and confirmed skills |
| `PUT` | `/api/v1/candidates/profile/skills` | Candidate | Review and confirm skill inventory |

### Job Management (`/api/v1/jobs`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/jobs` | Recruiter, Admin | Create a new job description with requirements |
| `GET` | `/api/v1/jobs` | Public | List open job postings (supports query filters) |
| `GET` | `/api/v1/jobs/:id` | Public | Retrieve detailed job posting |
| `PUT` | `/api/v1/jobs/:id` | Recruiter (Owner) | Update job specifications |
| `DELETE` | `/api/v1/jobs/:id` | Recruiter (Owner) | Remove job posting |

### Matching & Reports (`/api/v1/matches`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/matches/calculate` | Private | Compute candidate-job compatibility score |
| `GET` | `/api/v1/matches/ranked-jobs` | Candidate | Get all open jobs ranked by fit score |
| `GET` | `/api/v1/matches/ranked-candidates/:jobId` | Recruiter (Owner) | Get ranked candidate pipeline for job |
| `GET` | `/api/v1/matches/:id` | Owner / Admin | Retrieve full match diagnostics & learning paths |
| `GET` | `/api/v1/matches/:id/pdf` | Owner / Admin | Stream generated PDF report |
| `GET` | `/api/v1/matches/history` | Candidate | Review past match calculations |

---

## Automated Testing & Verification

The project includes unit, integration, and end-to-end audit test suites across all components:

### 1. AI Service Unit Tests (Pytest)
Validates document parsing (PDF/DOCX), Mistral parsing fallbacks, taxonomy normalization, and deterministic cosine similarity.
```bash
cd ai-service
.\.venv\Scripts\pytest tests/ -v
```
*Result*: **19 passing tests** (0 failures).

### 2. Express Backend Integration Tests (Jest)
Validates auth routes, bcrypt hashing, JWT issuance, RBAC, Multer upload validation, job CRUD, match calculations, ownership permissions, and PDF streams.
```bash
cd backend
npm test
```
*Result*: **5 test suites, 49 passing tests** (0 failures).

### 3. Frontend Production Build Check
```bash
cd frontend
npm run build
```
*Result*: Builds successfully with Vite (0 errors).

---

## Troubleshooting & FAQ

**Q: The AI microservice fails to download the Sentence Transformers model.**  
*A*: On initial startup, `all-MiniLM-L6-v2` (~90MB) is downloaded and cached in `~/.cache/huggingface/hub`. Ensure an active internet connection on first boot. If offline, the built-in deterministic hash vector fallback will engage automatically.

**Q: Can I use MongoDB Atlas instead of a local database?**  
*A*: Yes. Replace `MONGODB_URI` in `backend/.env` with your MongoDB Atlas cluster connection string:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/skillmatch?retryWrites=true&w=majority
```

**Q: Why does the CV extraction still return skills without a Mistral API key?**  
*A*: SkillMatch AI is built defensively. If `MISTRAL_API_KEY` is absent or encounters network limits, the service triggers a local rule-based heuristic extractor matching against the controlled taxonomy to ensure zero downtime.

---

## License & Acknowledgments

* **License**: Released under the [MIT License](LICENSE).
* **Project Type**: Academic Capstone Project — Software Engineering & Applied Machine Learning.
* **Libraries & Models**:
  - Sentence Transformers (`all-MiniLM-L6-v2`) by UKPLab / Hugging Face.
  - LangChain & Mistral AI for structured document extraction.
  - PyMuPDF (`fitz`) and PDFKit for document processing.
