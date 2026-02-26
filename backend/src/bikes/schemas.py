from pydantic import BaseModel, field_validator, model_validator, ConfigDict, computed_field
from typing import Optional, List
from datetime import datetime

# --- 1. THÔNG SỐ KỸ THUẬT ---
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
    model_config = ConfigDict(from_attributes=True)

# --- 2. ẢNH GALLERY ---
class BikeImageResponse(BaseModel):
    id: int
    image_url: str
    is_primary: bool
    caption: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# --- 3. ẢNH GALLERY BIẾN THỂ ---
class BikeVariantImageResponse(BaseModel):
    id: int
    image_url: str
    is_primary: bool
    caption: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# --- 4. BIẾN THỂ (VARIANTS) ---
class BikeVariantBase(BaseModel):
    name: str
    price: float
    color_name: Optional[str] = None
    color_hex: Optional[str] = None
    image_url: Optional[str] = None
    quantity: int = 0

    @field_validator('price', 'quantity', mode='before')
    @classmethod
    def parse_numeric_fields(cls, v):
        if v is None or v == '': return 0
        return float(str(v).replace(',', '').strip()) if isinstance(v, str) else v

class BikeVariantCreate(BikeVariantBase):
    pass

class BikeVariantResponse(BikeVariantBase):
    id: int
    is_available: bool = True
    images: List[BikeVariantImageResponse] = []
    model_config = ConfigDict(from_attributes=True)

# --- 5. HÃNG XE ---
class MakeResponse(BaseModel):
    id: int
    name: str
    slug: Optional[str] = None
    image_url: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# --- 6. XE (BIKE) ---
class BikeBase(BaseModel):
    name: str
    brand: Optional[str] = None
    make_id: Optional[int] = None
    type: str
    color_id: Optional[int] = None
    engine_cc: int
    price: float
    discount_price: Optional[float] = None
    discount_end_date: Optional[datetime] = None
    is_flash_sale: bool = False
    flash_sale_price: Optional[float] = None
    flash_sale_start: Optional[datetime] = None
    flash_sale_end: Optional[datetime] = None
    flash_sale_limit: int = 0
    image_url: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True

    @field_validator('price', 'discount_price', 'flash_sale_price', mode='before')
    @classmethod
    def parse_float_fields(cls, v):
        if v is None or v == '': return None
        return float(str(v).replace(',', '').strip()) if isinstance(v, str) else float(v)

    @field_validator('engine_cc', 'flash_sale_limit', mode='before')
    @classmethod
    def parse_int_fields(cls, v):
        if v is None or v == '': return 0
        return int(str(v).strip()) if isinstance(v, str) else int(v)

    @field_validator('discount_end_date', 'flash_sale_start', 'flash_sale_end', mode='before')
    @classmethod
    def parse_datetime_fields(cls, v):
        if v is None or v == '': return None
        return v

class BikeCreate(BikeBase):
    variants: List[BikeVariantCreate] = []
    specs: Optional[TechnicalSpecCreate] = None

class BikeResponse(BikeBase):
    id: int
    slug: Optional[str] = None
    created_at: Optional[datetime] = None
    make: Optional[MakeResponse] = None
    variants: List[BikeVariantResponse] = []
    specs: Optional[TechnicalSpecResponse] = None
    images: List[BikeImageResponse] = []
    
    # Chúng ta khai báo hai trường này để nhận dữ liệu
    total_quantity: int = 0
    in_stock: bool = False

    # ✅ BỔ SUNG: Hàm này sẽ tự động chạy trước khi gửi dữ liệu về React
    @model_validator(mode='after')
    def force_sync_quantity(self) -> 'BikeResponse':
        if self.variants:
            # Lấy danh sách màu, cộng dồn quantity của từng màu lại
            total = sum(v.quantity for v in self.variants if v.quantity is not None)
            self.total_quantity = total
            self.in_stock = total > 0
        else:
            # Nếu không có màu, lấy giá trị mặc định của xe (nếu có)
            self.total_quantity = getattr(self, 'quantity', 0) or 0
            self.in_stock = self.total_quantity > 0
        return self
    model_config = ConfigDict(from_attributes=True)