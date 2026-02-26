from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from pydantic import BaseModel

# Import nội bộ
from src.database import get_db
from src.auth.models import User
from src.users.schemas import UserCreate, UserResponse
from src.auth.utils import get_password_hash
from src.auth.dependencies import get_admin_user, get_current_user # Import thêm get_current_user
from src.logs.utils import create_audit_log      

router = APIRouter()

# Schema dùng riêng cho việc cập nhật quyền (Role)
class RoleUpdate(BaseModel):
    role: str  # Ví dụ: "admin" hoặc "user"

# ==========================================
# 1. ĐĂNG KÝ USER MỚI (Public)
# ==========================================
@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    # Kiểm tra Username
    query = select(User).where(User.username == user.username)
    result = await db.execute(query)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username đã tồn tại")

    # Kiểm tra Email
    query_email = select(User).where(User.email == user.email)
    result_email = await db.execute(query_email)
    if result_email.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email đã được sử dụng")

    # Tạo user mới
    hashed_password = get_password_hash(user.password)
    new_user = User(
        email=user.email, 
        username=user.username, 
        hashed_password=hashed_password,
        role="user",     # Mặc định là user thường
        is_active=True   # Mặc định kích hoạt
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return new_user

# ==========================================
# 2. LẤY THÔNG TIN USER HIỆN TẠI (GET /me)
# ==========================================
# API này cần thiết để Frontend lấy thông tin role/profile
@router.get("/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

# ==========================================
# 3. LẤY DANH SÁCH USER (Admin Only)
# ==========================================
@router.get("/", response_model=List[dict]) 
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    result = await db.execute(select(User).order_by(User.id))
    users = result.scalars().all()
    
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": "admin" if u.username == "admin" else (u.role or "user"),
            "is_active": u.is_active,
            "avatar": u.avatar
        }
        for u in users
    ]

# ==========================================
# 4. KHÓA / MỞ KHÓA TÀI KHOẢN (Admin Only)
# ==========================================
@router.put("/{user_id}/status")
async def toggle_user_status(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Không thể tự khóa tài khoản của chính mình.")

    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User không tồn tại.")

    # Đảo ngược trạng thái
    user.is_active = not user.is_active
    
    # Ghi log
    action_name = "UNLOCK_USER" if user.is_active else "LOCK_USER"
    await create_audit_log(
        db, admin.id, admin.username,
        action=action_name, target_type="USER", target_id=user.id,
        details={"target_user": user.username, "new_status": "Active" if user.is_active else "Locked"}
    )

    await db.commit()
    return {"message": "Cập nhật trạng thái thành công", "is_active": user.is_active}

# ==========================================
# 5. PHÂN QUYỀN: THĂNG CHỨC / GIÁNG CHỨC (Admin Only)
# ==========================================
@router.put("/{user_id}/role")
async def change_user_role(
    user_id: int,
    role_data: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Không thể tự thay đổi quyền của mình.")
        
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User không tồn tại.")

    # Cập nhật Role
    user.role = role_data.role 
    
    # Ghi log
    await create_audit_log(
        db, admin.id, admin.username,
        action="CHANGE_ROLE", target_type="USER", target_id=user.id,
        details={"target_user": user.username, "new_role": role_data.role}
    )

    await db.commit()
    return {"message": f"Đã cập nhật quyền thành {role_data.role}"}

# ==========================================
# 6. XÓA TÀI KHOẢN (Admin Only) -> MỚI THÊM
# ==========================================
@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    # 1. Không cho xóa chính mình
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Không thể tự xóa tài khoản của chính mình.")

    # 2. Tìm User
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User không tồn tại.")

    # 3. (Tuỳ chọn) Không cho xóa Admin khác để an toàn
    # if user.role == "admin":
    #     raise HTTPException(status_code=400, detail="Không thể xóa tài khoản Admin khác.")

    # 4. Ghi Log trước khi xóa
    await create_audit_log(
        db, admin.id, admin.username,
        action="DELETE_USER", target_type="USER", target_id=user_id,
        details={"deleted_user": user.username, "deleted_email": user.email}
    )

    # 5. Xóa và Lưu
    await db.delete(user)
    await db.commit()
    
    return None # 204 No Content không trả về body