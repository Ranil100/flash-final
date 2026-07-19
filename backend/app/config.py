from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    gemini_api_key: str = ""
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    llm_model: str = "gemini-2.5-flash"
    embedding_model: str = "gemini-embedding-001"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


def get_settings() -> Settings:
    # Return a fresh Settings instance to ensure environment file changes
    # (e.g., adding GEMINI_API_KEY) are picked up without relying on a
    # long-lived cache inside the running process.
    return Settings()
