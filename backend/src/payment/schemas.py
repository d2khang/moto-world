from pydantic import BaseModel
from typing import Optional

# 1. Schema dữ liệu gửi lên để tạo link thanh toán
class PaymentCreate(BaseModel):
    order_id: int
    amount: int  # Số tiền (VND)
    bank_code: Optional[str] = None  # Mã ngân hàng (NCB, VISA...)
    language: str = "vn"  # Ngôn ngữ giao diện thanh toán (vn/en)

# 2. Schema trả về URL thanh toán
class PaymentResponse(BaseModel):
    payment_url: str
    message: str = "Success"

# 3. Schema nhận kết quả trả về từ VNPAY (IPN hoặc Return URL)
class PaymentReturn(BaseModel):
    vnp_Amount: str
    vnp_BankCode: str
    vnp_OrderInfo: str
    vnp_ResponseCode: str
    vnp_TmnCode: str
    vnp_TransactionNo: str
    vnp_TxnRef: str
    vnp_SecureHash: str