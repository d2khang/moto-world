from groq import Groq
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import re

from src.database import get_db
from src.core.config import settings
from src.bikes.models import Bike

router = APIRouter()

# --- CẤU HÌNH GROQ ---
groq_client = None
if settings.GROQ_API_KEY:
    groq_client = Groq(api_key=settings.GROQ_API_KEY)
    print("✅ Groq đã sẵn sàng")
else:
    print("⚠️ Chưa tìm thấy GROQ_API_KEY")


class ChatRequest(BaseModel):
    message: str


# ===== FALLBACK: RULE-BASED =====
def rule_based_reply(message: str, bikes: list) -> str:
    msg = message.lower()

    # CHẶN CHỦ ĐỀ NGOÀI LỀ
    off_topic_keywords = [
        "chính trị", "bầu cử", "tổng thống", "chiến tranh", "quân sự",
        "phim", "nhạc", "ca sĩ", "diễn viên", "bóng đá", "thể thao",
        "nấu ăn", "công thức", "du lịch", "khách sạn", "nhà hàng",
        "cổ phiếu", "bitcoin", "crypto", "chứng khoán",
        "điện thoại", "laptop", "máy tính", "iphone", "samsung",
        "thời tiết", "tin tức", "báo", "game", "anime",
    ]
    if any(k in msg for k in off_topic_keywords):
        return "Xin lỗi, tôi chỉ có thể tư vấn về xe PKL tại **Moto World** thôi bạn nhé! 🏍️\n\nBạn cần tư vấn xe gì không?"

    # Chào hỏi
    if any(k in msg for k in ["hi", "chào", "hello", "hey", "alo"]):
        return "👋 Chào bạn! Tôi là trợ lý ảo của **Moto World**. Bạn cần tư vấn về dòng xe PKL nào không?"

    # Ngân sách
    match = re.search(r'(\d+)\s*(tr|triệu|tỷ)', msg)
    if match:
        amount = int(match.group(1))
        budget = amount * 1_000_000 if "tỷ" not in match.group(2) else amount * 1_000_000_000
        filtered = [b for b in bikes if b.price <= budget]
        if filtered:
            res = f"💡 Với ngân sách **{amount} {match.group(2)}**, đây là các mẫu xe phù hợp:\n\n"
            for b in filtered[:5]:
                res += f"- **{b.name}**: {b.price:,.0f} VNĐ\n"
            return res
        return f"Hiện chưa có xe nào trong tầm giá {amount} {match.group(2)}. Bạn có muốn nâng ngân sách không?"

    # Danh sách / giá xe
    if any(k in msg for k in ["giá", "bao nhiêu", "danh sách", "có xe gì", "xem xe"]):
        if not bikes:
            return "Kho xe đang cập nhật, bạn vui lòng quay lại sau nhé!"
        reply = "🏍️ **Showroom đang có sẵn các mẫu sau:**\n\n"
        for b in bikes[:8]:
            reply += f"- **{b.name}**: {b.price:,.0f} VNĐ\n"
        return reply

    # Liên hệ / địa chỉ
    if any(k in msg for k in ["địa chỉ", "ở đâu", "liên hệ", "số điện thoại", "hotline"]):
        return "📍 **Showroom Moto World**\n- Địa chỉ: 123 Đường Xe Máy, Quận 1, TP.HCM\n- Hotline: **1800-MOTO** (8:00 - 20:00)"

    # Cảm ơn
    if any(k in msg for k in ["cảm ơn", "thanks", "thank", "ok", "được rồi"]):
        return "😊 Không có gì! Nếu cần tư vấn thêm, bạn cứ hỏi nhé! 🏍️"

    # Mặc định
    return "🤔 Bạn có thể hỏi về: **Giá xe**, **Tư vấn ngân sách** hoặc **Địa chỉ showroom** nhé!"


# ===== MAIN HANDLER =====
@router.post("")
async def chat_with_ai(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    user_msg = request.message

    # Lấy dữ liệu xe từ DB
    query = select(Bike).where(Bike.is_active == True)
    result = await db.execute(query)
    bikes = result.scalars().all()

    bike_context = "\n".join([f"- {b.name} ({b.type}): {b.price:,.0f} VNĐ" for b in bikes])

    system_instruction = f"""Bạn là Moto AI, trợ lý ảo chuyên nghiệp của showroom Moto World.

PHẠM VI TRẢ LỜI - CHỈ hỗ trợ các chủ đề sau:
- Tư vấn, so sánh xe PKL (mô tô phân khối lớn) có trong kho
- Giá xe, chính sách trả góp, khuyến mãi
- Thông số kỹ thuật, bảo dưỡng xe PKL
- Thông tin showroom Moto World (địa chỉ, hotline, giờ mở cửa)

TUYỆT ĐỐI TỪ CHỐI các chủ đề sau (trả lời lịch sự và quay về chủ đề xe):
- Chính trị, thời sự, chiến tranh, bầu cử
- Giải trí: phim, nhạc, bóng đá, thể thao
- Ẩm thực, du lịch, khách sạn
- Tài chính: cổ phiếu, crypto, bitcoin
- Công nghệ: điện thoại, laptop, máy tính
- Bất kỳ chủ đề nào KHÔNG liên quan đến xe PKL và Moto World

Khi từ chối, luôn dùng mẫu câu: "Xin lỗi, tôi chỉ có thể tư vấn về xe PKL tại Moto World thôi bạn nhé! 🏍️ Bạn cần tư vấn xe gì không?"

DỮ LIỆU KHO XE THỰC TẾ:
{bike_context}

Trả lời bằng Tiếng Việt, ngắn gọn, thân thiện, dùng emoji hợp lý, định dạng Markdown."""

    # 1. Thử Groq
    try:
        if not groq_client:
            raise Exception("Groq chưa được cấu hình")

        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": user_msg}
            ],
            max_tokens=1024,
            temperature=0.7,
        )
        print("✅ Groq OK")
        return {"reply": response.choices[0].message.content, "source": "groq"}

    except Exception as e:
        print(f"⚠️ Groq lỗi: {str(e)[:80]} → dùng rule-based")

    # 2. Fallback rule-based
    reply = rule_based_reply(user_msg, bikes)
    print("✅ Rule-based OK")
    return {"reply": reply, "source": "fallback"}

