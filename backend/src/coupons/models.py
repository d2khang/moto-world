from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.sql import func
from src.database import Base

class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True) # Mã code (VD: TET2024)
    discount_type = Column(String) # "percent" hoặc "fixed"
    discount_value = Column(Float) # Giá trị giảm
    expiration_date = Column(DateTime) # Ngày hết hạn
    usage_limit = Column(Integer, default=100) # Giới hạn số lần dùng
    used_count = Column(Integer, default=0) # Đã dùng bao nhiêu lần
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())