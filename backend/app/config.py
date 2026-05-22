from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./staffrec.db"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    BEDROCK_MODEL_ID: str = "google.gemma-3-27b-it"

    class Config:
        env_file = ".env"


settings = Settings()
