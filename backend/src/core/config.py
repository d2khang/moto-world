from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # 1. Cấu hình Database & Token
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # 2. Cấu hình Email (Cần đầy đủ các trường này để fastapi-mail hoạt động)
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_FROM_NAME: str = "MOTO WORLD"

    # 3. Cấu hình AI Chatbot
    GROQ_API_KEY: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        # Bỏ qua các biến thừa trong file .env để tránh lỗi validation
        extra = "ignore" 

settings = Settings()