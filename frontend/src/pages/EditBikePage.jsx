import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { Save, Image as ImageIcon, ArrowLeft, Package, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast' // 1. Import toast

function EditBikePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false) // State cho nút lưu
  
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    price: '',
    engine_cc: '',
    type: 'Sport',
    description: '',
    image_url: '',
    quantity: 0,
  })

  useEffect(() => {
    const fetchBike = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/bikes/${id}`)
        const bike = res.data
        
        setFormData({
            name: bike.name || '',
            brand: bike.make?.name || bike.brand || '', 
            price: bike.price || 0,
            engine_cc: bike.engine_cc || 0,
            type: bike.type || 'Sport',
            description: bike.description || '',
            image_url: bike.image_url || '',
            quantity: bike.quantity || 0,
        })

      } catch (error) {
        console.error("Lỗi tải xe:", error)
        toast.error("Không tìm thấy thông tin xe này!")
        navigate('/admin/bikes')
      } finally {
        setLoading(false)
      }
    }
    fetchBike()
  }, [id, navigate])

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const token = localStorage.getItem('token')
    if (!token) { 
        toast.error("Phiên đăng nhập hết hạn!")
        return navigate('/login')
    }

    // Validate cơ bản
    if (Number(formData.price) < 0 || Number(formData.quantity) < 0) {
        toast.error("Giá tiền và số lượng không được âm!")
        return
    }

    setSaving(true)
    const toastId = toast.loading("Đang cập nhật dữ liệu...")

    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        engine_cc: Number(formData.engine_cc),
        quantity: Number(formData.quantity)
      }

      await axios.put(`http://localhost:8000/api/bikes/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success("Cập nhật xe thành công!", { id: toastId })
      navigate('/admin/bikes') 
    } catch (error) {
      console.error(error)
      const msg = error.response?.data?.detail || error.message
      toast.error(`Lỗi cập nhật: ${msg}`, { id: toastId })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
          <Loader2 className="animate-spin mb-2" size={32}/>
          <span className="text-sm font-bold uppercase tracking-widest">Đang tải dữ liệu...</span>
      </div>
  )

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-white flex justify-center pb-20 pt-24">
      <div className="w-full max-w-4xl bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700">
        <div className="flex items-center mb-6 justify-between">
            <div className="flex items-center">
                <Link to="/admin/bikes" className="text-gray-400 hover:text-white mr-4 p-2 bg-slate-700 rounded-full transition hover:bg-slate-600"><ArrowLeft size={20}/></Link>
                <h1 className="text-3xl font-bold text-yellow-500 uppercase tracking-wide">Chỉnh Sửa Xe #{id}</h1>
            </div>
            <span className="bg-slate-900 px-3 py-1 rounded text-xs font-mono text-gray-500 border border-slate-700">ID: {id}</span>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tên xe */}
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-gray-400 mb-1 text-sm font-bold">Tên xe</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded p-3 focus:border-yellow-500 outline-none text-white font-bold" />
                    </div>

                    {/* Hãng xe */}
                    <div>
                        <label className="block text-gray-400 mb-1 text-sm font-bold">Hãng sản xuất</label>
                        <input type="text" name="brand" value={formData.brand} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded p-3 focus:border-yellow-500 outline-none" />
                    </div>

                    {/* Giá tiền */}
                    <div>
                        <label className="block text-gray-400 mb-1 text-sm font-bold">Giá bán (VNĐ)</label>
                        <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded p-3 focus:border-yellow-500 outline-none font-mono font-bold text-green-400" />
                    </div>

                    {/* --- Ô NHẬP SỐ LƯỢNG --- */}
                    <div>
                        <label className="block text-yellow-400 mb-1 text-sm font-bold flex items-center gap-1">
                             <Package size={16}/> Số lượng kho
                        </label>
                        <input 
                            type="number" 
                            name="quantity" 
                            value={formData.quantity} 
                            onChange={handleChange} 
                            className="w-full bg-slate-800 border border-yellow-500/50 rounded p-3 focus:border-yellow-400 outline-none text-yellow-400 font-bold" 
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 col-span-2">
                        <div>
                            <label className="block text-gray-400 mb-1 text-sm font-bold">Động cơ (cc)</label>
                            <input type="number" name="engine_cc" value={formData.engine_cc} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded p-3 focus:border-yellow-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-1 text-sm font-bold">Loại xe</label>
                            <select name="type" value={formData.type} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded p-3 focus:border-yellow-500 outline-none cursor-pointer">
                                <option value="Sport">Sport</option>
                                <option value="Naked">Naked</option>
                                <option value="Adventure">Adventure</option>
                                <option value="Cruiser">Cruiser</option>
                                <option value="Scooter">Scooter</option>
                                <option value="Classic">Classic</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="mt-4">
                    <label className="block text-gray-400 mb-1 text-sm font-bold flex items-center gap-2">Link Ảnh (URL) <ImageIcon size={14}/></label>
                    <input type="text" name="image_url" value={formData.image_url} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded p-3 focus:border-yellow-500 outline-none text-blue-400 underline" placeholder="https://..." />
                    
                    {/* Preview ảnh nhỏ */}
                    {formData.image_url && (
                        <div className="mt-3 inline-block p-1 bg-slate-800 border border-slate-600 rounded-lg">
                            <img src={formData.image_url} alt="Preview" className="h-32 rounded object-cover" onError={(e) => e.target.style.display = 'none'} />
                        </div>
                    )}
                </div>

                <div className="mt-4">
                    <label className="block text-gray-400 mb-1 text-sm font-bold">Mô tả chi tiết</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows="5" className="w-full bg-slate-800 border border-slate-600 rounded p-3 focus:border-yellow-500 outline-none text-gray-300"></textarea>
                </div>
            </div>

            <button 
                type="submit" 
                disabled={saving}
                className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-black font-bold py-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2 transform hover:scale-[1.01] active:scale-[0.99]"
            >
                {saving ? <Loader2 className="animate-spin text-white"/> : <><Save className="w-6 h-6" /> LƯU THAY ĐỔI</>}
            </button>
        </form>
      </div>
    </div>
  )
}

export default EditBikePage