# File: backend/src/bikes/models.py
# Phiên bản: ULTIMATE (Đầy đủ tính năng)
# Mục đích: Quản lý xe, biến thể, hình ảnh, thông số kỹ thuật, màu sắc và Flash Sale.

from sqlalchemy import Column, Integer, String, Float, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
from src.database import Base
from datetime import datetime

# 1. Bảng Hãng xe
class Make(Base):
    __tablename__ = "makes"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    slug = Column(String, unique=True, index=True, nullable=True)
    image_url = Column(String, nullable=True)
    bikes = relationship("Bike", back_populates="make")

# 2. Bảng Loại xe
class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    slug = Column(String, unique=True, nullable=True)

# 3. Bảng Màu sắc (Chuẩn hóa)
class Color(Base):
    __tablename__ = "colors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)       # Ví dụ: Đen nhám
    hex_code = Column(String, nullable=True) # Ví dụ: #000000

# 4. Bảng Thư viện ảnh (Gallery)
class BikeImage(Base):
    __tablename__ = "bike_images"
    id = Column(Integer, primary_key=True, index=True)
    bike_id = Column(Integer, ForeignKey("bikes.id", ondelete="CASCADE"))
    
    image_url = Column(String, nullable=False)
    is_primary = Column(Boolean, default=False)
    caption = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow) # Chuẩn UTC

    bike = relationship("Bike", back_populates="images")

# 5. Bảng Thông số kỹ thuật
class TechnicalSpecification(Base):
    __tablename__ = "technical_specifications"
    id = Column(Integer, primary_key=True, index=True)
    bike_id = Column(Integer, ForeignKey("bikes.id", ondelete="CASCADE"), unique=True)
    
    power_hp = Column(Float, nullable=True)        # Mã lực
    torque_nm = Column(Float, nullable=True)       # Mô-men xoắn
    engine_type = Column(String, nullable=True)    # Loại động cơ
    seat_height_mm = Column(Integer, nullable=True) # Chiều cao yên
    weight_kg = Column(Integer, nullable=True)      # Trọng lượng
    fuel_capacity_l = Column(Float, nullable=True)  # Bình xăng
    top_speed_kmh = Column(Integer, nullable=True)  # Tốc độ tối đa
    transmission = Column(String, nullable=True)    # Hộp số

    bike = relationship("Bike", back_populates="specs")

# 6. Bảng Xe (Trung tâm)
class Bike(Base):
    __tablename__ = "bikes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    slug = Column(String, unique=True, index=True, nullable=True)
    
    make_id = Column(Integer, ForeignKey("makes.id"), nullable=True)
    brand = Column(String, nullable=True) 
    type = Column(String)   
    
    # Liên kết màu sắc
    color_id = Column(Integer, ForeignKey("colors.id"), nullable=True)

    engine_cc = Column(Integer)
    price = Column(Float)   
    
    # Ưu đãi thường
    discount_price = Column(Float, nullable=True) 
    discount_end_date = Column(DateTime, nullable=True)

    # --- TÍNH NĂNG FLASH SALE (Đã bổ sung lại) ---
    is_flash_sale = Column(Boolean, default=False)
    flash_sale_price = Column(Float, nullable=True)
    flash_sale_start = Column(DateTime, nullable=True)
    flash_sale_end = Column(DateTime, nullable=True)
    flash_sale_limit = Column(Integer, default=0)
    flash_sale_sold = Column(Integer, default=0)
    # ---------------------------------------------

    image_url = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow) # Chuẩn UTC

    # Quan hệ
    make = relationship("Make", back_populates="bikes")
    variants = relationship("BikeVariant", back_populates="bike", cascade="all, delete-orphan")
    specs = relationship("TechnicalSpecification", back_populates="bike", uselist=False, cascade="all, delete-orphan")
    color_data = relationship("Color")
    images = relationship("BikeImage", back_populates="bike", cascade="all, delete-orphan")

    # Tự động tính tổng tồn kho
    @hybrid_property
    def total_quantity(self):
        if self.variants:
            return sum(variant.quantity for variant in self.variants)
        return 0

# 7. Bảng Biến thể
class BikeVariant(Base):
    __tablename__ = "bike_variants"

    id = Column(Integer, primary_key=True, index=True)
    bike_id = Column(Integer, ForeignKey("bikes.id"))
    
    name = Column(String) 
    price = Column(Float) 
    image_url = Column(String, nullable=True)
    
    # Quản lý số lượng tại đây
    quantity = Column(Integer, default=5)
    
    bike = relationship("Bike", back_populates="variants")