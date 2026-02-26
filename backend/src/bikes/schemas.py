from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# --- 1. SCHEMA CHO BIẾN THỂ (Variant) ---
class BikeVariantBase(BaseModel):
    name: str
    price: float
    image_url: Optional[str] = None
    quantity: int = 5 

class BikeVariantCreate(BikeVariantBase):
    pass

class BikeVariantResponse(BikeVariantBase):
    id: int
    bike_id: int
    
    class Config:
        from_attributes = True

# --- 2. SCHEMA CHO HÃNG XE (Make) ---
class MakeBase(BaseModel):
    name: str
    image_url: Optional[str] = None

class MakeCreate(MakeBase):
    slug: Optional[str] = None

class MakeResponse(MakeBase):
    id: int
    slug: Optional[str] = None
    
    class Config:
        from_attributes = True

# --- 3. SCHEMA CHO XE (Bike) ---
class BikeBase(BaseModel):
    name: str
    brand: Optional[str] = None
    type: str
    
    # --- THÊM MỚI: MÀU SẮC ---
    color: Optional[str] = None 
    # -------------------------

    engine_cc: int
    price: float
    
    # --- GIÁ KHUYẾN MÃI ---
    discount_price: Optional[float] = None
    discount_end_date: Optional[datetime] = None 
    # --------------------------------

    image_url: Optional[str] = None
    description: Optional[str] = None
    quantity: int = 10 
    is_active: bool = True

class BikeCreate(BikeBase):
    make_id: Optional[int] = None
    variants: List[BikeVariantCreate] = [] # Danh sách biến thể kèm theo khi tạo xe

class BikeResponse(BikeBase):
    id: int
    slug: Optional[str] = None
    created_at: Optional[datetime] = None
    make: Optional[MakeResponse] = None
    variants: List[BikeVariantResponse] = []
    
    class Config:
        from_attributes = True