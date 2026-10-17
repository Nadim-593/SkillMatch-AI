import numpy as np
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

_model = None

def get_model():
    """Lazy-load and cache the embedding model."""
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            from app.config import settings
            logger.info(f"Loading embedding model: {settings.MODEL_NAME}")
            _model = SentenceTransformer(settings.MODEL_NAME)
            logger.info("Embedding model loaded successfully.")
        except Exception as e:
            logger.warning(f"Could not load SentenceTransformer: {e}. Semantic matching will use fallback.")
            return None
    return _model

def generate_embeddings(texts: List[str]) -> np.ndarray:
    """Generate normalized embeddings for a list of texts."""
    model = get_model()
    if model is not None:
        embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
        return embeddings
    # Fallback: simple deterministic hash vector for offline/testing mode without pytorch
    logger.info("Using fallback bag-of-words vector representation")
    dims = 384
    result = np.zeros((len(texts), dims), dtype=np.float32)
    for i, t in enumerate(texts):
        words = t.lower().split()
        for w in words:
            h = hash(w) % dims
            result[i, h] += 1.0
        norm = np.linalg.norm(result[i])
        if norm > 0:
            result[i] /= norm
    return result

def cosine_similarity(vec_a: np.ndarray, vec_b: np.ndarray) -> float:
    """Calculate cosine similarity between two normalized vectors."""
    norm_a = np.linalg.norm(vec_a)
    norm_b = np.linalg.norm(vec_b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    similarity = float(np.dot(vec_a, vec_b) / (norm_a * norm_b))
    return float(max(0.0, min(1.0, similarity)))

def batch_cosine_similarity(query: np.ndarray, corpus: np.ndarray) -> np.ndarray:
    """Calculate cosine similarity of a query vector against a corpus matrix."""
    return np.dot(corpus, query)
