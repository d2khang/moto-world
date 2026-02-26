import React from 'react';

const InstallmentPage = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white pt-24 pb-12 px-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black text-yellow-500 mb-8 uppercase border-b border-slate-700 pb-4">Mua Xe Trả Góp 0%</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <h3 className="text-xl font-bold mb-4">Tại sao nên mua trả góp?</h3>
            <ul className="space-y-3 text-gray-300">
              <li>✅ Sở hữu ngay siêu phẩm mơ ước chỉ với <strong>20% trả trước</strong>.</li>
              <li>✅ Lãi suất ưu đãi <strong>0%</strong> trong 12 tháng đầu.</li>
              <li>✅ Thủ tục đơn giản, xét duyệt online trong 15 phút.</li>
            </ul>
          </div>
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
             <h3 className="text-xl font-bold mb-4">Đối tác tài chính</h3>
             <div className="flex gap-4 flex-wrap">
               <span className="bg-white text-slate-900 font-bold px-4 py-2 rounded">HD Saison</span>
               <span className="bg-white text-slate-900 font-bold px-4 py-2 rounded">FE Credit</span>
               <span className="bg-white text-slate-900 font-bold px-4 py-2 rounded">Home Credit</span>
             </div>
          </div>
        </div>

        <section className="space-y-6 text-gray-300">
          <h2 className="text-2xl font-bold text-white">Thủ tục cần chuẩn bị</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Căn cước công dân (CCCD) gắn chip.</li>
            <li>Giấy phép lái xe (nếu có).</li>
            <li>Không cần chứng minh thu nhập (với khoản vay dưới 100 triệu).</li>
          </ul>
          <div className="bg-green-600/20 border border-green-600 p-4 rounded-xl mt-6">
            <p className="font-bold text-green-400">LIÊN HỆ TƯ VẤN TRẢ GÓP: 0969.69.69.69 (Mr. Dương Duy Khang)</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default InstallmentPage;