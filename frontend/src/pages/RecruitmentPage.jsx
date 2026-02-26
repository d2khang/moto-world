import React from 'react';

const RecruitmentPage = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white pt-24 pb-12 px-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black text-blue-500 mb-8 uppercase border-b border-slate-700 pb-4">
          Cơ Hội Nghề Nghiệp
        </h1>
        
        <p className="text-xl text-gray-300 mb-10">
          Gia nhập đội ngũ <span className="text-blue-500 font-bold">MOTO WORLD</span> để sống trọn với đam mê tốc độ!
        </p>

        <div className="space-y-6">
          {/* Job 1: Kỹ Thuật Viên */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-blue-500 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-white">1. Kỹ Thuật Viên Sửa Chữa (3 vị trí)</h3>
              <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">Full-time</span>
            </div>
            {/* Đã sửa dấu > thành chữ "trên" để tránh lỗi cú pháp */}
            <p className="text-gray-400 mb-4">Thu nhập: <strong>15 - 25 Triệu/tháng</strong></p>
            <ul className="list-disc pl-5 text-gray-300 space-y-1 mb-4">
              <li>Có kinh nghiệm sửa chữa xe phân khối lớn từ 1 năm trở lên.</li>
              <li>Am hiểu về động cơ, hệ thống điện, phuộc, phanh ABS.</li>
              <li>Biết lắp đặt đồ chơi (Pô, đèn trợ sáng, chống đổ...) là lợi thế lớn.</li>
            </ul>
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold transition">Ứng Tuyển Ngay</button>
          </div>

          {/* Job 2: Sale & Content - CẬP NHẬT THEO YÊU CẦU */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-blue-500 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-white">2. Nhân Viên Tư Vấn & Content (5 vị trí)</h3>
              <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">Full-time</span>
            </div>
            {/* Đã sửa dấu > thành chữ "trên" để fix lỗi */}
            <p className="text-gray-400 mb-4">Thu nhập: <strong>10 Triệu + Hoa hồng (Tổng trên 30 Triệu)</strong></p>
            <ul className="list-disc pl-5 text-gray-300 space-y-1 mb-4">
              <li>Ngoại hình sáng, phong cách năng động.</li>
              {/* Yêu cầu mới: Hiểu biết PKL & Làm Content */}
              <li><strong>Am hiểu sâu sắc</strong> về các dòng xe phân khối lớn, văn hóa Biker.</li>
              <li>Có kỹ năng sáng tạo nội dung (Content Creator) trên <strong>TikTok, Facebook, YouTube</strong>.</li>
              <li>Biết chụp ảnh, edit video cơ bản trên điện thoại là điểm cộng.</li>
            </ul>
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold transition">Ứng Tuyển Ngay</button>
          </div>
        </div>

        <div className="mt-12 text-center text-gray-400">
          Gửi CV hoặc Portfolio của bạn về email: <span className="text-white font-bold">hr@motoworld.vn</span>
        </div>
      </div>
    </div>
  );
};

export default RecruitmentPage;