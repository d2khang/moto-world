import { useState, useEffect } from 'react'
import { useCart } from '../context/CartContext'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, ArrowLeft, Plus, Minus, Banknote, Calendar, MapPin, Mail, CreditCard, Ticket, Check, X, ShieldCheck, Loader2 } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const CartPage = () => {
  const { cartItems, increaseQuantity, decreaseQuantity, removeFromCart, clearCart } = useCart()
  const navigate = useNavigate()
  
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '', note: '' })
  const [pickupTime, setPickupTime] = useState('') 
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [loading, setLoading] = useState(false)

  // --- LOGIC COUPON ---
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponLoading, setCouponLoading] = useState(false)

  const SHOWROOM_ADDRESS = "Cái Răng, Cần Thơ, Việt Nam"
  // Format thời gian cho input datetime-local (Min là ngày mai 08:00)
  const tomorrowStr = new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] + "T08:00";

  // --- 1. HÀM LẤY GIÁ THỰC TẾ (XỬ LÝ LOGIC GIẢM GIÁ) ---
  const getRealPrice = (item) => {
    // Nếu backend trả về current_price (giá sau giảm) và nó nhỏ hơn giá gốc -> Dùng giá này
    if (item.current_price && item.current_price < item.price) {
        return item.current_price;
    }
    // Nếu có flash_sale_price riêng
    if (item.flash_sale_price && item.is_flash_sale) {
        return item.flash_sale_price;
    }
    // Mặc định trả về giá gốc
    return item.price;
  }
  
  // ✅ HELPER: Định dạng URL ảnh chuẩn
  const formatUrl = (url) => {
    if (!url) return "https://via.placeholder.com/150?text=No+Image";
    if (url.startsWith('http')) return url;
    return `http://localhost:8000/${url}`; 
  }

  // --- 2. TÍNH TỔNG TIỀN DỰA TRÊN GIÁ THỰC TẾ ---
  const subTotal = cartItems.reduce((total, item) => {
      return total + (getRealPrice(item) * item.quantity);
  }, 0);
  
  // Tính tiền giảm giá từ Coupon
  const discountAmount = appliedCoupon 
    ? (appliedCoupon.discount_type === 'percent' 
        ? (subTotal * appliedCoupon.discount_value) / 100 
        : appliedCoupon.discount_value)
    : 0

  const totalAfterDiscount = subTotal - discountAmount > 0 ? subTotal - discountAmount : 0
  const totalDeposit = totalAfterDiscount * 0.3 // Cọc 30%

  // Hàm format tiền tệ
  const formatMoney = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

  // --- HÀM XỬ LÝ COUPON ---
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setAppliedCoupon(null)

    const toastId = toast.loading("Đang kiểm tra mã...")
    try {
        const token = localStorage.getItem('token')
        const res = await axios.post('http://localhost:8000/api/coupons/validate', {
            code: couponCode,
            total_amount: subTotal
        }, { headers: { Authorization: `Bearer ${token}` }})

        setAppliedCoupon(res.data)
        toast.success(`Áp dụng mã giảm giá thành công!`, { id: toastId })
    } catch (error) {
        const msg = error.response?.data?.detail || "Mã không hợp lệ"
        toast.error(msg, { id: toastId })
    } finally {
        setCouponLoading(false)
    }
  }

  // --- VALIDATE FORM ---
  const validateForm = () => {
    const specialCharsRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?0-9]+/;
    if (!customer.name.trim() || specialCharsRegex.test(customer.name)) {
      toast.error("Họ tên không được chứa số hoặc ký tự đặc biệt");
      return false;
    }
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(customer.phone.trim())) {
      toast.error("Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)");
      return false;
    }
    if (!pickupTime) {
      toast.error("Vui lòng chọn thời gian hẹn");
      return false;
    }
    
    // Validate ngày giờ (Phải hẹn trước 1 ngày, trong giờ hành chính)
    const selectedDate = new Date(pickupTime);
    const selectedHour = selectedDate.getHours();
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 1); 
    minDate.setHours(0, 0, 0, 0);

    if (selectedDate < minDate) {
      toast.error("Vui lòng đặt lịch hẹn từ ngày mai trở đi");
      return false;
    }
    if (selectedHour < 8 || selectedHour >= 18) {
      toast.error("Giờ làm việc từ 08:00 - 18:00. Vui lòng chọn lại!");
      return false;
    }
    return true;
  }

  // --- TẠO DATA GỬI API ---
  const createOrderData = (method) => {
    const selectedDate = new Date(pickupTime);
    const dateStr = selectedDate.toLocaleString('vi-VN');
    
    return {
      customer_name: customer.name.trim(),
      customer_phone: customer.phone.trim(),
      customer_email: customer.email,
      
      // Gửi cả 4 trường địa chỉ (để trống hoặc default nếu không dùng)
      province: "Cần Thơ", 
      district: "Cái Răng", 
      ward: "Hưng Phú",
      address_detail: `Showroom: ${SHOWROOM_ADDRESS} | Hẹn: ${dateStr}`,

      // Fallback cho backend cũ
      customer_address: `Showroom: ${SHOWROOM_ADDRESS} | Hẹn: ${dateStr}`,
      
      payment_method: method,
      total_amount: totalAfterDiscount, // Tổng tiền cuối cùng
      coupon_code: appliedCoupon ? appliedCoupon.code : null, 
      note: method === 'vnpay' ? "Thanh toán Cọc Online qua VNPay" : customer.note,
      
      items: cartItems.map(item => ({
        product_id: item.id,
        product_name: item.name,
        variant_name: item.variantName || "Tiêu chuẩn",
        // ✅ QUAN TRỌNG: Gửi giá thực tế (đã giảm) lên server
        price: getRealPrice(item), 
        quantity: item.quantity,
        // ✅ Gửi đúng URL ảnh (biến thể hoặc gốc) lên server để lưu vào order
        image_url: item.image || item.image_url || "" 
      }))
    }
  }

  // --- XỬ LÝ THANH TOÁN SAU (TIỀN MẶT) ---
  const handleCheckout = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) { 
        toast.error("Vui lòng đăng nhập để tiếp tục.")
        navigate('/login')
        return 
    }
    if (!validateForm()) return;

    setLoading(true)
    const orderData = createOrderData('cash'); 
    const toastId = toast.loading("Đang tạo lịch hẹn...")

    try {
      await axios.post('http://localhost:8000/api/orders/', orderData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success("Đặt lịch thành công!", { id: toastId })
      clearCart()
      navigate('/')
    } catch (error) {
      const msg = error.response?.data?.detail || "Lỗi hệ thống"
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false)
    }
  }

  // --- XỬ LÝ THANH TOÁN VN PAY ---
  const handleOnlinePayment = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) { 
        toast.error("Vui lòng đăng nhập!")
        navigate('/login')
        return
    }
    if (!validateForm()) return;

    setLoading(true);
    const toastId = toast.loading("Đang kết nối VNPay...")

    try {
        // 1. Tạo đơn hàng trước
        const orderData = createOrderData('vnpay');
        const resOrder = await axios.post('http://localhost:8000/api/orders/', orderData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const newOrderId = resOrder.data.id;
        
        // 2. Lấy link thanh toán cho số tiền CỌC
        const amountToPay = Math.round(totalDeposit); 
        const resPayment = await axios.post(
            `http://localhost:8000/api/payment/create-url?order_id=${newOrderId}&amount=${amountToPay}`, 
            {}, 
            { headers: { Authorization: `Bearer ${token}` } }
        );
        
        window.location.href = resPayment.data.payment_url;
    } catch (err) {
        console.error(err);
        const msg = err.response?.data?.detail || "Lỗi thanh toán"
        toast.error(msg, { id: toastId });
        setLoading(false);
    }
  };

  if (cartItems.length === 0) return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <h2 className="text-3xl font-black mb-6 uppercase tracking-widest">Giỏ hàng trống</h2>
      <Link to="/" className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold transition shadow-lg">Quay lại Showroom</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-900 text-white py-10 px-4 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* === CỘT TRÁI: DANH SÁCH SẢN PHẨM === */}
        <div className="lg:col-span-7">
          <h1 className="text-3xl font-black mb-8 flex items-center gap-2 uppercase tracking-tighter">
            <Link to="/"><ArrowLeft className="text-gray-500 hover:text-white transition" /></Link> Giỏ Hàng
          </h1>
          <div className="space-y-4">
            {cartItems.map((item) => {
              const realPrice = getRealPrice(item); // Lấy giá thực tế để hiển thị
              const isSale = realPrice < item.price; // Check xem có đang sale không
              
              // ✅ LOGIC CHỌN ẢNH HIỂN THỊ: Ưu tiên ảnh biến thể -> ảnh sản phẩm
              const displayImage = formatUrl(item.image || item.image_url);

              return (
                <div key={`${item.id}-${item.variantId}`} className="bg-slate-800 p-4 rounded-2xl flex gap-4 border border-slate-700 shadow-xl items-center relative overflow-hidden group">
                    
                    {/* --- ✅ HIỂN THỊ HÌNH ẢNH --- */}
                    <div className="w-32 h-24 flex-shrink-0 bg-white rounded-xl border border-slate-600 overflow-hidden relative">
                        <img 
                            src={displayImage} 
                            alt={item.name} 
                            className="absolute inset-0 w-full h-full object-contain p-2 hover:scale-110 transition-transform duration-500" 
                        />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold uppercase truncate">{item.name}</h3>
                        <p className="text-gray-400 text-xs mb-2 italic">Phiên bản: {item.variantName || "Tiêu chuẩn"}</p>
                        
                        {/* --- ✅ HIỂN THỊ GIÁ --- */}
                        <div className="flex flex-col items-start">
                            {isSale ? (
                                <>
                                    <div className="flex items-center gap-2">
                                        <span className="text-red-500 font-mono font-black text-lg">{formatMoney(realPrice)}</span>
                                        <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold animate-pulse">FLASH SALE</span>
                                    </div>
                                    <span className="text-gray-500 line-through text-xs">{formatMoney(item.price)}</span>
                                </>
                            ) : (
                                <span className="text-green-400 font-mono font-bold text-lg">{formatMoney(item.price)}</span>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col items-end justify-between gap-3 pl-2">
                        <button onClick={() => removeFromCart(item.id, item.variantId)} className="text-gray-500 hover:text-red-500 transition p-1"><Trash2 className="w-5 h-5" /></button>
                        <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-1 border border-slate-700">
                            <button onClick={() => decreaseQuantity(item.id, item.variantId)} className="p-1 hover:bg-slate-700 rounded"><Minus className="w-3 h-3" /></button>
                            <span className="font-bold w-6 text-center text-sm">{item.quantity}</span>
                            <button onClick={() => increaseQuantity(item.id, item.variantId)} className="p-1 hover:bg-slate-700 rounded"><Plus className="w-3 h-3" /></button>
                        </div>
                    </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* === CỘT PHẢI: FORM THÔNG TIN === */}
        <div className="lg:col-span-5">
          <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl sticky top-24">
            <h2 className="text-xl font-black mb-6 text-white uppercase border-b border-slate-700 pb-4 tracking-widest">Thông tin đặt lịch</h2>
            
            <div className="space-y-5">
              {/* INPUT FORM */}
              <div className="grid grid-cols-2 gap-4">
                 <div><label className="text-[10px] text-gray-500 font-black uppercase mb-1 block">Họ và tên *</label><input type="text" required className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-green-500 transition-colors text-sm" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} /></div>
                 <div><label className="text-[10px] text-gray-500 font-black uppercase mb-1 block">Số điện thoại *</label><input type="tel" required className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-green-500 transition-colors text-sm" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} /></div>
              </div>
              <div><label className="text-[10px] text-gray-500 font-black uppercase mb-1 block flex items-center gap-1"><Mail className="w-3 h-3"/> Email</label><input type="email" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-green-500 transition-colors text-sm" value={customer.email} onChange={e => setCustomer({...customer, email: e.target.value})} /></div>

              {/* Showroom Info */}
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-700 space-y-4 shadow-inner">
                  <div><label className="text-[10px] text-green-500 font-black uppercase mb-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> Địa điểm Showroom</label><div className="w-full text-sm text-gray-300 font-bold">{SHOWROOM_ADDRESS}</div></div>
                  <div><label className="text-[10px] text-yellow-500 font-black uppercase mb-1 flex items-center gap-1"><Calendar className="w-3 h-3"/> Thời gian hẹn (08h - 18h) *</label><input type="datetime-local" required min={tomorrowStr} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white outline-none cursor-pointer focus:border-yellow-500 transition-colors text-sm" style={{ colorScheme: 'dark' }} value={pickupTime} onChange={e => setPickupTime(e.target.value)} /></div>
              </div>

              {/* Coupon */}
              <div>
                <label className="text-[10px] text-pink-500 font-black uppercase mb-1 block flex items-center gap-1"><Ticket className="w-3 h-3"/> Mã giảm giá</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="VD: TET2024" 
                        className={`w-full bg-slate-900 border rounded-xl p-3 text-sm outline-none font-bold uppercase transition-colors ${appliedCoupon ? 'border-green-500 text-green-500' : 'border-slate-700 text-white'}`}
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value)}
                        disabled={!!appliedCoupon}
                    />
                    {appliedCoupon ? (
                        <button onClick={() => {setAppliedCoupon(null); setCouponCode('');}} className="bg-red-600/20 text-red-500 p-3 rounded-xl border border-red-600/50 hover:bg-red-600 hover:text-white transition"><X size={20}/></button>
                    ) : (
                        <button onClick={handleApplyCoupon} disabled={couponLoading} className="bg-pink-600 hover:bg-pink-500 text-white px-5 rounded-xl font-bold text-sm transition disabled:opacity-50">
                            {couponLoading ? <Loader2 className="animate-spin w-4 h-4"/> : 'Áp dụng'}
                        </button>
                    )}
                </div>
                {appliedCoupon && <p className="text-green-500 text-xs mt-1 font-bold ml-1 flex items-center gap-1 animate-in slide-in-from-top-1"><Check size={12}/> Giảm {appliedCoupon.discount_type === 'percent' ? appliedCoupon.discount_value + '%' : formatMoney(appliedCoupon.discount_value)}</p>}
              </div>

              {/* TỔNG TIỀN */}
              <div className="pt-4 border-t border-slate-700 space-y-2">
                <div className="flex justify-between items-center text-sm text-gray-400">
                  <span>Tạm tính:</span>
                  <span>{formatMoney(subTotal)}</span>
                </div>
                {appliedCoupon && (
                    <div className="flex justify-between items-center text-sm text-pink-500 font-bold">
                        <span>Giảm giá:</span>
                        <span>- {formatMoney(discountAmount)}</span>
                    </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-slate-700 border-dashed">
                  <span className="text-sm font-bold text-gray-300 uppercase tracking-widest">Tổng tiền xe:</span>
                  <span className="text-xl font-bold text-white">{formatMoney(totalAfterDiscount)}</span>
                </div>
                
                <div className="bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/30 flex justify-between items-center mt-2">
                  <span className="text-xs font-black text-yellow-500 uppercase tracking-widest">Cọc trước (30%):</span>
                  <span className="text-2xl font-black text-yellow-400 font-mono">{formatMoney(totalDeposit)}</span>
                </div>

                {/* PHƯƠNG THỨC THANH TOÁN */}
                <div className="space-y-4 pt-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Chọn phương thức:</label>
                    
                    {/* Tiền mặt */}
                    <div className="space-y-3">
                         <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'cash' ? 'bg-green-600/10 border-green-500 ring-1 ring-green-500' : 'bg-slate-900 border-slate-700'}`}>
                            <input type="radio" name="payment" className="hidden" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} />
                            <div className={`p-2 rounded-full ${paymentMethod === 'cash' ? 'bg-green-500 text-white' : 'bg-slate-800 text-gray-500'}`}>
                                <Banknote size={20} />
                            </div>
                            <div className="flex-1">
                                <span className={`block font-bold text-sm ${paymentMethod === 'cash' ? 'text-green-400' : 'text-white'}`}>Thanh toán tại Showroom</span>
                            </div>
                            {paymentMethod === 'cash' && <Check size={16} className="text-green-500"/>}
                         </label>

                         {paymentMethod === 'cash' && (
                             <button onClick={handleCheckout} disabled={loading} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition uppercase text-sm border border-slate-600 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
                                {loading ? <Loader2 className="animate-spin"/> : 'Xác nhận Đặt Lịch'}
                             </button>
                         )}
                    </div>

                    {/* VNPay */}
                    <button onClick={handleOnlinePayment} disabled={loading} className="w-full bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-900/50 transition flex items-center justify-center gap-2 hover:scale-[1.02] border border-blue-500/30">
                        {loading ? <Loader2 className="animate-spin"/> : <><CreditCard size={20} className="text-white"/> Cọc Online ({formatMoney(totalDeposit)})</>}
                    </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartPage