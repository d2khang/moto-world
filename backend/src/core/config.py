from pydantic_settings import BaseSettings
from pydantic import Field # Import thêm Field để xử lý biến môi trường an toàn hơn

class Settings(BaseSettings):
    # 1. Cấu hình Database & Token
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # 2. Cấu hình Email
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_FROM_NAME: str = "MOTO WORLD"

    # 3. Cấu hình AI Chatbot
    GROQ_API_KEY: str = ""

    # 4. Cấu hình Cloudinary (THÊM MỚI)
    # Các giá trị này lấy từ Dashboard của Cloudinary
    CLOUDINARY_CLOUD_NAME: str = Field(..., description="Cloud Name từ Cloudinary")
    CLOUDINARY_API_KEY: str = Field(..., description="API Key từ Cloudinary")
    CLOUDINARY_API_SECRET: str = Field(..., description="API Secret từ Cloudinary")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore" # Bỏ qua biến thừa

settings = Settings()