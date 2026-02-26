# File: backend/src/payment/router.py
# Mục đích: Xử lý thanh toán và tạo thông báo tự động khi đơn hàng thành công.

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select
from src.database import get_db
from src.auth.dependencies import get_current_user
from src.notifications.models import Notification # Import model thông báo
from src.orders.models import Order # Import model đơn hàng
from typing import Optional

router = APIRouter()

@router.post("/create-url")
async def create_payment_url(
    order_id: int,
    amount: Optional[float] = None,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = text("SELECT id, total_price FROM orders WHERE id = :id AND user_id = :uid")
    result = await db.execute(query, {"id": order_id, "uid": current_user.id})
    order = result.fetchone()
    
    if not order:
        raise HTTPException(status_code=404, detail="Đơn hàng không tồn tại")

    final_amount = amount if amount else order[1]
    payment_url = f"http://localhost:8000/api/payment/gateway?order_id={order_id}&amount={final_amount}"
    
    return {"payment_url": payment_url}

@router.get("/gateway", response_class=HTMLResponse)
async def simulate_payment_page(order_id: int, amount: float):
    formatted_amount = "{:,.0f}".format(amount).replace(",", ".")
    html_content = f"""
    <html>
        <head><title>Cổng Thanh Toán MotoWorld</title><script src="https://cdn.tailwindcss.com"></script></head>
        <body class="bg-gray-100 flex items-center justify-center h-screen">
            <div class="bg-white p-8 rounded-xl shadow-2xl w-96 text-center border-t-4 border-blue-600">
                <img src="https://vinadesign.vn/uploads/images/2023/05/vnpay-logo-vinadesign-25-12-57-55.jpg" class="w-32 mx-auto mb-6">
                <h2 class="text-xl font-bold text-gray-800 mb-2">Xác Nhận Thanh Toán</h2>
                <div class="bg-blue-50 p-4 rounded-lg mb-6">
                    <p class="text-sm text-blue-600 font-bold uppercase">Số tiền thanh toán</p>
                    <p class="text-3xl font-black text-blue-800">{formatted_amount} VNĐ</p>
                </div>
                <form action="/api/payment/success" method="get">
                    <input type="hidden" name="order_id" value="{order_id}">
                    <button type="submit" class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition">Thanh Toán Ngay</button>
                </form>
            </div>
        </body>
    </html>
    """
    return html_content

@router.get("/success")
async def payment_success(order_id: int, db: AsyncSession = Depends(get_db)):
    # 1. Cập nhật trạng thái đơn hàng sang 'deposited' (Đã cọc)
    update_query = text("UPDATE orders SET status = 'deposited' WHERE id = :id")
    await db.execute(update_query, {"id": order_id})
    
    # 2. Lấy thông tin user_id từ đơn hàng để gửi thông báo đúng người
    order_query = text("SELECT user_id FROM orders WHERE id = :id")
    order_result = await db.execute(order_query, {"id": order_id})
    order_data = order_result.fetchone()
    
    if order_data:
        user_id = order_data[0]
        # 3. Tạo thông báo mới tự động
        new_notification = Notification(
            user_id=user_id,
            message=f"Chúc mừng! Đơn hàng #{order_id} của bạn đã được thanh toán cọc thành công. Chúng tôi sẽ sớm liên hệ để hoàn tất thủ tục bàn giao xe.",
            is_read=False
        )
        db.add(new_notification)
    
    await db.commit()
    return RedirectResponse(url=f"http://localhost:5173/payment-result?status=success&order_id={order_id}")