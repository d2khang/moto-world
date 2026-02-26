import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Plus, Trash2, Save, Image as ImageIcon, Package, Percent, Layers, Settings, Ruler, Wrench, Clock, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast' // 1. Import toast

function AddBikePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false) // Thêm state loading
  
  // --- STATE CHÍNH ---
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    price: '',
    discount_price: '',
    discount_end_date: '',
    engine_cc: '',
    type: 'Sport',
    image_url: '',
    quantity: 0, 
  })

  const [variants, setVariants] = useState([
    { name: '', price: '', image_url: '', quantity: 1 }
  ])

  // --- STATE CHO BẢNG THÔNG SỐ KỸ THUẬT ---
  const [specs, setSpecs] = useState({
    engine: {
      "Loại động cơ": "", "Dung tích": "", "Đường kính x Hành trình piston": "",
      "Tỷ số nén": "", "Công suất cực đại": "", "Mô-men xoắn cực đại": "",
      "Hệ thống nhiên liệu": "", "Hộp số": "", "Tiêu thụ nhiên liệu": ""
    },
    chassis: {
      "Khung xe": "", "Hệ thống treo trước": "", "Hệ thống treo sau": "",
      "Phanh trước": "", "Phanh sau": "", "Lốp trước": "", "Lốp sau": ""
    },
    dimensions: {
      "Dài x Rộng x Cao": "", "Chiều cao yên": "", "Chiều dài cơ sở": "",
      "Khoảng sáng gầm": "", "Khối lượng ướt": "", "Dung tích bình xăng": "", "Dung tích nhớt": ""
    }
  })

  // Tự động tính tổng tồn kho
  useEffect(() => {
    const totalQty = variants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0)
    setFormData(prev => ({ ...prev, quantity: totalQty }))
  }, [variants])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // Hàm nhập thông số kỹ thuật
  const handleSpecChange = (category, key, value) => {
    setSpecs(prev => ({
      ...prev,
      [category]: { ...prev[category], [key]: value }
    }))
  }

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants]
    newVariants[index][field] = value
    setVariants(newVariants)
    
    // Tự động copy ảnh từ biến thể đầu tiên lên ảnh chính
    if (index === 0 && field === 'image_url' && formData.image_url === '') {
        setFormData(prev => ({ ...prev, image_url: value }))
    }
  }

  const addVariant = () => {
    setVariants([...variants, { name: '', price: formData.price, image_url: '', quantity: 1 }])
  }

  const removeVariant = (index) => {
    if (variants.length <= 1) {
        toast.error("Phải có ít nhất 1 phiên bản màu sắc!");
        return;
    }
    const newVariants = variants.filter((_, i) => i !== index)
    setVariants(newVariants)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const token = localStorage.getItem('token')
    if (!token) {
      toast.error("Phiên làm việc hết hạn. Vui lòng đăng nhập lại!")
      navigate('/login')
      return
    }

    // Validate cơ bản
    if (!formData.name || !formData.brand || !formData.price || !formData.engine_cc) {
        toast.error("Vui lòng điền đầy đủ các trường bắt buộc (*)")
        return
    }

    const validVariants = variants.filter(v => v.name.trim() !== "")
    if (validVariants.length === 0) {
        toast.error("Vui lòng thêm ít nhất 1 phiên bản màu sắc!")
        return
    }

    // Validate giá khuyến mãi
    const price = Number(formData.price)
    const discountPrice = formData.discount_price ? Number(formData.discount_price) : null
    
    if (discountPrice && discountPrice >= price) {
      toast.error("Giá khuyến mãi phải nhỏ hơn giá gốc!")
      return;
    }

    setLoading(true)
    const toastId = toast.loading("Đang đăng bán xe...")

    // Gom Specs thành JSON
    const descriptionJSON = JSON.stringify(specs) 

    const payload = {
      ...formData,
      description: descriptionJSON,
      price: price,
      discount_price: discountPrice,
      discount_end_date: formData.discount_end_date ? new Date(formData.discount_end_date).toISOString() : null,
      engine_cc: Number(formData.engine_cc),
      quantity: Number(formData.quantity),
      variants: validVariants.map(v => ({ 
        ...v, 
        price: v.price ? Number(v.price) : price,
        quantity: Number(v.quantity)
      }))
    }

    try {
      await axios.post('http://localhost:8000/api/bikes/', payload, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success("Đăng xe thành công! Kho đã được cập nhật.", { id: toastId })
      navigate('/admin/bikes') 
    } catch (error) {
      console.error("Lỗi:", error.response?.data)
      const errorDetail = error.response?.data?.detail
      
      let msg = "Lỗi không xác định"
      if (Array.isArray(errorDetail)) {
          msg = `${errorDetail[0].loc[1]} - ${errorDetail[0].msg}`
      } else if (typeof errorDetail === 'string') {
          msg = errorDetail
      }
      
      toast.error(`Thất bại: ${msg}`, { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-white flex justify-center pb-20 pt-24">
      <div className="w-full max-w-6xl bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700">
        <h1 className="text-3xl font-bold mb-6 text-center text-green-500 uppercase tracking-widest">Đăng Bán Xe Mới</h1>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* PHẦN 1: THÔNG TIN CHUNG */}
          <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
            <h3 className="text-xl font-bold mb-4 text-blue-400 border-b border-slate-700 pb-2">1. Thông số cơ bản</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-400 mb-1 text-sm font-semibold">Tên xe <span className="text-red-500">*</span></label>
                  <input type="text" name="name" onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded p-3 focus:border-green-500 outline-none transition-colors focus:bg-slate-800/80" required placeholder="Nhập tên xe..." />
                </div>
                
                <div>
                  <label className="block text-gray-400 mb-1 text-sm font-semibold">Hãng sản xuất <span className="text-red-500">*</span></label>
                  <input type="text" name="brand" onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded p-3 focus:border-green-500 outline-none transition-colors" required placeholder="Nhập hãng..." />
                </div>
                
                <div>
                  <label className="block text-gray-400 mb-1 text-sm font-semibold">Giá bán gốc (VNĐ) <span className="text-red-500">*</span></label>
                  <input type="number" name="price" onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded p-3 focus:border-green-500 outline-none font-mono text-green-400 font-bold" required placeholder="Ví dụ: 150000000" />
                </div>

                {/* --- KHU VỰC CẤU HÌNH KHUYẾN MÃI --- */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-red-400 mb-1 text-sm font-bold flex items-center gap-1">
                            <Percent size={14}/> Giá Sale (VNĐ)
                        </label>
                        <input 
                            type="number" 
                            name="discount_price" 
                            onChange={handleChange} 
                            className="w-full bg-slate-800 border border-red-500/50 rounded p-3 focus:border-red-500 outline-none text-red-400 placeholder-slate-600 font-mono font-bold" 
                            placeholder="Nhập giá giảm..." 
                        />
                    </div>
                    <div>
                        <label className="block text-red-400 mb-1 text-sm font-bold flex items-center gap-1">
                            <Clock size={14}/> Kết thúc lúc
                        </label>
                        <input 
                            type="datetime-local" 
                            name="discount_end_date" 
                            onChange={handleChange} 
                            className="w-full bg-slate-800 border border-red-500/50 rounded p-3 focus:border-red-500 outline-none text-white appearance-none cursor-pointer" 
                        />
                    </div>
                </div>
                
                <div>
                  <label className="block text-yellow-400 mb-1 text-sm font-bold flex items-center gap-1">
                      <Package size={16}/> Tổng Tồn Kho (Tự động tính)
                  </label>
                  <input type="number" name="quantity" value={formData.quantity} readOnly className="w-full bg-slate-700 border border-slate-600 rounded p-3 text-gray-400 cursor-not-allowed font-bold" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 mb-1 text-sm font-semibold">Phân khối (cc) <span className="text-red-500">*</span></label>
                    <input type="number" name="engine_cc" onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded p-3 focus:border-green-500 outline-none" required placeholder="Ví dụ: 1000"/>
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1 text-sm font-semibold">Loại xe <span className="text-red-500">*</span></label>
                    <select name="type" onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded p-3 focus:border-green-500 outline-none cursor-pointer">
                      <option value="Sport">Sport</option>
                      <option value="Naked">Naked</option>
                      <option value="Adventure">Adventure</option>
                      <option value="Cruiser">Cruiser</option>
                      <option value="Classic">Classic</option>
                      <option value="Scooter">Scooter</option>
                    </select>
                  </div>
                </div>
            </div>

            <div className="mt-4">
                <label className="block text-gray-400 mb-1 text-sm font-semibold flex items-center gap-2">Ảnh chính (URL) <ImageIcon className="text-gray-500 w-4 h-4" /></label>
                <input type="text" name="image_url" value={formData.image_url} onChange={handleChange} placeholder="https://..." className="w-full bg-slate-800 border border-slate-600 rounded p-3 focus:border-green-500 outline-none text-blue-400 underline" />
                <p className="text-[10px] text-gray-500 mt-1 italic">*Ảnh này sẽ hiện ở Trang chủ. Bạn có thể nhập link ảnh biến thể bên dưới, ô này sẽ tự động điền theo.</p>
            </div>
          </div>

          {/* PHẦN 2: THÔNG SỐ KỸ THUẬT CHI TIẾT */}
          <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
             <h3 className="text-xl font-bold mb-6 text-orange-400 border-b border-slate-700 pb-2 flex items-center gap-2">
                <Settings size={20}/> 2. Thông số kỹ thuật chi tiết
             </h3>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* CỘT 1: ĐỘNG CƠ */}
                <div>
                   <h4 className="text-green-400 font-bold mb-4 flex items-center gap-2 uppercase text-sm tracking-wider">
                      <Settings size={16}/> Động Cơ & Truyền Động
                   </h4>
                   <div className="space-y-3">
                      {Object.keys(specs.engine).map((key) => (
                        <div key={key}>
                           <label className="text-xs text-gray-400 block mb-1">{key}</label>
                           <input type="text" className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm focus:border-green-500 outline-none hover:border-slate-500 transition-colors" value={specs.engine[key]} onChange={(e) => handleSpecChange('engine', key, e.target.value)} />
                        </div>
                      ))}
                   </div>
                </div>

                {/* CỘT 2: KẾT CẤU & PHANH */}
                <div>
                   <h4 className="text-blue-400 font-bold mb-4 flex items-center gap-2 uppercase text-sm tracking-wider">
                      <Wrench size={16}/> Kết Cấu & Phanh
                   </h4>
                   <div className="space-y-3">
                      {Object.keys(specs.chassis).map((key) => (
                        <div key={key}>
                           <label className="text-xs text-gray-400 block mb-1">{key}</label>
                           <input type="text" className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm focus:border-blue-500 outline-none hover:border-slate-500 transition-colors" value={specs.chassis[key]} onChange={(e) => handleSpecChange('chassis', key, e.target.value)} />
                        </div>
                      ))}
                   </div>
                </div>

                {/* CỘT 3: KÍCH THƯỚC */}
                <div>
                   <h4 className="text-red-400 font-bold mb-4 flex items-center gap-2 uppercase text-sm tracking-wider">
                      <Ruler size={16}/> Kích Thước & Trọng Lượng
                   </h4>
                   <div className="space-y-3">
                      {Object.keys(specs.dimensions).map((key) => (
                        <div key={key}>
                           <label className="text-xs text-gray-400 block mb-1">{key}</label>
                           <input type="text" className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm focus:border-red-500 outline-none hover:border-slate-500 transition-colors" value={specs.dimensions[key]} onChange={(e) => handleSpecChange('dimensions', key, e.target.value)} />
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>

          {/* PHẦN 3: BIẾN THỂ & MÀU SẮC */}
          <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
            <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                <h3 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
                    <Layers size={20}/> 3. Phiên bản & Màu sắc
                </h3>
                <button type="button" onClick={addVariant} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded flex items-center gap-1 text-sm font-bold transition shadow-lg shadow-blue-900/20 transform hover:scale-105">
                    <Plus className="w-4 h-4" /> Thêm màu
                </button>
            </div>
            <div className="space-y-4">
              {variants.map((variant, index) => (
                  <div key={index} className="flex flex-col md:flex-row gap-2 items-end bg-slate-800 p-3 rounded border border-slate-700 shadow-sm relative group hover:border-slate-500 transition-colors">
                      <div className="flex-[2] w-full">
                          <label className="text-[10px] text-gray-400 uppercase font-bold ml-1">Tên Màu / Bản</label>
                          <input type="text" value={variant.name} onChange={(e) => handleVariantChange(index, 'name', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm focus:border-yellow-500 outline-none" placeholder="VD: Đen Nhám..." />
                      </div>
                      <div className="w-full md:w-36">
                          <label className="text-[10px] text-gray-400 uppercase font-bold ml-1">Giá riêng</label>
                          <input type="number" value={variant.price} onChange={(e) => handleVariantChange(index, 'price', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm focus:border-yellow-500 outline-none" placeholder="Giá..." />
                      </div>
                      <div className="w-full md:w-24">
                          <label className="text-[10px] text-yellow-500 uppercase font-bold ml-1">Số lượng</label>
                          <input type="number" min="0" value={variant.quantity} onChange={(e) => handleVariantChange(index, 'quantity', e.target.value)} className="w-full bg-slate-900 border border-yellow-500 rounded p-2 text-sm focus:border-yellow-400 outline-none font-bold text-center text-yellow-400" />
                      </div>
                      <div className="flex-1 w-full">
                          <label className="text-[10px] text-gray-400 uppercase font-bold ml-1">Ảnh màu xe</label>
                          <input type="text" value={variant.image_url} onChange={(e) => handleVariantChange(index, 'image_url', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm focus:border-yellow-500 outline-none text-blue-400 underline" placeholder="Link ảnh..." />
                      </div>
                      
                      <button 
                        type="button" 
                        onClick={() => removeVariant(index)} 
                        className="bg-red-600/20 text-red-500 p-2 rounded hover:bg-red-600 hover:text-white transition mb-[1px] md:h-[38px] flex items-center justify-center border border-red-500/30"
                        title="Xóa biến thể này"
                      >
                          <Trash2 className="w-4 h-4" />
                      </button>
                  </div>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 text-lg uppercase tracking-widest transition transform hover:scale-[1.01] active:scale-[0.99]"
          >
            {loading ? <Loader2 className="animate-spin" /> : <><Save className="w-6 h-6" /> ĐĂNG BÁN NGAY</>}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AddBikePage