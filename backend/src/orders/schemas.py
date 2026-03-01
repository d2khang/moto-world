from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# 1. Schema cho từng món hàng (Chi tiết sản phẩm trong đơn)
class OrderItemSchema(BaseModel):
    product_id: int
    product_name: str
    variant_name: Optional[str] = None
    price: float
    quantity: int
    image_url: Optional[str] = None
    
    class Config:
        from_attributes = True

# 2. Schema dữ liệu Frontend gửi lên khi tạo đơn
class OrderCreate(BaseModel):
    # Thông tin khách hàng
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    
    # ✅ Địa chỉ chi tiết (Optional để không bắt buộc Frontend phải có)
    province: Optional[str] = None
    district: Optional[str] = None
    ward: Optional[str] = None
    address_detail: Optional[str] = None
    
    # ✅ Địa chỉ cũ (Fallback cho Frontend chưa update)
    customer_address: Optional[str] = None 
    
    note: Optional[str] = None
    payment_method: str = "cash"
    
    # Thông tin thanh toán & Khuyến mãi (Router cần dùng)
    total_amount: float            
    coupon_code: Optional[str] = None 
    
    items: List[OrderItemSchema]

# 3. Schema dùng để cập nhật trạng thái đơn (Admin dùng)
class OrderStatusUpdate(BaseModel):
    status: str

# 4. Schema trả về dữ liệu đơn hàng đầy đủ (Response)
class OrderResponse(BaseModel):
    id: int
    user_id: int
    
    customer_name: str
    customer_phone: str
    
    total_price: float
    status: str
    created_at: datetime
    
    # Địa chỉ trả về (Cho phép rỗng nếu DB chưa có)
    province: Optional[str] = ""
    district: Optional[str] = ""
    ward: Optional[str] = ""
    address_detail: Optional[str] = ""
    
    note: Optional[str] = None
    payment_method: str
    
    items: List[OrderItemSchema] = [] 

    class Config:
        from_attributes = True