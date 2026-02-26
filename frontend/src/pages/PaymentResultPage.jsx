import React, { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Home, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const orderId = searchParams.get('order_id');
  const { clearCart } = useCart(); // Hàm xóa giỏ hàng (cần thêm vào Context nếu chưa có)

  useEffect(() => {
    if (status === 'success') {
      // Nếu thanh toán thành công thì xóa giỏ hàng local
      localStorage.removeItem('cart'); 
      // Hoặc gọi hàm clearCart() nếu bạn đã viết trong Context
    }
  }, [status]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 font-sans">
      <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl text-center max-w-md w-full">
        {status === 'success' ? (
          <>
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-black text-white mb-2 uppercase">Thanh Toán Thành Công!</h1>
            <p className="text-gray-400 mb-8">Đơn hàng <span className="text-green-400 font-bold">#{orderId}</span> đã được xác nhận.</p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-black text-white mb-2 uppercase">Thanh Toán Thất Bại</h1>
            <p className="text-gray-400 mb-8">Có lỗi xảy ra trong quá trình xử lý. Vui lòng thử lại.</p>
          </>
        )}

        <div className="space-y-3">
          <Link to="/my-orders" className="block w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2">
             <ShoppingBag size={18} /> Xem Đơn Hàng
          </Link>
          <Link to="/" className="block w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2">
             <Home size={18} /> Về Trang Chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentResultPage;