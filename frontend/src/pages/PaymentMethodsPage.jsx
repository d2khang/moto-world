// File: frontend/src/pages/PaymentMethodsPage.jsx
import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Banknote, CreditCard, Building2, AlertTriangle, 
  CheckCircle2, ArrowLeft, ShieldCheck, Wallet 
} from 'lucide-react'

const PaymentMethodsPage = () => {
  
  // Scroll lên đầu trang khi vào trang
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pt-24 pb-16 px-4 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* --- HEADER --- */}
        <div className="mb-10 text-center">
          <Link to="/" className="inline-flex items-center text-slate-500 hover:text-white mb-4 transition-colors">
            <ArrowLeft size={16} className="mr-2" /> Quay lại trang chủ
          </Link>
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-4">
            Phương Thức Thanh Toán
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Moto World hỗ trợ đa dạng các hình thức thanh toán nhằm mang lại sự thuận tiện và an toàn tuyệt đối cho khách hàng khi mua xe.
          </p>
        </div>

        {/* --- LƯU Ý QUAN TRỌNG (YÊU CẦU CỦA BẠN) --- */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-3xl p-6 md:p-8 mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <AlertTriangle size={120} className="text-yellow-500" />
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-yellow-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <AlertTriangle /> Lưu ý quan trọng về Giá Xe
            </h3>
            <p className="text-slate-300 mb-4 leading-relaxed">
              Kính thưa quý khách, giá xe hiển thị trên website là <strong className="text-white">GIÁ NIÊM YẾT (Đã bao gồm VAT)</strong>. 
              Để xe có thể lăn bánh hợp pháp, quý khách cần chi trả thêm các khoản phí theo quy định của nhà nước, bao gồm:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="bg-yellow-500/20 text-yellow-500 p-1 rounded mt-0.5"><CheckCircle2 size={12}/></span>
                  <span><strong>Thuế trước bạ (5%):</strong> Tính trên giá tính lệ phí trước bạ (thường bằng giá niêm yết).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-yellow-500/20 text-yellow-500 p-1 rounded mt-0.5"><CheckCircle2 size={12}/></span>
                  <span><strong>Phí cấp biển số:</strong> Tùy thuộc vào khu vực đăng ký (Thành phố/Tỉnh).</span>
                </li>
              </ul>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="bg-yellow-500/20 text-yellow-500 p-1 rounded mt-0.5"><CheckCircle2 size={12}/></span>
                  <span><strong>Phí đăng kiểm + Bảo trì đường bộ + Tem xe:</strong> Chi phí ước chừng tùy loại xe.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-yellow-500/20 text-yellow-500 p-1 rounded mt-0.5"><CheckCircle2 size={12}/></span>
                  <span><strong>Bảo hiểm trách nhiệm dân sự:</strong> Bắt buộc khi tham gia giao thông.</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 text-xs font-bold text-yellow-600 bg-yellow-500/5 p-3 rounded-lg border border-yellow-500/10 inline-block">
              * Nhân viên Moto World sẽ hỗ trợ tư vấn và kê khai chi tiết các khoản phí này khi quý khách làm thủ tục mua xe.
            </div>
          </div>
        </div>

        {/* --- CÁC PHƯƠNG THỨC --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 1. Tiền mặt */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-green-500/50 transition-colors group">
            <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-green-500 mb-4 group-hover:bg-green-500 group-hover:text-white transition-colors">
              <Banknote size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Tiền Mặt Tại Showroom</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Quý khách có thể thanh toán trực tiếp bằng tiền mặt (VNĐ) tại quầy thu ngân của Showroom khi đến xem và nhận xe.
            </p>
          </div>

          {/* 2. Chuyển khoản / VNPay */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-blue-500/50 transition-colors group">
            <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-blue-500 mb-4 group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <CreditCard size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Chuyển Khoản & VNPay</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-3">
              Hỗ trợ thanh toán qua quét mã QR VNPay hoặc chuyển khoản ngân hàng trực tiếp.
            </p>
            <div className="bg-slate-950 p-3 rounded border border-slate-800 text-xs text-slate-300">
              <div className="flex items-center gap-2 mb-1"><Building2 size={12}/> <strong>Techcombank</strong></div>
              <div>STK: <strong>2474111004</strong></div>
              <div>Chủ TK: <strong>Duong Duy Khang/MOTO WORLD CO., LTD</strong></div>
            </div>
          </div>

          {/* 3. Trả góp */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-purple-500/50 transition-colors group">
            <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-purple-500 mb-4 group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <Wallet size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Hỗ Trợ Trả Góp</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Liên kết với các ngân hàng và công ty tài chính (HD Saison, FE Credit...) hỗ trợ trả góp lãi suất thấp.
            </p>
            <Link to="/installment" className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 uppercase tracking-wider">
              Xem bảng tính trả góp <ArrowLeft size={12} className="rotate-180"/>
            </Link>
          </div>

        </div>

        {/* --- CAM KẾT --- */}
        <div className="mt-16 border-t border-slate-800 pt-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <ShieldCheck size={32} className="mx-auto text-green-500 mb-3"/>
            <h4 className="font-bold text-white mb-1">Thanh Toán An Toàn</h4>
            <p className="text-xs text-slate-500">Mọi giao dịch đều có hóa đơn, chứng từ rõ ràng.</p>
          </div>
          <div>
            <Building2 size={32} className="mx-auto text-blue-500 mb-3"/>
            <h4 className="font-bold text-white mb-1">Pháp Lý Minh Bạch</h4>
            <p className="text-xs text-slate-500">Hỗ trợ trọn gói thủ tục đăng ký xe.</p>
          </div>
          <div>
            <Wallet size={32} className="mx-auto text-purple-500 mb-3"/>
            <h4 className="font-bold text-white mb-1">Không Phí Ẩn</h4>
            <p className="text-xs text-slate-500">Tư vấn chính xác tổng chi phí lăn bánh trước khi cọc.</p>
          </div>
        </div>

      </div>
    </div>
  )
}

export default PaymentMethodsPage