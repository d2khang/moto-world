import google.generativeai as genai
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import re

from src.database import get_db
from src.core.config import settings
from src.bikes.models import Bike

router = APIRouter()

# Cấu hình Gemini
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
else:
    print("⚠️ CẢNH BÁO: Chưa tìm thấy GEMINI_API_KEY")

generation_config = {
    "temperature": 0.7,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 1024,
}

class ChatRequest(BaseModel):
    message: str

# ===== BỘ NÃO DỰ PHÒNG (RULE-BASED) - CHẠY LOCAL 100% =====
def rule_based_reply(message: str, bikes: list) -> str:
    msg = message.lower()

    # 1. Chào hỏi
    if any(k in msg for k in ["hi", "chào", "hello"]):
        return "👋 Chào bạn! Tôi là trợ lý ảo của **Moto World**. Bạn cần tư vấn về dòng xe PKL nào không?"

    # 2. Xử lý ngân sách (Ví dụ: "xe dưới 600tr", "tầm 500 triệu")
    match = re.search(r'(\d+)\s*(tr|triệu|tỷ)', msg)
    if match:
        amount = int(match.group(1))
        budget = amount * 1_000_000 if "tỷ" not in match.group(2) else amount * 1_000_000_000
        
        # Lọc xe theo giá
        filtered = [b for b in bikes if b.price <= budget]
        if filtered:
            res = f"💡 Với ngân sách khoảng **{amount} {match.group(2)}**, đây là các mẫu xe dành cho bạn:\n\n"
            for b in filtered[:5]:
                res += f"- **{b.name}**: {b.price:,.0f} VNĐ\n"
            return res
        return f"Hiện tại showroom chưa có xe nào trong tầm giá {amount} {match.group(2)}. Bạn có muốn nâng ngân sách lên một chút không?"

    # 3. Tra cứu danh sách xe / Báo giá chung
    if any(k in msg for k in ["giá", "bao nhiêu", "danh sách", "có xe gì"]):
        if not bikes: return "Kho xe đang cập nhật, bạn vui lòng quay lại sau nhé!"
        reply = "🏍️ **Showroom đang có sẵn các mẫu sau:**\n\n"
        for b in bikes[:8]:
            reply += f"- **{b.name}**: {b.price:,.0f} VNĐ\n"
        return reply

    # 4. Địa chỉ & Liên hệ
    if any(k in msg for k in ["địa chỉ", "ở đâu", "liên hệ", "số điện thoại"]):
        return "📍 **Showroom Moto World**\n- Địa chỉ: 123 Đường Xe Máy, Quận 1, TP.HCM\n- Hotline: **1800-MOTO** (8:00 - 20:00)"

    return "🤔 Tôi chưa rõ ý bạn. Bạn có thể hỏi về: **Giá xe**, **Tư vấn theo ngân sách (ví dụ: xe dưới 500tr)** hoặc **Địa chỉ showroom** nhé!"

# ===== MAIN HANDLER =====
@router.post("")
async def chat_with_ai(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    user_msg = request.message
    
    # Luôn lấy dữ liệu xe từ DB để sẵn sàng cho cả AI và Fallback
    query = select(Bike).where(Bike.is_active == True)
    result = await db.execute(query)
    bikes = result.scalars().all()

    # Chuẩn bị Context cho AI
    bike_context = "\n".join([f"- {b.name} ({b.type}): {b.price:,.0f} VNĐ" for b in bikes])
    system_instruction = f"Bạn là Moto AI. Tư vấn xe dựa trên danh sách: {bike_context}. Trả lời ngắn, dùng emoji."

    try:
        # ƯU TIÊN DÙNG AI (Dùng bản 1.5 Flash cho ổn định Quota)
        chat_model = genai.GenerativeModel(
            model_name="gemini-1.5-flash", 
            generation_config=generation_config,
            system_instruction=system_instruction
        )
        response = chat_model.generate_content(user_msg)
        return {"reply": response.text, "source": "ai"}

    except Exception as e:
        error_str = str(e)
        # Nếu gặp lỗi 404 (Không tìm thấy model) hoặc 429 (Hết lượt dùng)
        if any(code in error_str for code in ["404", "429", "quota", "limit"]):
            print(f"⚠️ Chế độ Demo: AI đang bận/lỗi, chuyển sang bộ não dự phòng.")
            reply = rule_based_reply(user_msg, bikes)
            return {"reply": reply, "source": "fallback"}
        
        # Các lỗi khác
        return {"reply": "Chào bạn, Moto AI đây! Bạn cần hỏi về mẫu xe nào trong cửa hàng không?"}