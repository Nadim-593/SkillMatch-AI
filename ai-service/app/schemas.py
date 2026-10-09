from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum

class SkillSource(str, Enum):
    CV = "cv"
    JOB = "job"

class SkillRequirement(str, Enum):
    REQUIRED = "required"
    PREFERRED = "preferred"
    NEUTRAL = "neutral"

class ExtractedSkill(BaseModel):
    skill_name: str = Field(..., description="Raw skill name from source")
    normalized_name: str = Field(..., description="Normalized taxonomy name")
    category: str = Field(default="General", description="Skill category")
    evidence: str = Field(default="", description="Source text evidence")
    source: SkillSource = SkillSource.CV
    requirement: SkillRequirement = SkillRequirement.NEUTRAL
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)

class CVExtractionRequest(BaseModel):
    text: str = Field(..., min_length=10, description="CV text content")
    candidate_id: Optional[str] = None

class CVExtractionResponse(BaseModel):
    success: bool
    candidate_id: Optional[str] = None
    skills: List[ExtractedSkill] = []
    raw_text_length: int = 0
    message: str = ""

class JobExtractionRequest(BaseModel):
    title: str
    description: str
    responsibilities: Optional[str] = ""
    job_id: Optional[str] = None

class JobExtractionResponse(BaseModel):
    success: bool
    job_id: Optional[str] = None
    required_skills: List[ExtractedSkill] = []
    preferred_skills: List[ExtractedSkill] = []
    message: str = ""

class EmbeddingRequest(BaseModel):
    texts: List[str] = Field(..., min_length=1)

class EmbeddingResponse(BaseModel):
    success: bool
    embeddings: List[List[float]] = []
    model: str = ""
    dimensions: int = 0

class MatchRequest(BaseModel):
    candidate_id: str
    job_id: str
    candidate_skills: List[ExtractedSkill] = []
    job_required_skills: List[ExtractedSkill] = []
    job_preferred_skills: List[ExtractedSkill] = []
    candidate_text: str = ""
    job_text: str = ""

class SkillMatchStatus(str, Enum):
    MATCHED = "matched"
    PARTIAL = "partial"
    MISSING = "missing"

class SkillGapItem(BaseModel):
    skill_name: str
    normalized_name: str
    category: str
    status: SkillMatchStatus
    explanation: str
    evidence: str = ""
    requirement: SkillRequirement

class MatchResponse(BaseModel):
    success: bool
    candidate_id: str
    job_id: str
    overall_score: float = Field(ge=0.0, le=100.0)
    skill_overlap_score: float = Field(ge=0.0, le=100.0)
    semantic_similarity_score: float = Field(ge=0.0, le=100.0)
    matched_skills: List[SkillGapItem] = []
    partial_skills: List[SkillGapItem] = []
    missing_skills: List[SkillGapItem] = []
    explanation: str = ""
    scoring_version: str = "v1.0"
    message: str = ""

class HealthResponse(BaseModel):
    service: str
    status: str
    version: str
    model_loaded: bool
    mistral_configured: bool
    timestamp: str

class DocumentExtractResponse(BaseModel):
    success: bool
    filename: str
    extracted_text: str = ""
    character_count: int = 0
    message: str = ""
