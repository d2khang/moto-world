from pydantic import BaseModel
from datetime import datetime
from typing import Any, Optional

class AuditLogResponse(BaseModel):
    id: int
    admin_username: str
    action: str
    target_type: str
    details: Any
    created_at: datetime

    class Config:
        from_attributes = True