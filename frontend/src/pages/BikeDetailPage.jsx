import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom' 
import axios from 'axios'
import { 
  ArrowLeft, ShoppingCart, Zap, Trash2, Edit, X, ShieldCheck, 
  Ruler, Settings, Tag, Clock, Star, Scale, Info, Gauge 
} from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useCompare } from '../context/CompareContext' 
import toast from 'react-hot-toast'

/**
 * File: BikeDetailPage.jsx
 * Chức năng: Hiển thị chi tiết xe.
 * ĐẶC BIỆT: Logic lọc ảnh chỉ hiển thị ảnh của biến thể (màu) đang chọn.
 */

function BikeDetailPage() {
  const { id } = useParams() 
  const navigate = useNavigate()
  
  const [bike, setBike] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [activeImage, setActiveImage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState(null)

  const { addToCart } = useCart()
  const { addToCompare } = useCompare()

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isAdmin = user.role === 'admin' || user.role === 'staff'

  // 1. FETCH DỮ LIỆU
  useEffect(() => {
    const fetchBikeDetail = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/bikes/${id}`)
        setBike(res.data)
        
        // Mặc định chọn biến thể đầu tiên
        if (res.data.variants && res.data.variants.length > 0) {
            setSelectedVariant(res.data.variants[0])
        }

        // Mặc định hiển thị ảnh của biến thể đầu tiên (nếu có)
        const initialImg = (res.data.variants && res.data.variants[0]?.image_url) 
            ? res.data.variants[0].image_url 
            : res.data.image_url
        setActiveImage(initialImg)

      } catch (error) {
        console.error("Lỗi:", error)
        toast.error("Không thể tải thông tin xe")
      } finally {
        setLoading(false)
      }
    }
    fetchBikeDetail()
  }, [id])

  // 2. LOGIC ĐẾM NGƯỢC FLASH SALE
  useEffect(() => {
    if (!bike) return;
    const endDate = bike.is_flash_sale ? bike.flash_sale_end : bike.discount_end_date;
    if (!endDate) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
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

  // 3. TỰ ĐỘNG ĐỔI ẢNH LỚN KHI CHỌN MÀU (BIẾN THỂ) KHÁC
  useEffect(() => {
      if (selectedVariant && selectedVariant.image_url) {
          setActiveImage(selectedVariant.image_url)
      }
  }, [selectedVariant])

  const handleAddToCart = () => {
      const qty = selectedVariant ? selectedVariant.quantity : bike.quantity;
      if (qty <= 0) return toast.error("Sản phẩm tạm hết hàng!");
      addToCart(bike, selectedVariant);
      toast.success(`Đã thêm "${bike.name}" vào giỏ!`);
  }

  const handleDelete = async () => {
    if (window.confirm(`Xóa vĩnh viễn "${bike.name}"?`)) {
      const token = localStorage.getItem('token')
      try {
        await axios.delete(`http://localhost:8000/api/bikes/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        toast.success("Đã xóa sản phẩm")
        navigate('/admin/bikes') 
      } catch (error) {
        toast.error("Lỗi khi xóa")
      }
    }
  }

  const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0)

  // --- RENDER GIÁ ---
  const renderPriceSection = () => {
    const originalPrice = selectedVariant ? selectedVariant.price : bike.price
    let finalPrice = originalPrice
    let isSale = false
    let tagLabel = ""

    if (bike.is_flash_sale && timeLeft !== "EXPIRED") {
        finalPrice = bike.flash_sale_price || originalPrice
        isSale = true
        tagLabel = "🔥 FLASH SALE"
    } else if (bike.discount_price && bike.discount_price < originalPrice && timeLeft !== "EXPIRED") {
        finalPrice = bike.discount_price
        isSale = true
        tagLabel = "⚡ KHUYẾN MÃI"
    }

    if (isSale) {
        const percent = Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
        return (
            <div className="mb-6 font-mono bg-slate-800/50 p-4 rounded-xl border border-red-500/30">
                {timeLeft && (
                    <div className="inline-flex items-center gap-2 text-red-400 mb-2 text-sm font-bold animate-pulse">
                        <Clock size={16} /> <span>Kết thúc sau: {timeLeft}</span>
                    </div>
                )}
                <div className="flex items-end gap-3">
                    <span className="text-4xl font-black text-red-500 tracking-tight">
                        {formatPrice(finalPrice)}
                    </span>
                    <span className="text-lg text-gray-500 line-through font-bold mb-1">
                        {formatPrice(originalPrice)}
                    </span>
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded mb-2">
                        -{percent}%
                    </span>
                </div>
                <p className="text-xs text-red-400 mt-1 font-bold uppercase">{tagLabel}</p>
            </div>
        )
    }
    return (
        <div className="text-4xl font-black text-green-500 mb-8 font-mono tracking-tight">
            {formatPrice(finalPrice)}
        </div>
    )
  }

  // --- RENDER SPECS ---
  const renderSpecs = () => {
     if (!bike.specs) {
         return <p className="text-gray-500 italic text-center py-8">Chưa có thông số kỹ thuật chi tiết.</p>
     }
     const s = bike.specs
     return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
                <h4 className="text-blue-400 font-bold mb-4 uppercase text-sm flex items-center gap-2 border-b border-slate-700 pb-2">
                    <Zap size={18}/> Hiệu Năng
                </h4>
                <ul className="space-y-3 text-sm">
                    <SpecItem label="Động cơ" value={s.engine_type} />
                    <SpecItem label="Hộp số" value={s.transmission} />
                    <SpecItem label="Công suất" value={s.power_hp ? `${s.power_hp} HP` : null} highlight />
                    <SpecItem label="Mô-men xoắn" value={s.torque_nm ? `${s.torque_nm} Nm` : null} />
                    <SpecItem label="Tốc độ tối đa" value={s.top_speed_kmh ? `${s.top_speed_kmh} km/h` : null} />
                </ul>
            </div>
            <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
                <h4 className="text-orange-400 font-bold mb-4 uppercase text-sm flex items-center gap-2 border-b border-slate-700 pb-2">
                    <Ruler size={18}/> Kích Thước
                </h4>
                <ul className="space-y-3 text-sm">
                    <SpecItem label="Chiều cao yên" value={s.seat_height_mm ? `${s.seat_height_mm} mm` : null} />
                    <SpecItem label="Trọng lượng ướt" value={s.weight_kg ? `${s.weight_kg} kg` : null} />
                    <SpecItem label="Dung tích bình xăng" value={s.fuel_capacity_l ? `${s.fuel_capacity_l} L` : null} />
                </ul>
            </div>
            <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
                 <h4 className="text-green-400 font-bold mb-4 uppercase text-sm flex items-center gap-2 border-b border-slate-700 pb-2">
                    <Info size={18}/> Thông Tin Khác
                </h4>
                <div className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                    {bike.description || "Đang cập nhật mô tả..."}
                </div>
            </div>
        </div>
     )
  }

  const SpecItem = ({ label, value, highlight }) => {
      if (!value) return null
      return (
        <li className="flex justify-between items-center">
            <span className="text-gray-400">{label}</span>
            <span className={`font-bold ${highlight ? 'text-yellow-400' : 'text-slate-200'}`}>{value}</span>
        </li>
      )
  }

  if (loading) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center font-bold">LOADING...</div>
  if (!bike) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Sản phẩm không tồn tại</div>

  const currentQuantity = selectedVariant ? selectedVariant.quantity : bike.quantity;
  const isOutOfStock = (currentQuantity || 0) <= 0;

  // ============================================================
  // LOGIC LỌC ẢNH THÔNG MINH (UPDATED)
  // Chỉ hiển thị ảnh của biến thể đang chọn.
  // ============================================================
  
  let displayImages = []
  
  if (selectedVariant) {
      // 1. Lấy ảnh đại diện của biến thể
      if (selectedVariant.image_url) {
          displayImages.push(selectedVariant.image_url)
      }
      
      // 2. Lấy album ảnh riêng của biến thể (Từ Backend mới đã gửi kèm)
      if (selectedVariant.images && selectedVariant.images.length > 0) {
          const variantGallery = selectedVariant.images.map(img => img.image_url)
          displayImages = [...displayImages, ...variantGallery]
      }
  }

  // 3. Fallback: Chỉ khi nào không có bất kỳ ảnh nào của biến thể, mới dùng ảnh chung của xe
  // (Để tránh việc chọn màu Đỏ mà lại hiện ảnh màu Xanh từ gallery chung)
  if (displayImages.length === 0) {
      if (bike.image_url) displayImages.push(bike.image_url)
      // Nếu muốn hiển thị gallery chung khi không có ảnh biến thể, bỏ comment dòng dưới:
      // if (bike.images) displayImages = [...displayImages, ...bike.images.map(i => i.image_url)]
  }

  // 4. Lọc trùng lặp (Unique)
  const allImages = displayImages.filter((url, index, self) => url && self.indexOf(url) === index)

  return (
    <div className="bg-slate-900 min-h-screen text-white pb-20 pt-20">
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <Link to="/bikes" className="inline-flex items-center text-slate-400 hover:text-white transition group">
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition" /> Danh sách sản phẩm
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* CỘT TRÁI: GALLERY ẢNH */}
        <div className="space-y-4">
          {/* ẢNH LỚN ACTIVE */}
          <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 relative aspect-[4/3] group">
            <img src={activeImage || "https://via.placeholder.com/600x400?text=No+Image"} alt={bike.name} className="w-full h-full object-contain bg-black/20" />
             {isOutOfStock && (
                 <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                    <span className="bg-red-600 text-white px-6 py-2 text-xl font-bold uppercase -rotate-12 border-4 border-white">Hết Hàng</span>
                 </div>
             )}
          </div>

          {/* LIST THUMBNAILS (Chỉ hiện ảnh của màu đang chọn) */}
          {allImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
               {allImages.map((img, idx) => (
                  <button key={idx} onClick={() => setActiveImage(img)} className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${activeImage === img ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-slate-700 opacity-60 hover:opacity-100'}`}>
                     <img src={img} className="w-full h-full object-cover" />
                  </button>
               ))}
            </div>
          )}
        </div>

        {/* CỘT PHẢI: THÔNG TIN */}
        <div>
           <div className="mb-2">
              <span className="text-blue-400 text-sm font-bold uppercase tracking-wider">{bike.make?.name || bike.brand}</span>
              <h1 className="text-4xl md:text-5xl font-black text-white uppercase mt-1 mb-2 leading-tight">{bike.name}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1"><Gauge size={16}/> {bike.engine_cc}cc</span>
                  <span className="flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded">{bike.type}</span>
                  <span className="flex items-center gap-1 text-yellow-500"><Star size={16} fill="currentColor"/> 5.0</span>
              </div>
           </div>

           {isAdmin && (
                <div className="flex gap-3 mb-6">
                    <Link to={`/bikes/${id}/edit`} className="flex items-center gap-2 bg-yellow-500/10 text-yellow-500 px-4 py-2 rounded-lg hover:bg-yellow-500/20 transition text-sm font-bold">
                        <Edit size={16}/> Chỉnh sửa
                    </Link>
                    <button onClick={handleDelete} className="flex items-center gap-2 bg-red-500/10 text-red-500 px-4 py-2 rounded-lg hover:bg-red-500/20 transition text-sm font-bold">
                        <Trash2 size={16}/> Xóa xe
                    </button>
                </div>
           )}

           <div className="w-full h-px bg-slate-800 my-6"></div>
           {renderPriceSection()}

           {bike.variants && bike.variants.length > 0 && (
              <div className="mb-8">
                 <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">Lựa chọn phiên bản:</h3>
                 <div className="flex flex-wrap gap-3">
                    {bike.variants.map((v) => (
                       <button key={v.id} onClick={() => setSelectedVariant(v)} className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${selectedVariant?.id === v.id ? 'bg-slate-800 border-blue-500 text-white shadow-lg shadow-blue-500/10' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                          {v.image_url && <img src={v.image_url} className="w-6 h-6 rounded object-cover" />}
                          <span className="font-bold text-sm uppercase">{v.name}</span>
                       </button>
                    ))}
                 </div>
              </div>
           )}

           <div className="flex gap-4">
              <button onClick={handleAddToCart} disabled={isOutOfStock} className={`flex-1 py-4 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-transform active:scale-95 ${isOutOfStock ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white'}`}>
                 {isOutOfStock ? "Hết Hàng" : <><ShoppingCart size={20}/> Thêm Vào Giỏ</>}
              </button>
              <button onClick={() => { addToCompare(bike); navigate('/compare'); }} className="px-6 rounded-xl bg-slate-800 border border-slate-600 text-blue-400 hover:text-white hover:border-blue-500 transition-colors">
                 <Scale size={24} />
              </button>
           </div>

           <div className="mt-6 grid grid-cols-2 gap-4 text-xs font-bold text-slate-500 uppercase">
              <div className="flex items-center gap-2"><ShieldCheck size={16}/> Bảo hành chính hãng</div>
              <div className="flex items-center gap-2"><Tag size={16}/> Giá đã bao gồm VAT</div>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-16 border-t border-slate-800 pt-10">
          <div className="flex items-center gap-3 mb-6">
             <div className="p-3 bg-slate-800 rounded-xl text-blue-500"><Settings size={24}/></div>
             <h3 className="text-2xl font-black text-white uppercase">Thông Số Kỹ Thuật Chi Tiết</h3>
          </div>
          {renderSpecs()}
      </div>
    </div>
  )
}

export default BikeDetailPage