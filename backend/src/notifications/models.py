from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from src.database import Base

class Notification(Base):
    __tablename__ = "notifications"
    
    # Giữ dòng này để tránh lỗi "Table defined" khi reload
    __table_args__ = {'extend_existing': True} 

    # Chỉ cần primary_key là đủ
    id = Column(Integer, primary_key=True)
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) 
    
    title = Column(String)
    message = Column(String)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now)
    
    # --- SỬA DÒNG NÀY (Dùng đường dẫn tuyệt đối) ---
    # Thay "User" -> "src.auth.models.User"
    user = relationship("src.auth.models.User", back_populates="notifications")