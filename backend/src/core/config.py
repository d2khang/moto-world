from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # 1. Cấu hình Database & Token
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # 2. Cấu hình Email
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""

    # 👇 3. THÊM DÒNG NÀY (Cấu hình AI):
    GEMINI_API_KEY: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()