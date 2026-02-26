import React from 'react';

const GioiThieuPage = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white pt-24 pb-12 px-6 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* --- PHẦN 1: HEADER --- */}
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter italic mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
            CÂU CHUYỆN MOTO WORLD
          </h1>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-[0.3em]">
            Hệ thống phân phối mô tô chính hãng số 1 Việt Nam
          </p>
        </div>

        {/* --- PHẦN 2: NỘI DUNG & HÌNH ẢNH --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start mb-32">
          <div className="space-y-8">
            <h2 className="text-4xl font-black uppercase leading-none">
              Đam mê <span className="text-green-500">Tốc độ</span>
            </h2>
            <p className="text-gray-300 text-lg leading-relaxed text-justify">
              Được thành lập từ năm 2015, MOTO WORLD không chỉ là nơi mua bán xe, mà là ngôi nhà chung của những trái tim yêu tự do. Chúng tôi mang đến những siêu phẩm từ Honda, Yamaha, BMW... với cam kết chất lượng tuyệt đối.
            </p>
            
            {/* HỘP THÔNG TIN LIÊN HỆ MỚI (ĐÃ THÊM SĐT & EMAIL) */}
            <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl">
              <h3 className="text-xl font-black text-white uppercase mb-6 border-b border-slate-600 pb-2">Thông Tin Liên Hệ</h3>
              
              <div className="space-y-6">
                {/* Địa chỉ */}
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500/20 p-3 rounded-full text-blue-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase">Trụ sở chính</p>
                    <p className="text-white font-bold text-lg">Khu dân cư 586, Cái Răng, Cần Thơ</p>
                  </div>
                </div>

                {/* Hotline (MỚI) */}
                <div className="flex items-center gap-4">
                   <div className="bg-green-500/20 p-3 rounded-full text-green-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                   </div>
                   <div>
                    <p className="text-xs text-gray-400 font-bold uppercase">Hotline 24/7</p>
                    <a href="tel:0969696969" className="text-green-400 font-black text-2xl tracking-wider hover:text-white transition">0969.69.69.69</a>
                   </div>
                </div>

                {/* Email (MỚI) */}
                <div className="flex items-center gap-4">
                   <div className="bg-yellow-500/20 p-3 rounded-full text-yellow-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                   </div>
                   <div>
                    <p className="text-xs text-gray-400 font-bold uppercase">Email Hỗ Trợ</p>
                    <a href="mailto:motoworld69@gmail.com" className="text-white font-bold text-lg hover:text-yellow-500 transition">motoworld69@gmail.com</a>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* HÌNH ẢNH SHOWROOM */}
          <div className="relative group h-full">
            <div className="absolute -inset-2 bg-gradient-to-r from-green-500 to-blue-600 rounded-[2rem] blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
            <img 
              src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80" 
              alt="Showroom" 
              className="relative rounded-[2rem] border border-slate-700 shadow-2xl w-full h-full object-cover min-h-[500px]"
            />
          </div>
        </div>

        {/* --- PHẦN 3: BẢN ĐỒ GOOGLE MAP --- */}
        <div className="mb-32">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black uppercase tracking-tight text-white">
              Ghé thăm <span className="text-blue-500">Showroom</span>
            </h2>
            <p className="text-gray-400 mt-2">Mở cửa từ 8:00 - 21:00 tất cả các ngày trong tuần</p>
          </div>
          
          <div className="relative w-full h-[450px] rounded-[2rem] overflow-hidden border border-slate-700 shadow-2xl group">
             {/* Hiệu ứng viền phát sáng */}
             <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-green-500 blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
             
             {/* Google Map Iframe */}
             <iframe 
               src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3929.053361900823!2d105.7600!3d10.0100!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31a08830b3b4991b%3A0x44665427eb32662e!2sKhu%20D%C3%A2n%20C%C6%B0%20586!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s" 
               className="relative w-full h-full border-0 filter grayscale hover:grayscale-0 transition duration-700"
               allowFullScreen="" 
               loading="lazy" 
               referrerPolicy="no-referrer-when-downgrade"
               title="Google Map Moto World"
             ></iframe>
          </div>
        </div>

        {/* --- PHẦN 4: 3 GIÁ TRỊ CỐT LÕI --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: "CHẤT LƯỢNG", desc: "Xe nhập khẩu hải quan chính ngạch, kiểm tra 50 điểm.", color: "text-green-500", border: "hover:border-green-500" },
            { title: "UY TÍN", desc: "Bảo hành 3 năm chính hãng, hỗ trợ cứu hộ 24/7.", color: "text-yellow-500", border: "hover:border-yellow-500" },
            { title: "ĐAM MÊ", desc: "Cộng đồng 50.000 thành viên, tổ chức tour hàng quý.", color: "text-blue-500", border: "hover:border-blue-500" }
          ].map((item, idx) => (
            <div key={idx} className={`bg-slate-800 p-8 rounded-3xl border border-slate-700 ${item.border} transition-all duration-300 group hover:bg-slate-800/80`}>
              <h3 className={`text-4xl font-black ${item.color} mb-2`}>0{idx + 1}.</h3>
              <h4 className="text-xl font-bold uppercase mb-2 text-white">{item.title}</h4>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GioiThieuPage;