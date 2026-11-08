# SkillMatch AI — Matching Scoring Formula & Methodology

## 1. Overview
SkillMatch AI uses a transparent, explainable **hybrid scoring architecture** combining:
1. **Weighted Skill Requirements Overlap Score (60%)**
2. **Contextual Semantic Similarity Score (40%)**

```
Final Fit Score = 0.60 × Skill Overlap Score + 0.40 × Semantic Similarity Score
```
Both component scores are normalized to a consistent `0 – 100` scale.

---

## 2. Skill Overlap Scoring Methodology (60%)

Skill overlap assesses how many of the recruiter's requested skills are evidenced in the candidate's verified profile.

### Skill Importance Weighting
Job requirements distinguish between **Required** (core) and **Preferred** (nice-to-have) skills:
* **Required Skills**: 70% weight in skill overlap
* **Preferred Skills**: 30% weight in skill overlap

### Match Credit per Skill
* **Full Match (`matched`)**: `1.0` credit
  * Either direct canonical taxonomy match (e.g. `JS` → `JavaScript`) OR cosine similarity $\ge 0.80$ with candidate evidence.
* **Partial Match (`partial`)**: `0.5` credit
  * Candidate possesses related experience ($0.55 \le \text{similarity} < 0.80$), but does not fully satisfy the requirement.
* **Missing (`missing`)**: `0.0` credit
  * No credible evidence found in CV ($\text{similarity} < 0.55$).

### Overlap Formula
$$\text{ReqScore} = \frac{\sum \text{Credit}_{\text{required}}}{N_{\text{required}}}$$
$$\text{PrefScore} = \frac{\sum \text{Credit}_{\text{preferred}}}{N_{\text{preferred}}}$$
$$\text{Skill Overlap Score} = (0.70 \times \text{ReqScore} + 0.30 \times \text{PrefScore}) \times 100$$

*(If a job defines only required skills, $\text{Skill Overlap Score} = \text{ReqScore} \times 100$. If only preferred skills are defined, $\text{Skill Overlap Score} = \text{PrefScore} \times 100$.)*

---

## 3. Semantic Similarity Scoring Methodology (40%)

Semantic similarity evaluates the holistic contextual alignment between the candidate's background and the job description.

* **Embedding Model**: `sentence-transformers/all-MiniLM-L6-v2`
  * Dimension: 384
  * Normalization: $L_2$ unit sphere normalization
* **Metric**: Cosine similarity between candidate context vector $\vec{u}$ and job requirement vector $\vec{v}$:
  $$\text{CosineSim}(\vec{u}, \vec{v}) = \frac{\vec{u} \cdot \vec{v}}{\|\vec{u}\|_2 \|\vec{v}\|_2}$$
  Because vectors are $L_2$ normalized:
  $$\text{CosineSim}(\vec{u}, \vec{v}) = \vec{u} \cdot \vec{v}$$
* **Score Mapping**:
  $$\text{Semantic Similarity Score} = \max(0.0, \min(1.0, \text{CosineSim})) \times 100$$

---

## 4. Skill Gap Classification Thresholds

| Classification | Condition | Description | Credit |
|---|---|---|---|
| **Matched** | Exact Name Match OR $\text{CosineSim} \ge 0.80$ | Credible, verified evidence found | 1.0 |
| **Partially Matched** | $0.55 \le \text{CosineSim} < 0.80$ | Related technology or transferable knowledge | 0.5 |
| **Missing** | $\text{CosineSim} < 0.55$ | No evidence found in candidate profile | 0.0 |

---

## 5. Curated Learning Recommendations
For every **missing** or **partially matched** skill, SkillMatch AI retrieves verified, free learning resources from its curated database in MongoDB. No links are fabricated or hallucinated by LLMs.
