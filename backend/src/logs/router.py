from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List
from pydantic import BaseModel
from datetime import datetime

from src.database import get_db
from src.auth.dependencies import get_current_user
from src.auth.models import User
from src.logs.models import AuditLog  # <--- Import AuditLog

router = APIRouter()

# --- Schema ---
class LogResponse(BaseModel):
    id: int
    user: str
    action: str
    target: str
    status: str
    timestamp: datetime
    
    class Config:
        from_attributes = True

# --- HÀM GHI LOG (Dùng chung) ---
async def create_log(db: AsyncSession, user: str, action: str, target: str, status: str = "success"):
    new_log = AuditLog(  # <--- Dùng AuditLog
        user=user,
        action=action,
        target=target,
        status=status,
        timestamp=datetime.now()
    )
    db.add(new_log)

# --- API LẤY LOG ---
@router.get("/", response_model=List[LogResponse])
async def get_logs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Chỉ Admin mới được xem
    is_super_admin = current_user.role == "admin" or current_user.username == "admin"
    if not is_super_admin:
         raise HTTPException(status_code=403, detail="Chỉ Admin mới được xem nhật ký")

    # Lấy dữ liệu
    stmt = select(AuditLog).order_by(desc(AuditLog.timestamp)).limit(100) # <--- Dùng AuditLog
    result = await db.execute(stmt)
    return result.scalars().all()