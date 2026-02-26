from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from src.database import Base

class AuditLog(Base):  # <--- Đổi tên thành AuditLog
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user = Column(String, index=True)
    action = Column(String)
    target = Column(String)
    status = Column(String)
    timestamp = Column(DateTime, default=datetime.now)