from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import Column, Integer, String, Boolean, select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from src.database import Base, get_db
from src.auth.dependencies import get_current_user # <--- Dùng cái này thay vì get_admin_user
from src.auth.models import User
from src.logs.utils import create_audit_log # <--- Thêm log

# ==========================================
# 1. MODEL (BẢNG TRONG DATABASE)
# ==========================================
class PromoBanner(Base):
    __tablename__ = "promo_banners"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, default="Siêu Sale Khai Trương")
    description = Column(String, default="Nhập mã giảm giá để nhận ngay ưu đãi khi chốt đơn phân khối lớn.")
    discount_code = Column(String, default="MOTOPRO20")
    image_url = Column(String, default="https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=1000&auto=format&fit=crop")
    is_active = Column(Boolean, default=True)

# ==========================================
# 2. SCHEMA (ĐỊNH DẠNG DỮ LIỆU API)
# ==========================================
class PromoBannerSchema(BaseModel):
    title: str
    description: str
    discount_code: str
    image_url: str
    is_active: bool

class PromoBannerResponse(PromoBannerSchema):
    id: int
    class Config:
        from_attributes = True

# ==========================================
# 3. ROUTER (API ENDPOINTS)
# ==========================================
router = APIRouter()

# --- HÀM KIỂM TRA QUYỀN (Dùng chung) ---
def check_staff_permission(user: User):
    # Cho phép nếu là Admin HOẶC Staff
    if user.role not in ["admin", "staff"] and user.username != "admin":
        raise HTTPException(status_code=403, detail="Bạn không đủ quyền (Cần quyền Staff/Admin)")

# API cho Khách xem (Không cần đăng nhập)
@router.get("/", response_model=PromoBannerResponse)
async def get_promo(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PromoBanner).limit(1))
    promo = result.scalar_one_or_none()
    
    # Nếu trong DB chưa có banner nào, tự động tạo 1 cái mặc định
    if not promo:
        promo = PromoBanner()
        db.add(promo)
        await db.commit()
        await db.refresh(promo)
        
    return promo

# API Cập nhật Banner (Admin + Staff)
@router.put("/", response_model=PromoBannerResponse)
async def update_promo(
    promo_in: PromoBannerSchema, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user) # <--- Lấy user hiện tại
):
    check_staff_permission(current_user) # <--- Kiểm tra quyền Staff

    result = await db.execute(select(PromoBanner).limit(1))
    promo = result.scalar_one_or_none()
    
    action_type = "UPDATE_BANNER"
    
    if not promo:
        promo = PromoBanner(**promo_in.model_dump())
        db.add(promo)
        action_type = "CREATE_BANNER"
    else:
        for key, value in promo_in.model_dump().items():
            setattr(promo, key, value)
            
    # Ghi nhật ký
    await create_audit_log(
        db, 
        username=current_user.username,
        action=action_type, 
        target="Banner Khuyến Mãi",
        details={"code": promo.discount_code, "title": promo.title}
    )

    await db.commit()
    await db.refresh(promo)
    return promo