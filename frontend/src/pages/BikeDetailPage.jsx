import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom' 
import axios from 'axios'
import { ArrowLeft, Check, ShoppingCart, Zap, Trash2, Edit, X, ShieldCheck, Ruler, Settings, Wrench, Tag, Clock, Star, Scale } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useCompare } from '../context/CompareContext' 
import toast from 'react-hot-toast'

function BikeDetailPage() {
  const { id } = useParams() 
  const navigate = useNavigate()
  
  const [bike, setBike] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState(null)

  const { addToCart } = useCart()
  const { addToCompare } = useCompare()

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isAdmin = user.role === 'admin' || user.role === 'staff'

  useEffect(() => {
    const fetchBikeDetail = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/bikes/${id}`)
        setBike(res.data)
        if (res.data.variants && res.data.variants.length > 0) {
            setSelectedVariant(res.data.variants[0])
        } else {
            setSelectedVariant(null)
        }
      } catch (error) {
        console.error("Lỗi truy xuất dữ liệu chi tiết:", error)
        toast.error("Không thể tải thông tin xe")
      } finally {
        setLoading(false)
      }
    }
    fetchBikeDetail()
  }, [id])

  useEffect(() => {
    if (!bike || !bike.discount_end_date) return;
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(bike.discount_end_date).getTime();
      const distance = end - now;

      if (distance < 0) {
        setTimeLeft("EXPIRED");
        clearInterval(timer);
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [bike]);

  const handleAddToCart = () => {
      const qty = selectedVariant ? selectedVariant.quantity : bike.quantity;
      if (qty <= 0) {
          toast.error("Sản phẩm này hiện đang tạm hết hàng!");
          return;
      }
      addToCart(bike, selectedVariant);
      toast.success(`Đã thêm "${bike.name}" vào giỏ!`, { icon: '🛒' });
  }

  // --- HÀM XỬ LÝ SO SÁNH & CHUYỂN TRANG ---
  const handleCompareNow = () => {
      addToCompare(bike);
      // Chuyển hướng ngay lập tức sang trang so sánh
      navigate('/compare');
  }

  const handleDelete = async () => {
    if (window.confirm(`Xác nhận xóa vĩnh viễn dữ liệu xe: "${bike.name}"?`)) {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error("Phiên làm việc hết hạn. Vui lòng đăng nhập lại.")
        navigate('/login')
        return
      }
      const toastId = toast.loading("Đang xóa sản phẩm...")
      try {
        await axios.delete(`http://localhost:8000/api/bikes/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        toast.success("Dữ liệu đã được gỡ bỏ khỏi hệ thống.", { id: toastId })
        navigate('/bikes') 
      } catch (error) {
        const errorMsg = error.response?.data?.detail || "Không thể thực hiện thao tác xóa."
        toast.error(`Lỗi hệ thống: ${errorMsg}`, { id: toastId })
      }
    }
  }

  const formatPrice = (price) => {
    if (!price) return "Liên hệ"
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
  }

  const renderPriceSection = () => {
    const currentPrice = selectedVariant ? selectedVariant.price : bike.price
    const isDiscounted = bike.discount_price 
                          && bike.discount_price > 0 
                          && bike.discount_price < bike.price
                          && timeLeft !== "EXPIRED"
                          && currentPrice === bike.price;

    if (isDiscounted) {
        const percent = Math.round(((bike.price - bike.discount_price) / bike.price) * 100);
        return (
            <div className="mb-8 font-mono">
                {timeLeft && (
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 text-white px-3 py-1.5 rounded-lg mb-3 text-sm font-bold shadow-lg shadow-red-900/30 animate-pulse border border-red-400">
                        <Clock size={16} className="text-white" />
                        <span>Kết thúc sau: {timeLeft}</span>
                    </div>
                )}
                <div className="flex items-center gap-3 mb-1">
                    <span className="text-xl text-gray-500 line-through font-bold opacity-70">
                        {formatPrice(bike.price)}
                    </span>
                    <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full border border-red-200">
                        -{percent}%
                    </span>
                </div>
                <div className="text-5xl font-black text-red-500 tracking-tight flex items-center gap-2">
                    {formatPrice(bike.discount_price)}
                    <Tag className="w-6 h-6 animate-pulse"/>
                </div>
                <p className="text-xs text-red-400 mt-2 font-bold uppercase tracking-wide">
                    ⚡ Giá khuyến mãi đặc biệt
                </p>
            </div>
        )
    }
    return (
        <div className="text-4xl font-bold text-green-500 mb-8 font-mono">
            {formatPrice(currentPrice)}
        </div>
    )
  }

  const renderSpecs = (description) => {
    if (!description) return <p className="italic text-gray-500 text-center">Thông tin đang cập nhật...</p>
    try {
      const specs = JSON.parse(description)
      if (specs.engine || specs.chassis || specs.dimensions) {
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
            {specs.engine && (
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg hover:border-green-500/30 transition-colors">
                    <h4 className="text-green-400 font-bold mb-6 uppercase text-sm tracking-widest flex items-center gap-2 border-b border-slate-700 pb-4">
                        <Zap size={18}/> Động Cơ & Truyền Động
                    </h4>
                    <ul className="space-y-4 text-sm">
                        {Object.entries(specs.engine).map(([key, value]) => value && (
                            <li key={key} className="flex justify-between items-center border-b border-slate-700/30 pb-2 last:border-0 last:pb-0">
                                <span className="text-gray-400 font-medium">{key}</span>
                                <span className="font-bold text-white text-right ml-4 max-w-[55%]">{value}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
             {specs.chassis && (
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg hover:border-blue-500/30 transition-colors">
                    <h4 className="text-blue-400 font-bold mb-6 uppercase text-sm tracking-widest flex items-center gap-2 border-b border-slate-700 pb-4">
                         <Wrench size={18}/> Kết Cấu & Phanh
                    </h4>
                    <ul className="space-y-4 text-sm">
                        {Object.entries(specs.chassis).map(([key, value]) => value && (
                            <li key={key} className="flex justify-between items-center border-b border-slate-700/30 pb-2 last:border-0 last:pb-0">
                                <span className="text-gray-400 font-medium">{key}</span>
                                <span className="font-bold text-white text-right ml-4 max-w-[55%]">{value}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
             {specs.dimensions && (
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg hover:border-red-500/30 transition-colors">
                    <h4 className="text-red-400 font-bold mb-6 uppercase text-sm tracking-widest flex items-center gap-2 border-b border-slate-700 pb-4">
                         <Ruler size={18}/> Kích Thước & Trọng Lượng
                    </h4>
                    <ul className="space-y-4 text-sm">
                        {Object.entries(specs.dimensions).map(([key, value]) => value && (
                            <li key={key} className="flex justify-between items-center border-b border-slate-700/30 pb-2 last:border-0 last:pb-0">
                                <span className="text-gray-400 font-medium">{key}</span>
                                <span className="font-bold text-white text-right ml-4 max-w-[55%]">{value}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
          </div>
        )
      }
    } catch (e) {
      return (
         <p className="leading-relaxed bg-slate-800/50 p-8 rounded-xl border border-slate-700/50 text-sm whitespace-pre-line text-gray-300 max-w-4xl mx-auto">
            {description}
         </p>
      )
    }
  }

  if (loading) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center text-xl animate-pulse font-bold">ĐANG TRUY XUẤT DỮ LIỆU...</div>
  
  if (!bike) return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center">
      <h2 className="text-2xl font-bold mb-4">Sản phẩm không tồn tại hoặc đã bị gỡ bỏ.</h2>
      <Link to="/bikes" className="text-blue-400 hover:underline">Quay lại danh sách sản phẩm</Link>
    </div>
  )

  const displayImage = selectedVariant?.image_url || bike.image_url || "https://via.placeholder.com/800x600"
  const currentQuantity = selectedVariant ? selectedVariant.quantity : bike.quantity;
  const isOutOfStock = (currentQuantity || 0) <= 0;

  return (
    <div className="bg-slate-900 min-h-screen text-white pb-20">
      {/* HEADER NAV */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Link to="/bikes" className="inline-flex items-center text-gray-400 hover:text-green-400 transition mb-6 group">
          <ArrowLeft className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" /> 
          Quay lại danh sách sản phẩm
        </Link>
      </div>

      {/* PHẦN 1: ẢNH VÀ THÔNG TIN MUA HÀNG */}
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl relative group h-[400px] md:h-[500px]">
            <img 
              src={displayImage} 
              alt={bike.name} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute top-4 left-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded shadow-lg uppercase tracking-wider">
              {bike.make?.name || bike.brand}
            </div>
            {isOutOfStock && (
                 <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                    <span className="bg-red-600 text-white px-6 py-2 text-2xl font-black uppercase transform -rotate-12 border-4 border-white">Hết Hàng</span>
                 </div>
            )}
          </div>
          
          {bike.variants && bike.variants.length > 0 && (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {bike.variants.map((v) => (
                <button 
                  key={v.id} 
                  onClick={() => setSelectedVariant(v)} 
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${selectedVariant?.id === v.id ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-slate-700 opacity-60'}`}
                >
                  <img src={v.image_url || bike.image_url} className="w-full h-full object-cover" alt={v.name} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col justify-start pt-4">
          <div className="flex justify-between items-start">
              <div>
                  <h1 className="text-4xl md:text-5xl font-black mb-3 uppercase tracking-tighter leading-tight">
                     {bike.name}
                  </h1>
                  
                  <div className="flex items-center gap-4 mb-6">
                     {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-xs font-bold border border-red-500/50 uppercase tracking-wide">
                           <X className="w-3 h-3" /> Hết hàng
                        </span>
                     ) : (
                        <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-xs font-bold border border-green-500/50 uppercase tracking-wide">
                           <Check className="w-3 h-3" /> Còn hàng ({currentQuantity})
                        </span>
                     )}
                     <span className="flex items-center gap-1 text-yellow-500 text-sm font-bold">
                         <Star size={14} fill="currentColor"/> 5.0
                     </span>
                  </div>
              </div>

              {isAdmin && (
                <div className="ml-4 flex items-center gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700 shadow-xl">
                   <Link to={`/bikes/${id}/edit`} className="text-yellow-500 p-2 hover:bg-yellow-500/10 rounded-lg transition" title="Sửa thông tin">
                      <Edit className="w-5 h-5"/>
                   </Link>
                   <button onClick={handleDelete} className="text-red-500 p-2 hover:bg-red-500/10 rounded-lg transition" title="Xóa sản phẩm">
                      <Trash2 className="w-5 h-5"/>
                   </button>
                </div>
              )}
          </div>

          <div className="flex items-center gap-4 text-gray-400 mb-8 text-sm">
            <span className="bg-slate-800 px-4 py-1.5 rounded-lg border border-slate-700 font-mono text-gray-300">{bike.engine_cc} CC</span>
            <span className="bg-slate-800 px-4 py-1.5 rounded-lg border border-slate-700 uppercase text-gray-300">{bike.type}</span>
          </div>

          {renderPriceSection()}

          {bike.variants && bike.variants.length > 0 && (
            <div className="mb-8">
              <h3 className="text-gray-400 mb-3 font-bold text-xs uppercase tracking-widest">Lựa chọn phiên bản:</h3>
              <div className="flex flex-wrap gap-3">
                {bike.variants.map((v) => (
                    <button 
                      key={v.id} 
                      onClick={() => setSelectedVariant(v)} 
                      className={`px-6 py-3 rounded-xl font-bold border transition-all ${selectedVariant?.id === v.id ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50' : 'bg-slate-800 border-slate-700 text-gray-400 hover:border-gray-500 hover:text-white'}`}
                    >
                      {v.name.toUpperCase()}
                    </button>
                ))}
              </div>
            </div>
          )}

          {/* KHU VỰC NÚT BẤM */}
          <div className="flex flex-col sm:flex-row gap-4 mt-auto">
            <button 
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`flex-[2] font-bold py-4 rounded-xl transition shadow-xl flex items-center justify-center gap-3 text-lg uppercase tracking-wide
                  ${isOutOfStock 
                    ? 'bg-slate-700 text-gray-500 cursor-not-allowed border border-slate-600' 
                    : 'bg-green-600 hover:bg-green-500 text-white hover:shadow-green-900/50 hover:-translate-y-1' 
                  }`}
            >
              {isOutOfStock ? (
                  <> <X className="w-6 h-6" /> Tạm Hết Hàng </>
              ) : (
                  <> <ShoppingCart className="w-6 h-6" /> Thêm vào giỏ </>
              )}
            </button>

            {/* NÚT SO SÁNH (ĐÃ ĐƯỢC CHỈNH ĐỂ CHUYỂN TRANG NGAY) */}
            <button 
                onClick={handleCompareNow} 
                className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-blue-400 hover:text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-2 uppercase text-xs tracking-wider"
                title="So sánh với xe khác"
            >
                <Scale className="w-5 h-5" /> So sánh
            </button>

            <Link 
              to="/warranty" 
              className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-gray-300 hover:text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-2 uppercase text-xs tracking-wider"
            >
              <ShieldCheck className="w-5 h-5" /> Bảo hành
            </Link>
          </div>
        </div>
      </div>

      {/* PHẦN 2: THÔNG SỐ KỸ THUẬT (FULL WIDTH Ở GIỮA) */}
      <div className="max-w-7xl mx-auto px-4">
          <div className="border-t border-slate-800 pt-16">
            <div className="text-center mb-10">
                <h3 className="text-3xl font-black text-white inline-flex items-center gap-3 uppercase tracking-tighter">
                    <Settings className="w-8 h-8 text-blue-500" /> Thông số kỹ thuật
                </h3>
                <p className="text-gray-500 mt-2 text-sm">Chi tiết cấu hình và hiệu năng của xe</p>
            </div>
            
            {renderSpecs(bike.description)}
          </div>
      </div>

    </div>
  )
}

export default BikeDetailPage