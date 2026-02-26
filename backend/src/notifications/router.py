from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from src.database import get_db
from src.notifications.models import Notification
from src.auth.dependencies import get_current_user
from src.auth.models import User
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime
    class Config:
        from_attributes = True

# --- 1. API LẤY THÔNG BÁO (ĐÃ FIX QUYỀN ADMIN) ---
@router.get("/", response_model=list[NotificationResponse])
async def get_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Logic kiểm tra quyền: Là Admin/Staff HOẶC tên đăng nhập là "admin"
    is_manager = current_user.role in ["admin", "staff"] or current_user.username == "admin"

    if is_manager:
        # Admin/Staff: Xem thông báo CỦA MÌNH (user_id = id) + THÔNG BÁO HỆ THỐNG (user_id = NULL)
        query = select(Notification).where(
            or_(
                Notification.user_id == current_user.id,
                Notification.user_id.is_(None) # Dùng .is_(None) chuẩn hơn == None trong SQL
            )
        ).order_by(Notification.created_at.desc()).limit(20)
    else:
        # Khách hàng: CHỈ xem thông báo của chính mình
        query = select(Notification).where(
            Notification.user_id == current_user.id
        ).order_by(Notification.created_at.desc()).limit(20)

    result = await db.execute(query)
    return result.scalars().all()

# --- 2. API ĐÁNH DẤU ĐÃ ĐỌC (ĐÃ FIX QUYỀN ADMIN) ---
@router.put("/{notif_id}/read")
async def mark_as_read(
    notif_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = await db.get(Notification, notif_id)
    if not notif:
        raise HTTPException(status_code=404, detail="Không tìm thấy")
    
    # Xác định quyền
    is_manager = current_user.role in ["admin", "staff"] or current_user.username == "admin"
    
    # Kiểm tra quyền đọc:
    # 1. Là chủ sở hữu thông báo (is_owner)
    # 2. Hoặc là Admin đọc thông báo hệ thống (is_system_notif)
    is_owner = notif.user_id == current_user.id
    is_system_notif = notif.user_id is None

    if not (is_owner or (is_system_notif and is_manager)):
        raise HTTPException(status_code=403, detail="Không có quyền thao tác thông báo này")

    notif.is_read = True
    await db.commit()
    return {"message": "Đã đọc"}