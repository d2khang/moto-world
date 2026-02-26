from pydantic import BaseModel, EmailStr
from typing import Optional

# Schema dùng để nhận dữ liệu khi Đăng ký
class UserCreate(BaseModel):
    username: str 
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    phone_number: Optional[str] = None

# Schema dùng để trả dữ liệu về (User Info)
class UserResponse(BaseModel):
    id: int 
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    avatar: Optional[str] = None
    is_active: bool
    role: str  # <--- QUAN TRỌNG: BỔ SUNG DÒNG NÀY

    class Config:
        from_attributes = True

# Schema trả về khi Login thành công
class Token(BaseModel):
    access_token: str
    token_type: str
    username: str
    role: str 