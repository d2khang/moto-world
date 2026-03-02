# File: backend/src/notifications/email_service.py
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from src.core.config import settings
from typing import List, Dict

# Cấu hình kết nối
conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

async def send_order_confirmation_email(email_to: str, order_data: Dict):
    """
    Hàm gửi email xác nhận đơn hàng (Chạy background)
    """
    
    # 1. Tạo nội dung danh sách sản phẩm HTML
    items_html = ""
    for item in order_data["items"]:
        # Định dạng tiền tệ
        price_str = "{:,.0f}".format(item["price"]).replace(",", ".")
        total_item_str = "{:,.0f}".format(item["price"] * item["quantity"]).replace(",", ".")
        
        items_html += f"""
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px;">
                <strong>{item['product_name']}</strong><br>
                <small style="color: #666;">Phiên bản: {item.get('variant_name', 'Tiêu chuẩn')}</small>
            </td>
            <td style="padding: 10px; text-align: center;">{item['quantity']}</td>
            <td style="padding: 10px; text-align: right;">{price_str} đ</td>
            <td style="padding: 10px; text-align: right;">{total_item_str} đ</td>
        </tr>
        """

    # 2. Tổng tiền
    total_amount_str = "{:,.0f}".format(order_data["total_amount"]).replace(",", ".")
    deposit_str = "{:,.0f}".format(order_data["total_amount"] * 0.3).replace(",", ".")

    # 3. Template HTML đầy đủ
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #1a202c; color: #fff; padding: 20px; text-align: center;">
            <h2 style="margin: 0;">MOTO WORLD</h2>
            <p style="margin: 5px 0 0;">Xác nhận đặt hàng thành công</p>
        </div>
        
        <div style="padding: 20px;">
            <p>Xin chào <strong>{order_data['customer_name']}</strong>,</p>
            <p>Cảm ơn bạn đã đặt hàng tại Moto World. Đơn hàng của bạn đang được xử lý.</p>
            
            <h3 style="border-bottom: 2px solid #48bb78; padding-bottom: 5px; color: #1a202c;">Thông tin đơn hàng #{order_data['id']}</h3>
            <p><strong>Ngày đặt:</strong> {order_data['created_at']}</p>
            <p><strong>Phương thức:</strong> {order_data['payment_method'].upper()}</p>
            <p><strong>Địa chỉ/Ghi chú:</strong> {order_data['address']}</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                    <tr style="background-color: #f7fafc; text-align: left;">
                        <th style="padding: 10px;">Sản phẩm</th>
                        <th style="padding: 10px; text-align: center;">SL</th>
                        <th style="padding: 10px; text-align: right;">Đơn giá</th>
                        <th style="padding: 10px; text-align: right;">Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
                    {items_html}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Tổng cộng:</td>
                        <td style="padding: 10px; text-align: right; font-weight: bold; color: #e53e3e;">{total_amount_str} đ</td>
                    </tr>
                    <tr>
                        <td colspan="3" style="padding: 10px; text-align: right; font-style: italic;">Cọc trước (30%):</td>
                        <td style="padding: 10px; text-align: right; font-weight: bold;">{deposit_str} đ</td>
                    </tr>
                </tfoot>
            </table>
            
            <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #718096;">
                <p>Mọi thắc mắc vui lòng liên hệ hotline: 0969.69.69.69</p>
                <p>Địa chỉ: Khu dân cư 586, Cái Răng, Cần Thơ</p>
            </div>
        </div>
    </div>
    """

    message = MessageSchema(
        subject=f"Xác nhận đơn hàng #{order_data['id']} - MOTO WORLD",
        recipients=[email_to],
        body=html,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    await fm.send_message(message)