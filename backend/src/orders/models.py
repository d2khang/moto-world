from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from src.database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Thông tin khách hàng
    customer_name = Column(String, nullable=False)
    customer_phone = Column(String, nullable=False)
    customer_email = Column(String, nullable=True)
    customer_address = Column(String, nullable=False)
    
    # Thông tin thanh toán
    payment_method = Column(String, default="cash")
    
    # --- SỬA Ở ĐÂY: Đổi total_amount thành total_price ---
    total_price = Column(Float, nullable=False, default=0.0)
    # -----------------------------------------------------

    status = Column(String, default="pending") 
    note = Column(Text, nullable=True) # Thêm cột ghi chú nếu cần
    created_at = Column(DateTime, default=datetime.utcnow)

    # Quan hệ
    user = relationship("src.auth.models.User", back_populates="orders") # Trỏ rõ đường dẫn để tránh lỗi vòng lặp
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    
    product_id = Column(Integer)
    product_name = Column(String)
    variant_name = Column(String, nullable=True)
    price = Column(Float)
    quantity = Column(Integer)
    image_url = Column(String, nullable=True)

    order = relationship("Order", back_populates="items")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(String)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)