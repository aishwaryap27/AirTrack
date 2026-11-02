from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Any, Union
from pydantic import field_validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "AirTrack — Air Traffic Data Management and Analytics"
    API_PREFIX: str = "/api"
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "AirTrafficDB"
    DEBUG: bool = False
    CORS_ORIGINS: Union[List[str], str] = ["*"]

    @field_validator("CORS_ORIGINS")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return []
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        elif isinstance(v, (list, tuple)):
            return list(v)
        return ["*"]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
