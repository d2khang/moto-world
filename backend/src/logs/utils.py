from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from src.logs.models import AuditLog
import json

async def create_audit_log(
    db: AsyncSession, 
    # 1. Hứng các tham số cũ
    p_user_id: int = None,   
    p_username: str = None,  

    # 2. Các tham số Keyword
    action: str = "UNKNOWN", 
    target_type: str = "",
    target_id: int = 0,
    details: any = None,
    
    # 3. Các tham số mới
    admin_id: int = None,
    user_id: int = None,
    username: str = None,
    target: str = "",
    status: str = "success"
):
    # --- XỬ LÝ USERNAME ---
    final_user = username or p_username or "System"
    if not username and not p_username:
        if user_id: final_user = f"User:{user_id}"
        elif admin_id: final_user = f"Admin:{admin_id}"

    # --- XỬ LÝ ACTION (Việt hóa cho đẹp) ---
    readable_action = action
    if action == "CREATE_COUPON": readable_action = "Tạo mã giảm giá"
    elif action == "UPDATE_ORDER": readable_action = "Cập nhật đơn hàng"
    elif action == "CREATE_BIKE": readable_action = "Thêm xe mới"
    
    # --- XỬ LÝ TARGET (Làm đẹp nội dung) ---
    final_target = target
    
    # Nếu chưa có target (trường hợp gọi từ Coupon cũ) -> Tự tạo nội dung đẹp
    if not final_target:
        # Trường hợp Coupon
        if target_type == "COUPON" and isinstance(details, dict):
            code = details.get("code", "???")
            val = details.get("value", 0)
            final_target = f"Mã: {code} (Giảm {val}%)"
        
        # Trường hợp Bike (nếu có)
        elif target_type == "BIKE":
            final_target = f"Xe ID: {target_id}"

        # Trường hợp khác: Chỉ hiện text đơn giản
        else:
            final_target = str(details) if details else f"{target_type} #{target_id}"

    # --- TẠO LOG ---
    new_log = AuditLog(
        user=str(final_user),
        action=readable_action,  # Lưu hành động tiếng Việt/Dễ đọc
        target=str(final_target), # Lưu nội dung gọn gàng
        status=status,
        timestamp=datetime.now()
    )
    
    db.add(new_log)