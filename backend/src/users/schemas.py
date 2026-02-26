from pydantic import BaseModel, EmailStr
import uuid

# Dạng cơ bản (chung cho tạo và hiện)
class UserBase(BaseModel):
    email: EmailStr
    username: str

# Dạng dữ liệu khi Đăng ký (có mật khẩu)
class UserCreate(UserBase):
    password: str

# Dạng dữ liệu khi Trả về cho Frontend (không được hiện mật khẩu)
class UserResponse(UserBase):
    id: uuid.UUID
    is_active: bool

    class Config:
        from_attributes = True