import logging
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

from app.config import settings
from app.schemas import (
    HealthResponse, EmbeddingRequest, EmbeddingResponse,
    CVExtractionRequest, CVExtractionResponse,
    JobExtractionRequest, JobExtractionResponse,
    MatchRequest, MatchResponse,
)
from app.embeddings import get_model, generate_embeddings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting SkillMatch AI service...")
    settings.validate()
    try:
        get_model()
    except Exception as e:
        logger.warning(f"Embedding model preload notice: {e}")
    yield
    logger.info("SkillMatch AI service stopped.")

app = FastAPI(
    title="SkillMatch AI Service",
    description="Microservice for skill extraction, embeddings, and matching algorithms",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://127.0.0.1:5000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def verify_internal_key(x_api_key: Optional[str] = Header(None)):
    if settings.AI_SERVICE_API_KEY and x_api_key and x_api_key != settings.AI_SERVICE_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return True

@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    from app.embeddings import _model
    return HealthResponse(
        service="SkillMatch AI Service",
        status="healthy",
        version="1.0.0",
        model_loaded=_model is not None,
        mistral_configured=bool(settings.MISTRAL_API_KEY and settings.MISTRAL_API_KEY != "placeholder_add_real_key"),
        timestamp=datetime.now(timezone.utc).isoformat(),
    )

@app.post("/api/v1/embeddings", response_model=EmbeddingResponse, tags=["Embeddings"])
async def create_embeddings(
    request: EmbeddingRequest,
    _: bool = Depends(verify_internal_key),
):
    try:
        if not request.texts:
            raise HTTPException(status_code=400, detail="texts list cannot be empty")
        embeddings = generate_embeddings(request.texts)
        return EmbeddingResponse(
            success=True,
            embeddings=embeddings.tolist(),
            model=settings.MODEL_NAME,
            dimensions=embeddings.shape[1] if len(embeddings.shape) > 1 else len(embeddings[0]),
        )
    except Exception as e:
        logger.error(f"Embedding error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/extract/cv", response_model=CVExtractionResponse, tags=["Extraction"])
async def extract_cv(
    request: CVExtractionRequest,
    _: bool = Depends(verify_internal_key),
):
    from app.extraction import extract_cv_skills
    return await extract_cv_skills(request)

@app.post("/api/v1/extract/job", response_model=JobExtractionResponse, tags=["Extraction"])
async def extract_job(
    request: JobExtractionRequest,
    _: bool = Depends(verify_internal_key),
):
    from app.extraction import extract_job_skills
    return await extract_job_skills(request)

@app.post("/api/v1/match", response_model=MatchResponse, tags=["Matching"])
async def match_candidate_job(
    request: MatchRequest,
    _: bool = Depends(verify_internal_key),
):
    from app.matching import calculate_match
    return await calculate_match(request)
