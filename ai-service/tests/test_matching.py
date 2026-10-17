import asyncio
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.schemas import MatchRequest, ExtractedSkill, SkillSource, SkillRequirement
from app.matching import calculate_match, cosine_similarity
import numpy as np

client = TestClient(app)

def test_perfect_skill_match():
    request = MatchRequest(
        candidate_id="cand123",
        job_id="job123",
        candidate_skills=[
            ExtractedSkill(
                skill_name="React",
                normalized_name="React",
                category="Frontend",
                evidence="5 years React",
                source=SkillSource.CV,
                requirement=SkillRequirement.NEUTRAL,
                confidence=1.0,
            ),
            ExtractedSkill(
                skill_name="Node.js",
                normalized_name="Node.js",
                category="Backend",
                evidence="4 years Node.js",
                source=SkillSource.CV,
                requirement=SkillRequirement.NEUTRAL,
                confidence=1.0,
            ),
        ],
        job_required_skills=[
            ExtractedSkill(
                skill_name="React",
                normalized_name="React",
                category="Frontend",
                evidence="Requires React",
                source=SkillSource.JOB,
                requirement=SkillRequirement.REQUIRED,
                confidence=1.0,
            )
        ],
        job_preferred_skills=[
            ExtractedSkill(
                skill_name="Node.js",
                normalized_name="Node.js",
                category="Backend",
                evidence="Prefers Node.js",
                source=SkillSource.JOB,
                requirement=SkillRequirement.PREFERRED,
                confidence=1.0,
            )
        ],
        candidate_text="Senior React and Node.js fullstack developer",
        job_text="Looking for a React and Node.js fullstack engineer",
    )

    response = asyncio.run(calculate_match(request))
    assert response.success is True
    assert response.skill_overlap_score == 100.0
    assert len(response.matched_skills) == 2
    assert len(response.missing_skills) == 0
    assert len(response.partial_skills) == 0
    assert response.overall_score >= 80.0  # High overall fit

def test_zero_match_disjoint():
    request = MatchRequest(
        candidate_id="cand_disjoint",
        job_id="job_disjoint",
        candidate_skills=[
            ExtractedSkill(
                skill_name="Graphic Design",
                normalized_name="Graphic Design",
                category="Design",
                evidence="Photoshop flyer design",
                source=SkillSource.CV,
                requirement=SkillRequirement.NEUTRAL,
                confidence=0.9,
            )
        ],
        job_required_skills=[
            ExtractedSkill(
                skill_name="Kubernetes",
                normalized_name="Kubernetes",
                category="DevOps",
                evidence="Cluster administration",
                source=SkillSource.JOB,
                requirement=SkillRequirement.REQUIRED,
                confidence=1.0,
            )
        ],
        job_preferred_skills=[],
        candidate_text="Graphic designer specialized in marketing posters",
        job_text="DevOps engineer needed for Kubernetes infrastructure",
    )

    response = asyncio.run(calculate_match(request))
    assert response.success is True
    assert response.skill_overlap_score == 0.0
    assert len(response.missing_skills) == 1
    assert response.missing_skills[0].normalized_name == "Kubernetes"
    assert len(response.matched_skills) == 0

def test_weighted_overlap_calculation():
    # 2 required skills (1 matched, 1 missing) -> req_score = 50%
    # 1 preferred skill (matched) -> pref_score = 100%
    # Expected overlap = 0.70 * 50 + 0.30 * 100 = 35 + 30 = 65%
    request = MatchRequest(
        candidate_id="cand_weighted",
        job_id="job_weighted",
        candidate_skills=[
            ExtractedSkill(
                skill_name="Python",
                normalized_name="Python",
                category="Programming Language",
                evidence="Python script developer",
                source=SkillSource.CV,
                requirement=SkillRequirement.NEUTRAL,
                confidence=1.0,
            ),
            ExtractedSkill(
                skill_name="Docker",
                normalized_name="Docker",
                category="DevOps",
                evidence="Docker containerization",
                source=SkillSource.CV,
                requirement=SkillRequirement.NEUTRAL,
                confidence=1.0,
            ),
        ],
        job_required_skills=[
            ExtractedSkill(
                skill_name="Python",
                normalized_name="Python",
                category="Programming Language",
                evidence="Python required",
                source=SkillSource.JOB,
                requirement=SkillRequirement.REQUIRED,
                confidence=1.0,
            ),
            ExtractedSkill(
                skill_name="Rust",
                normalized_name="Rust",
                category="Programming Language",
                evidence="Rust required",
                source=SkillSource.JOB,
                requirement=SkillRequirement.REQUIRED,
                confidence=1.0,
            ),
        ],
        job_preferred_skills=[
            ExtractedSkill(
                skill_name="Docker",
                normalized_name="Docker",
                category="DevOps",
                evidence="Docker preferred",
                source=SkillSource.JOB,
                requirement=SkillRequirement.PREFERRED,
                confidence=1.0,
            )
        ],
        candidate_text="Python and Docker developer",
        job_text="Python, Rust, and Docker backend engineer",
    )

    response = asyncio.run(calculate_match(request))
    assert response.success is True
    assert response.skill_overlap_score == 65.0
    assert len(response.matched_skills) == 2
    assert len(response.missing_skills) == 1
    assert response.missing_skills[0].normalized_name == "Rust"

def test_cosine_similarity_properties():
    vec_a = np.array([1.0, 0.0, 0.0], dtype=np.float32)
    vec_b = np.array([1.0, 0.0, 0.0], dtype=np.float32)
    vec_c = np.array([0.0, 1.0, 0.0], dtype=np.float32)

    assert abs(cosine_similarity(vec_a, vec_b) - 1.0) < 1e-6
    assert abs(cosine_similarity(vec_a, vec_c) - 0.0) < 1e-6

def test_api_match_endpoint():
    payload = {
        "candidate_id": "test_c1",
        "job_id": "test_j1",
        "candidate_skills": [
            {
                "skill_name": "FastAPI",
                "normalized_name": "FastAPI",
                "category": "Backend",
                "evidence": "Built APIs in FastAPI",
                "source": "cv",
                "requirement": "neutral",
                "confidence": 0.9,
            }
        ],
        "job_required_skills": [
            {
                "skill_name": "FastAPI",
                "normalized_name": "FastAPI",
                "category": "Backend",
                "evidence": "Requires FastAPI",
                "source": "job",
                "requirement": "required",
                "confidence": 1.0,
            }
        ],
        "job_preferred_skills": [],
        "candidate_text": "FastAPI developer",
        "job_text": "Looking for FastAPI developer",
    }
    response = client.post(
        "/api/v1/match",
        headers={"x-api-key": "internal_dev_key"},
        json=payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["overall_score"] > 0
    assert data["skill_overlap_score"] == 100.0
    assert len(data["matched_skills"]) == 1
    assert data["matched_skills"][0]["normalized_name"] == "FastAPI"
