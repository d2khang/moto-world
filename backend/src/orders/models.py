from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from src.database import Base

class Order(Base):
    """Bảng lưu trữ thông tin đơn hàng của khách hàng."""
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False) # Liên kết tới người mua
    
    # Thông tin khách hàng
    customer_name = Column(String, nullable=False)  # Tên người nhận
    customer_phone = Column(String, nullable=False) # Số điện thoại liên hệ
    customer_email = Column(String, nullable=True)  # Email nhận thông báo
    
    # --- CẢI TIẾN: TÁCH ĐỊA CHỈ CHI TIẾT ---
    province = Column(String, nullable=False)       # Tỉnh / Thành phố
    district = Column(String, nullable=False)       # Quận / Huyện
    ward = Column(String, nullable=False)           # Phường / Xã
    address_detail = Column(String, nullable=False) # Số nhà, tên đường cụ thể
    
    # --- CẢI TIẾN: HÌNH THỨC NHẬN HÀNG ---
    # Giá trị: 'showroom' (Nhận tại cửa hàng) hoặc 'delivery' (Giao tận nhà)
    order_type = Column(String, default="delivery") 
    shipping_fee = Column(Float, default=0.0)       # Phí vận chuyển (nếu có)
    # -------------------------------------
    
    payment_method = Column(String, default="cash") # Hình thức thanh toán (Tiền mặt/Chuyển khoản)
    total_price = Column(Float, nullable=False, default=0.0) # Tổng giá trị đơn hàng
    status = Column(String, default="pending")      # Trạng thái: pending, deposited, completed, cancelled
    note = Column(Text, nullable=True)               # Ghi chú của khách hàng
    created_at = Column(DateTime, default=datetime.utcnow) # Thời gian tạo đơn

    # Quan hệ: Một đơn hàng thuộc về một người dùng và có nhiều món hàng
    user = relationship("src.auth.models.User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    """Bảng lưu chi tiết từng sản phẩm trong một đơn hàng."""
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id")) # Liên kết tới đơn hàng chính
    
    product_id = Column(Integer)        # ID của xe
    product_name = Column(String)      # Tên xe tại thời điểm mua
    variant_name = Column(String, nullable=True) # Tên biến thể (nếu có)
    price = Column(Float)               # Giá tại thời điểm chốt đơn
    quantity = Column(Integer)          # Số lượng mua
    image_url = Column(String, nullable=True) # Ảnh sản phẩm khi mua

    order = relationship("Order", back_populates="items")