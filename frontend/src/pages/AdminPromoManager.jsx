import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Save, Megaphone, Image as ImageIcon, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast' // 1. Import toast

export default function AdminPromoManager() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [promo, setPromo] = useState({
    title: '',
    description: '',
    discount_code: '',
    image_url: '',
    is_active: false
  })

  useEffect(() => {
    const fetchPromo = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/promo/')
        if (res.data) setPromo(res.data)
      } catch (error) {
        console.error("Lỗi tải Promo:", error)
        toast.error("Không thể tải cấu hình quảng cáo")
      } finally {
        setLoading(false)
      }
    }
    fetchPromo()
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setPromo({
      ...promo,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const token = localStorage.getItem('token')
    if (!token) {
        toast.error("Phiên đăng nhập hết hạn!")
        return navigate('/login')
    }

    setSaving(true)
    const toastId = toast.loading("Đang lưu cấu hình...")

    try {
      await axios.put('http://localhost:8000/api/promo/', promo, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success("Đã cập nhật Banner Quảng cáo!", { id: toastId })
      
      // Nếu đang bật popup, hiển thị thêm thông báo nhỏ
      if (promo.is_active) {
          setTimeout(() => toast("Popup sẽ hiển thị ngay khi khách vào trang chủ.", { icon: 'ℹ️' }), 1000)
      }

    } catch (error) {
      const msg = error.response?.data?.detail || "Lỗi server"
      toast.error(`Lỗi lưu: ${msg}`, { id: toastId })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
      <div className="min-h-screen bg-slate-900 pt-24 flex flex-col items-center justify-center text-white">
          <Loader2 className="animate-spin text-yellow-500 mb-2" size={32}/>
          <span className="text-xs font-bold uppercase tracking-widest">Đang tải cấu hình...</span>
      </div>
  )

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-white flex justify-center pb-20 pt-24">
      <div className="w-full max-w-4xl bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700">
        <h1 className="text-3xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 uppercase tracking-widest flex items-center gap-3">
          <Megaphone className="text-yellow-500" /> Quản Lý Popup Quảng Cáo
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700 space-y-6">
            
            {/* Bật / Tắt Popup */}
            <div className="flex items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-600 shadow-lg">
              <div>
                <h3 className={`font-bold text-lg transition-colors ${promo.is_active ? 'text-green-400' : 'text-gray-400'}`}>
                    {promo.is_active ? 'ĐANG HIỂN THỊ (ON)' : 'ĐANG ẨN (OFF)'}
                </h3>
                <p className="text-xs text-gray-400 mt-1">Gạt nút bên phải để bật/tắt Popup trên trang chủ.</p>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="is_active" checked={promo.is_active} onChange={handleChange} className="sr-only peer" />
                <div className="w-16 h-8 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-green-500 shadow-inner"></div>
              </label>
            </div>

            <div className="w-full h-px bg-slate-700 my-4"></div>

            {/* Tiêu đề & Mã giảm giá */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-400 mb-1 text-xs font-black uppercase tracking-wider">Tiêu đề Banner <span className="text-red-500">*</span></label>
                <input 
                    type="text" 
                    name="title" 
                    value={promo.title} 
                    onChange={handleChange} 
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 focus:border-yellow-500 outline-none text-white font-bold placeholder-slate-600 transition-colors" 
                    required 
                    placeholder="VD: Siêu Sale Mùa Hè"
                />
              </div>
              <div>
                <label className="block text-yellow-500 mb-1 text-xs font-black uppercase tracking-wider">Mã Giảm Giá (Code)</label>
                <input 
                    type="text" 
                    name="discount_code" 
                    value={promo.discount_code} 
                    onChange={handleChange} 
                    className="w-full bg-slate-800 border border-yellow-500/50 rounded-lg p-3 focus:border-yellow-400 outline-none text-yellow-400 font-black uppercase placeholder-slate-600 transition-colors" 
                    placeholder="VD: SALE50" 
                />
              </div>
            </div>

            {/* Nội dung */}
            <div>
              <label className="block text-gray-400 mb-1 text-xs font-black uppercase tracking-wider">Mô tả ngắn</label>
              <textarea 
                name="description" 
                value={promo.description} 
                onChange={handleChange} 
                rows="3" 
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 focus:border-yellow-500 outline-none text-sm text-gray-300 placeholder-slate-600 transition-colors"
                placeholder="Nhập nội dung quảng cáo..."
              ></textarea>
            </div>

            {/* Hình ảnh */}
            <div>
              <label className="block text-gray-400 mb-1 text-xs font-black uppercase tracking-wider flex items-center gap-2">Link Ảnh Banner (URL) <ImageIcon size={14}/></label>
              <input 
                type="text" 
                name="image_url" 
                value={promo.image_url} 
                onChange={handleChange} 
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 focus:border-yellow-500 outline-none text-blue-400 underline placeholder-slate-600 transition-colors text-sm" 
                placeholder="https://..."
              />
              
              {/* Preview Ảnh */}
              {promo.image_url && (
                <div className="mt-4 p-2 bg-slate-800 rounded-xl border border-slate-600 inline-block max-w-full">
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-2 ml-1">Xem trước:</p>
                    <div className="h-48 w-full md:w-80 rounded-lg overflow-hidden relative shadow-lg">
                        <img src={promo.image_url} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                    </div>
                </div>
              )}
            </div>
            
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-white font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 text-lg uppercase tracking-widest transition transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="animate-spin"/> : <><Save className="w-6 h-6" /> LƯU CẤU HÌNH POPUP</>}
          </button>
        </form>
      </div>
    </div>
  )
}