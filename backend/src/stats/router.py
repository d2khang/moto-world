from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract, desc
from datetime import datetime, date

from src.database import get_db
from src.auth.dependencies import get_current_user
from src.auth.models import User
from src.orders.models import Order, OrderItem
from src.bikes.models import Bike

router = APIRouter()

# --- HÀM KIỂM TRA QUYỀN (Dùng chung) ---
def check_permission(user: User):
    # Cho phép nếu là Admin HOẶC Staff
    if user.role not in ["admin", "staff"] and user.username != "admin":
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem thống kê")

# 1. TỔNG QUAN (Summary)
@router.get("/summary")
async def get_summary(
    start_date: date = None, 
    end_date: date = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    check_permission(current_user) # <--- Kiểm tra quyền

    # Xây dựng bộ lọc ngày
    date_filter = []
    if start_date: date_filter.append(func.date(Order.created_at) >= start_date)
    if end_date: date_filter.append(func.date(Order.created_at) <= end_date)

    # 1. Tổng doanh thu (chỉ tính đơn đã hoàn thành hoặc đã ship)
    revenue_query = select(func.sum(Order.total_price)).where(
        Order.status.in_(['completed', 'shipped']), 
        *date_filter
    )
    revenue_res = await db.execute(revenue_query)
    revenue = revenue_res.scalar() or 0

    # 2. Tổng đơn hàng
    orders_query = select(func.count(Order.id)).where(*date_filter)
    orders_res = await db.execute(orders_query)
    total_orders = orders_res.scalar() or 0

    # 3. Tổng xe trong kho
    bikes_query = select(func.sum(Bike.quantity))
    bikes_res = await db.execute(bikes_query)
    total_bikes = bikes_res.scalar() or 0

    # 4. Tổng thành viên
    users_query = select(func.count(User.id))
    users_res = await db.execute(users_query)
    total_users = users_res.scalar() or 0

    return {
        "revenue": revenue,
        "orders": total_orders,
        "bikes": total_bikes,
        "users": total_users
    }

# 2. BIỂU ĐỒ DOANH THU (Revenue Chart)
@router.get("/revenue-chart")
async def get_revenue_chart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    check_permission(current_user)

    # Lấy doanh thu theo tháng (trong năm nay)
    current_year = datetime.now().year
    stmt = (
        select(
            extract('month', Order.created_at).label('month'),
            func.sum(Order.total_price).label('total')
        )
        .where(
            extract('year', Order.created_at) == current_year,
            Order.status.in_(['completed', 'shipped'])
        )
        .group_by('month')
        .order_by('month')
    )
    result = await db.execute(stmt)
    rows = result.all()

    # Chuẩn hóa dữ liệu trả về frontend
    labels = [f"Tháng {int(r.month)}" for r in rows]
    data = [r.total for r in rows]

    return {"labels": labels, "data": data}

# 3. BIỂU ĐỒ THƯƠNG HIỆU (Brand Chart)
@router.get("/brand-chart")
async def get_brand_chart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    check_permission(current_user)

    # Đếm số lượng xe theo thương hiệu
    stmt = (
        select(Bike.brand, func.count(Bike.id))
        .group_by(Bike.brand)
    )
    result = await db.execute(stmt)
    rows = result.all()

    labels = [r[0] for r in rows]
    data = [r[1] for r in rows]

    return {"labels": labels, "data": data}

# 4. TOP XE BÁN CHẠY (Top Bikes)
@router.get("/top-bikes")
async def get_top_bikes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    check_permission(current_user)

    # Tính tổng số lượng bán ra của từng loại xe
    stmt = (
        select(
            OrderItem.product_name,
            func.sum(OrderItem.quantity).label('total_sold'),
            func.sum(OrderItem.price * OrderItem.quantity).label('total_revenue')
        )
        .join(Order, Order.id == OrderItem.order_id)
        .where(Order.status.in_(['completed', 'shipped'])) # Chỉ tính đơn thành công
        .group_by(OrderItem.product_name)
        .order_by(desc('total_sold'))
        .limit(5)
    )
    result = await db.execute(stmt)
    rows = result.all()

    return [
        {
            "name": r.product_name,
            "sold": r.total_sold,
            "revenue": r.total_revenue
        }
        for r in rows
    ]