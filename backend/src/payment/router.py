from fastapi import APIRouter

# 👇 ĐÂY MỚI LÀ CODE ROUTER CHUẨN
router = APIRouter()

@router.get("/")
async def get_payment_info():
    return {"message": "Payment API is working"}

@router.post("/create")
async def create_payment_url():
    # Logic tạo link thanh toán sẽ viết ở đây sau
    return {"payment_url": "https://sandbox.vnpayment.vn/..."}