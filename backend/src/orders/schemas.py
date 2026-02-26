from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# --- 1. Schema cho từng item trong đơn hàng ---
class OrderItemSchema(BaseModel):
    product_id: Optional[int] = None
    product_name: str
    variant_name: Optional[str] = None
    price: float
    quantity: int
    image_url: Optional[str] = None

    class Config:
        from_attributes = True

# --- 2. Schema khi gửi dữ liệu tạo đơn hàng từ Frontend ---
class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None 
    customer_address: str
    payment_method: Optional[str] = "cash" 
    items: List[OrderItemSchema] 
    total_amount: float # Frontend gửi số tiền với tên này
    note: Optional[str] = None
    coupon_code: Optional[str] = None

# --- 3. Schema cập nhật trạng thái (QUAN TRỌNG) ---
class OrderStatusUpdate(BaseModel):
    status: str # "pending", "confirmed", "shipped", "completed", "cancelled"

# --- 4. Schema phản hồi dữ liệu về cho Frontend ---
class OrderResponse(BaseModel):
    id: int
    user_id: int # Thêm trường này để Admin biết đơn của ai
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    customer_address: str
    payment_method: Optional[str] = None
    total_price: float 
    status: str
    created_at: datetime
    items: List[OrderItemSchema]

    class Config:
        from_attributes = True