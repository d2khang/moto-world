import shutil
import uuid
import os
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, delete, update, distinct
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from pydantic import BaseModel, field_validator
from datetime import datetime

from src.database import get_db
from src.bikes.models import Make, Bike, BikeVariant, BikeVariantImage, Category, Color, TechnicalSpecification, BikeImage
from src.bikes.schemas import BikeCreate, BikeResponse, BikeVariantCreate
from src.auth.dependencies import get_current_user
from src.auth.models import User
from src.logs.utils import create_audit_log

router = APIRouter()

# ==========================================
# SCHEMA CẬP NHẬT
# ==========================================
class BikeUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    type: Optional[str] = None
    color_id: Optional[int] = None
    price: Optional[float] = None
    discount_price: Optional[float] = None
    discount_end_date: Optional[datetime] = None
    engine_cc: Optional[int] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_flash_sale: Optional[bool] = None
    flash_sale_price: Optional[float] = None
    flash_sale_start: Optional[datetime] = None
    flash_sale_end: Optional[datetime] = None
    flash_sale_limit: Optional[int] = None
    specs: Optional[dict] = None

    @field_validator('discount_end_date', 'flash_sale_start', 'flash_sale_end', mode='before')
    @classmethod
    def parse_datetime_fields(cls, v):
        if v == "" or v is None:
            return None
        return v

# ==========================================
# ✅ HELPER: TÍNH GIÁ THỰC TẾ THEO THỜI GIAN
# ==========================================
def compute_active_price(bike: Bike) -> dict:
    """
    Tính giá hiển thị thực tế dựa trên thời điểm hiện tại.
    Ưu tiên: Flash Sale > Discount > Giá gốc
    """
    now = datetime.now()

    # 1. Kiểm tra Flash Sale có đang active không
    flash_active = (
        bike.is_flash_sale == True
        and bike.flash_sale_price is not None
        and (bike.flash_sale_start is None or bike.flash_sale_start <= now)
        and (bike.flash_sale_end is None or bike.flash_sale_end >= now)
    )
    if flash_active:
        return {
            "current_price": bike.flash_sale_price,
            "is_sale_active": True,
            "sale_type": "flash_sale",
            "is_flash_sale": True,
        }

    # 2. Kiểm tra Discount còn hạn không
    discount_active = (
        bike.discount_price is not None
        and (bike.discount_end_date is None or bike.discount_end_date >= now)
    )
    if discount_active:
        return {
            "current_price": bike.discount_price,
            "is_sale_active": True,
            "sale_type": "discount",
            "is_flash_sale": False,
        }

    # 3. Giá gốc
    return {
        "current_price": bike.price,
        "is_sale_active": False,
        "sale_type": None,
        "is_flash_sale": False,
    }

def serialize_bike(bike: Bike) -> dict:
    """Chuyển bike ORM object thành dict, thêm các trường giá thực tế."""
    price_info = compute_active_price(bike)

    # Serialize variants
    variants_list = []
    for v in (bike.variants or []):
        variants_list.append({
            "id": v.id,
            "name": v.name,
            "price": v.price,
            "quantity": v.quantity,
            "color_name": v.color_name,
            "color_hex": v.color_hex,
            "image_url": v.image_url,
            "is_available": v.is_available,
            "images": [{"id": img.id, "image_url": img.image_url, "is_primary": img.is_primary} for img in (v.images or [])],
        })

    return {
        "id": bike.id,
        "name": bike.name,
        "slug": bike.slug,
        "type": bike.type,
        "engine_cc": bike.engine_cc,
        "description": bike.description,
        "image_url": bike.image_url,
        "price": bike.price,
        "discount_price": bike.discount_price,
        "discount_end_date": bike.discount_end_date,
        "flash_sale_price": bike.flash_sale_price,
        "flash_sale_start": bike.flash_sale_start,
        "flash_sale_end": bike.flash_sale_end,
        "flash_sale_limit": bike.flash_sale_limit,
        "is_active": bike.is_active,
        "created_at": bike.created_at,
        "make": {"id": bike.make.id, "name": bike.make.name} if bike.make else None,
        "specs": bike.specs,
        "images": [{"id": img.id, "image_url": img.image_url, "is_primary": img.is_primary} for img in (bike.images or [])],
        "variants": variants_list,
        "total_quantity": bike.total_quantity,
        "in_stock": bike.in_stock,
        # ✅ Các trường giá thực tế - Frontend chỉ cần dùng current_price
        "current_price": price_info["current_price"],
        "is_sale_active": price_info["is_sale_active"],
        "sale_type": price_info["sale_type"],
        "is_flash_sale": price_info["is_flash_sale"],  # Trạng thái thực tế theo giờ
    }

# ==========================================
# HELPERS
# ==========================================
def check_staff_permission(user: User):
    if user.role not in ["admin", "staff"] and user.username != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không đủ quyền thực hiện thao tác này")

async def ensure_attributes_exist(db: AsyncSession, brand: str = None, type_: str = None):
    if brand:
        make = (await db.execute(select(Make).where(Make.name == brand))).scalar_one_or_none()
        if not make:
            db.add(Make(name=brand, slug=brand.lower().strip().replace(" ", "-")))
    if type_:
        cat = (await db.execute(select(Category).where(Category.name == type_))).scalar_one_or_none()
        if not cat:
            db.add(Category(name=type_, slug=type_.lower().strip().replace(" ", "-")))
    await db.flush()

def get_bike_with_relations(bike_id: int):
    return (
        select(Bike).where(Bike.id == bike_id).options(
            selectinload(Bike.make),
            selectinload(Bike.specs),
            selectinload(Bike.images),
            selectinload(Bike.variants).selectinload(BikeVariant.images)
        )
    )

# ==========================================
# API LẤY DỮ LIỆU BỘ LỌC
# ==========================================
@router.get("/filters")
async def get_bike_filters(db: AsyncSession = Depends(get_db)):
    makes = (await db.execute(select(Make.name).distinct().order_by(Make.name))).scalars().all()
    types = (await db.execute(select(Bike.type).distinct().where(Bike.type.isnot(None)))).scalars().all()

    colors_standard = (await db.execute(select(Color.name))).scalars().all()
    colors_variant = (await db.execute(
        select(BikeVariant.color_name)
        .where(BikeVariant.color_name.isnot(None))
        .where(BikeVariant.color_name != "")
        .distinct()
    )).scalars().all()

    unique_colors = set()
    if colors_standard: unique_colors.update([c.strip() for c in colors_standard if c])
    if colors_variant: unique_colors.update([c.strip() for c in colors_variant if c])
    final_colors = sorted(list(unique_colors))

    stats = (await db.execute(select(func.max(Bike.price).label("max_price"), func.max(Bike.engine_cc).label("max_cc")))).one_or_none()
    max_price = stats.max_price if stats and stats.max_price else 2000000000
    max_cc = stats.max_cc if stats and stats.max_cc else 1000

    return {"brands": makes, "types": types, "colors": final_colors, "max_price": max_price, "max_cc": max_cc}

# ==========================================
# 1. API TẠO XE MỚI
# ==========================================
@router.post("/", response_model=BikeResponse, status_code=status.HTTP_201_CREATED)
async def create_bike(
    bike_in: BikeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_staff_permission(current_user)
    bike_data = bike_in.model_dump()
    variants_data = bike_data.pop('variants', [])
    specs_data = bike_data.pop('specs', None)

    await ensure_attributes_exist(db, brand=bike_data.get('brand'), type_=bike_data.get('type'))

    if not bike_data.get('make_id') and bike_data.get('brand'):
        try:
            make = (await db.execute(select(Make).where(Make.name == bike_data.get('brand')))).scalar_one()
            bike_data['make_id'] = make.id
        except:
            pass

    bike_data.pop('brand', None)

    if not bike_data.get('slug'):
        bike_data['slug'] = bike_data['name'].lower().strip().replace(" ", "-") + "-" + str(uuid.uuid4().hex[:4])

    new_bike = Bike(**bike_data)

    for variant in variants_data:
        # ✅ Fallback color_name = name nếu không điền
        if not variant.get('color_name'):
            variant['color_name'] = variant.get('name', '')
        new_bike.variants.append(BikeVariant(**variant))

    if specs_data:
        new_bike.specs = TechnicalSpecification(**specs_data)

    db.add(new_bike)
    try:
        await db.commit()
        await db.refresh(new_bike)
        result = await db.execute(get_bike_with_relations(new_bike.id))
        return result.scalar_one()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Lỗi dữ liệu: Trùng tên hoặc lỗi ràng buộc.")

# ==========================================
# 2. API UPLOAD GALLERY XE
# ==========================================
@router.post("/{bike_id}/gallery", status_code=201)
async def upload_bike_gallery(
    bike_id: int,
    files: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_staff_permission(current_user)
    bike = await db.get(Bike, bike_id)
    if not bike:
        raise HTTPException(404, "Xe không tồn tại")

    saved_images = []
    upload_dir = "static/uploads/bikes"
    os.makedirs(upload_dir, exist_ok=True)

    for file in files:
        if not file.content_type.startswith("image/"):
            continue
        file_ext = file.filename.split(".")[-1]
        unique_name = f"{bike_id}_{uuid.uuid4().hex[:8]}.{file_ext}"
        file_path = f"{upload_dir}/{unique_name}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        url = f"http://localhost:8000/{file_path}"
        db.add(BikeImage(bike_id=bike_id, image_url=url, is_primary=False))
        saved_images.append(url)

    await db.commit()
    return {"message": f"Đã upload {len(saved_images)} ảnh", "urls": saved_images}

# ==========================================
# 3. API ĐẶT ẢNH ĐẠI DIỆN CHÍNH
# ==========================================
@router.put("/gallery/{image_id}/set-primary")
async def set_primary_image(
    image_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_staff_permission(current_user)
    target_img = await db.get(BikeImage, image_id)
    if not target_img:
        raise HTTPException(404, "Ảnh không tồn tại")
    await db.execute(update(BikeImage).where(BikeImage.bike_id == target_img.bike_id).values(is_primary=False))
    target_img.is_primary = True
    bike = await db.get(Bike, target_img.bike_id)
    bike.image_url = target_img.image_url
    await db.commit()
    return {"message": "Đã cập nhật ảnh đại diện mới"}

# ==========================================
# 4. API XOÁ ẢNH GALLERY XE
# ==========================================
@router.delete("/gallery/{image_id}")
async def delete_gallery_image(
    image_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_staff_permission(current_user)
    img = await db.get(BikeImage, image_id)
    if not img:
        raise HTTPException(404, "Ảnh không tồn tại")
    await db.delete(img)
    await db.commit()
    return {"message": "Đã xóa ảnh khỏi bộ sưu tập"}

# ==========================================
# 5. API LẤY CHI TIẾT XE ✅ Trả về current_price
# ==========================================
@router.get("/{bike_id}")
async def get_bike(bike_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(get_bike_with_relations(bike_id))
    bike = result.scalar_one_or_none()
    if not bike:
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại.")
    # ✅ Trả về dict đã có current_price tính sẵn
    return serialize_bike(bike)

# ==========================================
# 6. API DANH SÁCH XE ✅ Trả về current_price
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
    is_flash_sale: Optional[bool] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Bike).options(
        selectinload(Bike.make),
        selectinload(Bike.specs),
        selectinload(Bike.images),
        selectinload(Bike.variants).selectinload(BikeVariant.images)
    ).distinct()

    if brand:
        stmt = stmt.join(Make).where(Make.name.ilike(f"%{brand}%"))
    if type:
        stmt = stmt.where(Bike.type.ilike(f"%{type}%"))

    # ✅ Lọc flash sale theo thời gian thực
    if is_flash_sale:
        now = datetime.now()
        stmt = stmt.where(
            Bike.is_flash_sale == True,
            or_(Bike.flash_sale_start.is_(None), Bike.flash_sale_start <= now),
            or_(Bike.flash_sale_end.is_(None), Bike.flash_sale_end >= now)
        )

    if color:
        stmt = stmt.outerjoin(BikeVariant).outerjoin(Color).where(
            or_(
                Color.name.ilike(f"%{color}%"),
                BikeVariant.color_name.ilike(f"%{color}%")
            )
        )

    if min_price: stmt = stmt.where(Bike.price >= min_price)
    if max_price: stmt = stmt.where(Bike.price <= max_price)
    if min_cc is not None: stmt = stmt.where(Bike.engine_cc >= min_cc)
    if max_cc is not None and max_cc > 0: stmt = stmt.where(Bike.engine_cc <= max_cc)

    count_stmt = select(func.count(func.distinct(Bike.id))).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    stmt = stmt.order_by(Bike.created_at.desc()).limit(size).offset((page - 1) * size)
    bikes = (await db.execute(stmt)).scalars().all()

    # ✅ Serialize từng xe với current_price tính sẵn
    items = [serialize_bike(bike) for bike in bikes]

    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "total_pages": (total + size - 1) // size if total > 0 else 1
    }

# ==========================================
# 7. API CẬP NHẬT XE
# ==========================================
@router.put("/{bike_id}", response_model=BikeResponse)
async def update_bike(
    bike_id: int,
    bike_update: BikeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_staff_permission(current_user)
    result = await db.execute(get_bike_with_relations(bike_id))
    bike = result.scalar_one_or_none()
    if not bike:
        raise HTTPException(404, "Không tìm thấy xe")

    update_data = bike_update.model_dump(exclude_unset=True)
    specs_data = update_data.pop('specs', None)
    if specs_data:
        if bike.specs:
            for k, v in specs_data.items():
                if hasattr(bike.specs, k): setattr(bike.specs, k, v)
        else:
            bike.specs = TechnicalSpecification(**specs_data)

    for key, value in update_data.items():
        if hasattr(bike, key): setattr(bike, key, value)

    await db.commit()
    await db.refresh(bike)
    return bike

# ==========================================
# 8. API XOÁ XE
# ==========================================
@router.delete("/{bike_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bike(
    bike_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_staff_permission(current_user)
    bike = await db.get(Bike, bike_id)
    if not bike:
        raise HTTPException(404, "Sản phẩm không tồn tại.")
    await create_audit_log(db, current_user.username, "Xóa xe", f"Xe: {bike.name}", "warning")
    await db.delete(bike)
    await db.commit()
    return None

# ==========================================
# 9. API CẬP NHẬT BIẾN THỂ BULK
# ==========================================
@router.post("/{bike_id}/variants/bulk", status_code=201)
async def create_bulk_variants(
    bike_id: int,
    variants_in: List[BikeVariantCreate],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_staff_permission(current_user)
    bike = await db.get(Bike, bike_id)
    if not bike:
        raise HTTPException(404, "Xe không tồn tại")

    old_variants = (await db.execute(select(BikeVariant).where(BikeVariant.bike_id == bike_id))).scalars().all()
    for v in old_variants:
        await db.execute(delete(BikeVariantImage).where(BikeVariantImage.variant_id == v.id))
    await db.execute(delete(BikeVariant).where(BikeVariant.bike_id == bike_id))

    for v in variants_in:
        db.add(BikeVariant(
            bike_id=bike_id,
            name=v.name,
            price=v.price,
            quantity=v.quantity,
            # ✅ Fallback color_name = name nếu không điền
            color_name=v.color_name if v.color_name else v.name,
            color_hex=v.color_hex,
            image_url=v.image_url if v.image_url else bike.image_url
        ))

    await db.commit()
    return {"message": f"Đã cập nhật {len(variants_in)} phiên bản thành công"}

# ==========================================
# 10. API UPLOAD GALLERY BIẾN THỂ
# ==========================================
@router.post("/{bike_id}/variants/{variant_id}/gallery", status_code=201)
async def upload_variant_gallery(
    bike_id: int,
    variant_id: int,
    files: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_staff_permission(current_user)
    variant = await db.get(BikeVariant, variant_id)
    if not variant or variant.bike_id != bike_id:
        raise HTTPException(404, "Biến thể không tồn tại")

    saved = []
    upload_dir = f"static/uploads/variants/{variant_id}"
    os.makedirs(upload_dir, exist_ok=True)

    existing_primary = (await db.execute(
        select(BikeVariantImage).where(
            BikeVariantImage.variant_id == variant_id,
            BikeVariantImage.is_primary == True
        )
    )).scalar_one_or_none()

    for file in files:
        if not file.content_type.startswith("image/"):
            continue
        ext = file.filename.split(".")[-1]
        path = f"{upload_dir}/{uuid.uuid4().hex[:8]}.{ext}"
        with open(path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        url = f"http://localhost:8000/{path}"
        is_primary = (len(saved) == 0 and existing_primary is None)
        db.add(BikeVariantImage(variant_id=variant_id, image_url=url, is_primary=is_primary))
        if is_primary:
            variant.image_url = url
        saved.append(url)

    await db.commit()
    return {"message": f"Đã upload {len(saved)} ảnh cho biến thể", "urls": saved}

# ==========================================
# 11. API LẤY GALLERY BIẾN THỂ
# ==========================================
@router.get("/{bike_id}/variants/{variant_id}/gallery")
async def get_variant_gallery(bike_id: int, variant_id: int, db: AsyncSession = Depends(get_db)):
    variant = await db.get(BikeVariant, variant_id)
    if not variant or variant.bike_id != bike_id:
        raise HTTPException(404, "Biến thể không tồn tại")
    result = await db.execute(
        select(BikeVariantImage)
        .where(BikeVariantImage.variant_id == variant_id)
        .order_by(BikeVariantImage.is_primary.desc(), BikeVariantImage.created_at)
    )
    images = result.scalars().all()
    return {"variant_id": variant_id, "images": [{"id": img.id, "url": img.image_url, "is_primary": img.is_primary} for img in images]}

# ==========================================
# 12. API ĐẶT ẢNH PRIMARY BIẾN THỂ
# ==========================================
@router.put("/variants/gallery/{image_id}/set-primary")
async def set_variant_primary_image(image_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    check_staff_permission(current_user)
    target = await db.get(BikeVariantImage, image_id)
    if not target:
        raise HTTPException(404, "Ảnh không tồn tại")
    await db.execute(update(BikeVariantImage).where(BikeVariantImage.variant_id == target.variant_id).values(is_primary=False))
    target.is_primary = True
    variant = await db.get(BikeVariant, target.variant_id)
    variant.image_url = target.image_url
    await db.commit()
    return {"message": "Đã cập nhật ảnh đại diện biến thể"}

# ==========================================
# 13. API XOÁ ẢNH GALLERY BIẾN THỂ
# ==========================================
@router.delete("/variants/gallery/{image_id}")
async def delete_variant_gallery_image(image_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    check_staff_permission(current_user)
    img = await db.get(BikeVariantImage, image_id)
    if not img:
        raise HTTPException(404, "Ảnh không tồn tại")
    await db.delete(img)
    await db.commit()
    return {"message": "Đã xóa ảnh biến thể"}