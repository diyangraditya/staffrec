from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./staffrec.db"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    BEDROCK_MODEL_ID: str = "google.gemma-3-27b-it"
    SENDER_EMAIL: str = "recruiter@staffrec.io"
    FRONTEND_ENDPOINT: str = "http://localhost:5173"
    CLOUDFRONT_URL: str = ""

    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }

settings = Settings()
