from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_ # <--- QUAN TRỌNG: Thêm or_ để tìm kiếm linh hoạt
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from pydantic import BaseModel

from src.database import get_db
from src.bikes.models import Make, Bike, BikeVariant, Category, Color 
from src.bikes.schemas import BikeCreate, BikeResponse
from src.auth.dependencies import get_current_user
from src.auth.models import User 
from src.logs.utils import create_audit_log

router = APIRouter()

# --- SCHEMA NHẬP DỮ LIỆU THUỘC TÍNH ---
class AttributeCreate(BaseModel):
    name: str
    hex_code: Optional[str] = None

# --- SCHEMA UPDATE XE ---
class BikeUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    type: Optional[str] = None
    color: Optional[str] = None     
    price: Optional[float] = None
    discount_price: Optional[float] = None
    discount_end_date: Optional[str] = None
    engine_cc: Optional[int] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    quantity: Optional[int] = None

# --- HÀM KIỂM TRA QUYỀN ---
def check_staff_permission(user: User):
    if user.role not in ["admin", "staff"] and user.username != "admin":
        raise HTTPException(status_code=403, detail="Bạn không đủ quyền (Cần quyền Staff/Admin)")

# --- HÀM TỰ ĐỘNG TẠO THUỘC TÍNH NẾU CHƯA CÓ ---
async def ensure_attributes_exist(db: AsyncSession, brand: str = None, type_: str = None, color: str = None):
    # 1. Brand
    if brand:
        make = (await db.execute(select(Make).where(Make.name == brand))).scalar_one_or_none()
        if not make:
            db.add(Make(name=brand, slug=brand.lower().strip().replace(" ", "-")))

    # 2. Category
    if type_:
        cat = (await db.execute(select(Category).where(Category.name == type_))).scalar_one_or_none()
        if not cat:
            db.add(Category(name=type_, slug=type_.lower().strip().replace(" ", "-")))

    # 3. Color
    if color:
        col = (await db.execute(select(Color).where(Color.name == color))).scalar_one_or_none()
        if not col:
            db.add(Color(name=color))
            
    await db.flush()

# ==========================================
# 1. API LẤY DỮ LIỆU BỘ LỌC
# ==========================================
@router.get("/filters")
async def get_filters(db: AsyncSession = Depends(get_db)):
    makes = (await db.execute(select(Make.name).order_by(Make.name))).scalars().all()
    cats = (await db.execute(select(Category.name).order_by(Category.name))).scalars().all()
    colors = (await db.execute(select(Color.name).order_by(Color.name))).scalars().all()
    
    return {
        "brands": makes,
        "types": cats,
        "colors": colors
    }

# ==========================================
# 2. CÁC API THÊM BỘ LỌC THỦ CÔNG
# ==========================================
@router.post("/attributes/makes", status_code=201)
async def create_make_attribute(data: AttributeCreate, db: AsyncSession = Depends(get_db), u: User = Depends(get_current_user)):
    check_staff_permission(u)
    if (await db.execute(select(Make).where(Make.name == data.name))).scalar_one_or_none():
        raise HTTPException(400, "Hãng xe đã tồn tại")
    db.add(Make(name=data.name, slug=data.name.lower().replace(" ", "-")))
    await db.commit()
    return {"message": "Đã thêm hãng xe"}

@router.post("/attributes/categories", status_code=201)
async def create_category_attribute(data: AttributeCreate, db: AsyncSession = Depends(get_db), u: User = Depends(get_current_user)):
    check_staff_permission(u)
    if (await db.execute(select(Category).where(Category.name == data.name))).scalar_one_or_none():
        raise HTTPException(400, "Loại xe đã tồn tại")
    db.add(Category(name=data.name, slug=data.name.lower().replace(" ", "-")))
    await db.commit()
    return {"message": "Đã thêm loại xe"}

@router.post("/attributes/colors", status_code=201)
async def create_color_attribute(data: AttributeCreate, db: AsyncSession = Depends(get_db), u: User = Depends(get_current_user)):
    check_staff_permission(u)
    if (await db.execute(select(Color).where(Color.name == data.name))).scalar_one_or_none():
        raise HTTPException(400, "Màu sắc đã tồn tại")
    db.add(Color(name=data.name, hex_code=data.hex_code))
    await db.commit()
    return {"message": "Đã thêm màu sắc"}

# ==========================================
# 3. API TẠO XE MỚI (FIXED: LƯU TẤT CẢ BIẾN THỂ MÀU)
# ==========================================
@router.post("/", response_model=BikeResponse, status_code=status.HTTP_201_CREATED)
async def create_bike(
    bike_in: BikeCreate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    check_staff_permission(current_user)

    # 1. Chuẩn bị dữ liệu
    bike_data = bike_in.model_dump()
    variants_data = bike_data.pop('variants', [])
    
    # --- LOGIC MỚI: QUÉT TẤT CẢ BIẾN THỂ ĐỂ TẠO BỘ LỌC MÀU ---
    # Duyệt qua từng biến thể để thêm màu vào bảng Color nếu chưa có
    if variants_data:
        for variant in variants_data:
             await ensure_attributes_exist(db, color=variant.get('name'))
    
    # Nếu chưa nhập màu chính, lấy màu đầu tiên làm đại diện
    if not bike_data.get('color') and variants_data:
        bike_data['color'] = variants_data[0].get('name')
    # -------------------------------------------------------

    # 2. Tự động thêm bộ lọc Hãng/Loại vào Database nếu chưa có
    await ensure_attributes_exist(
        db, 
        brand=bike_data.get('brand'), 
        type_=bike_data.get('type'),
        color=bike_data.get('color') # Vẫn lưu màu chính
    )

    # 3. Xử lý Hãng xe
    make = (await db.execute(select(Make).where(Make.name == bike_data.get('brand')))).scalar_one()

    bike_data.pop('brand', None)
    bike_data.pop('make_id', None)

    if not bike_data.get('slug'):
        bike_data['slug'] = bike_data['name'].lower().strip().replace(" ", "-")

    # 4. Tạo Xe
    new_bike = Bike(**bike_data, make_id=make.id)
    
    # 5. Tạo Biến thể
    for variant in variants_data:
        new_bike.variants.append(BikeVariant(**variant))
    
    db.add(new_bike)
    try:
        await create_audit_log(
            db, 
            username=current_user.username,
            action="Thêm xe mới", 
            target=f"Xe: {new_bike.name}",
            details={"price": new_bike.price, "qty": new_bike.quantity}
        )
        
        await db.commit()
        
        result = await db.execute(
            select(Bike)
            .options(selectinload(Bike.make), selectinload(Bike.variants))
            .where(Bike.id == new_bike.id)
        )
        return result.scalar_one()
        
    except IntegrityError:
        await db.rollback() 
        raise HTTPException(status_code=400, detail="Sản phẩm đã tồn tại (trùng tên hoặc slug).")

# ==========================================
# 4. API LẤY DANH SÁCH XE (FIXED: TÌM MÀU TRONG CẢ BIẾN THỂ)
# ==========================================
@router.get("/")
async def list_bikes(
    page: int = Query(1, ge=1),
    size: int = Query(12, ge=1),
    brand: Optional[str] = None,
    type: Optional[str] = None,
    color: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_cc: Optional[int] = None,
    max_cc: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Bike).options(selectinload(Bike.make), selectinload(Bike.variants))

    if brand:
        stmt = stmt.join(Make).where(Make.name.ilike(f"%{brand}%"))
    if type:
        stmt = stmt.where(Bike.type.ilike(f"%{type}%"))
    
    # --- LOGIC TÌM KIẾM MÀU NÂNG CAO ---
    if color:
        # Tìm xe có Màu Chính chứa từ khóa HOẶC có Biến Thể chứa từ khóa
        stmt = stmt.outerjoin(BikeVariant).where(
            or_(
                Bike.color.ilike(f"%{color}%"),      # Màu chính (VD: Cam)
                BikeVariant.name.ilike(f"%{color}%") # Màu biến thể (VD: Xanh Dương Đậm)
            )
        ).distinct() # Dùng distinct để tránh 1 xe hiện nhiều lần nếu khớp nhiều biến thể
    # -----------------------------------

    if min_price is not None:
        stmt = stmt.where(Bike.price >= min_price)
    if max_price is not None:
        stmt = stmt.where(Bike.price <= max_price)
    if min_cc is not None:
        stmt = stmt.where(Bike.engine_cc >= min_cc)
    if max_cc is not None:
        stmt = stmt.where(Bike.engine_cc <= max_cc)

    # Đếm tổng số lượng (distinct ID để chính xác)
    count_stmt = select(func.count(func.distinct(Bike.id))).select_from(stmt.subquery())
    total_result = await db.execute(count_stmt)
    total_items = total_result.scalar() or 0

    offset = (page - 1) * size
    stmt = stmt.limit(size).offset(offset)
    
    result = await db.execute(stmt)
    bikes = result.scalars().all()

    return {
        "items": bikes,
        "total": total_items,
        "page": page,
        "size": size,
        "total_pages": (total_items + size - 1) // size if total_items > 0 else 1
    }

# ==========================================
# 5. API LẤY CHI TIẾT XE
# ==========================================
@router.get("/{bike_id}", response_model=BikeResponse)
async def get_bike(bike_id: int, db: AsyncSession = Depends(get_db)):
    query = select(Bike).where(Bike.id == bike_id).options(selectinload(Bike.make), selectinload(Bike.variants))
    result = await db.execute(query)
    bike = result.scalar_one_or_none()
    
    if not bike:
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại.")
    return bike

# ==========================================
# 6. API CẬP NHẬT XE (FIXED: CẬP NHẬT FILTER KHI ĐỔI MÀU)
# ==========================================
@router.put("/{bike_id}", response_model=BikeResponse)
async def update_bike(
    bike_id: int, 
    bike_update: BikeUpdate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    check_staff_permission(current_user)

    query = select(Bike).where(Bike.id == bike_id).options(selectinload(Bike.make), selectinload(Bike.variants))
    result = await db.execute(query)
    bike = result.scalar_one_or_none()
    if not bike: raise HTTPException(404, "Không tìm thấy sản phẩm.")
    
    # Tự động thêm bộ lọc mới nếu cần
    await ensure_attributes_exist(db, bike_update.brand, bike_update.type, bike_update.color)

    # Logic cập nhật Hãng xe
    if bike_update.brand and bike_update.brand != bike.brand:
        make = (await db.execute(select(Make).where(Make.name == bike_update.brand))).scalar_one()
        bike.make_id = make.id
        bike.brand = bike_update.brand

    # Cập nhật các trường khác
    old_price = bike.price
    old_qty = bike.quantity
    
    update_data = bike_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key != 'brand': 
            setattr(bike, key, value)
    
    # Ghi log
    if old_price != bike.price or old_qty != bike.quantity:
        await create_audit_log(
            db, 
            username=current_user.username,
            action="Cập nhật xe", 
            target=f"Xe #{bike.id} ({bike.name})",
            details={
                "price_change": f"{old_price:,.0f} -> {bike.price:,.0f}",
                "qty_change": f"{old_qty} -> {bike.quantity}"
            }
        )

    await db.commit()
    await db.refresh(bike)
    return bike

# ==========================================
# 7. API XÓA XE
# ==========================================
@router.delete("/{bike_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bike(
    bike_id: int, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    check_staff_permission(current_user)

    query = select(Bike).where(Bike.id == bike_id)
    result = await db.execute(query)
    bike = result.scalar_one_or_none()
    
    if not bike: raise HTTPException(404, "Sản phẩm không tồn tại.")
    
    await create_audit_log(db, current_user.username, "Xóa xe", f"Xe: {bike.name}", "warning")

    await db.delete(bike)
    await db.commit()
    return None