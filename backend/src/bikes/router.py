import shutil
import uuid
import os
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, delete, update
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from pydantic import BaseModel

from src.database import get_db
from src.bikes.models import Make, Bike, BikeVariant, Category, Color, TechnicalSpecification, BikeImage
from src.bikes.schemas import BikeCreate, BikeResponse
from src.auth.dependencies import get_current_user
from src.auth.models import User 
from src.logs.utils import create_audit_log
from src.bikes.schemas import BikeVariantCreate
router = APIRouter()

# --- SCHEMA UPDATE (Định nghĩa tại đây để khớp với logic mới) ---
class BikeUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    type: Optional[str] = None
    
    # SỬA: Dùng color_id thay vì color string
    color_id: Optional[int] = None     
    
    price: Optional[float] = None
    discount_price: Optional[float] = None
    discount_end_date: Optional[str] = None
    engine_cc: Optional[int] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    
    # SỬA: Thêm các trường Flash Sale
    is_flash_sale: Optional[bool] = None
    flash_sale_price: Optional[float] = None
    flash_sale_start: Optional[str] = None 
    flash_sale_end: Optional[str] = None
    flash_sale_limit: Optional[int] = None

# --- HÀM KIỂM TRA QUYỀN ---
def check_staff_permission(user: User):
    if user.role not in ["admin", "staff"] and user.username != "admin":
        raise HTTPException(status_code=403, detail="Bạn không đủ quyền (Cần quyền Staff/Admin)")

# --- HÀM TỰ ĐỘNG TẠO ATTRIBUTE (Hãng, Loại) ---
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

# ==========================================
# 1. API TẠO XE MỚI (Full Option: Specs + Variants)
# ==========================================
@router.post("/", response_model=BikeResponse, status_code=status.HTTP_201_CREATED)
async def create_bike(
    bike_in: BikeCreate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    check_staff_permission(current_user)

    # 1. Tách dữ liệu
    bike_data = bike_in.model_dump()
    variants_data = bike_data.pop('variants', [])
    specs_data = bike_data.pop('specs', None) # Lấy dữ liệu Specs

    # 2. Xử lý Hãng xe & Loại xe
    await ensure_attributes_exist(db, brand=bike_data.get('brand'), type_=bike_data.get('type'))
    
    # Lấy ID hãng xe nếu chưa có
    if not bike_data.get('make_id') and bike_data.get('brand'):
        make = (await db.execute(select(Make).where(Make.name == bike_data.get('brand')))).scalar_one()
        bike_data['make_id'] = make.id
    
    bike_data.pop('brand', None) # Bỏ field brand thừa vì đã có make_id

    # 3. Tạo Slug
    if not bike_data.get('slug'):
        bike_data['slug'] = bike_data['name'].lower().strip().replace(" ", "-") + "-" + str(uuid.uuid4().hex[:4])

    # 4. Tạo đối tượng Xe
    new_bike = Bike(**bike_data)
    
    # 5. Thêm Biến thể (Variants)
    for variant in variants_data:
        new_bike.variants.append(BikeVariant(**variant))
    
    # 6. Thêm Thông số kỹ thuật (Specs) - MỚI
    if specs_data:
        new_specs = TechnicalSpecification(**specs_data)
        new_bike.specs = new_specs

    db.add(new_bike)
    
    try:
        await db.commit()
        await db.refresh(new_bike)
        
        # Reload để trả về full data
        result = await db.execute(
            select(Bike)
            .options(
                selectinload(Bike.make), 
                selectinload(Bike.variants),
                selectinload(Bike.specs), # Load thêm specs
                selectinload(Bike.images) # Load thêm ảnh
            )
            .where(Bike.id == new_bike.id)
        )
        return result.scalar_one()

    except IntegrityError as e:
        await db.rollback() 
        print(f"Lỗi DB: {e}")
        raise HTTPException(status_code=400, detail="Lỗi dữ liệu: Có thể trùng tên hoặc mã màu không tồn tại.")

# ==========================================
# 2. API UPLOAD GALLERY ẢNH (MỚI TOANH)
# ==========================================
@router.post("/{bike_id}/gallery", status_code=201)
async def upload_bike_gallery(
    bike_id: int,
    files: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload nhiều ảnh cùng lúc cho một xe"""
    check_staff_permission(current_user)

    # Kiểm tra xe có tồn tại không
    bike = await db.get(Bike, bike_id)
    if not bike:
        raise HTTPException(404, "Xe không tồn tại")

    saved_images = []
    
    # Tạo thư mục nếu chưa có
    upload_dir = "static/uploads/bikes"
    os.makedirs(upload_dir, exist_ok=True)

    for file in files:
        # Validate file ảnh
        if not file.content_type.startswith("image/"):
            continue
            
        file_ext = file.filename.split(".")[-1]
        unique_name = f"{bike_id}_{uuid.uuid4().hex[:8]}.{file_ext}"
        file_path = f"{upload_dir}/{unique_name}"
        
        # Lưu file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Tạo URL (Lưu ý: trên production nên dùng domain thật)
        url = f"http://localhost:8000/{file_path}"
        
        # Lưu vào DB
        new_img = BikeImage(bike_id=bike_id, image_url=url, is_primary=False)
        db.add(new_img)
        saved_images.append(url)

    await db.commit()
    return {"message": f"Đã upload {len(saved_images)} ảnh", "urls": saved_images}

# ==========================================
# 3. API SET ẢNH ĐẠI DIỆN (Set Primary)
# ==========================================
@router.put("/gallery/{image_id}/set-primary")
async def set_primary_image(
    image_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_staff_permission(current_user)
    
    # Lấy ảnh cần set
    target_img = await db.get(BikeImage, image_id)
    if not target_img:
        raise HTTPException(404, "Ảnh không tồn tại")
        
    # Reset tất cả ảnh của xe đó về false
    await db.execute(
        update(BikeImage)
        .where(BikeImage.bike_id == target_img.bike_id)
        .values(is_primary=False)
    )
    
    # Set ảnh này thành true
    target_img.is_primary = True
    
    # Cập nhật luôn vào bảng Bike (để query list nhanh hơn)
    bike = await db.get(Bike, target_img.bike_id)
    bike.image_url = target_img.image_url
    
    await db.commit()
    return {"message": "Đã đặt làm ảnh đại diện"}

# ==========================================
# 4. API LẤY CHI TIẾT XE (UPDATE: Load thêm Specs & Gallery)
# ==========================================
@router.get("/{bike_id}", response_model=BikeResponse)
async def get_bike(bike_id: int, db: AsyncSession = Depends(get_db)):
    query = (
        select(Bike)
        .where(Bike.id == bike_id)
        .options(
            selectinload(Bike.make), 
            selectinload(Bike.variants),
            selectinload(Bike.specs), # <--- Load Specs
            selectinload(Bike.images) # <--- Load Gallery
        )
    )
    result = await db.execute(query)
    bike = result.scalar_one_or_none()
    
    if not bike:
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại.")
    return bike

# ==========================================
# 5. API LIST BIKES (UPDATE: Logic lọc màu theo color_id hoặc Variant)
# ==========================================
@router.get("/")
async def list_bikes(
    page: int = Query(1, ge=1),
    size: int = Query(12, ge=1),
    brand: Optional[str] = None,
    type: Optional[str] = None,
    color: Optional[str] = None, # color ở đây là tìm theo tên
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    is_flash_sale: Optional[bool] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Bike).options(
        selectinload(Bike.make), 
        selectinload(Bike.variants),
        selectinload(Bike.images) # Load ảnh để hiển thị thumbnail
    )

    if brand: stmt = stmt.join(Make).where(Make.name.ilike(f"%{brand}%"))
    if type: stmt = stmt.where(Bike.type.ilike(f"%{type}%"))
    if is_flash_sale: stmt = stmt.where(Bike.is_flash_sale == True)
    
    # Logic tìm màu (Hỗ trợ cả bảng Color và Variant)
    if color:
        stmt = stmt.outerjoin(BikeVariant).outerjoin(Color).where(
            or_(
                Color.name.ilike(f"%{color}%"),
                BikeVariant.name.ilike(f"%{color}%")
            )
        ).distinct()

    if min_price: stmt = stmt.where(Bike.price >= min_price)
    if max_price: stmt = stmt.where(Bike.price <= max_price)

    # Đếm tổng
    count_stmt = select(func.count(func.distinct(Bike.id))).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    # Phân trang
    stmt = stmt.limit(size).offset((page - 1) * size)
    bikes = (await db.execute(stmt)).scalars().all()

    return {
        "items": bikes,
        "total": total,
        "page": page,
        "size": size,
        "total_pages": (total + size - 1) // size if total > 0 else 1
    }

# ==========================================
# 6. API XOÁ ẢNH TRONG GALLERY
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
    return {"message": "Đã xóa ảnh"}

# ==========================================
# 7. API CẬP NHẬT XE (ĐÃ FIX LỖI MissingGreenlet)
# ==========================================
@router.put("/{bike_id}", response_model=BikeResponse)
async def update_bike(
    bike_id: int, 
    bike_update: BikeUpdate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    check_staff_permission(current_user)

    # --- FIX: Load đầy đủ các quan hệ (Make, Variants, Specs, Images) ---
    query = (
        select(Bike)
        .where(Bike.id == bike_id)
        .options(
            selectinload(Bike.make),
            selectinload(Bike.variants),
            selectinload(Bike.specs),
            selectinload(Bike.images)
        )
    )
    # -------------------------------------------------------------------
    
    result = await db.execute(query)
    bike = result.scalar_one_or_none()
    if not bike: raise HTTPException(404, "Không tìm thấy sản phẩm.")
    
    # Cập nhật các trường
    update_data = bike_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if hasattr(bike, key):
             setattr(bike, key, value)
    
    await db.commit()
    
    # Không cần refresh đơn thuần, mà nên trả về object đã có đủ quan hệ
    # (Vì variants/specs/images đã được load ở trên và vẫn nằm trong session)
    return bike

# ==========================================
# 8. API XÓA XE
# ==========================================
@router.delete("/{bike_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bike(
    bike_id: int, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    check_staff_permission(current_user)
    bike = await db.get(Bike, bike_id)
    if not bike: raise HTTPException(404, "Sản phẩm không tồn tại.")
    
    await create_audit_log(db, current_user.username, "Xóa xe", f"Xe: {bike.name}", "warning")
    await db.delete(bike)
    await db.commit()
    return None
# ==========================================
# 9. API TẠO NHIỀU BIẾN THỂ (CHO QUY TRÌNH UPLOAD ẢNH TRƯỚC)
# ==========================================
@router.post("/{bike_id}/variants/bulk", status_code=201)
async def create_bulk_variants(
    bike_id: int,
    variants: List[BikeVariantCreate],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_staff_permission(current_user)
    
    bike = await db.get(Bike, bike_id)
    if not bike:
        raise HTTPException(404, "Xe không tồn tại")

    for v in variants:
        # Nếu variant gửi lên không có ảnh, thử lấy ảnh đại diện của xe
        img = v.image_url if v.image_url else bike.image_url
        new_variant = BikeVariant(
            bike_id=bike_id,
            name=v.name,
            price=v.price,
            quantity=v.quantity,
            image_url=img
        )
        db.add(new_variant)

    await db.commit()
    return {"message": f"Đã thêm {len(variants)} biến thể"}