from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# --- 1. SCHEMA MỚI: THÔNG SỐ KỸ THUẬT (Specs) ---
class TechnicalSpecBase(BaseModel):
    power_hp: Optional[float] = None
    torque_nm: Optional[float] = None
    engine_type: Optional[str] = None
    seat_height_mm: Optional[int] = None
    weight_kg: Optional[int] = None
    fuel_capacity_l: Optional[float] = None
    top_speed_kmh: Optional[int] = None
    transmission: Optional[str] = None

class TechnicalSpecCreate(TechnicalSpecBase):
    pass

class TechnicalSpecResponse(TechnicalSpecBase):
    id: int
    class Config:
        from_attributes = True

# --- 2. SCHEMA MỚI: HÌNH ẢNH (Gallery) ---
class BikeImageResponse(BaseModel):
    id: int
    image_url: str
    is_primary: bool
    caption: Optional[str] = None
    class Config:
        from_attributes = True

# --- 3. SCHEMA BIẾN THỂ (Giữ nguyên, tối ưu nhẹ) ---
class BikeVariantBase(BaseModel):
    name: str
    price: float
    image_url: Optional[str] = None
    quantity: int = 5 

class BikeVariantCreate(BikeVariantBase):
    pass

class BikeVariantResponse(BikeVariantBase):
    id: int
    class Config:
        from_attributes = True

# --- 4. SCHEMA HÃNG XE (Giữ nguyên) ---
class MakeBase(BaseModel):
    name: str
    image_url: Optional[str] = None

class MakeResponse(MakeBase):
    id: int
    slug: Optional[str] = None
    class Config:
        from_attributes = True

# --- 5. SCHEMA XE (Bike) - NÂNG CẤP LỚN ---
class BikeBase(BaseModel):
    name: str
    brand: Optional[str] = None # Tên hãng (để hiển thị hoặc tạo mới)
    make_id: Optional[int] = None # ID hãng (ưu tiên dùng cái này)
    type: str
    
    # Màu sắc: Nhận cả ID hoặc Tên (linh hoạt cho Frontend)
    color_id: Optional[int] = None 
    
    engine_cc: int
    price: float
    
    # Khuyến mãi thường
    discount_price: Optional[float] = None
    discount_end_date: Optional[datetime] = None 
    
    # --- FLASH SALE (MỚI) ---
    is_flash_sale: bool = False
    flash_sale_price: Optional[float] = None
    flash_sale_start: Optional[datetime] = None
    flash_sale_end: Optional[datetime] = None
    flash_sale_limit: int = 0
    # -----------------------

    image_url: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True

class BikeCreate(BikeBase):
    # Nhận thêm danh sách biến thể và thông số kỹ thuật khi tạo
    variants: List[BikeVariantCreate] = []
    specs: Optional[TechnicalSpecCreate] = None 

class BikeResponse(BikeBase):
    id: int
    slug: Optional[str] = None
    created_at: Optional[datetime] = None
    
    # Các quan hệ trả về (Quan trọng để hiển thị Full thông tin)
    make: Optional[MakeResponse] = None
    variants: List[BikeVariantResponse] = []
    specs: Optional[TechnicalSpecResponse] = None
    images: List[BikeImageResponse] = [] # Trả về Gallery ảnh
    total_quantity: int = 0 # Lấy từ @hybrid_property
    
    class Config:
        from_attributes = True