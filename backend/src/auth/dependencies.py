from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.database import get_db
from src.core.config import settings
from src.auth.models import User


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    # 1. In ra Token mà Backend nhận được từ Frontend
    print(f"\n[DEBUG] Token nhận được từ React: {token}") 
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        # 2. In ra dữ liệu bên trong Token sau khi giải mã
        print(f"[DEBUG] Dữ liệu trong Token (Payload): {payload}")
        
        username: str = payload.get("sub")
        if username is None:
            print("[DEBUG] LỖI: Không tìm thấy 'sub' (username) trong Token!")
            raise credentials_exception
            
    except JWTError as e:
        # 3. In ra lỗi nếu Token bị sai chữ ký hoặc hết hạn
        print(f"[DEBUG] LỖI GIẢI MÃ TOKEN: {e}")
        raise credentials_exception
        
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    
    if user is None:
        # 4. In ra nếu Token đúng nhưng trong Database lại không có người này
        print(f"[DEBUG] LỖI DB: Không tìm thấy tài khoản nào có username là '{username}'!")
        raise credentials_exception
        
    print(f"[DEBUG] XÁC THỰC THÀNH CÔNG: Chào mừng {user.username}!\n")
    return user
async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    # Logic: Username là "admin" HOẶC role là "admin"
    if current_user.username == "admin" or current_user.role == "admin":
        return current_user
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN, 
        detail="Bạn không có quyền Admin"
    )

# --- SỬA HÀM NÀY ---
async def get_superuser(current_user: User = Depends(get_current_user)) -> User:
    # Logic cũ: chỉ check current_user.is_superuser (bị lỗi khi db mới chưa set true)
    # Logic MỚI: Nếu username là "admin" THÌ CHO PHÉP LUÔN
    if current_user.username == "admin" or current_user.is_superuser:
        return current_user
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN, 
        detail="Chức năng này chỉ dành cho Chủ Cửa Hàng (Super Admin)"
    )