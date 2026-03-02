# File: backend/src/coupons/router.py
# Mục đích: Định nghĩa các API endpoints quản lý mã giảm giá (Coupon).
# Xử lý logic tạo, lấy danh sách, xóa và kiểm tra tính hợp lệ của mã.

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime

from src.database import get_db
from src.auth.dependencies import get_current_user
from src.auth.models import User
from src.coupons.models import Coupon
from src.coupons.schemas import CouponCreate, CouponResponse, CouponValidateInput
from src.logs.utils import create_audit_log 

router = APIRouter()

# --- HÀM KIỂM TRA QUYỀN (Dùng chung) ---
def check_staff_permission(user: User):
    """
    Kiểm tra xem user có quyền Admin hoặc Staff không.
    Nếu không, ném lỗi 403 Forbidden.
    """
    if user.role not in ["admin", "staff"] and user.username != "admin":
        raise HTTPException(status_code=403, detail="Bạn không đủ quyền (Cần quyền Staff/Admin)")

# 1. TẠO MÃ GIẢM GIÁ (Admin + Staff)
@router.post("/", response_model=CouponResponse)
async def create_coupon(
    coupon_in: CouponCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Tạo một mã giảm giá mới.
    Sửa lỗi: Loại bỏ timezone khỏi expiration_date để tương thích với PostgreSQL (Timestamp without timezone).
    """
    check_staff_permission(current_user)

    # Kiểm tra trùng mã (case-insensitive)
    existing_coupon = await db.execute(select(Coupon).where(Coupon.code == coupon_in.code.upper()))
    if existing_coupon.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Mã giảm giá này đã tồn tại!")

    # Chuyển đổi dữ liệu từ Pydantic model sang dict để xử lý
    coupon_data = coupon_in.dict()

    # --- LOGIC FIX LỖI DATETIME ---
    # asyncpg không cho phép lưu datetime có timezone vào cột TIMESTAMP WITHOUT TIME ZONE
    # Ta cần chuyển expiration_date về dạng naive (không có tzinfo)
    if coupon_data.get("expiration_date"):
        expire_date = coupon_data["expiration_date"]
        # Nếu datetime có chứa thông tin timezone (offset-aware)
        if expire_date.tzinfo is not None:
            # Xóa thông tin timezone (giữ nguyên giờ, coi như là giờ server/UTC tùy logic hệ thống)
            coupon_data["expiration_date"] = expire_date.replace(tzinfo=None)
    
    # Chuẩn hóa mã về chữ in hoa
    coupon_data["code"] = coupon_data["code"].upper()

    # Tạo object Coupon từ dữ liệu đã xử lý
    new_coupon = Coupon(**coupon_data) 
    db.add(new_coupon)
    
    # Ghi nhật ký hệ thống (Audit Log)
    await create_audit_log(
        db, 
        username=current_user.username,
        action="CREATE_COUPON", 
        target_type="COUPON", 
        target_id=0, # ID sẽ có sau khi commit, nhưng ở đây log tạm thời
        details={"code": new_coupon.code, "value": new_coupon.discount_value}
    )

    try:
        await db.commit()
        await db.refresh(new_coupon)
        return new_coupon
    except Exception as e:
        await db.rollback()
        # In lỗi ra console để debug nếu có vấn đề khác
        print(f"Error creating coupon: {e}") 
        raise HTTPException(status_code=500, detail=f"Lỗi Server: {str(e)}")

# 2. LẤY DANH SÁCH MÃ (Admin + Staff)
@router.get("/", response_model=List[CouponResponse])
async def get_coupons(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy danh sách tất cả mã giảm giá.
    """
    check_staff_permission(current_user)

    result = await db.execute(select(Coupon).order_by(Coupon.created_at.desc()))
    return result.scalars().all()

# 3. XÓA MÃ (Admin + Staff)
@router.delete("/{coupon_id}")
async def delete_coupon(
    coupon_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Xóa mã giảm giá theo ID.
    """
    check_staff_permission(current_user)

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
    """
    Kiểm tra mã giảm giá có hợp lệ để sử dụng hay không.
    """
    code = input_data.code.upper()
    
    # Tìm mã trong DB
    result = await db.execute(select(Coupon).where(Coupon.code == code))
    coupon = result.scalar_one_or_none()

    if not coupon:
        raise HTTPException(status_code=404, detail="Mã giảm giá không tồn tại.")

    # Kiểm tra trạng thái kích hoạt
    if not coupon.is_active:
        raise HTTPException(status_code=400, detail="Mã này đang bị khóa.")
    
    # Kiểm tra hạn sử dụng
    # Lưu ý: coupon.expiration_date từ DB là Naive (không múi giờ)
    # datetime.now() trả về Naive (giờ hệ thống cục bộ)
    # Phép so sánh này hợp lệ về mặt kỹ thuật Python, nhưng cần đảm bảo server chạy đúng giờ.
    if coupon.expiration_date and coupon.expiration_date < datetime.now():
        raise HTTPException(status_code=400, detail="Mã này đã hết hạn.")
        
    # Kiểm tra số lượng sử dụng
    if coupon.usage_limit > 0 and coupon.used_count >= coupon.usage_limit:
        raise HTTPException(status_code=400, detail="Mã này đã hết lượt sử dụng.")

    return {
        "code": coupon.code,
        "discount_type": coupon.discount_type,
        "discount_value": coupon.discount_value
    }