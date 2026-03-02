from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from typing import List
from datetime import datetime

# Import models
from src.bikes import models as bike_models
from src.orders import models, schemas
from src.coupons.models import Coupon  
from src.auth.models import User
from src.database import get_db
from src.auth.dependencies import get_current_user

# --- IMPORT LOG & NOTIFICATION & EMAIL ---
from src.logs.router import create_log 
from src.notifications.models import Notification
from src.notifications.email_service import send_order_confirmation_email # <--- MỚI THÊM

router = APIRouter()

# ==========================================
# 1. TẠO ĐƠN HÀNG (Trừ kho + Áp dụng Coupon + TẠO THÔNG BÁO + GỬI MAIL)
# ==========================================
@router.post("/", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_in: schemas.OrderCreate,
    background_tasks: BackgroundTasks, # <--- MỚI THÊM: Để chạy gửi mail ngầm
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # --- BƯỚC 1: KIỂM TRA & TRỪ KHO ---
    final_price = order_in.total_amount 

    for item in order_in.items:
        # Lấy thông tin xe
        stmt = select(bike_models.Bike).where(bike_models.Bike.id == item.product_id)
        result = await db.execute(stmt)
        bike = result.scalar_one_or_none()

        if not bike:
            raise HTTPException(status_code=404, detail=f"Xe {item.product_name} không tồn tại!")

        if item.variant_name:
            stmt_variant = select(bike_models.BikeVariant).where(
                bike_models.BikeVariant.bike_id == item.product_id,
                bike_models.BikeVariant.name == item.variant_name
            )
            result_variant = await db.execute(stmt_variant)
            variant = result_variant.scalar_one_or_none()

            if not variant:
                raise HTTPException(
                    status_code=404,
                    detail=f"Phiên bản '{item.variant_name}' của xe '{bike.name}' không tồn tại!"
                )

            if variant.quantity < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Phiên bản '{variant.name}' của xe '{bike.name}' chỉ còn {variant.quantity} chiếc. Bạn không thể mua {item.quantity} chiếc."
                )

            variant.quantity -= item.quantity
            db.add(variant)

        else:
            # Không có variant_name → kiểm tra tổng kho
            stmt_variants = select(bike_models.BikeVariant).where(
                bike_models.BikeVariant.bike_id == item.product_id
            )
            result_variants = await db.execute(stmt_variants)
            variants = result_variants.scalars().all()

            total_qty = sum(v.quantity for v in variants)

            if total_qty < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Xe '{bike.name}' chỉ còn {total_qty} chiếc. Bạn không thể mua {item.quantity} chiếc."
                )

            remaining = item.quantity
            for v in variants:
                if remaining <= 0:
                    break
                deduct = min(v.quantity, remaining)
                v.quantity -= deduct
                remaining -= deduct
                db.add(v)

    # --- BƯỚC 2: XỬ LÝ MÃ GIẢM GIÁ ---
    if order_in.coupon_code:
        stmt = select(Coupon).where(Coupon.code == order_in.coupon_code.upper())
        result = await db.execute(stmt)
        used_coupon = result.scalar_one_or_none()

        if used_coupon:
            if (used_coupon.is_active and 
                used_coupon.expiration_date > datetime.now() and 
                used_coupon.used_count < used_coupon.usage_limit):
                
                if used_coupon.discount_type == 'percent':
                    discount = (final_price * used_coupon.discount_value) / 100
                else:
                    discount = used_coupon.discount_value
                
                final_price -= discount
                if final_price < 0: final_price = 0
                
                used_coupon.used_count += 1
                db.add(used_coupon)
            else:
                raise HTTPException(status_code=400, detail="Mã giảm giá không hợp lệ hoặc đã hết hạn.")
        else:
            raise HTTPException(status_code=404, detail="Mã giảm giá không tồn tại.")

    # --- BƯỚC 3: TẠO ĐƠN HÀNG ---
    
    # Logic fallback: Nếu thiếu địa chỉ chi tiết, dùng customer_address điền tạm
    full_address = order_in.customer_address or ""
    
    prov = order_in.province or "Đang cập nhật"
    dist = order_in.district or "Đang cập nhật"
    ward = order_in.ward or "Đang cập nhật"
    # address_detail ưu tiên lấy chi tiết, nếu ko có thì lấy full_address
    addr_detail = order_in.address_detail or full_address or "Đang cập nhật"

    new_order = models.Order(
        user_id=current_user.id,
        customer_name=order_in.customer_name,
        customer_phone=order_in.customer_phone,
        customer_email=order_in.customer_email,
        
        # ✅ Map dữ liệu đã xử lý vào Model
        province=prov,
        district=dist,
        ward=ward,
        address_detail=addr_detail,
        
        payment_method=order_in.payment_method,
        total_price=final_price, 
        note=order_in.note,
        status="pending"
    )
    
    db.add(new_order)
    await db.flush()

    # --- BƯỚC 4: LƯU CHI TIẾT ---
    for item in order_in.items:
        new_item = models.OrderItem(
            order_id=new_order.id,
            product_id=item.product_id,
            product_name=item.product_name,
            variant_name=item.variant_name,
            price=item.price,
            quantity=item.quantity,
            image_url=item.image_url
        )
        db.add(new_item)
    
    # 🟢 GHI LOG: Khách đặt hàng mới
    await create_log(
        db=db,
        user=current_user.username,
        action="Đặt hàng mới",
        target=f"Đơn #{new_order.id} ({len(order_in.items)} món)",
        status="success"
    )

    # 🔔 TẠO THÔNG BÁO (NOTIFICATION)
    # 1. Thông báo cho KHÁCH HÀNG
    notif_customer = Notification(
        user_id=current_user.id, 
        title="Đặt hàng thành công ✅",
        message=f"Đơn hàng #{new_order.id} của bạn đã được ghi nhận. Tổng tiền: {final_price:,.0f}đ."
    )
    db.add(notif_customer)

    # 2. Thông báo cho ADMIN/STAFF
    notif_admin = Notification(
        user_id=None,
        title="📦 Có đơn hàng mới!",
        message=f"Khách hàng {current_user.username} vừa đặt đơn #{new_order.id}. Kiểm tra ngay!"
    )
    db.add(notif_admin)

    await db.commit()
    await db.refresh(new_order)

    # Query lại để trả về response đầy đủ (kèm items)
    stmt = (
        select(models.Order)
        .options(selectinload(models.Order.items))
        .where(models.Order.id == new_order.id)
    )
    result = await db.execute(stmt)
    final_order = result.scalar_one()

    # ========================================================
    # 📧 GỬI EMAIL XÁC NHẬN (BACKGROUND TASK)
    # ========================================================
    if final_order.customer_email:
        # Chuẩn bị dữ liệu cho template email
        email_data = {
            "id": final_order.id,
            "created_at": final_order.created_at.strftime("%d/%m/%Y %H:%M"),
            "customer_name": final_order.customer_name,
            "payment_method": final_order.payment_method,
            "address": final_order.address_detail,
            "total_amount": final_order.total_price,
            "items": [
                {
                    "product_name": item.product_name,
                    "variant_name": item.variant_name,
                    "quantity": item.quantity,
                    "price": item.price
                } for item in final_order.items
            ]
        }
        
        # Thêm task gửi mail vào hàng đợi (không chặn response)
        background_tasks.add_task(
            send_order_confirmation_email, 
            final_order.customer_email, 
            email_data
        )
    # ========================================================

    return final_order

# ==========================================
# 2. KHÁCH HÀNG: XEM LỊCH SỬ ĐƠN
# ==========================================
@router.get("/my-orders", response_model=List[schemas.OrderResponse])
async def get_my_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(models.Order)
        .options(selectinload(models.Order.items))
        .where(models.Order.user_id == current_user.id)
        .order_by(desc(models.Order.created_at))
    )
    result = await db.execute(stmt)
    return result.scalars().all()

# ==========================================
# 3. QUẢN LÝ: XEM TOÀN BỘ ĐƠN (Admin & Staff)
# ==========================================
@router.get("/admin/all", response_model=List[schemas.OrderResponse])
async def get_all_orders_admin(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role not in ["admin", "staff"] and current_user.username != "admin":
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem danh sách đơn hàng")
    
    stmt = (
        select(models.Order)
        .options(selectinload(models.Order.items))
        .order_by(desc(models.Order.created_at))
    )
    result = await db.execute(stmt)
    return result.scalars().all()

# ==========================================
# 4. QUẢN LÝ: CẬP NHẬT TRẠNG THÁI (Admin & Staff)
# ==========================================
@router.put("/{order_id}/status")
async def update_order_status(
    order_id: int,
    status_update: schemas.OrderStatusUpdate, 
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role not in ["admin", "staff"] and current_user.username != "admin":
        raise HTTPException(status_code=403, detail="Bạn không có quyền cập nhật đơn hàng")
        
    stmt = select(models.Order).where(models.Order.id == order_id)
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Đơn hàng không tồn tại")
    
    old_status = order.status
    order.status = status_update.status

    # 🟢 GHI LOG
    log_status = "success" if order.status == "completed" else "warning"
    if order.status == "cancelled": log_status = "error"

    await create_log(
        db=db,
        user=current_user.username, 
        action="Cập nhật trạng thái",
        target=f"Đơn #{order_id} ({old_status} -> {order.status})",
        status=log_status
    )

    # 🔔 THÔNG BÁO CHO KHÁCH
    notif_update = Notification(
        user_id=order.user_id,
        title="Cập nhật đơn hàng 🚚",
        message=f"Đơn hàng #{order.id} của bạn đã chuyển sang trạng thái: {order.status.upper()}"
    )
    db.add(notif_update)

    await db.commit()
    
    return {"message": "Cập nhật trạng thái thành công", "status": order.status}

# ==========================================
# 5. CHI TIẾT ĐƠN HÀNG
# ==========================================
@router.get("/{order_id}", response_model=schemas.OrderResponse)
async def get_order_detail(
    order_id: int, 
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(models.Order)
        .options(selectinload(models.Order.items))
        .where(models.Order.id == order_id)
    )
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")
    
    is_manager = current_user.role in ["admin", "staff"] or current_user.username == "admin"
    if order.user_id != current_user.id and not is_manager:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem đơn này")
        
    return order