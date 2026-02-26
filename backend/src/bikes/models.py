from sqlalchemy import Column, Integer, String, Float, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from src.database import Base
from datetime import datetime

# 1. Bảng Hãng xe (Make)
class Make(Base):
    __tablename__ = "makes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    slug = Column(String, unique=True, index=True, nullable=True)
    image_url = Column(String, nullable=True)
    
    # Quan hệ với bảng Bike
    bikes = relationship("Bike", back_populates="make")

# 2. Bảng Loại xe (Category) - MỚI
class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True) # Ví dụ: Sport, Naked, Adventure
    slug = Column(String, unique=True, nullable=True)

# 3. Bảng Màu sắc (Color) - MỚI
class Color(Base):
    __tablename__ = "colors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True) # Ví dụ: Đen nhám, Xanh GP
    hex_code = Column(String, nullable=True) # Ví dụ: #000000 (Mã màu hiển thị chấm tròn)

# 4. Bảng Xe (Bike)
class Bike(Base):
    __tablename__ = "bikes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    slug = Column(String, unique=True, index=True, nullable=True)
    
    # Liên kết hãng xe 
    make_id = Column(Integer, ForeignKey("makes.id"), nullable=True)
    brand = Column(String, nullable=True) 
    
    type = Column(String)   # Sport, Naked... (Có thể link với Category.name)
    
    # --- CỘT MÀU SẮC (MỚI) ---
    color = Column(String, nullable=True) # Lưu tên màu chính (Ví dụ: Đen)
    # -------------------------

    engine_cc = Column(Integer)
    price = Column(Float)   
    
    # --- CỘT GIÁ KHUYẾN MÃI ---
    discount_price = Column(Float, nullable=True) 
    discount_end_date = Column(DateTime, nullable=True)

    image_url = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    
    quantity = Column(Integer, default=10) 
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)

    # Quan hệ
    make = relationship("Make", back_populates="bikes")
    variants = relationship("BikeVariant", back_populates="bike", cascade="all, delete-orphan")

# 5. Bảng Biến thể (BikeVariant)
class BikeVariant(Base):
    __tablename__ = "bike_variants"

    id = Column(Integer, primary_key=True, index=True)
    bike_id = Column(Integer, ForeignKey("bikes.id"))
    
    name = Column(String) 
    price = Column(Float) 
    image_url = Column(String, nullable=True)
    quantity = Column(Integer, default=5)
    
    bike = relationship("Bike", back_populates="variants")