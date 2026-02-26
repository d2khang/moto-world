"""add_tech_specs_and_refactor_inventory

Revision ID: b9ccab6180c2
Revises: 8fab92f4835c
Create Date: 2026-02-26 20:53:43.030059

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b9ccab6180c2'
down_revision: Union[str, Sequence[str], None] = '8fab92f4835c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Tạo bảng technical_specifications (MỚI)
    op.create_table('technical_specifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('bike_id', sa.Integer(), nullable=True),
        sa.Column('engine_type', sa.String(), nullable=True),
        sa.Column('horsepower', sa.Float(), nullable=True),
        sa.Column('torque', sa.Float(), nullable=True),
        sa.Column('max_rpm', sa.Integer(), nullable=True),
        sa.Column('seat_height', sa.Integer(), nullable=True),
        sa.Column('weight', sa.Float(), nullable=True),
        sa.Column('fuel_capacity', sa.Float(), nullable=True),
        sa.Column('wheelbase', sa.Integer(), nullable=True),
        sa.Column('transmission', sa.String(), nullable=True),
        sa.Column('drive_type', sa.String(), nullable=True),
        sa.Column('front_brake', sa.String(), nullable=True),
        sa.Column('rear_brake', sa.String(), nullable=True),
        sa.Column('abs', sa.Boolean(), nullable=True),
        sa.Column('fuel_consumption', sa.Float(), nullable=True),
        sa.Column('top_speed', sa.Integer(), nullable=True),
        sa.Column('acceleration_0_100', sa.Float(), nullable=True),
        sa.ForeignKeyConstraint(['bike_id'], ['bikes.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('bike_id')
    )
    op.create_index(op.f('ix_technical_specifications_id'), 'technical_specifications', ['id'], unique=False)

    # 2. Thêm cột mới vào bike_variants
    op.add_column('bike_variants', sa.Column('color_code', sa.String(), nullable=True))
    op.add_column('bike_variants', sa.Column('is_available', sa.Boolean(), nullable=True))
    op.add_column('bike_variants', sa.Column('quantity', sa.Integer(), nullable=True, server_default='0'))

    # 3. Xóa quantity khỏi bikes (SQLite cần tạo lại bảng)
    # Bước 3a: Tạo bảng bikes_new không có quantity
    op.create_table('bikes_new',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=True),
        sa.Column('slug', sa.String(), nullable=True),
        sa.Column('make_id', sa.Integer(), nullable=True),
        sa.Column('brand', sa.String(), nullable=True),
        sa.Column('type', sa.String(), nullable=True),
        sa.Column('color', sa.String(), nullable=True),
        sa.Column('engine_cc', sa.Integer(), nullable=True),
        sa.Column('price', sa.Float(), nullable=True),
        sa.Column('discount_price', sa.Float(), nullable=True),
        sa.Column('discount_end_date', sa.DateTime(), nullable=True),
        sa.Column('image_url', sa.String(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['make_id'], ['makes.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_bikes_new_id', 'bikes_new', ['id'], unique=False)
    op.create_index('ix_bikes_new_name', 'bikes_new', ['name'], unique=False)
    op.create_index('ix_bikes_new_slug', 'bikes_new', ['slug'], unique=True)

    # Bước 3b: Copy dữ liệu sang bảng mới
    op.execute("""
        INSERT INTO bikes_new (id, name, slug, make_id, brand, type, color,
            engine_cc, price, discount_price, discount_end_date,
            image_url, description, is_active, created_at)
        SELECT id, name, slug, make_id, brand, type, color,
            engine_cc, price, discount_price, discount_end_date,
            image_url, description, is_active, created_at
        FROM bikes
    """)

    # Bước 3c: Xóa bảng cũ và đổi tên
    op.drop_index('ix_bikes_id', table_name='bikes')
    op.drop_index('ix_bikes_name', table_name='bikes')
    op.drop_index('ix_bikes_slug', table_name='bikes')
    op.drop_table('bikes')
    op.rename_table('bikes_new', 'bikes')
    op.execute("ALTER INDEX ix_bikes_new_id RENAME TO ix_bikes_id") if False else None  # SQLite không hỗ trợ, bỏ qua


def downgrade() -> None:
    # Xóa bảng technical_specifications
    op.drop_index(op.f('ix_technical_specifications_id'), table_name='technical_specifications')
    op.drop_table('technical_specifications')

    # Xóa cột thêm vào bike_variants
    op.drop_column('bike_variants', 'color_code')
    op.drop_column('bike_variants', 'is_available')

    # Thêm lại quantity vào bikes
    op.add_column('bikes', sa.Column('quantity', sa.Integer(), nullable=True, server_default='10'))