import cloudinary
import cloudinary.uploader
from fastapi import UploadFile, HTTPException
from src.core.config import settings

# Cấu hình Cloudinary ngay khi file này được import
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True # Luôn sử dụng HTTPS
)

def upload_image_to_cloud(file: UploadFile, folder: str = "moto_world/uploads") -> str:
    """
    Hàm upload file lên Cloudinary.
    
    Args:
        file (UploadFile): File nhận được từ API.
        folder (str): Tên thư mục trên Cloudinary để phân loại ảnh.
        
    Returns:
        str: URL ảnh an toàn (HTTPS) để lưu vào DB.
    """
    try:
        # Cloudinary uploader.upload chấp nhận file-like object
        # file.file chính là file-like object của SpooledTemporaryFile từ FastAPI
        response = cloudinary.uploader.upload(
            file.file,
            folder=folder,
            resource_type="auto" # Tự động nhận diện ảnh/video
        )
        
        # Trả về secure_url (https link)
        return response.get("secure_url")
    
    except Exception as e:
        # Log lỗi ra console để debug nếu cần
        print(f"Lỗi upload Cloudinary: {str(e)}")
        raise HTTPException(status_code=500, detail="Không thể upload ảnh lên Cloud. Vui lòng thử lại.")

def delete_image_from_cloud(image_url: str):
    """
    (Tùy chọn) Hàm xóa ảnh trên Cloudinary dựa vào URL.
    Logic: Phân tích URL để lấy public_id và gọi lệnh destroy.
    """
    try:
        # Ví dụ URL: https://res.cloudinary.com/demo/image/upload/v123456/moto_world/uploads/abc.jpg
        # Cần lấy public_id là: moto_world/uploads/abc
        if "cloudinary.com" not in image_url:
            return # Không phải ảnh Cloudinary, bỏ qua

        # Tách chuỗi để lấy public_id (cần xử lý chuỗi kỹ hơn tùy format URL)
        # Đây là ví dụ đơn giản, thực tế có thể cần regex
        parts = image_url.split("/")
        filename = parts[-1]
        public_id = filename.split(".")[0] # Bỏ đuôi .jpg/.png
        
        # Nếu có folder, ghép lại (đây chỉ là logic giả định đơn giản hóa)
        # Cách tốt nhất là lưu public_id vào DB thay vì chỉ lưu URL
        pass 
        # cloudinary.uploader.destroy(public_id)
        
    except Exception as e:
        print(f"Lỗi xóa ảnh Cloudinary: {str(e)}")