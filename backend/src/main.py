import os
import shutil
import uuid
import cloudinary
import cloudinary.uploader
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

# --- IMPORT CONFIG & DATABASE ---
from src.core.config import settings
from src.database import get_db, engine, Base
from src.auth import models as auth_models
from src.auth.utils import get_password_hash, verify_password
from src.auth.dependencies import get_current_user

# --- IMPORT ROUTERS ---
from src.auth.router import router as auth_router
from src.bikes.router import router as bikes_router
from src.orders.router import router as orders_router
from src.stats.router import router as stats_router
from src.payment.router import router as payment_router
from src.coupons.router import router as coupons_router
from src.users.router import router as users_router
from src.logs.router import router as logs_router
from src.notifications.router import router as notifications_router
from src.promo.router import router as promo_router
from src.chat.router import router as chat_router

# --- CẤU HÌNH CLOUDINARY ---
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET
)

app = FastAPI(title="Moto World API", version="1.0.0")

# --- CẤU HÌNH STATIC FILES ---
# Vẫn giữ để tương thích, nhưng file ảnh mới sẽ lên Cloudinary
if not os.path.exists("static/uploads"):
    os.makedirs("static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# --- CẤU HÌNH CORS (QUAN TRỌNG) ---
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "https://moto-world.vercel.app", # Link mẫu (bạn có thể thay bằng link thật)
    "*"  # DÒNG NÀY QUAN TRỌNG: Cho phép tất cả các domain truy cập (tránh lỗi 100% khi mới deploy)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- KHỞI TẠO DATABASE ---
@app.on_event("startup")
async def startup():
    # Tạo bảng nếu chưa có
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# --- ĐĂNG KÝ CÁC ROUTER ---
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(bikes_router, prefix="/api/bikes", tags=["Bikes"])
app.include_router(orders_router, prefix="/api/orders", tags=["Orders"])
app.include_router(coupons_router, prefix="/api/coupons", tags=["Coupons"])
app.include_router(stats_router, prefix="/api/stats", tags=["Stats"])
app.include_router(payment_router, prefix="/api/payment", tags=["Payment"])
app.include_router(users_router, prefix="/api/users", tags=["Users"])
app.include_router(promo_router, prefix="/api/promo", tags=["Promo Banner"])
app.include_router(logs_router, prefix="/api/logs", tags=["Logs"])
app.include_router(notifications_router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(chat_router, prefix="/api/chat", tags=["AI Chatbot"])

# --- ROOT API ---
@app.get("/")
async def root():
    return {"status": "online", "message": "Moto World API is running perfectly"}

# --- CÁC HÀM XỬ LÝ USER (Password & Avatar) ---
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@app.put("/api/users/change-password")
async def change_password(
    request: ChangePasswordRequest, 
    current_user: auth_models.User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    if not verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Mật khẩu hiện tại không chính xác")
    
    current_user.hashed_password = get_password_hash(request.new_password)
    db.add(current_user)
    await db.commit()
    return {"message": "Đổi mật khẩu thành công"}

@app.post("/api/users/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...), 
    current_user: auth_models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload avatar lên Cloudinary để không bị mất ảnh khi Render restart
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ định dạng hình ảnh")

    try:
        # Upload file lên Cloudinary
        upload_result = cloudinary.uploader.upload(file.file, folder="moto_world_avatars")
        
        # Lấy URL HTTPS
        avatar_url = upload_result.get("secure_url")
        
        # Cập nhật Database
        current_user.avatar = avatar_url
        db.add(current_user)
        await db.commit()
        
        return {"url": avatar_url}
        
    except Exception as e:
        print(f"Lỗi upload Cloudinary: {e}")
        raise HTTPException(status_code=500, detail="Không thể upload ảnh, vui lòng thử lại sau.")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print("❌ VALIDATION ERROR CHI TIẾT:", exc.errors())
    return JSONResponse(status_code=422, content={"detail": exc.errors()})