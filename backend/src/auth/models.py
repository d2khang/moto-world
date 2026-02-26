from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from src.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String)
    
    full_name = Column(String, nullable=True)    
    phone_number = Column(String, nullable=True) 

    role = Column(String, default="user") 
    avatar = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 👇 THÊM 2 DÒNG NÀY ĐỂ LƯU MÃ OTP VÀ THỜI GIAN HẾT HẠN 👇
    otp_code = Column(String, nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)

    # --- CÁC QUAN HỆ ---
    orders = relationship("src.orders.models.Order", back_populates="user")
    notifications = relationship("src.notifications.models.Notification", back_populates="user", cascade="all, delete-orphan")