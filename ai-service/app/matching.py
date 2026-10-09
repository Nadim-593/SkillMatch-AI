import numpy as np
import logging
from app.schemas import (
    MatchRequest, MatchResponse,
    SkillGapItem, SkillMatchStatus, SkillRequirement,
)
from app.embeddings import generate_embeddings, cosine_similarity

logger = logging.getLogger(__name__)

SKILL_OVERLAP_WEIGHT = 0.60
SEMANTIC_WEIGHT = 0.40

MATCHED_THRESHOLD = 0.80
PARTIAL_THRESHOLD = 0.55

async def calculate_match(request: MatchRequest) -> MatchResponse:
    """Calculate hybrid match score between candidate and job."""
    all_job_skills = request.job_required_skills + request.job_preferred_skills
    
    if not all_job_skills:
        return MatchResponse(
            success=True,
            candidate_id=request.candidate_id,
            job_id=request.job_id,
            overall_score=0.0,
            skill_overlap_score=0.0,
            semantic_similarity_score=0.0,
            explanation="No job requirements found to evaluate against.",
            message="No job requirements provided.",
        )
    
    candidate_skill_names = {s.normalized_name.lower() for s in request.candidate_skills}
    
    matched_skills = []
    partial_skills = []
    missing_skills = []
    
    candidate_texts = [f"{s.normalized_name} {s.evidence}" for s in request.candidate_skills] if request.candidate_skills else [""]
    job_skill_texts = [f"{s.normalized_name} {s.evidence}" for s in all_job_skills]
    
    try:
        candidate_embeddings = generate_embeddings(candidate_texts)
        job_skill_embeddings = generate_embeddings(job_skill_texts)
    except Exception as e:
        logger.error(f"Embedding error in matching: {e}")
        candidate_embeddings = None
        job_skill_embeddings = None
    
    for i, job_skill in enumerate(all_job_skills):
        job_lower = job_skill.normalized_name.lower()
        
        # 1. Exact or alias match
        if job_lower in candidate_skill_names:
            matched_skills.append(SkillGapItem(
                skill_name=job_skill.skill_name,
                normalized_name=job_skill.normalized_name,
                category=job_skill.category,
                status=SkillMatchStatus.MATCHED,
                explanation=f"Exact match: '{job_skill.normalized_name}' present in candidate CV.",
                evidence=job_skill.evidence,
                requirement=job_skill.requirement,
            ))
            continue
        
        # 2. Semantic matching against candidate skills
        best_sim = 0.0
        best_evidence = ""
        if candidate_embeddings is not None and job_skill_embeddings is not None and len(request.candidate_skills) > 0:
            job_vec = job_skill_embeddings[i]
            for j, c_skill in enumerate(request.candidate_skills):
                sim = cosine_similarity(candidate_embeddings[j], job_vec)
                if sim > best_sim:
                    best_sim = sim
                    best_evidence = c_skill.evidence or c_skill.normalized_name
        
        if best_sim >= MATCHED_THRESHOLD:
            matched_skills.append(SkillGapItem(
                skill_name=job_skill.skill_name,
                normalized_name=job_skill.normalized_name,
                category=job_skill.category,
                status=SkillMatchStatus.MATCHED,
                explanation=f"High semantic similarity ({best_sim:.2f}) with candidate skill.",
                evidence=best_evidence,
                requirement=job_skill.requirement,
            ))
        elif best_sim >= PARTIAL_THRESHOLD:
            partial_skills.append(SkillGapItem(
                skill_name=job_skill.skill_name,
                normalized_name=job_skill.normalized_name,
                category=job_skill.category,
                status=SkillMatchStatus.PARTIAL,
                explanation=f"Partial overlap ({best_sim:.2f}) with candidate profile.",
                evidence=best_evidence,
                requirement=job_skill.requirement,
            ))
        else:
            missing_skills.append(SkillGapItem(
                skill_name=job_skill.skill_name,
                normalized_name=job_skill.normalized_name,
                category=job_skill.category,
                status=SkillMatchStatus.MISSING,
                explanation=f"Missing: No verifiable evidence of '{job_skill.normalized_name}' found in candidate profile.",
                evidence="",
                requirement=job_skill.requirement,
            ))
    
    # Calculate weighted skill overlap
    req_total = len(request.job_required_skills)
    pref_total = len(request.job_preferred_skills)
    
    req_matched = sum(1 for s in matched_skills if s.requirement == SkillRequirement.REQUIRED)
    req_partial = sum(1 for s in partial_skills if s.requirement == SkillRequirement.REQUIRED)
    pref_matched = sum(1 for s in matched_skills if s.requirement == SkillRequirement.PREFERRED)
    pref_partial = sum(1 for s in partial_skills if s.requirement == SkillRequirement.PREFERRED)
    
    req_score = (req_matched + 0.5 * req_partial) / req_total if req_total > 0 else 1.0
    pref_score = (pref_matched + 0.5 * pref_partial) / pref_total if pref_total > 0 else req_score
    
    if req_total > 0 and pref_total > 0:
        overlap_score = 0.70 * req_score + 0.30 * pref_score
    elif req_total > 0:
        overlap_score = req_score
    else:
        overlap_score = pref_score
    
    skill_overlap_score = round(float(overlap_score * 100), 2)
    
    # Semantic text similarity
    semantic_sim_score = 0.0
    if request.candidate_text and request.job_text:
        try:
            texts = [request.candidate_text[:2000], request.job_text[:2000]]
            t_embeddings = generate_embeddings(texts)
            sim = cosine_similarity(t_embeddings[0], t_embeddings[1])
            semantic_sim_score = round(float(sim * 100), 2)
        except Exception as e:
            logger.warning(f"Semantic comparison failed: {e}")
    else:
        semantic_sim_score = skill_overlap_score
    
    overall_score = round(
        float(SKILL_OVERLAP_WEIGHT * skill_overlap_score + SEMANTIC_WEIGHT * semantic_sim_score),
        2
    )
    
    explanation = (
        f"Match Score: {overall_score:.1f}/100. "
        f"Skill Overlap: {skill_overlap_score:.1f}/100 ({len(matched_skills)} matched, {len(partial_skills)} partial, {len(missing_skills)} missing). "
        f"Contextual Semantic Fit: {semantic_sim_score:.1f}/100. "
        f"Weighted calculation: 60% skill requirements overlap + 40% semantic similarity."
    )
    
    return MatchResponse(
        success=True,
        candidate_id=request.candidate_id,
        job_id=request.job_id,
        overall_score=overall_score,
        skill_overlap_score=skill_overlap_score,
        semantic_similarity_score=semantic_sim_score,
        matched_skills=matched_skills,
        partial_skills=partial_skills,
        missing_skills=missing_skills,
        explanation=explanation,
        scoring_version="v1.0",
        message="Match calculation complete",
    )
