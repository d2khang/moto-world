from sqlalchemy import Column, Integer, String, Float, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
from src.database import Base
from datetime import datetime

class Make(Base):
    __tablename__ = "makes"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    slug = Column(String, unique=True, index=True, nullable=True)
    image_url = Column(String, nullable=True)
    bikes = relationship("Bike", back_populates="make")

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    slug = Column(String, unique=True, nullable=True)

class Color(Base):
    __tablename__ = "colors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    hex_code = Column(String, nullable=True)

class BikeImage(Base):
    __tablename__ = "bike_images"
    id = Column(Integer, primary_key=True, index=True)
    bike_id = Column(Integer, ForeignKey("bikes.id", ondelete="CASCADE"))
    image_url = Column(String, nullable=False)
    is_primary = Column(Boolean, default=False)
    caption = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    bike = relationship("Bike", back_populates="images")

# ✅ MỚI: Ảnh riêng cho từng biến thể
class BikeVariantImage(Base):
    __tablename__ = "bike_variant_images"
    id = Column(Integer, primary_key=True, index=True)
    variant_id = Column(Integer, ForeignKey("bike_variants.id", ondelete="CASCADE"))
    image_url = Column(String, nullable=False)
    is_primary = Column(Boolean, default=False)
    caption = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    variant = relationship("BikeVariant", back_populates="images")

class TechnicalSpecification(Base):
    __tablename__ = "technical_specifications"
    id = Column(Integer, primary_key=True, index=True)
    bike_id = Column(Integer, ForeignKey("bikes.id", ondelete="CASCADE"), unique=True)
    power_hp = Column(Float, nullable=True)
    torque_nm = Column(Float, nullable=True)
    engine_type = Column(String, nullable=True)
    seat_height_mm = Column(Integer, nullable=True)
    weight_kg = Column(Integer, nullable=True)
    fuel_capacity_l = Column(Float, nullable=True)
    top_speed_kmh = Column(Integer, nullable=True)
    transmission = Column(String, nullable=True)
    bike = relationship("Bike", back_populates="specs")

class Bike(Base):
    __tablename__ = "bikes"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    slug = Column(String, unique=True, index=True, nullable=True)
    make_id = Column(Integer, ForeignKey("makes.id"), nullable=True)
    brand = Column(String, nullable=True)
    type = Column(String)
    color_id = Column(Integer, ForeignKey("colors.id"), nullable=True)
    engine_cc = Column(Integer)
    price = Column(Float)
    discount_price = Column(Float, nullable=True)
    discount_end_date = Column(DateTime, nullable=True)
    is_flash_sale = Column(Boolean, default=False)
    flash_sale_price = Column(Float, nullable=True)
    flash_sale_start = Column(DateTime, nullable=True)
    flash_sale_end = Column(DateTime, nullable=True)
    flash_sale_limit = Column(Integer, default=0)
    flash_sale_sold = Column(Integer, default=0)
    image_url = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    make = relationship("Make", back_populates="bikes")
    variants = relationship("BikeVariant", back_populates="bike", cascade="all, delete-orphan")
    specs = relationship("TechnicalSpecification", back_populates="bike", uselist=False, cascade="all, delete-orphan")
    color_data = relationship("Color")
    images = relationship("BikeImage", back_populates="bike", cascade="all, delete-orphan")

    # ✅ FIX: Tính tổng tồn kho đúng — trả về 0 nếu không có variant
    @hybrid_property
    def total_quantity(self):
        if not self.variants:
            return 0
        return sum(v.quantity or 0 for v in self.variants)

    @hybrid_property
    def in_stock(self):
        return self.total_quantity > 0


class BikeVariant(Base):
    __tablename__ = "bike_variants"
    id = Column(Integer, primary_key=True, index=True)
    bike_id = Column(Integer, ForeignKey("bikes.id"))
    name = Column(String)
    color_name = Column(String, nullable=True)   # ✅ Tên màu VD: "Đỏ GP"
    color_hex = Column(String, nullable=True)    # ✅ Mã màu VD: "#FF0000"
    price = Column(Float)
    image_url = Column(String, nullable=True)    # Ảnh đại diện biến thể
    quantity = Column(Integer, default=0)        # ✅ Default 0, không phải 5
    is_available = Column(Boolean, default=True)

    bike = relationship("Bike", back_populates="variants")
    images = relationship("BikeVariantImage", back_populates="variant", cascade="all, delete-orphan")  # ✅ Gallery ảnh biến thể