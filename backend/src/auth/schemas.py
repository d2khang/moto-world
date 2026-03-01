from pydantic import BaseModel, EmailStr
from typing import Optional

# 1. Schema dữ liệu đầu vào khi Đăng ký
# (Tuyệt đối KHÔNG có trường role ở đây để bảo mật)
class UserCreate(BaseModel):
    username: str 
    email: EmailStr
    password: str
    full_name: str
    phone_number: Optional[str] = None

# 2. Schema dữ liệu trả về (User Info)
class UserResponse(BaseModel):
    id: int 
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    avatar: Optional[str] = None
    role: str  # <--- Đã bổ sung theo yêu cầu
    is_active: bool = True

    class Config:
        from_attributes = True

# 3. Schema cho Token (Trả về khi login)
class Token(BaseModel):
    access_token: str
    token_type: str
    username: str
    role: str

# 4. Các Schema phục vụ quên mật khẩu
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str      
    new_password: str