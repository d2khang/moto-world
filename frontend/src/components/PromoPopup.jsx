import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X, Tag, ArrowRight } from 'lucide-react'
import axios from 'axios'

export default function PromoPopup() {
  const [isOpen, setIsOpen] = useState(false)
  const [promo, setPromo] = useState(null)

  useEffect(() => {
    const fetchPromo = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/promo/')
        const data = res.data
        
        // Chỉ hiện nếu Admin bật (is_active = true) và khách chưa xem
        const hasSeenPromo = sessionStorage.getItem('hasSeenPromo')
        
        if (data && data.is_active && !hasSeenPromo) {
          setPromo(data)
          // Đợi 1.5s sau khi vào web mới nhảy popup ra
          const timer = setTimeout(() => {
            setIsOpen(true)
            sessionStorage.setItem('hasSeenPromo', 'true')
          }, 1500)
          return () => clearTimeout(timer)
        }
      } catch (error) {
        console.error("Lỗi tải Popup:", error)
      }
    }
    
    fetchPromo()
  }, [])

  if (!isOpen || !promo) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-500" onClick={() => setIsOpen(false)}></div>

      <div className="relative bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-500">
        <button onClick={() => setIsOpen(false)} className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-red-500 text-white rounded-full z-10 transition-colors">
          <X size={20} />
        </button>

        <div className="w-full md:w-1/2 h-48 md:h-auto bg-slate-800 relative">
          <img src={promo.image_url} alt="Promo" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent md:hidden"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-900 hidden md:block"></div>
        </div>

        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
          <div className="inline-flex items-center gap-1 text-green-400 font-black text-xs uppercase tracking-widest mb-2 border border-green-500/30 bg-green-500/10 w-fit px-2 py-1 rounded">
            <Tag size={12} /> Ưu đãi giới hạn
          </div>
          
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4 leading-tight">
            {promo.title}
          </h2>
          
          <p className="text-gray-400 text-sm mb-6">
            {promo.description} <br/><br/>
            Nhập mã: <strong className="text-yellow-400 text-lg bg-slate-800 px-2 py-0.5 rounded border border-slate-600 uppercase">{promo.discount_code}</strong>
          </p>
          
          <div className="flex gap-3">
            <Link to="/bikes" onClick={() => setIsOpen(false)} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-xl text-center flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-900/50">
              Mua Ngay <ArrowRight size={16}/>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}