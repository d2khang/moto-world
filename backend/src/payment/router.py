from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from src.database import get_db
from src.auth.dependencies import get_current_user
from typing import Optional # Import thêm Optional

router = APIRouter()

# 1. API TẠO URL THANH TOÁN (ĐÃ SỬA)
@router.post("/create-url")
async def create_payment_url(
    order_id: int,
    amount: Optional[float] = None, # <--- THÊM THAM SỐ AMOUNT (nhận từ Frontend)
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Kiểm tra đơn hàng có tồn tại và thuộc về user không
    query = text("SELECT id, total_price FROM orders WHERE id = :id AND user_id = :uid")
    result = await db.execute(query, {"id": order_id, "uid": current_user.id})
    order = result.fetchone()
    
    if not order:
        raise HTTPException(status_code=404, detail="Đơn hàng không tồn tại")

    # --- LOGIC QUAN TRỌNG: ƯU TIÊN TIỀN CỌC ---
    # Nếu Frontend gửi 'amount' lên (tiền cọc) -> Dùng 'amount'
    # Nếu không gửi -> Dùng 'order[1]' (Tổng tiền trong database)
    final_amount = amount if amount else order[1]
    # ------------------------------------------

    # Tạo link giả lập chuyển hướng sang trang thanh toán
    # Truyền 'final_amount' vào URL thay vì 'order[1]'
    payment_url = f"http://localhost:8000/api/payment/gateway?order_id={order_id}&amount={final_amount}"
    
    return {"payment_url": payment_url}

# 2. TRANG GIAO DIỆN THANH TOÁN GIẢ (Giữ nguyên, chỉ đảm bảo hiển thị đúng số tiền nhận được)
@router.get("/gateway", response_class=HTMLResponse)
async def simulate_payment_page(order_id: int, amount: float):
    # Format tiền tệ cho đẹp
    formatted_amount = "{:,.0f}".format(amount).replace(",", ".")

    html_content = f"""
    <html>
        <head>
            <title>Cổng Thanh Toán MotoWorld</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-100 flex items-center justify-center h-screen">
            <div class="bg-white p-8 rounded-xl shadow-2xl w-96 text-center border-t-4 border-blue-600">
                <img src="https://vinadesign.vn/uploads/images/2023/05/vnpay-logo-vinadesign-25-12-57-55.jpg" alt="VNPay" class="w-32 mx-auto mb-6">
                <h2 class="text-xl font-bold text-gray-800 mb-2">Xác Nhận Thanh Toán</h2>
                <p class="text-gray-500 mb-6">Đơn hàng #{order_id}</p>
                
                <div class="bg-blue-50 p-4 rounded-lg mb-6">
                    <p class="text-sm text-blue-600 font-bold uppercase">Số tiền thanh toán</p>
                    <p class="text-3xl font-black text-blue-800">{formatted_amount} VNĐ</p>
                </div>

                <div class="mb-6">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ThanhToanDonHang_{order_id}_SoTien_{int(amount)}" class="mx-auto border p-2 rounded">
                    <p class="text-xs text-gray-400 mt-2">Quét mã QR để thanh toán thử nghiệm</p>
                </div>

                <div class="flex gap-3">
                    <a href="http://localhost:5173/cart" class="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition">Hủy bỏ</a>
                    
                    <form action="/api/payment/success" method="get" class="flex-1">
                        <input type="hidden" name="order_id" value="{order_id}">
                        <button type="submit" class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition shadow-lg shadow-blue-600/30">
                            Thanh Toán Ngay
                        </button>
                    </form>
                </div>
            </div>
        </body>
    </html>
    """
    return html_content

# 3. XỬ LÝ KHI THANH TOÁN THÀNH CÔNG (Giữ nguyên)
@router.get("/success")
async def payment_success(order_id: int, db: AsyncSession = Depends(get_db)):
    # Cập nhật trạng thái đơn hàng thành 'deposited' (Đã cọc) hoặc 'completed' tùy logic của bạn
    # Ở đây mình để 'deposited' để phân biệt với trả thẳng
    update_query = text("UPDATE orders SET status = 'deposited' WHERE id = :id")
    await db.execute(update_query, {"id": order_id})
    await db.commit()
    
    return RedirectResponse(url=f"http://localhost:5173/payment-result?status=success&order_id={order_id}")