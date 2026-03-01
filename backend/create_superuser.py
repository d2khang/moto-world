import asyncio
import sys
import os

# Đảm bảo Python tìm thấy thư mục 'src'
sys.path.append(os.getcwd())

from sqlalchemy import select
from src.database import AsyncSessionLocal 
from src.core.security import get_password_hash

# 👇 QUAN TRỌNG: Import TOÀN BỘ các Models có quan hệ với User
# Để SQLAlchemy hiểu được sơ đồ quan hệ (relationship)
from src.auth.models import User
from src.orders.models import Order
from src.notifications.models import Notification  # <--- Thêm cái này để fix lỗi mới nhất
from src.bikes.models import Bike                  # (Thêm dự phòng)
from src.coupons.models import Coupon              # (Thêm dự phòng)

async def create_superuser():
    print("========================================")
    print("   TẠO TÀI KHOẢN ADMIN (NHẬP TAY)")
    print("========================================")
    
    # 1. Nhập thông tin từ bàn phím
    username = input("👉 Nhập Username: ").strip()
    if not username:
        print("❌ Username không được để trống!")
        return

    email = input("👉 Nhập Email: ").strip()
    
    password = input("👉 Nhập Password: ").strip()
    if len(password) < 6:
        print("❌ Password quá ngắn (tối thiểu 6 ký tự).")
        return
        
    full_name = input("👉 Nhập Họ tên hiển thị (Enter để bỏ qua): ").strip()
    if not full_name:
        full_name = "Super Admin"

    # 2. Kết nối Database và xử lý
    async with AsyncSessionLocal() as db:
        try:
            # Kiểm tra xem user đã tồn tại chưa
            stmt = select(User).where(
                (User.username == username) | (User.email == email)
            )
            existing_user = (await db.execute(stmt)).scalar_one_or_none()
            
            if existing_user:
                print(f"❌ Lỗi: User '{username}' hoặc Email '{email}' đã tồn tại trong hệ thống!")
                return

            # Tạo user mới với quyền admin
            admin_user = User(
                username=username,
                email=email,
                hashed_password=get_password_hash(password),
                full_name=full_name,
                role="admin",        # <--- QUYỀN CAO NHẤT
                is_active=True,
                avatar=None
            )
            
            db.add(admin_user)
            await db.commit()
            print("----------------------------------------")
            print(f"✅ THÀNH CÔNG! Đã tạo Admin: {username}")
            print("----------------------------------------")
            
        except Exception as e:
            print(f"❌ Có lỗi xảy ra: {e}")
            await db.rollback()

if __name__ == "__main__":
    try:
        # Tắt cảnh báo DeprecationWarning (tùy chọn)
        import warnings
        warnings.filterwarnings("ignore", category=DeprecationWarning)

        if sys.platform == 'win32':
            asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
            
        asyncio.run(create_superuser())
    except KeyboardInterrupt:
        print("\nĐã hủy thao tác.")