import { useState, useEffect } from 'react'
import axios from 'axios'
import { Ticket, Plus, Trash2, Calendar, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast' // 1. Import toast

export default function AdminCouponPage() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  
  // Form State
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percent', // hoặc 'fixed'
    discount_value: '',
    expiration_date: '',
    usage_limit: 100
  })

  useEffect(() => {
    fetchCoupons()
  }, [])

  const fetchCoupons = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:8000/api/coupons/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCoupons(res.data)
    } catch (error) {
      console.error(error)
      toast.error("Không thể tải danh sách mã giảm giá")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formData.code || !formData.discount_value || !formData.expiration_date) {
        toast.error("Vui lòng điền đầy đủ thông tin bắt buộc!")
        return
    }

    setCreating(true)
    const toastId = toast.loading("Đang tạo mã...")

    try {
      const token = localStorage.getItem('token')
      
      const payload = {
          ...formData,
          code: formData.code.toUpperCase().trim(), // Luôn viết hoa mã
          discount_value: Number(formData.discount_value),
          usage_limit: Number(formData.usage_limit),
          expiration_date: new Date(formData.expiration_date).toISOString()
      }

      await axios.post('http://localhost:8000/api/coupons/', payload, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success("Tạo mã giảm giá thành công!", { id: toastId })
      setFormData({ code: '', discount_type: 'percent', discount_value: '', expiration_date: '', usage_limit: 100 }) // Reset form
      fetchCoupons() // Load lại danh sách

    } catch (error) {
      const msg = error.response?.data?.detail || "Không thể tạo mã"
      toast.error(`Lỗi: ${msg}`, { id: toastId })
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id, code) => {
      if(!window.confirm(`Bạn chắc chắn muốn xóa mã "${code}"?`)) return;
      
      const toastId = toast.loading("Đang xóa...");
      try {
        const token = localStorage.getItem('token')
        await axios.delete(`http://localhost:8000/api/coupons/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        setCoupons(coupons.filter(c => c.id !== id))
        toast.success("Đã xóa mã giảm giá!", { id: toastId })
      } catch (error) {
        toast.error("Lỗi khi xóa mã", { id: toastId })
      }
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-white pb-20 pt-24">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 uppercase tracking-tighter mb-8 flex items-center gap-2">
           <Ticket className="text-yellow-500" /> Quản Lý Mã Giảm Giá
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* FORM TẠO MÃ */}
            <div className="md:col-span-1">
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl sticky top-24">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-400 border-b border-slate-700 pb-2">
                        <Plus size={20}/> Tạo Mã Mới
                    </h3>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Mã Code <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                placeholder="VD: SALE50"
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white font-black uppercase focus:border-yellow-500 outline-none placeholder-slate-600"
                                value={formData.code}
                                onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Loại giảm</label>
                                <select 
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none cursor-pointer text-sm font-bold"
                                    value={formData.discount_type}
                                    onChange={e => setFormData({...formData, discount_type: e.target.value})}
                                >
                                    <option value="percent">Theo %</option>
                                    <option value="fixed">Tiền mặt (VNĐ)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Giá trị <span className="text-red-500">*</span></label>
                                <input 
                                    type="number" 
                                    placeholder="VD: 10"
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none font-mono font-bold"
                                    value={formData.discount_value}
                                    onChange={e => setFormData({...formData, discount_value: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Hết hạn ngày <span className="text-red-500">*</span></label>
                            <input 
                                type="datetime-local" 
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none cursor-pointer"
                                value={formData.expiration_date}
                                onChange={e => setFormData({...formData, expiration_date: e.target.value})}
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Số lượng giới hạn</label>
                            <input 
                                type="number" 
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none font-bold text-center"
                                value={formData.usage_limit}
                                onChange={e => setFormData({...formData, usage_limit: e.target.value})}
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={creating}
                            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-black py-3 rounded-xl transition shadow-lg mt-2 uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                            {creating ? <Loader2 className="animate-spin" size={20}/> : "Lưu Mã Giảm Giá"}
                        </button>
                    </form>
                </div>
            </div>

            {/* DANH SÁCH MÃ */}
            <div className="md:col-span-2 space-y-4">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 mb-4 flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-400">Danh sách mã hiện có ({coupons.length})</span>
                </div>

                {loading ? (
                    <div className="text-center text-gray-500 py-10 flex flex-col items-center gap-2">
                        <Loader2 className="animate-spin text-yellow-500" size={32}/>
                        <span className="text-xs font-bold uppercase tracking-widest">Đang tải dữ liệu...</span>
                    </div>
                ) : coupons.length === 0 ? (
                    <div className="text-center text-gray-500 bg-slate-800 p-12 rounded-xl border border-slate-700 border-dashed">
                        <Ticket size={48} className="mx-auto mb-4 opacity-20"/>
                        Chưa có mã giảm giá nào được tạo.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {coupons.map(coupon => (
                            <div key={coupon.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group hover:border-yellow-500/50 transition shadow-lg hover:bg-slate-800/80">
                                <div className="flex gap-4 items-center w-full">
                                    <div className="bg-slate-900 p-4 rounded-lg border-2 border-slate-700 border-dashed text-yellow-500 font-black text-xl min-w-[120px] text-center shadow-inner relative overflow-hidden group-hover:border-yellow-500/30 transition-colors">
                                        {coupon.code}
                                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-800 rounded-full"></div>
                                        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-800 rounded-full"></div>
                                    </div>
                                    <div className="flex-grow">
                                        <div className="font-bold text-white text-lg flex items-center gap-2">
                                            Giảm: <span className="text-green-400 bg-green-900/20 px-2 py-0.5 rounded text-sm border border-green-500/20">
                                                {coupon.discount_type === 'percent' ? `${coupon.discount_value}%` : `${new Intl.NumberFormat('vi-VN').format(coupon.discount_value)}đ`}
                                            </span>
                                        </div>
                                        <div className="text-[10px] font-bold text-gray-400 flex flex-col sm:flex-row gap-2 mt-1 uppercase tracking-wide">
                                            <span className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-700">
                                                <Calendar size={10} className="text-blue-400"/> Hết hạn: {new Date(coupon.expiration_date).toLocaleString('vi-VN')}
                                            </span>
                                            <span className={`px-2 py-1 rounded border ${coupon.used_count >= coupon.usage_limit ? 'bg-red-900/20 border-red-500/20 text-red-400' : 'bg-slate-900 border-slate-700'}`}>
                                                Đã dùng: {coupon.used_count} / {coupon.usage_limit}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleDelete(coupon.id, coupon.code)} 
                                    className="bg-slate-900 text-gray-500 p-3 rounded-lg hover:text-red-500 hover:bg-red-500/10 transition border border-slate-700 hover:border-red-500/30 w-full sm:w-auto flex justify-center"
                                    title="Xóa mã này"
                                >
                                    <Trash2 size={20}/>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  )
}