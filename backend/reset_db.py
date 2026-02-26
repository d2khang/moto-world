import asyncio
from sqlalchemy import text
from src.database import engine

async def reset_tables():
    async with engine.begin() as conn:
        print("dang ket noi database...")
        # 1. Xóa bảng lịch sử cập nhật cũ
        await conn.execute(text("DROP TABLE IF EXISTS alembic_version;"))
        # 2. Xóa bảng users bị lỗi
        await conn.execute(text("DROP TABLE IF EXISTS users CASCADE;"))
        print("DA XOA THANH CONG! Database sach se.")

if __name__ == "__main__":
    asyncio.run(reset_tables())