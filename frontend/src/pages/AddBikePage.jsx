import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { 
  Plus, Trash2, Save, Image as ImageIcon, Package, Percent, 
  Layers, Settings, Wrench, Loader2, X, UploadCloud,
  CheckCircle2, Camera
} from 'lucide-react'
import toast from 'react-hot-toast'

// --- CÁC COMPONENT GIAO DIỆN (ĐƯA RA NGOÀI ĐỂ TRÁNH LỖI MẤT FOCUS) ---
const SectionHeader = ({ icon: Icon, title, color }) => (
  <div className="flex items-center gap-3 mb-6 pb-3 border-b border-slate-700/50">
    <div className={`p-2 rounded-lg bg-slate-800 ${color}`}><Icon size={22} /></div>
    <h3 className="text-xl font-bold text-slate-200">{title}</h3>
  </div>
)

const InputGroup = ({ label, required, children, subLabel }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-semibold text-slate-400 flex justify-between">
      <span>{label} {required && <span className="text-red-500">*</span>}</span>
      {subLabel && <span className="text-xs text-slate-600 font-normal italic">{subLabel}</span>}
    </label>
    {children}
  </div>
)

const StyledInput = (props) => (
  <input 
    {...props} 
    className={`w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all placeholder:text-slate-700 ${props.className}`} 
  />
)

// --- COMPONENT CHÍNH ---
function AddBikePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  // --- STATE DỮ LIỆU ---
  const [formData, setFormData] = useState({
    name: '', brand: '', type: 'Sport', price: '', 
    engine_cc: '', description: '', quantity: 0,
    is_flash_sale: false, flash_sale_price: '', flash_sale_limit: '',
    flash_sale_start: '', flash_sale_end: ''
  })

  // Biến thể: Thêm trường `imageIndex` để biết đang chọn ảnh nào
  const [variants, setVariants] = useState([
    { name: '', price: '', quantity: 1, imageIndex: 0 } 
  ])

  const [specs, setSpecs] = useState({
    engine_type: '', transmission: '', power_hp: '', torque_nm: '', 
    top_speed_kmh: '', seat_height_mm: '', weight_kg: '', fuel_capacity_l: ''
  })

  const [galleryFiles, setGalleryFiles] = useState([])
  const [previews, setPreviews] = useState([])

  // --- EFFECT: TÍNH TỔNG TỒN KHO ---
  useEffect(() => {
    const totalQty = variants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0)
    setFormData(prev => ({ ...prev, quantity: totalQty }))
  }, [variants])

  // --- CÁC HÀM XỬ LÝ (HANDLERS) ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSpecChange = (e) => {
    setSpecs(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // Xử lý biến thể
  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants]
    newVariants[index][field] = value
    setVariants(newVariants)
  }

  const addVariant = () => {
    setVariants([...variants, { name: '', price: formData.price, quantity: 1, imageIndex: 0 }])
  }

  const removeVariant = (index) => {
    if (variants.length <= 1) return toast.error("Cần ít nhất 1 phiên bản màu!")
    setVariants(variants.filter((_, i) => i !== index))
  }

  // Xử lý ảnh
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    const newPreviews = files.map(file => URL.createObjectURL(file))
    setGalleryFiles(prev => [...prev, ...files])
    setPreviews(prev => [...prev, ...newPreviews])
  }

  const removeFile = (index) => {
    setGalleryFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
    // Reset variant nào đang chọn ảnh bị xóa về 0
    setVariants(prev => prev.map(v => v.imageIndex === index ? { ...v, imageIndex: 0 } : v))
  }

  // --- QUY TRÌNH LƯU DỮ LIỆU ---
  const handleSubmit = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) return navigate('/login')

    if (!formData.name || !formData.brand || !formData.price) {
        return toast.error("Vui lòng điền: Tên xe, Hãng và Giá!")
    }

    const safeNum = (val) => (val && val !== '') ? Number(val) : null
    const safeFloat = (val) => (val && val !== '') ? parseFloat(val) : null

    setLoading(true)
    const toastId = toast.loading("Đang khởi tạo dữ liệu...")

    try {
      // BƯỚC 1: TẠO XE (Variants rỗng để xử lý sau)
      const bikePayload = {
        ...formData,
        price: safeNum(formData.price),
        engine_cc: safeNum(formData.engine_cc) || 0,
        discount_price: safeNum(formData.discount_price),
        discount_end_date: formData.discount_end_date ? new Date(formData.discount_end_date).toISOString() : null,
        
        flash_sale_price: safeNum(formData.flash_sale_price),
        flash_sale_limit: safeNum(formData.flash_sale_limit) || 0,
        flash_sale_start: formData.flash_sale_start ? new Date(formData.flash_sale_start).toISOString() : null,
        flash_sale_end: formData.flash_sale_end ? new Date(formData.flash_sale_end).toISOString() : null,
        
        variants: [], 
        specs: {
            power_hp: safeFloat(specs.power_hp),
            torque_nm: safeFloat(specs.torque_nm),
            seat_height_mm: safeNum(specs.seat_height_mm),
            weight_kg: safeNum(specs.weight_kg),
            fuel_capacity_l: safeFloat(specs.fuel_capacity_l),
            top_speed_kmh: safeNum(specs.top_speed_kmh),
            engine_type: specs.engine_type || null,
            transmission: specs.transmission || null
        }
      }

      const createRes = await axios.post('http://localhost:8000/api/bikes/', bikePayload, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const newBikeId = createRes.data.id

      // BƯỚC 2: UPLOAD ẢNH & LẤY URL
      let uploadedUrls = []
      if (galleryFiles.length > 0) {
        toast.loading("Đang tải ảnh lên...", { id: toastId })
        const formDataUpload = new FormData()
        galleryFiles.forEach(file => formDataUpload.append('files', file))
        
        const uploadRes = await axios.post(`http://localhost:8000/api/bikes/${newBikeId}/gallery`, formDataUpload, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        })
        uploadedUrls = uploadRes.data.urls
      }

      // BƯỚC 3: TẠO BIẾN THỂ (GÁN ẢNH TƯƠNG ỨNG)
      toast.loading("Đang đồng bộ phiên bản...", { id: toastId })
      
      const variantsPayload = variants.map(v => ({
          name: v.name,
          price: safeNum(v.price) || safeNum(formData.price),
          quantity: safeNum(v.quantity),
          // Logic: Lấy URL ảnh theo chỉ số imageIndex đã chọn
          image_url: uploadedUrls[v.imageIndex] || uploadedUrls[0] || null
      }))

      await axios.post(`http://localhost:8000/api/bikes/${newBikeId}/variants/bulk`, variantsPayload, {
         headers: { Authorization: `Bearer ${token}` }
      })

      toast.success("Thành công! Xe đã được đăng bán.", { id: toastId })
      navigate('/admin/bikes')

    } catch (error) {
      console.error(error)
      const msg = error.response?.data?.detail || "Lỗi xử lý dữ liệu"
      toast.error(`Lỗi: ${JSON.stringify(msg)}`, { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-24 pt-24 px-4 font-sans">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center justify-center gap-3">
          <Package className="text-green-500" /> THÊM SẢN PHẨM MỚI
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- CỘT TRÁI: THÔNG TIN (Chiếm 2/3) --- */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 1. THÔNG TIN CƠ BẢN */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl">
            <SectionHeader icon={Settings} title="Thông Tin Cơ Bản" color="text-blue-400" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputGroup label="Tên xe" required>
                <StyledInput name="name" onChange={handleChange} placeholder="VD: Yamaha R1M 2024" />
              </InputGroup>

              <div className="grid grid-cols-2 gap-4">
                 <InputGroup label="Hãng xe" required>
                    <StyledInput name="brand" onChange={handleChange} placeholder="VD: Yamaha" />
                 </InputGroup>
                 <InputGroup label="Loại xe">
                    <select name="type" onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 outline-none focus:border-green-500">
                       {['Sport', 'Naked', 'Adventure', 'Classic', 'Scooter', 'Cruiser'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                 </InputGroup>
              </div>

              <InputGroup label="Giá niêm yết (VNĐ)" required subLabel="Giá gốc chưa giảm">
                 <StyledInput type="number" name="price" onChange={handleChange} className="text-green-400 font-bold font-mono" placeholder="VD: 850000000" />
              </InputGroup>

              <div className="grid grid-cols-2 gap-4">
                 <InputGroup label="Phân khối (cc)">
                    <StyledInput type="number" name="engine_cc" onChange={handleChange} placeholder="1000" />
                 </InputGroup>
                 <InputGroup label="Tổng tồn kho">
                    <div className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-center font-bold text-yellow-500 cursor-not-allowed select-none">
                        {formData.quantity} xe
                    </div>
                 </InputGroup>
              </div>

              <div className="md:col-span-2">
                 <InputGroup label="Mô tả sản phẩm">
                    <textarea name="description" rows="3" onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:border-green-500 outline-none placeholder:text-slate-700" placeholder="Nhập mô tả chi tiết..." />
                 </InputGroup>
              </div>
            </div>
          </div>

          {/* 2. FLASH SALE */}
          <div className={`rounded-2xl border p-6 transition-all ${formData.is_flash_sale ? 'bg-red-950/20 border-red-500/30' : 'bg-slate-900 border-slate-800'}`}>
            <div className="flex justify-between items-center mb-4">
               <div className="flex items-center gap-3">
                  <Percent size={20} className={formData.is_flash_sale ? "text-red-400" : "text-slate-500"} />
                  <span className={`font-bold ${formData.is_flash_sale ? "text-red-400" : "text-slate-400"}`}>Chế độ Flash Sale</span>
               </div>
               <input type="checkbox" name="is_flash_sale" checked={formData.is_flash_sale} onChange={handleChange} className="w-5 h-5 accent-red-500 cursor-pointer" />
            </div>
            
            {formData.is_flash_sale && (
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fadeIn">
                  <InputGroup label="Giá Sale"><StyledInput type="number" name="flash_sale_price" onChange={handleChange} className="border-red-500/50 text-red-400" /></InputGroup>
                  <InputGroup label="Số lượng"><StyledInput type="number" name="flash_sale_limit" onChange={handleChange} className="border-red-500/50" /></InputGroup>
                  <InputGroup label="Bắt đầu"><StyledInput type="datetime-local" name="flash_sale_start" onChange={handleChange} className="border-red-500/50" /></InputGroup>
                  <InputGroup label="Kết thúc"><StyledInput type="datetime-local" name="flash_sale_end" onChange={handleChange} className="border-red-500/50" /></InputGroup>
               </div>
            )}
          </div>

          {/* 3. THÔNG SỐ KỸ THUẬT */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl">
             <SectionHeader icon={Wrench} title="Thông Số Kỹ Thuật" color="text-orange-400" />
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InputGroup label="ĐỘNG CƠ"><StyledInput name="engine_type" value={specs.engine_type} onChange={handleSpecChange} placeholder="V-Twin, I4..." /></InputGroup>
                <InputGroup label="HỘP SỐ"><StyledInput name="transmission" value={specs.transmission} onChange={handleSpecChange} placeholder="6 cấp..." /></InputGroup>
                <InputGroup label="CÔNG SUẤT (HP)"><StyledInput type="number" name="power_hp" value={specs.power_hp} onChange={handleSpecChange} /></InputGroup>
                <InputGroup label="MÔ-MEN (Nm)"><StyledInput type="number" name="torque_nm" value={specs.torque_nm} onChange={handleSpecChange} /></InputGroup>
                <InputGroup label="TỐC ĐỘ (km/h)"><StyledInput type="number" name="top_speed_kmh" value={specs.top_speed_kmh} onChange={handleSpecChange} /></InputGroup>
                <InputGroup label="YÊN XE (mm)"><StyledInput type="number" name="seat_height_mm" value={specs.seat_height_mm} onChange={handleSpecChange} /></InputGroup>
                <InputGroup label="TRỌNG LƯỢNG (kg)"><StyledInput type="number" name="weight_kg" value={specs.weight_kg} onChange={handleSpecChange} /></InputGroup>
                <InputGroup label="BÌNH XĂNG (Lít)"><StyledInput type="number" name="fuel_capacity_l" value={specs.fuel_capacity_l} onChange={handleSpecChange} /></InputGroup>
             </div>
          </div>
        </div>

        {/* --- CỘT PHẢI: ẢNH & BIẾN THỂ (Chiếm 1/3) --- */}
        <div className="space-y-8">
           
           {/* 4. GALLERY ẢNH */}
           <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl sticky top-24 z-30">
              <SectionHeader icon={ImageIcon} title="Thư Viện Ảnh" color="text-purple-400" />
              
              <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center hover:border-purple-500 transition-colors relative mb-4 bg-slate-950/50">
                 <input type="file" multiple onChange={handleFileSelect} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                 <UploadCloud className="mx-auto text-slate-500 mb-2" />
                 <p className="text-sm text-slate-400 font-bold">Click để chọn nhiều ảnh</p>
                 <p className="text-xs text-slate-600 mt-1">JPG, PNG, WEBP</p>
              </div>

              {previews.length > 0 && (
                 <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                    {previews.map((src, idx) => (
                       <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-700 group">
                          <img src={src} className="w-full h-full object-cover" alt="Preview" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded">Ảnh #{idx + 1}</span>
                          </div>
                          <button type="button" onClick={() => removeFile(idx)} className="absolute top-1 right-1 bg-red-500 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">
                             <X size={10} />
                          </button>
                       </div>
                    ))}
                 </div>
              )}
           </div>

           {/* 5. PHIÊN BẢN MÀU SẮC */}
           <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl">
              <div className="flex justify-between mb-4">
                 <SectionHeader icon={Layers} title="Phiên Bản Màu" color="text-yellow-400" />
                 <button type="button" onClick={addVariant} className="bg-slate-800 p-2 rounded hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"><Plus size={18} /></button>
              </div>
              
              <div className="space-y-4">
                 {variants.map((v, i) => (
                    <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative group hover:border-slate-600 transition-colors">
                       <button type="button" onClick={() => removeVariant(i)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600">
                          <X size={12}/>
                       </button>
                       
                       <div className="space-y-3">
                          <div>
                            <label className="text-[10px] uppercase text-slate-500 font-bold">Tên Màu</label>
                            <input type="text" value={v.name} onChange={(e) => handleVariantChange(i, 'name', e.target.value)} className="w-full bg-transparent border-b border-slate-700 focus:border-yellow-500 outline-none text-sm text-yellow-500 font-bold pb-1 placeholder:text-slate-800" placeholder="VD: Đen Nhám" />
                          </div>
                          
                          <div className="flex gap-2">
                             <div className="flex-1">
                                <label className="text-[10px] uppercase text-slate-500 font-bold">Giá Riêng</label>
                                <input type="number" value={v.price} onChange={(e) => handleVariantChange(i, 'price', e.target.value)} className="w-full bg-slate-900 rounded px-2 py-1.5 text-xs outline-none border border-slate-800 focus:border-slate-600" placeholder="Mặc định" />
                             </div>
                             <div className="w-16">
                                <label className="text-[10px] uppercase text-slate-500 font-bold">SL</label>
                                <input type="number" value={v.quantity} onChange={(e) => handleVariantChange(i, 'quantity', e.target.value)} className="w-full bg-slate-900 rounded px-2 py-1.5 text-xs outline-none text-center font-bold text-yellow-500 border border-slate-800 focus:border-slate-600" />
                             </div>
                          </div>

                          {/* CHỌN ẢNH CHO MÀU */}
                          <div className="bg-slate-900 p-2 rounded-lg flex items-center gap-2 border border-slate-800">
                             <Camera size={14} className="text-slate-500" />
                             <select 
                                value={v.imageIndex} 
                                onChange={(e) => handleVariantChange(i, 'imageIndex', parseInt(e.target.value))}
                                className="bg-transparent text-xs text-slate-300 outline-none w-full cursor-pointer"
                             >
                                {previews.length === 0 && <option value="0">Chưa có ảnh...</option>}
                                {previews.map((_, idx) => (
                                   <option key={idx} value={idx}>Dùng Ảnh #{idx + 1}</option>
                                ))}
                             </select>
                             {previews[v.imageIndex] && (
                                <img src={previews[v.imageIndex]} className="w-6 h-6 rounded object-cover border border-slate-600" alt="color-preview" />
                             )}
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* --- FOOTER: NÚT ĐĂNG BÁN --- */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 flex justify-center z-50 shadow-2xl">
           <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-12 rounded-full shadow-lg shadow-green-900/20 flex items-center gap-2 uppercase tracking-wider transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <Loader2 className="animate-spin" /> : <><CheckCircle2 /> Hoàn Tất & Đăng Bán</>}
           </button>
        </div>

      </form>
    </div>
  )
}

export default AddBikePage