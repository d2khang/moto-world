import re
import random
import smtplib 
from email.mime.text import MIMEText 
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from pydantic import BaseModel, EmailStr

from src.database import get_db
from src.core.config import settings
from src.auth.utils import verify_password, create_access_token, get_password_hash
from src.auth.models import User

router = APIRouter()

# ==========================================
# CẤU HÌNH GMAIL (ĐÃ BẢO MẬT)
# ==========================================
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

# 👇 QUAN TRỌNG: Lấy từ settings thay vì điền trực tiếp
# (Nó sẽ tự đọc từ file .env của bạn)
SENDER_EMAIL = settings.MAIL_USERNAME
SENDER_PASSWORD = settings.MAIL_PASSWORD      

# ==========================================
# 1. CÁC PYDANTIC MODEL (SCHEMA)
# ==========================================
class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    email: EmailStr
    phone_number: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str
    
    class Config:
        from_attributes = True

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str      
    new_password: str

# ==========================================
# 2. HÀM GỬI EMAIL (HTML CHUYÊN NGHIỆP)
# ==========================================
def send_otp_email(to_email: str, otp: str):
    # Kiểm tra xem đã cấu hình email chưa
    if not SENDER_EMAIL or not SENDER_PASSWORD:
        print("❌ LỖI: Chưa cấu hình Email trong file .env")
        return False

    try:
        subject = "🔐 Moto World - Mã Xác Thực Đặt Lại Mật Khẩu"
        
        # Thiết kế giao diện HTML cho Email
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: 'Arial', sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #e0e0e0; }}
                .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center; color: white; }}
                .header h1 {{ margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 2px; font-weight: 800; }}
                .content {{ padding: 30px; color: #333; text-align: center; }}
                .greeting {{ font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 10px; }}
                .message {{ font-size: 15px; color: #4b5563; line-height: 1.6; margin-bottom: 25px; }}
                .otp-box {{ background-color: #ecfdf5; border: 2px dashed #10b981; color: #047857; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 15px 30px; margin: 20px auto; width: fit-content; border-radius: 8px; }}
                .warning {{ font-size: 13px; color: #dc2626; margin-top: 25px; background-color: #fef2f2; padding: 10px; border-radius: 6px; display: inline-block; }}
                .footer {{ background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #eee; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>MOTO WORLD</h1>
                </div>
                <div class="content">
                    <p class="greeting">Xin chào,</p>
                    <p class="message">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.<br>Để tiếp tục, vui lòng sử dụng mã xác thực bên dưới:</p>
                    
                    <div class="otp-box">{otp}</div>
                    
                    <div class="warning">
                        ⚠️ Mã này sẽ hết hạn sau <strong>5 phút</strong>.<br>
                        Tuyệt đối không chia sẻ mã này cho bất kỳ ai.
                    </div>
                </div>
                <div class="footer">
                    &copy; {datetime.now().year} Moto World System. All rights reserved.<br>
                    Đây là email tự động, vui lòng không trả lời.
                </div>
            </div>
        </body>
        </html>
        """
        
        # Chuyển đổi sang định dạng HTML ("html" thay vì "plain")
        msg = MIMEText(html_content, "html", "utf-8") 
        msg['Subject'] = subject
        msg['From'] = SENDER_EMAIL
        msg['To'] = to_email

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls() 
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.sendmail(SENDER_EMAIL, to_email, msg.as_string())
        server.quit()
        
        print(f"✅ Đã gửi HTML Email thành công tới: {to_email}")
        return True
    except Exception as e:
        print(f"❌ LỖI GỬI EMAIL: {e}")
        return False

# ==========================================
# 3. HÀM KIỂM TRA ĐỘ MẠNH MẬT KHẨU
# ==========================================
def validate_password_strength(password: str):
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Mật khẩu phải có ít nhất 8 ký tự.")
    return True

# ==========================================
# 4. API ĐĂNG KÝ (REGISTER)
# ==========================================
@router.post("/register", response_model=UserResponse)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    query = select(User).where(
        or_(User.username == user_in.username, User.email == user_in.email)
    )
    result = await db.execute(query)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Tên đăng nhập hoặc Email đã tồn tại"
        )

    validate_password_strength(user_in.password)
    
    new_user = User(
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name,
        phone_number=user_in.phone_number,
        hashed_password=get_password_hash(user_in.password),
        role="user", 
        avatar=None
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return new_user

# ==========================================
# 5. API ĐĂNG NHẬP (LOGIN)
# ==========================================
@router.post("/login") 
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: AsyncSession = Depends(get_db)
):
    # Tìm user theo Username HOẶC Email
    query = select(User).where(
        or_(
            User.username == form_data.username, 
            User.email == form_data.username
        )
    )
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    # Kiểm tra User tồn tại và Mật khẩu đúng
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tài khoản hoặc mật khẩu không đúng",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Kiểm tra User có bị khóa không
    if hasattr(user, "is_active") and not user.is_active:
         raise HTTPException(status_code=400, detail="Tài khoản này đã bị khóa.")

    # Tạo Token JWT
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}, 
        expires_delta=access_token_expires
    )
    
    # Trả về đầy đủ thông tin
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "username": user.username,
        "role": user.role,       
        "full_name": user.full_name,
        "email": user.email,               
        "phone_number": user.phone_number, 
        "avatar": user.avatar,
        "address": getattr(user, "address", "") # Tránh lỗi nếu chưa có cột address
    }

# ==========================================
# 6. QUÊN MẬT KHẨU (GỬI OTP)
# ==========================================
@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()
    
    if not user:
        return {"message": "Nếu email tồn tại, mã OTP đã được gửi."}
    
    otp = str(random.randint(100000, 999999))
    
    user.otp_code = otp
    user.otp_expires_at = datetime.now() + timedelta(minutes=5)
    
    db.add(user)
    await db.commit()

    send_success = send_otp_email(user.email, otp)
    
    if not send_success:
         raise HTTPException(status_code=500, detail="Lỗi hệ thống gửi mail. Vui lòng thử lại sau.")
    
    return {"message": "Mã OTP đã được gửi tới email của bạn."}

# ==========================================
# 7. ĐẶT LẠI MẬT KHẨU
# ==========================================
@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    query = select(User).where(User.email == request.email)
    result = await db.execute(query) 
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Email không tồn tại trong hệ thống")

    if not user.otp_code or user.otp_code != request.otp:
         raise HTTPException(status_code=400, detail="Mã OTP không chính xác")

    if user.otp_expires_at and user.otp_expires_at < datetime.now():
         raise HTTPException(status_code=400, detail="Mã OTP đã hết hạn. Vui lòng lấy mã mới")

    validate_password_strength(request.new_password)

    user.hashed_password = get_password_hash(request.new_password)
    user.otp_code = None
    user.otp_expires_at = None

    db.add(user)
    await db.commit()
    
    return {"message": "Mật khẩu đã được cập nhật thành công. Bạn có thể đăng nhập ngay."}