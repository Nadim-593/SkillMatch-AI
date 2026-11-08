# SkillMatch AI — Architecture

## Overview
Three-tier architecture:
1. **React Frontend** (Vite) — port 5173
2. **Express Backend** (Node.js) — port 5000
3. **FastAPI AI Service** (Python) — port 8000

## Data Flow
```
User Browser
  └─► React Frontend (Vite, port 5173)
        └─► Express REST API (port 5000)
              ├─► MongoDB Atlas (database)
              └─► Python FastAPI AI Service (port 8000)
                    ├─► Mistral API (LLM extraction)
                    └─► Sentence Transformers (local embeddings)
```

## Scoring Formula
```
Final Score = 0.60 × Skill Overlap Score + 0.40 × Semantic Similarity Score
```
Both component scores are on a 0–100 scale before combination.

Skill Overlap sub-weights:
- Required skills: 70%
- Preferred skills: 30%
- Partial match counts as 0.5 of a full match

## Skill Classification Thresholds
- Matched: semantic similarity ≥ 0.80 OR direct name match
- Partially Matched: 0.55 ≤ similarity < 0.80
- Missing: similarity < 0.55
