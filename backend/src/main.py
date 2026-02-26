import os
import shutil
import uuid
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select # Thêm select để truy vấn database
from pydantic import BaseModel 

# --- 1. IMPORT THƯ VIỆN GOOGLE AI ---
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold

# --- IMPORT DATABASE & MODELS ---
from src.database import get_db, engine, Base
from src.auth import models as auth_models 
from src.auth.utils import get_password_hash, verify_password 
from src.auth.dependencies import get_current_user 
# Đảm bảo đường dẫn import Model Bike đúng với cấu trúc dự án của bạn
from src.bikes.models import Bike 

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

app = FastAPI(title="Moto World API", version="1.0.0")

# --- 2. CẤU HÌNH GOOGLE GEMINI AI ---
GOOGLE_API_KEY = "AIzaSyBwfQ8QLfXP2d0zcgaz4k0W3uBFzRryI4s" 

try:
    genai.configure(api_key=GOOGLE_API_KEY)
    
    safety_settings = {
        HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
    }

    # Sử dụng model flash ổn định đã check thành công trước đó
    model = genai.GenerativeModel(
        model_name='models/gemini-flash-latest',
        safety_settings=safety_settings
    )
    print("✅ Đã kết nối với Google Gemini AI")
except Exception as e:
    print(f"❌ Lỗi cấu hình AI: {e}")

# --- CẤU HÌNH STATIC FILES ---
if not os.path.exists("static/uploads"):
    os.makedirs("static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# --- CẤU HÌNH CORS ---
origins = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]
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

# --- SCHEMAS ---
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class ChatRequest(BaseModel):
    message: str

# --- ROOT API ---
@app.get("/")
async def root():
    return {"status": "online", "message": "Moto World API is running perfectly"}

# --- 4. API ENDPOINT CHO CHATBOT (Đã nâng cấp RAG) ---
@app.post("/api/chat", tags=["AI Chatbot"])
async def chat_with_ai(
    request: ChatRequest, 
    db: AsyncSession = Depends(get_db) # Kết nối database
):
    try:
        # 1. TRUY VẤN DANH SÁCH XE THỰC TẾ TỪ DB
        result = await db.execute(select(Bike).where(Bike.is_active == True))
        bikes = result.scalars().all()
        
        # Chuyển dữ liệu xe thành chuỗi văn bản để AI đọc
        bike_data_summary = "\n".join([
            f"- {b.name} ({b.brand}): Giá {b.price:,} VNĐ, Loại: {b.type}"
            for b in bikes
        ])

        # 2. XÂY DỰNG PROMPT HƯỚNG DẪN AI
        system_instruction = (
            "Bạn là MotoAI, chuyên gia tư vấn tại showroom Moto World Việt Nam. "
            "Dưới đây là danh sách xe thực tế đang có tại cửa hàng chúng ta:\n"
            f"{bike_data_summary}\n\n"
            "Nhiệm vụ: Dựa vào danh sách trên để tư vấn cho khách. Trả lời thân thiện, chuyên nghiệp bằng tiếng Việt. "
            "Nếu khách hỏi xe không có trong danh sách, hãy khéo léo giới thiệu các mẫu tương tự đang có sẵn."
        )
        
        full_prompt = f"{system_instruction}\n\nKhách hàng hỏi: {request.message}"
        
        # 3. GỌI GEMINI XỬ LÝ
        response = model.generate_content(full_prompt)
        
        if response and response.text:
             return {"reply": response.text}
        else:
             return {"reply": "Tôi đã nhận được câu hỏi nhưng đang kiểm tra lại kho xe. Bạn có thể hỏi cụ thể hơn được không?"}

    except Exception as e:
        print(f"❌ LỖI TRUY VẤN AI: {e}")
        return {"reply": "Hệ thống tư vấn đang bận cập nhật kho xe. Vui lòng thử lại sau giây lát!"}

# --- USER ACTIONS ---
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
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ định dạng hình ảnh")

    file_extension = file.filename.split(".")[-1]
    unique_filename = f"avatar_{current_user.id}_{uuid.uuid4().hex[:8]}.{file_extension}"
    file_path = f"static/uploads/{unique_filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    avatar_url = f"http://localhost:8000/{file_path}"
    current_user.avatar = avatar_url
    
    db.add(current_user)
    await db.commit()
    return {"url": avatar_url}