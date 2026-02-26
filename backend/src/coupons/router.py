from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime

from src.database import get_db
from src.auth.dependencies import get_current_user # Dùng cái này thay vì get_admin_user
from src.auth.models import User
from src.coupons.models import Coupon
from src.coupons.schemas import CouponCreate, CouponResponse, CouponValidateInput
from src.logs.utils import create_audit_log 

router = APIRouter()

# --- HÀM KIỂM TRA QUYỀN (Dùng chung) ---
def check_staff_permission(user: User):
    # Cho phép nếu là Admin HOẶC Staff
    if user.role not in ["admin", "staff"] and user.username != "admin":
        raise HTTPException(status_code=403, detail="Bạn không đủ quyền (Cần quyền Staff/Admin)")

# 1. TẠO MÃ GIẢM GIÁ (Admin + Staff)
@router.post("/", response_model=CouponResponse)
async def create_coupon(
    coupon_in: CouponCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user) # <--- Đổi thành current_user
):
    check_staff_permission(current_user) # <--- Kiểm tra quyền Staff

    # Kiểm tra trùng mã
    existing_coupon = await db.execute(select(Coupon).where(Coupon.code == coupon_in.code))
    if existing_coupon.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Mã giảm giá này đã tồn tại!")

    # Tạo Coupon
    # Lưu ý: model_dump() là của Pydantic v2, nếu lỗi thì dùng .dict()
    new_coupon = Coupon(**coupon_in.dict()) 
    db.add(new_coupon)
    
    # Ghi nhật ký
    await create_audit_log(
        db, 
        username=current_user.username,
        action="CREATE_COUPON", 
        target_type="COUPON", 
        target_id=0,
        details={"code": new_coupon.code, "value": new_coupon.discount_value}
    )

    await db.commit()
    await db.refresh(new_coupon)
    return new_coupon

# 2. LẤY DANH SÁCH MÃ (Admin + Staff)
@router.get("/", response_model=List[CouponResponse])
async def get_coupons(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_staff_permission(current_user) # <--- Kiểm tra quyền Staff

    result = await db.execute(select(Coupon))
    return result.scalars().all()

# 3. XÓA MÃ (Admin + Staff)
@router.delete("/{coupon_id}")
async def delete_coupon(
    coupon_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_staff_permission(current_user) # <--- Kiểm tra quyền Staff

    coupon = await db.get(Coupon, coupon_id)
    if not coupon:
        raise HTTPException(status_code=404, detail="Mã không tồn tại")
    
    # Ghi nhật ký trước khi xóa
    await create_audit_log(
        db, 
        username=current_user.username,
        action="DELETE_COUPON", 
        target_type="COUPON", 
        target_id=coupon.id,
        details={"code": coupon.code, "discount_value": coupon.discount_value}
    )
        
    await db.delete(coupon)
    await db.commit()
    return {"message": "Đã xóa mã giảm giá và ghi lại nhật ký."}

# 4. KIỂM TRA MÃ GIẢM GIÁ (Public - Ai cũng được dùng)
@router.post("/validate")
async def validate_coupon(
    input_data: CouponValidateInput,
    db: AsyncSession = Depends(get_db)
):
    code = input_data.code.upper()
    
    # Tìm mã trong DB
    result = await db.execute(select(Coupon).where(Coupon.code == code))
    coupon = result.scalar_one_or_none()

    if not coupon:
        raise HTTPException(status_code=404, detail="Mã giảm giá không tồn tại.")

    # Kiểm tra điều kiện hiệu lực
    if not coupon.is_active:
        raise HTTPException(status_code=400, detail="Mã này đang bị khóa.")
    
    if coupon.expiration_date < datetime.now():
        raise HTTPException(status_code=400, detail="Mã này đã hết hạn.")
        
    if coupon.used_count >= coupon.usage_limit:
        raise HTTPException(status_code=400, detail="Mã này đã hết lượt sử dụng.")

    return {
        "code": coupon.code,
        "discount_type": coupon.discount_type,
        "discount_value": coupon.discount_value
    }