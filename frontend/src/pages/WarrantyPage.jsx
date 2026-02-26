import React from 'react';

const WarrantyPage = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white pt-24 pb-12 px-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black text-green-500 mb-8 uppercase border-b border-slate-700 pb-4">
          Chính Sách Bảo Hành & Bảo Dưỡng
        </h1>
        
        <div className="space-y-8 text-gray-300">
          
          {/* 1. THỜI HẠN BẢO HÀNH */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Thời hạn bảo hành</h2>
            <p className="mb-2">Tất cả các dòng xe mua tại <span className="text-green-500 font-bold">MOTO WORLD</span> đều được hưởng chế độ:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-white">1 năm</strong> hoặc <strong className="text-white">12000 Km</strong>.</li>
              <li>Bảo hành 12 tháng cho các chi tiết độ lắp đặt tại shop.</li>
            </ul>
          </section>

          {/* 2. BẢO DƯỠNG & DESMO (MỚI THÊM) */}
          <section className="bg-slate-800 p-6 rounded-2xl border border-blue-500/50">
            <h2 className="text-2xl font-bold text-blue-400 mb-4 uppercase">2. Gói Bảo Dưỡng & Desmo Service</h2>
            <p className="mb-4 text-white font-medium">
              Để "chiến mã" luôn ở trạng thái đỉnh cao, chúng tôi cung cấp gói bảo dưỡng tiêu chuẩn mỗi <span className="text-yellow-500 font-black">3.000 KM</span>:
            </p>
            <ul className="list-disc pl-6 space-y-3">
              <li>
                <strong className="text-white">Bảo dưỡng định kỳ (Mỗi 3.000 Km):</strong> 
                <span className="block text-sm mt-1 text-gray-400">- Thay nhớt, lọc nhớt chính hãng.<br/>- Vệ sinh nhông sên dĩa, kiểm tra bố thắng, áp suất lốp.</span>
              </li>
              <li>
                <strong className="text-white">Desmo Service (Gói Cao Cấp):</strong>
                <span className="block text-sm mt-1 text-gray-400">- Kiểm tra và canh chỉnh khe hở xupap (Desmodromic) chuẩn kỹ thuật.<br/>- Vệ sinh họng ga, kim phun, thay nước mát và dầu thắng.</span>
              </li>
              <li className="italic text-green-400 font-bold">🎁 Đặc biệt: Miễn phí công thợ cho 3 lần bảo dưỡng đầu tiên.</li>
            </ul>
          </section>

          {/* 3. ĐẶC QUYỀN XE ĐỘ (GIỮ NGUYÊN) */}
          <section className="bg-slate-800 p-6 rounded-2xl border border-green-500/50">
            <h2 className="text-2xl font-bold text-green-400 mb-4 uppercase">3. Đặc Quyền "Chơi Là Phải Độ"</h2>
            <p className="mb-4 text-white font-medium">
              MOTO WORLD <span className="text-yellow-500 font-black">VẪN BẢO HÀNH</span> cho xe đã thay đổi kết cấu:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Chấp nhận bảo hành xe đã thay Pô (Exhaust), Map lại ECU.</li>
              <li>Chấp nhận xe đã cắt đuôi, độ dàn áo, thay đổi tư thế lái.</li>
              <li>Hỗ trợ canh chỉnh map máy miễn phí trọn đời cho anh em mua xe tại shop.</li>
            </ul>
          </section>

          {/* 4. TỪ CHỐI BẢO HÀNH */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Trường hợp từ chối</h2>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Xe bị tai nạn nặng biến dạng khung sườn.</li>
              <li>Hư hỏng do thiên tai, ngập nước quá mức cho phép.</li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
};

export default WarrantyPage;