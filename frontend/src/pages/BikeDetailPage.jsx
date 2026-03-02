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

  // ✅ HELPER: Định dạng URL ảnh chuẩn
  const formatUrl = (url) => {
    if (!url) return "https://via.placeholder.com/600x400?text=No+Image";
    if (url.startsWith('http')) return url;
    return `http://localhost:8000/${url}`; 
  }

  // 1. FETCH DỮ LIỆU
  useEffect(() => {
    const fetchBikeDetail = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/bikes/${id}`)
        const data = res.data
        setBike(data)
        
        // Mặc định chọn biến thể đầu tiên (nếu có)
        if (data.variants && data.variants.length > 0) {
            const firstVar = data.variants[0];
            setSelectedVariant(firstVar);

            // LOGIC CHỌN ẢNH KHỞI TẠO:
            // 1. Ảnh đại diện của biến thể
            // 2. Ảnh đầu tiên trong gallery của biến thể
            // 3. Ảnh gốc của xe
            let initImg = firstVar.image_url;
            if (!initImg && firstVar.images && firstVar.images.length > 0) {
                initImg = firstVar.images[0].image_url;
            }
            setActiveImage(formatUrl(initImg || data.image_url));

        } else {
            // Không có biến thể -> Lấy ảnh gốc
            setActiveImage(formatUrl(data.image_url));
        }
      } catch (error) {
        toast.error("Không thể tải thông tin xe")
      } finally {
        setLoading(false)
      }
    }
    fetchBikeDetail()
  }, [id])

  // 2. LOGIC ĐẾM NGƯỢC
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

  // 3. ĐỔI ẢNH KHI CHỌN BIẾN THỂ (SỬA LẠI LOGIC ƯU TIÊN)
  useEffect(() => {
      if (selectedVariant) {
          // Khi chọn màu, tìm ảnh để hiển thị theo thứ tự ưu tiên:
          // 1. Ảnh đại diện riêng của màu đó
          // 2. Ảnh đầu tiên trong bộ sưu tập của màu đó
          // 3. (Fallback) Ảnh gốc của xe
          
          let imgToShow = selectedVariant.image_url;
          if (!imgToShow && selectedVariant.images && selectedVariant.images.length > 0) {
              imgToShow = selectedVariant.images[0].image_url;
          }
          
          setActiveImage(formatUrl(imgToShow || bike?.image_url));
      }
  }, [selectedVariant, bike])

  const handleAddToCart = () => {
      const qty = selectedVariant ? selectedVariant.quantity : bike.total_quantity;
      if (qty <= 0) return toast.error("Sản phẩm tạm hết hàng!");
      addToCart(bike, selectedVariant);
      toast.success(`Đã thêm vào giỏ hàng!`);
  }

  const handleDelete = async () => {
    if (window.confirm(`Xóa vĩnh viễn "${bike.name}"?`)) {
      const token = localStorage.getItem('token')
      try {
        await axios.delete(`http://localhost:8000/api/bikes/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        toast.success("Đã xóa sản phẩm")
        navigate('/bikes') 
      } catch (error) {
        toast.error("Lỗi khi xóa")
      }
    }
  }

  const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0)

  // --- RENDER GIÁ ---
  const renderPriceSection = () => {
    const originalPrice = selectedVariant ? selectedVariant.price : bike.price
    let finalPrice = bike.current_price || originalPrice
    let isSale = finalPrice < originalPrice

    if (isSale && timeLeft !== "EXPIRED") {
        const percent = Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
        return (
            <div className="mb-6 font-mono bg-slate-800/50 p-5 rounded-2xl border border-red-500/30">
                {timeLeft && (
                    <div className="inline-flex items-center gap-2 text-red-400 mb-3 text-sm font-bold bg-red-500/10 px-3 py-1 rounded-full animate-pulse">
                        <Clock size={16} /> <span>Kết thúc sau: {timeLeft}</span>
                    </div>
                )}
                <div className="flex items-end gap-4">
                    <span className="text-5xl font-black text-red-500 tracking-tighter">{formatPrice(finalPrice)}</span>
                    <div className="flex flex-col mb-1">
                        <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md mb-1 w-fit">-{percent}%</span>
                        <span className="text-lg text-gray-500 line-through font-bold">{formatPrice(originalPrice)}</span>
                    </div>
                </div>
                <p className="text-xs text-red-400 mt-2 font-black uppercase tracking-widest">{bike.is_flash_sale ? "🔥 FLASH SALE" : "⚡ KHUYẾN MÃI"}</p>
            </div>
        )
    }
    return <div className="text-5xl font-black text-green-500 mb-8 font-mono tracking-tighter">{formatPrice(finalPrice)}</div>
  }

  // --- RENDER SPECS ---
  const renderSpecs = () => {
     if (!bike.specs) return <p className="text-gray-500 italic text-center py-10">Thông số kỹ thuật đang cập nhật...</p>
     const s = bike.specs
     return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
            <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700 shadow-xl">
                <h4 className="text-blue-400 font-black mb-5 uppercase text-xs tracking-widest flex items-center gap-2 border-b border-slate-700 pb-3"><Zap size={18}/> Hiệu Năng</h4>
                <ul className="space-y-4 text-sm">
                    <SpecItem label="Loại động cơ" value={s.engine_type} />
                    <SpecItem label="Dung tích" value={bike.engine_cc ? `${bike.engine_cc} cc` : null} />
                    <SpecItem label="Hộp số" value={s.transmission} />
                    <SpecItem label="Công suất" value={s.power_hp ? `${s.power_hp} HP` : null} highlight />
                    <SpecItem label="Mô-men xoắn" value={s.torque_nm ? `${s.torque_nm} Nm` : null} />
                </ul>
            </div>
            <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700 shadow-xl">
                <h4 className="text-orange-400 font-black mb-5 uppercase text-xs tracking-widest flex items-center gap-2 border-b border-slate-700 pb-3"><Ruler size={18}/> Kích Thước</h4>
                <ul className="space-y-4 text-sm">
                    <SpecItem label="Chiều cao yên" value={s.seat_height_mm ? `${s.seat_height_mm} mm` : null} />
                    <SpecItem label="Trọng lượng" value={s.weight_kg ? `${s.weight_kg} kg` : null} />
                    <SpecItem label="Bình xăng" value={s.fuel_capacity_l ? `${s.fuel_capacity_l} L` : null} />
                    <SpecItem label="Phanh trước" value={s.front_brake} />
                    <SpecItem label="Phanh sau" value={s.rear_brake} />
                </ul>
            </div>
            <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700 shadow-xl">
                 <h4 className="text-green-400 font-black mb-5 uppercase text-xs tracking-widest flex items-center gap-2 border-b border-slate-700 pb-3"><Info size={18}/> Giới Thiệu</h4>
                <div className="text-gray-400 text-sm leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto custom-scrollbar">
                    {bike.description || "Đang cập nhật mô tả..."}
                </div>
            </div>
        </div>
     )
  }

  const SpecItem = ({ label, value, highlight }) => {
      if (!value) return null
      return (
        <li className="flex justify-between items-center group">
            <span className="text-gray-500 group-hover:text-gray-300 transition-colors">{label}</span>
            <span className={`font-bold ${highlight ? 'text-yellow-400' : 'text-slate-200'}`}>{value}</span>
        </li>
      )
  }

  if (loading) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center font-black uppercase tracking-widest">Đang tải...</div>

  // ============================================================
  // ✅ LOGIC GALLERY (ĐÃ SỬA): CHIA TÁCH HOÀN TOÀN
  // ============================================================
  let thumbnails = []

  if (selectedVariant) {
      // --- TRƯỜNG HỢP 1: ĐANG CHỌN BIẾN THỂ (MÀU) ---
      // CHỈ lấy ảnh của biến thể đó.
      
      // 1. Lấy ảnh đại diện của biến thể
      const variantMainImg = formatUrl(selectedVariant.image_url);
      if (variantMainImg) thumbnails.push(variantMainImg);

      // 2. Lấy bộ sưu tập ảnh của biến thể (nếu có)
      if (selectedVariant.images && selectedVariant.images.length > 0) {
          selectedVariant.images.forEach(img => {
              const url = formatUrl(img.image_url);
              // Chỉ thêm nếu khác ảnh đại diện để tránh trùng
              if (url !== variantMainImg) thumbnails.push(url);
          });
      }
      
      // Nếu biến thể không có ảnh nào -> Để trống (Không fallback về ảnh xe gốc để tránh nhầm màu)

  } else {
      // --- TRƯỜNG HỢP 2: KHÔNG CÓ BIẾN THỂ (HOẶC CHƯA CHỌN) ---
      // Lấy ảnh gốc của xe
      const bikeMainImg = formatUrl(bike.image_url);
      if (bikeMainImg) thumbnails.push(bikeMainImg);

      if (bike.images && bike.images.length > 0) {
          bike.images.forEach(img => {
              const url = formatUrl(img.image_url);
              if (url !== bikeMainImg) thumbnails.push(url);
          });
      }
  }

  const currentQuantity = selectedVariant ? selectedVariant.quantity : bike.total_quantity;
  const isOutOfStock = (currentQuantity || 0) <= 0;

  return (
    <div className="bg-slate-900 min-h-screen text-white pb-20 pt-24">
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <Link to="/bikes" className="inline-flex items-center text-slate-500 hover:text-white transition-all font-bold uppercase text-xs tracking-widest">
          <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại danh sách
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* CỘT TRÁI: GALLERY */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-700 relative aspect-[4/3] shadow-2xl">
            <img src={activeImage} alt={bike.name} className="absolute inset-0 w-full h-full object-contain p-8" />
             {isOutOfStock && (
                 <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10 backdrop-blur-sm">
                    <span className="bg-red-600 text-white px-8 py-3 text-2xl font-black uppercase -rotate-12 border-4 border-white shadow-2xl">HẾT HÀNG</span>
                 </div>
             )}
          </div>

          {/* LIST THUMBNAILS (Đã lọc theo màu) */}
          {thumbnails.length > 0 && (
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
               {thumbnails.map((img, idx) => (
                  <button key={idx} onClick={() => setActiveImage(img)} className={`w-24 h-20 flex-shrink-0 rounded-2xl overflow-hidden border-2 bg-white p-1 transition-all ${activeImage === img ? 'border-blue-500 scale-105 shadow-lg shadow-blue-500/20' : 'border-slate-800 opacity-40 hover:opacity-100'}`}>
                     <img src={img} className="w-full h-full object-contain" />
                  </button>
               ))}
            </div>
          )}
        </div>

        {/* CỘT PHẢI: THÔNG TIN */}
        <div className="flex flex-col">
           <div className="mb-4">
              <span className="text-blue-500 text-sm font-black uppercase tracking-widest">{bike.make?.name || bike.brand}</span>
              <h1 className="text-5xl md:text-6xl font-black text-white uppercase mt-2 mb-4 leading-none tracking-tighter">{bike.name}</h1>
              <div className="flex items-center gap-6 text-sm text-gray-400 font-bold">
                  <span className="flex items-center gap-2 bg-slate-800 px-4 py-1.5 rounded-full border border-slate-700"><Gauge size={16}/> {bike.engine_cc} CC</span>
                  <span className="flex items-center gap-2 bg-slate-800 px-4 py-1.5 rounded-full border border-slate-700 uppercase"><Tag size={16}/> {bike.type}</span>
                  <span className="flex items-center gap-2 text-yellow-500"><Star size={18} fill="currentColor"/> 5.0</span>
              </div>
           </div>

           {isAdmin && (
                <div className="flex gap-3 mb-8">
                    <Link to={`/bikes/${id}/edit`} className="bg-yellow-500/10 text-yellow-500 px-5 py-2.5 rounded-xl hover:bg-yellow-500/20 transition text-xs font-black uppercase tracking-widest border border-yellow-500/20 flex items-center gap-2">
                        <Edit size={16}/> Chỉnh sửa
                    </Link>
                    <button onClick={handleDelete} className="bg-red-500/10 text-red-500 px-5 py-2.5 rounded-xl hover:bg-red-500/20 transition text-xs font-black uppercase tracking-widest border border-red-500/20 flex items-center gap-2">
                        <Trash2 size={16}/> Xóa xe
                    </button>
                </div>
           )}

           <div className="w-full h-px bg-slate-800 mb-8"></div>
           {renderPriceSection()}

           {bike.variants && bike.variants.length > 0 && (
              <div className="mb-10">
                 <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-4">Lựa chọn màu sắc</h3>
                 <div className="flex flex-wrap gap-4">
                    {bike.variants.map((v) => (
                       <button key={v.id} onClick={() => setSelectedVariant(v)} className={`flex items-center gap-3 px-5 py-4 rounded-2xl border-2 transition-all ${selectedVariant?.id === v.id ? 'bg-slate-800 border-blue-500 text-white shadow-xl ring-2 ring-blue-500/20' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'}`}>
                          {v.image_url && <div className="w-8 h-8 rounded-full bg-white p-0.5 overflow-hidden border border-slate-700"><img src={formatUrl(v.image_url)} className="w-full h-full object-contain" /></div>}
                          <span className="font-black text-xs uppercase tracking-widest">{v.name}</span>
                       </button>
                    ))}
                 </div>
              </div>
           )}

           <div className="flex gap-4 mt-auto">
              <button onClick={handleAddToCart} disabled={isOutOfStock} className={`flex-[3] py-5 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all ${isOutOfStock ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' : 'bg-green-600 hover:bg-green-500 text-white shadow-green-900/40'}`}>
                 {isOutOfStock ? "HẾT HÀNG" : <><ShoppingCart size={22}/> Thêm Vào Giỏ</>}
              </button>
              <button onClick={() => { addToCompare(bike); navigate('/compare'); }} className="flex-1 rounded-2xl bg-slate-800 border-2 border-slate-700 text-slate-400 hover:text-white hover:border-blue-500 transition-all flex items-center justify-center">
                 <Scale size={24} />
              </button>
           </div>

           <div className="mt-8 grid grid-cols-2 gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <div className="flex items-center gap-3 bg-slate-800/30 p-3 rounded-xl border border-slate-800"><ShieldCheck size={18} className="text-blue-500"/> Bảo hành 2 năm</div>
              <div className="flex items-center gap-3 bg-slate-800/30 p-3 rounded-xl border border-slate-800"><Tag size={18} className="text-green-500"/> Hỗ trợ trả góp</div>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-24 border-t border-slate-800 pt-16">
          <div className="flex items-center gap-4 mb-10">
              <div className="p-4 bg-blue-500 rounded-3xl shadow-lg shadow-blue-500/20 text-white"><Settings size={32}/></div>
              <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Thông Số Kỹ Thuật</h3>
          </div>
          {renderSpecs()}
      </div>
    </div>
  )
}

const Loader2 = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
)

export default BikeDetailPage