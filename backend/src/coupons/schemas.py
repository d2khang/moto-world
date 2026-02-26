from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CouponCreate(BaseModel):
    code: str
    discount_type: str # "percent" | "fixed"
    discount_value: float
    expiration_date: datetime
    usage_limit: int

class CouponResponse(CouponCreate):
    id: int
    used_count: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
class CouponValidateInput(BaseModel):
    code: str
    total_amount: float