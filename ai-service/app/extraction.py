import json
import logging
import re
from typing import List, Dict, Any, Tuple
from app.schemas import (
    CVExtractionRequest, CVExtractionResponse,
    JobExtractionRequest, JobExtractionResponse,
    ExtractedSkill, SkillSource, SkillRequirement,
)
from app.config import settings
from app.normalization import normalize_skill, get_category_for_skill, SKILL_ALIASES

logger = logging.getLogger(__name__)

def _heuristic_skill_extract(text: str) -> List[Dict[str, Any]]:
    """Deterministic skill taxonomy matcher used as robust fallback or baseline."""
    found = []
    text_lower = text.lower()
    for alias, canonical in SKILL_ALIASES.items():
        pattern = r'\b' + re.escape(alias) + r'\b'
        match = re.search(pattern, text_lower)
        if match:
            start = max(0, match.start() - 50)
            end = min(len(text), match.end() + 50)
            evidence = text[start:end].replace('\n', ' ').strip()
            found.append({
                "skill_name": alias,
                "normalized_name": canonical,
                "category": get_category_for_skill(canonical),
                "evidence": evidence,
                "confidence": 0.85,
            })
    # Deduplicate by normalized name
    dedup: Dict[str, Dict[str, Any]] = {}
    for item in found:
        norm = item["normalized_name"]
        if norm not in dedup:
            dedup[norm] = item
    return list(dedup.values())

def _safe_parse_json(content: str) -> Any:
    """Parse JSON safely from raw content, stripping markdown code blocks or trailing commas."""
    content = content.strip()
    # Strip markdown fences
    if content.startswith("```"):
        lines = content.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        content = "\n".join(lines).strip()

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        # Regex search for JSON object or array
        array_match = re.search(r'\[\s*\{.*\}\s*\]', content, re.DOTALL)
        if array_match:
            try:
                return json.loads(array_match.group(0))
            except json.JSONDecodeError:
                pass
        
        obj_match = re.search(r'\{\s*".*"\s*:.*\}', content, re.DOTALL)
        if obj_match:
            try:
                return json.loads(obj_match.group(0))
            except json.JSONDecodeError:
                pass
        raise ValueError("Model output did not contain valid JSON.")

async def _extract_with_llm(text: str, extraction_type: str) -> Tuple[Any, bool]:
    """
    Extract skills via Mistral using LangChain.
    Returns (result, is_llm_used).
    """
    if not settings.MISTRAL_API_KEY or settings.MISTRAL_API_KEY == "placeholder_add_real_key":
        logger.info("Mistral API key not configured. Using taxonomy-based extraction.")
        return _heuristic_skill_extract(text), False

    try:
        from langchain_mistralai import ChatMistralAI
        from langchain_core.messages import HumanMessage, SystemMessage

        llm = ChatMistralAI(
            model=settings.MISTRAL_MODEL,
            api_key=settings.MISTRAL_API_KEY,
            temperature=0,
            max_tokens=2500,
            timeout=30,
        )

        if extraction_type == "cv":
            system_prompt = (
                "You are an expert AI recruiting assistant specializing in technical skill extraction. "
                "Analyze the provided CV text and extract all verifiable technical, professional, and domain skills. "
                "Output ONLY a valid JSON array of objects. Do not include markdown headers, explanation, or conversational text. "
                "Each object MUST contain:\n"
                "- skill_name: (string) skill name as written in text\n"
                "- normalized_name: (string) standard canonical taxonomy name (e.g., 'React.js' -> 'React')\n"
                "- category: (string) skill category (e.g., 'Frontend', 'Backend', 'Database', 'DevOps', 'Cloud', 'Programming Language', 'AI/ML', 'Architecture')\n"
                "- evidence: (string) exact sentence from the text demonstrating this skill\n"
                "- confidence: (float between 0.0 and 1.0)\n\n"
                "Rules:\n"
                "1. Only extract skills with direct supporting context in the CV.\n"
                "2. Do not invent or fabricate qualifications.\n"
                "3. Omit subjective soft skills (e.g., 'fast learner', 'hard worker').\n"
            )
            user_msg = f"Extract skills from this candidate CV:\n\n{text[:6000]}"
        else:
            system_prompt = (
                "You are an expert technical recruiter analyzing job descriptions. "
                "Extract required skills and preferred/nice-to-have skills into structured JSON. "
                "Output ONLY a valid JSON object with exactly two keys: 'required' (array of skills) and 'preferred' (array of skills). "
                "Each skill item MUST have:\n"
                "- skill_name: (string)\n"
                "- normalized_name: (string)\n"
                "- category: (string)\n"
                "- evidence: (string) quotation from job description\n"
                "- confidence: (float 0.0 to 1.0)\n"
            )
            user_msg = f"Extract requirements from this job posting:\n\n{text[:6000]}"

        messages = [SystemMessage(content=system_prompt), HumanMessage(content=user_msg)]
        response = llm.invoke(messages)
        parsed = _safe_parse_json(str(response.content))
        return parsed, True
    except Exception as e:
        logger.warning(f"Mistral LLM extraction failed or timed out: {e}. Falling back to taxonomy matcher.")
        return _heuristic_skill_extract(text), False

async def extract_cv_skills(request: CVExtractionRequest) -> CVExtractionResponse:
    """Extract and normalize candidate skills from CV text."""
    text = (request.text or "").strip()
    if len(text) < 15:
        raise ValueError("CV text is too short or empty (minimum 15 characters required).")

    raw_skills, is_llm = await _extract_with_llm(text, "cv")

    skills: List[ExtractedSkill] = []
    if isinstance(raw_skills, list):
        for item in raw_skills:
            if not isinstance(item, dict):
                continue
            raw_name = str(item.get("skill_name", "")).strip()
            if not raw_name:
                continue
            norm = normalize_skill(str(item.get("normalized_name", raw_name)))
            cat = str(item.get("category", "")).strip() or get_category_for_skill(norm)
            evidence = str(item.get("evidence", "")).strip()[:400]
            confidence = float(item.get("confidence", 0.8))

            skills.append(ExtractedSkill(
                skill_name=raw_name,
                normalized_name=norm,
                category=cat,
                evidence=evidence,
                source=SkillSource.CV,
                requirement=SkillRequirement.NEUTRAL,
                confidence=max(0.0, min(1.0, confidence)),
            ))

    method_msg = "via Mistral LLM" if is_llm else "via controlled taxonomy matcher (offline mode)"
    return CVExtractionResponse(
        success=True,
        candidate_id=request.candidate_id,
        skills=skills,
        raw_text_length=len(text),
        message=f"Extracted {len(skills)} skills {method_msg}",
    )

async def extract_job_skills(request: JobExtractionRequest) -> JobExtractionResponse:
    """Extract required and preferred skills from job posting."""
    combined_text = f"Title: {request.title}\n\nDescription: {request.description}\n\nResponsibilities: {request.responsibilities or ''}".strip()
    if len(combined_text) < 15:
        raise ValueError("Job description is too short or empty.")

    raw_data, is_llm = await _extract_with_llm(combined_text, "job")

    required_skills: List[ExtractedSkill] = []
    preferred_skills: List[ExtractedSkill] = []

    if isinstance(raw_data, dict):
        raw_req = raw_data.get("required", [])
        raw_pref = raw_data.get("preferred", [])
    elif isinstance(raw_data, list):
        # Heuristic split when taxonomy matcher returns a flat list
        raw_req = raw_data[:len(raw_data)//2 + 1]
        raw_pref = raw_data[len(raw_data)//2 + 1:]
    else:
        raw_req = []
        raw_pref = []

    for item in raw_req:
        if isinstance(item, dict) and item.get("skill_name"):
            raw_name = str(item["skill_name"]).strip()
            norm = normalize_skill(str(item.get("normalized_name", raw_name)))
            cat = str(item.get("category", "")).strip() or get_category_for_skill(norm)
            required_skills.append(ExtractedSkill(
                skill_name=raw_name,
                normalized_name=norm,
                category=cat,
                evidence=str(item.get("evidence", ""))[:400],
                source=SkillSource.JOB,
                requirement=SkillRequirement.REQUIRED,
                confidence=float(item.get("confidence", 0.8)),
            ))

    for item in raw_pref:
        if isinstance(item, dict) and item.get("skill_name"):
            raw_name = str(item["skill_name"]).strip()
            norm = normalize_skill(str(item.get("normalized_name", raw_name)))
            cat = str(item.get("category", "")).strip() or get_category_for_skill(norm)
            preferred_skills.append(ExtractedSkill(
                skill_name=raw_name,
                normalized_name=norm,
                category=cat,
                evidence=str(item.get("evidence", ""))[:400],
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
