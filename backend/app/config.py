from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "AirTrack — Air Traffic Data Management and Analytics"
    API_PREFIX: str = "/api"
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "AirTrafficDB"
    DEBUG: bool = True
    CORS_ORIGINS: List[str] = ["*"]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
