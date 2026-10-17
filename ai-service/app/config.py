import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    MISTRAL_API_KEY: str = os.getenv("MISTRAL_API_KEY", "")
    MISTRAL_MODEL: str = os.getenv("MISTRAL_MODEL", "mistral-small-latest")
    AI_SERVICE_API_KEY: str = os.getenv("AI_SERVICE_API_KEY", "")
    AI_SERVICE_PORT: int = int(os.getenv("AI_SERVICE_PORT", "8000"))
    AI_SERVICE_HOST: str = os.getenv("AI_SERVICE_HOST", "0.0.0.0")
    MODEL_NAME: str = os.getenv("MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "info")

    def validate(self):
        warnings = []
        if not self.MISTRAL_API_KEY or self.MISTRAL_API_KEY == "placeholder_add_real_key":
            warnings.append("MISTRAL_API_KEY not set — LLM extraction will use fallback")
        if not self.AI_SERVICE_API_KEY:
            warnings.append("AI_SERVICE_API_KEY not set — internal auth disabled")
        for w in warnings:
            print(f"[WARNING] {w}")
        return warnings

settings = Settings()
