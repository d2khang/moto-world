import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-slate-950 text-gray-400 border-t border-slate-800 font-sans mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* CỘT 1: GIỚI THIỆU */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-4 block">
              MOTO WORLD
            </Link>
            <p className="text-sm mb-4 leading-relaxed">
              Hệ thống phân phối mô tô phân khối lớn chính hãng uy tín hàng đầu Việt Nam.
            </p>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition cursor-pointer">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </div>
            </div>
          </div>

          {/* CỘT 2: KHÁM PHÁ */}
          <div>
            <h3 className="text-white font-bold uppercase mb-4 text-sm tracking-wider">Khám Phá</h3>
            <ul className="space-y-3 text-sm font-medium">
              <li><Link to="/" className="hover:text-green-500 transition-colors">Trang Chủ</Link></li>
              <li><Link to="/bikes" className="hover:text-green-500 transition-colors">Thương Hiệu</Link></li>
              <li><Link to="/about" className="hover:text-green-500 transition-colors">Về Chúng Tôi</Link></li>
            </ul>
          </div>

          {/* CỘT 3: HỖ TRỢ KHÁCH HÀNG */}
          <div>
            <h3 className="text-white font-bold uppercase mb-4 text-sm tracking-wider">Hỗ Trợ Khách Hàng</h3>
            <ul className="space-y-3 text-sm font-medium">
              <li>
                <Link to="/warranty" className="hover:text-green-500 transition-colors flex items-center gap-2">
                  Chính sách bảo hành
                </Link>
              </li>
              <li>
                {/* --- MỚI THÊM --- */}
                <Link to="/payment-methods" className="hover:text-green-500 transition-colors flex items-center gap-2">
                  Phương thức thanh toán
                </Link>
              </li>
              <li>
                <Link to="/installment" className="hover:text-green-500 transition-colors flex items-center gap-2">
                  Mua trả góp 0%
                </Link>
              </li>
              <li>
                <Link to="/recruitment" className="hover:text-green-500 transition-colors flex items-center gap-2">
                  Tuyển dụng nhân sự
                  <span className="text-[10px] bg-red-600 text-white px-1.5 rounded ml-1">HOT</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* CỘT 4: LIÊN HỆ */}
          <div>
            <h3 className="text-white font-bold uppercase mb-4 text-sm tracking-wider">Liên Hệ</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="font-bold text-white min-w-[60px]">Hotline:</span> 
                <span className="text-green-500 font-bold">0969.69.69.69</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-white min-w-[60px]">Email:</span> 
                <span>motoworld6699@gmail.com</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-white min-w-[60px]">Địa chỉ:</span> 
                <span>Khu dân cư 586, Cái Răng, Cần Thơ</span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* BẢN QUYỀN */}
        <div className="border-t border-slate-800 mt-12 pt-8 text-center text-xs font-bold uppercase tracking-widest text-gray-600">
          © 2026 MOTO WORLD. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;