import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# --- 1. IMPORT CONFIG & BASE ---
from src.core.config import settings
from src.database import Base

# --- 2. IMPORT TẤT CẢ MODELS ---
from src.auth.models import User 
from src.bikes.models import (
    Bike, 
    Make, 
    Category, 
    Color, 
    BikeVariant, 
    BikeImage, 
    TechnicalSpecification
)
from src.orders.models import Order, OrderItem
from src.coupons.models import Coupon
from src.notifications.models import Notification

# SỬA LẠI DÒNG NÀY:
from src.logs.models import AuditLog 

# Nếu có thêm Promo
from src.promo.router import router as promo_router # Promo thường không có models riêng nếu chưa định nghĩa, nếu có thì import models
# (Lưu ý: Nếu src.promo chưa có file models.py chứa class cụ thể thì bỏ qua dòng import promo model)

# -------------------------------------------------------

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

config.set_main_option("sqlalchemy.url", str(settings.DATABASE_URL))

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()

async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()

def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()