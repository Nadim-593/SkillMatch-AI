import json
import logging
import re
from typing import List, Dict, Any
from app.schemas import (
    CVExtractionRequest, CVExtractionResponse,
    JobExtractionRequest, JobExtractionResponse,
    ExtractedSkill, SkillSource, SkillRequirement,
)
from app.config import settings
from app.normalization import normalize_skill, get_category_for_skill, SKILL_ALIASES

logger = logging.getLogger(__name__)

# Heuristic pattern extractor for fallback when LLM API key is not configured
def _heuristic_skill_extract(text: str) -> List[Dict[str, Any]]:
    found = []
    text_lower = text.lower()
    for alias, canonical in SKILL_ALIASES.items():
        pattern = r'\b' + re.escape(alias) + r'\b'
        match = re.search(pattern, text_lower)
        if match:
            start = max(0, match.start() - 40)
            end = min(len(text), match.end() + 40)
            evidence = text[start:end].replace('\n', ' ').strip()
            found.append({
                "skill_name": alias,
                "normalized_name": canonical,
                "category": get_category_for_skill(canonical),
                "evidence": evidence,
                "confidence": 0.85,
            })
    # Deduplicate by normalized_name
    dedup = {}
    for item in found:
        norm = item["normalized_name"]
        if norm not in dedup:
            dedup[norm] = item
    return list(dedup.values())

async def _extract_with_llm(text: str, extraction_type: str) -> List[dict]:
    """Use Mistral via LangChain to extract skills."""
    if not settings.MISTRAL_API_KEY or settings.MISTRAL_API_KEY == "placeholder_add_real_key":
        logger.warning("Mistral API key not configured. Using deterministic taxonomy matcher.")
        return _heuristic_skill_extract(text)
    
    try:
        from langchain_mistralai import ChatMistralAI
        from langchain_core.messages import HumanMessage, SystemMessage
        
        llm = ChatMistralAI(
            model=settings.MISTRAL_MODEL,
            api_key=settings.MISTRAL_API_KEY,
            temperature=0,
            max_tokens=2000,
        )
        
        if extraction_type == "cv":
            system_prompt = """You are a skill extraction system. Extract technical and professional skills from the CV text.
Return ONLY a valid JSON array. No explanation, no markdown.
Each item must have:
- skill_name: string (as written in text)
- normalized_name: string (canonical name, e.g. 'JS' -> 'JavaScript')
- category: string (e.g. 'Frontend', 'Backend', 'Database', 'DevOps', 'Cloud', 'Programming Language', 'AI/ML')
- evidence: string (exact quote from text)
- confidence: number between 0 and 1
Rules:
- Only extract skills with clear evidence
- Do not invent skills
- Maximum 30 skills"""
            user_msg = f"Extract skills from this CV:\n\n{text[:4000]}"
        else:
            system_prompt = """You are a job requirements extraction system. Extract required and preferred technical skills from a job posting.
Return ONLY a valid JSON object with two arrays: 'required' and 'preferred'. No markdown.
Each item must have:
- skill_name: string
- normalized_name: string
- category: string
- evidence: string
- confidence: number between 0 and 1"""
            user_msg = f"Extract skills from this job posting:\n\n{text[:4000]}"
        
        messages = [SystemMessage(content=system_prompt), HumanMessage(content=user_msg)]
        response = llm.invoke(messages)
        content = response.content.strip()
        
        if content.startswith("```"):
            lines = content.split("\n")
            content = "\n".join(lines[1:-1])
        
        parsed = json.loads(content)
        return parsed
    except Exception as e:
        logger.error(f"LLM extraction failed, using fallback: {e}")
        return _heuristic_skill_extract(text)

async def extract_cv_skills(request: CVExtractionRequest) -> CVExtractionResponse:
    """Extract skills from CV text."""
    text = request.text.strip()
    raw_skills = await _extract_with_llm(text, "cv")
    
    skills = []
    if isinstance(raw_skills, list):
        for item in raw_skills:
            raw_name = item.get("skill_name", "").strip()
            normalized = normalize_skill(item.get("normalized_name", raw_name))
            if not normalized:
                continue
            category = item.get("category") or get_category_for_skill(normalized)
            skills.append(ExtractedSkill(
                skill_name=raw_name,
                normalized_name=normalized,
                category=category,
                evidence=item.get("evidence", "")[:300],
                source=SkillSource.CV,
                requirement=SkillRequirement.NEUTRAL,
                confidence=float(item.get("confidence", 0.8)),
            ))
    
    return CVExtractionResponse(
        success=True,
        candidate_id=request.candidate_id,
        skills=skills,
        raw_text_length=len(text),
        message=f"Extracted {len(skills)} skills successfully",
    )

async def extract_job_skills(request: JobExtractionRequest) -> JobExtractionResponse:
    """Extract required and preferred skills from job description."""
    combined_text = f"{request.title}\n\n{request.description}\n\n{request.responsibilities or ''}"
    raw = await _extract_with_llm(combined_text, "job")
    
    required_skills = []
    preferred_skills = []
    
    if isinstance(raw, dict):
        raw_required = raw.get("required", [])
        raw_preferred = raw.get("preferred", [])
    elif isinstance(raw, list):
        # Fallback split
        raw_required = raw[:len(raw)//2 + 1]
        raw_preferred = raw[len(raw)//2 + 1:]
    else:
        raw_required = []
        raw_preferred = []
    
    for item in raw_required:
        raw_name = item.get("skill_name", "").strip()
        normalized = normalize_skill(item.get("normalized_name", raw_name))
        if not normalized:
            continue
        category = item.get("category") or get_category_for_skill(normalized)
        required_skills.append(ExtractedSkill(
            skill_name=raw_name,
            normalized_name=normalized,
            category=category,
            evidence=item.get("evidence", "")[:300],
            source=SkillSource.JOB,
            requirement=SkillRequirement.REQUIRED,
            confidence=float(item.get("confidence", 0.8)),
        ))
        
    for item in raw_preferred:
        raw_name = item.get("skill_name", "").strip()
        normalized = normalize_skill(item.get("normalized_name", raw_name))
        if not normalized:
            continue
        category = item.get("category") or get_category_for_skill(normalized)
        preferred_skills.append(ExtractedSkill(
            skill_name=raw_name,
            normalized_name=normalized,
            category=category,
            evidence=item.get("evidence", "")[:300],
            source=SkillSource.JOB,
            requirement=SkillRequirement.PREFERRED,
            confidence=float(item.get("confidence", 0.8)),
        ))
    
    return JobExtractionResponse(
        success=True,
        job_id=request.job_id,
        required_skills=required_skills,
        preferred_skills=preferred_skills,
        message=f"Extracted {len(required_skills)} required and {len(preferred_skills)} preferred skills",
    )
