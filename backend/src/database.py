from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from src.core.config import settings

# 1. Tạo động cơ kết nối (Async Engine)
# Thêm connect_args={"check_same_thread": False} riêng cho SQLite
engine = create_async_engine(
    settings.DATABASE_URL, 
    echo=True,
    connect_args={"check_same_thread": False}
)

# 2. Tạo phiên làm việc (Session Factory)
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)

# 3. Class cha cho tất cả các bảng (Models) sau này
class Base(DeclarativeBase):
    pass

# 4. Dependency Injection (Dùng để cấp DB Session cho API)
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()