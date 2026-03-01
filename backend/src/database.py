from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from src.core.config import settings

# 1. Tạo động cơ kết nối (Async Engine)
engine = create_async_engine(
    settings.DATABASE_URL, 
    echo=True,
    # connect_args={"check_same_thread": False} # Dòng này chỉ dùng cho SQLite, PostgreSQL không cần (có thể xóa hoặc comment lại)
)

# 2. Tạo Session Factory (Nơi khởi tạo AsyncSessionLocal)
# TUYỆT ĐỐI KHÔNG import AsyncSessionLocal ở đây
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)

# 3. Base Model
class Base(DeclarativeBase):
    pass

# 4. Dependency
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()