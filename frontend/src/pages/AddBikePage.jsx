import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { 
  Plus, Trash2, Save, Package, Percent, 
  Layers, Settings, Wrench, Loader2, X, 
  CheckCircle2, Camera, Upload, Image as ImageIcon, Zap
} from 'lucide-react'
import toast from 'react-hot-toast'

// --- CẤU HÌNH NHÃN TIẾNG VIỆT CHO THÔNG SỐ ---
const SPEC_FIELDS = [
  { key: 'engine_type', label: 'Loại động cơ', placeholder: 'VD: 4 thì, 4 xi-lanh' },
  { key: 'transmission', label: 'Hộp số', placeholder: 'VD: 6 cấp' },
  { key: 'power_hp', label: 'Công suất (HP)', type: 'number' },
  { key: 'torque_nm', label: 'Mô-men xoắn (Nm)', type: 'number' },
  { key: 'top_speed_kmh', label: 'Tốc độ tối đa (km/h)', type: 'number' },
  { key: 'seat_height_mm', label: 'Chiều cao yên (mm)', type: 'number' },
  { key: 'weight_kg', label: 'Trọng lượng (kg)', type: 'number' },
  { key: 'fuel_capacity_l', label: 'Dung tích bình xăng (L)', type: 'number' },
]

// --- CÁC COMPONENT GIAO DIỆN ---
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

function AddBikePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  // --- 1. STATE THÔNG TIN XE & KHUYẾN MÃI ---
  const [formData, setFormData] = useState({
    name: '', brand: '', type: 'Sport', price: '', 
    engine_cc: '', description: '', 
    // quantity đã bị loại bỏ vì Bike không còn cột này (tính theo variants)
    // GIẢM GIÁ & FLASH SALE
    discount_price: '', discount_end_date: '',
    is_flash_sale: false, flash_sale_price: '', flash_sale_limit: '',
    flash_sale_start: '', flash_sale_end: ''
  })
  const [mainFile, setMainFile] = useState(null)
  const [mainPreview, setMainPreview] = useState(null)

  // --- 2. STATE BIẾN THỂ ---
  const [variants, setVariants] = useState([
    { name: '', price: '', quantity: 1, files: [], previews: [] } 
  ])
  
  // Tính tổng tồn kho để hiển thị (UI only)
  const [displayTotalQty, setDisplayTotalQty] = useState(0)

  // --- 3. STATE THÔNG SỐ ---
  const [specs, setSpecs] = useState({
    engine_type: '', transmission: '', power_hp: '', torque_nm: '', 
    top_speed_kmh: '', seat_height_mm: '', weight_kg: '', fuel_capacity_l: ''
  })

  useEffect(() => {
    const totalQty = variants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0)
    setDisplayTotalQty(totalQty)
  }, [variants])

  // --- HANDLERS ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleMainFileChange = (file) => {
    if (!file) return;
    setMainFile(file)
    if (mainPreview) URL.revokeObjectURL(mainPreview)
    setMainPreview(URL.createObjectURL(file))
  }

  const handleVariantFilesChange = (vIdx, selectedFiles) => {
    const filesArray = Array.from(selectedFiles)
    const newVariants = [...variants]
    newVariants[vIdx].files = [...newVariants[vIdx].files, ...filesArray]
    const newPreviews = filesArray.map(file => URL.createObjectURL(file))
    newVariants[vIdx].previews = [...newVariants[vIdx].previews, ...newPreviews]
    setVariants(newVariants)
  }

  const removeVariantFile = (vIdx, fIdx) => {
    const newVariants = [...variants]
    URL.revokeObjectURL(newVariants[vIdx].previews[fIdx])
    newVariants[vIdx].files.splice(fIdx, 1)
    newVariants[vIdx].previews.splice(fIdx, 1)
    setVariants(newVariants)
  }

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants]
    newVariants[index][field] = value
    setVariants(newVariants)
  }

  const addVariant = () => {
    setVariants([...variants, { name: '', price: formData.price, quantity: 1, files: [], previews: [] }])
  }

  const removeVariant = (index) => {
    if (variants.length <= 1) return toast.error("Cần ít nhất 1 phiên bản màu!")
    variants[index].previews.forEach(p => URL.revokeObjectURL(p))
    setVariants(variants.filter((_, i) => i !== index))
  }

  // --- SUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) return navigate('/login')

    if (!formData.name || !formData.brand || !formData.price || !mainFile) {
        return toast.error("Vui lòng điền tên, hãng, giá và chọn ẢNH ĐẠI DIỆN XE!")
    }

    setLoading(true)
    const toastId = toast.loading("Đang xử lý dữ liệu...")

    try {
      // ✅ FIX 1: Tách quantity ra khỏi payload (vì DB không có cột này)
      const { quantity, ...restFormData } = formData 

      const bikePayload = {
        ...restFormData, // Chỉ gửi các trường còn lại
        price: Number(formData.price),
        engine_cc: Number(formData.engine_cc) || 0,
        
        discount_price: formData.discount_price ? Number(formData.discount_price) : null,
        discount_end_date: formData.discount_end_date || null,
        
        is_flash_sale: formData.is_flash_sale,
        flash_sale_price: formData.is_flash_sale && formData.flash_sale_price ? Number(formData.flash_sale_price) : null,
        flash_sale_limit: formData.is_flash_sale && formData.flash_sale_limit ? Number(formData.flash_sale_limit) : 0,
        flash_sale_start: formData.is_flash_sale ? formData.flash_sale_start : null,
        flash_sale_end: formData.is_flash_sale ? formData.flash_sale_end : null,
        
        specs: { 
            ...specs, 
            power_hp: parseFloat(specs.power_hp) || 0, 
            torque_nm: parseFloat(specs.torque_nm) || 0,
            fuel_capacity_l: parseFloat(specs.fuel_capacity_l) || 0,
            seat_height_mm: parseFloat(specs.seat_height_mm) || 0,
            weight_kg: parseFloat(specs.weight_kg) || 0,
            top_speed_kmh: parseFloat(specs.top_speed_kmh) || 0
        }
      }

      // 1. TẠO XE (Sẽ không lỗi vì không gửi quantity)
      const createRes = await axios.post('http://localhost:8000/api/bikes/', bikePayload, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const newBikeId = createRes.data.id

      // 2. UPLOAD ẢNH (Ảnh chính + Ảnh biến thể)
      const allFiles = [mainFile]
      const photoCounts = [1] // [1 ảnh chính, n ảnh variant 1, m ảnh variant 2...]
      variants.forEach(v => {
          allFiles.push(...v.files)
          photoCounts.push(v.files.length)
      })

      const formDataUpload = new FormData()
      allFiles.forEach(f => formDataUpload.append('files', f))

      const uploadRes = await axios.post(`http://localhost:8000/api/bikes/${newBikeId}/gallery`, formDataUpload, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      })
      const uploadedUrls = uploadRes.data.urls

      // 3. CẬP NHẬT URL ẢNH CHÍNH CHO XE
      await axios.put(`http://localhost:8000/api/bikes/${newBikeId}`, { image_url: uploadedUrls[0] }, {
          headers: { Authorization: `Bearer ${token}` }
      })

      // 4. TẠO CÁC BIẾN THỂ (Lấy URL ảnh tương ứng từ mảng đã upload)
      let pointer = 1 
      const finalVariants = variants.map((v, idx) => {
          const count = photoCounts[idx + 1] // Số lượng ảnh của variant này
          const myUrls = uploadedUrls.slice(pointer, pointer + count)
          pointer += count
          
          return {
              name: v.name,
              price: Number(v.price) || Number(formData.price),
              quantity: Number(v.quantity), // Quantity lưu ở đây mới đúng
              image_url: myUrls.length > 0 ? myUrls[0] : uploadedUrls[0], // Lấy ảnh đầu tiên của variant làm đại diện
              // Có thể cần gửi thêm danh sách ảnh phụ của variant nếu backend hỗ trợ (ở đây ta tạm dùng logic cũ)
          }
      })

      await axios.post(`http://localhost:8000/api/bikes/${newBikeId}/variants/bulk`, finalVariants, {
          headers: { Authorization: `Bearer ${token}` }
      })

      toast.success("Đăng bán thành công!", { id: toastId })
      navigate('/admin/bikes')

    } catch (error) {
      console.error(error)
      const errMsg = error.response?.data?.detail || "Lỗi hệ thống"
      toast.error(errMsg, { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-24 pt-24 px-4 font-sans">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center justify-center gap-3 uppercase">
          <Package className="text-green-500" /> THÊM XE MỚI
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          {/* 1. THÔNG TIN CƠ BẢN */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl">
            <SectionHeader icon={Settings} title="Thông Tin & Ảnh Đại Diện Xe" color="text-blue-400" />
            
            <div className="flex flex-col md:flex-row gap-8">
                {/* Upload Ảnh */}
                <div className="w-full md:w-1/3">
                    <label className="text-sm font-bold text-slate-400 mb-2 block uppercase tracking-widest">Ảnh bìa sản phẩm</label>
                    <div className="relative group aspect-[3/4] border-2 border-dashed border-slate-700 rounded-2xl overflow-hidden bg-slate-950 flex flex-col items-center justify-center hover:border-green-500 transition-all cursor-pointer">
                        {mainPreview ? (
                            <img src={mainPreview} className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center p-4">
                                <Upload size={40} className="mx-auto text-slate-700 mb-2" />
                                <p className="text-xs text-slate-500 font-bold uppercase">Tải ảnh chính</p>
                            </div>
                        )}
                        <input type="file" accept="image/*" onChange={(e) => handleMainFileChange(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-1 gap-6">
                    <InputGroup label="Tên xe" required><StyledInput name="name" onChange={handleChange} placeholder="VD: Yamaha R1M 2024" /></InputGroup>
                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Hãng xe" required><StyledInput name="brand" onChange={handleChange} /></InputGroup>
                        <InputGroup label="Loại xe">
                            <select name="type" onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 outline-none focus:border-green-500">
                                {['Sport', 'Naked', 'Adventure', 'Classic', 'Scooter'].map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </InputGroup>
                    </div>
                    {/* ✅ step="any" cho Giá niêm yết */}
                    <InputGroup label="Giá niêm yết (VNĐ)" required><StyledInput type="number" step="any" name="price" onChange={handleChange} className="text-green-400 font-bold font-mono" /></InputGroup>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* ✅ step="any" cho Phân khối */}
              <InputGroup label="Phân khối (cc)"><StyledInput type="number" step="any" name="engine_cc" onChange={handleChange} /></InputGroup>
              <InputGroup label="Tổng Tồn kho (Tự động)"><div className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-center font-bold text-yellow-500">{displayTotalQty}</div></InputGroup>
              <div className="md:col-span-2"><InputGroup label="Mô tả"><textarea name="description" rows="3" onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:border-green-500 outline-none resize-none" /></InputGroup></div>
            </div>
          </div>

          {/* 2. THIẾT LẬP KHUYẾN MÃI (GIẢM GIÁ & FLASH SALE) */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl">
             <SectionHeader icon={Percent} title="Thiết Lập Khuyến Mãi" color="text-red-500" />
             
             {/* Giảm giá thường */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <InputGroup label="Giá khuyến mãi (VNĐ)" subLabel="(Để trống nếu không giảm)">
                    {/* ✅ step="any" */}
                    <StyledInput type="number" step="any" name="discount_price" onChange={handleChange} className="text-red-400 font-mono font-bold" />
                </InputGroup>
                <InputGroup label="Ngày kết thúc khuyến mãi">
                    <StyledInput type="datetime-local" name="discount_end_date" onChange={handleChange} className="text-sm" />
                </InputGroup>
             </div>

             {/* Flash Sale */}
             <div className="border-t border-slate-800 pt-6">
                <div className="flex items-center gap-3 mb-4">
                    <input 
                        type="checkbox" 
                        id="is_flash_sale" 
                        name="is_flash_sale" 
                        checked={formData.is_flash_sale} 
                        onChange={handleChange}
                        className="w-5 h-5 accent-yellow-500 cursor-pointer"
                    />
                    <label htmlFor="is_flash_sale" className="font-bold text-yellow-400 flex items-center gap-2 cursor-pointer select-none">
                        <Zap size={18} className={formData.is_flash_sale ? "fill-yellow-400" : ""} /> Kích hoạt Flash Sale
                    </label>
                </div>

                {formData.is_flash_sale && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-yellow-500/5 p-4 rounded-xl border border-yellow-500/20 animate-in fade-in slide-in-from-top-2">
                        {/* ✅ step="any" */}
                        <InputGroup label="Giá Flash Sale" required><StyledInput type="number" step="any" name="flash_sale_price" onChange={handleChange} className="text-yellow-400 font-bold" /></InputGroup>
                        <InputGroup label="Giới hạn số lượng" required><StyledInput type="number" name="flash_sale_limit" onChange={handleChange} /></InputGroup>
                        <InputGroup label="Bắt đầu"><StyledInput type="datetime-local" name="flash_sale_start" onChange={handleChange} /></InputGroup>
                        <InputGroup label="Kết thúc"><StyledInput type="datetime-local" name="flash_sale_end" onChange={handleChange} /></InputGroup>
                    </div>
                )}
             </div>
          </div>

          {/* 3. THÔNG SỐ KỸ THUẬT */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl">
             <SectionHeader icon={Wrench} title="Thông Số Kỹ Thuật" color="text-orange-400" />
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {SPEC_FIELDS.map((field) => (
                   <InputGroup key={field.key} label={field.label}>
                      <StyledInput 
                        type={field.type || 'text'}
                        name={field.key} 
                        // ✅ ĐÃ THÊM: step="any" để nhập số lẻ cho mọi thông số số
                        step={field.type === 'number' ? "any" : undefined}
                        onChange={(e) => setSpecs({...specs, [e.target.name]: e.target.value})}
                        placeholder={field.placeholder || ''} 
                      />
                   </InputGroup>
                ))}
             </div>
          </div>
        </div>

        {/* CỘT PHẢI: BIẾN THỂ */}
        <div className="space-y-8">
           <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl sticky top-24 max-h-[calc(100vh-150px)] flex flex-col">
              <div className="flex justify-between mb-4 flex-shrink-0">
                 <SectionHeader icon={Layers} title="Phiên Bản Màu" color="text-yellow-400" />
                 <button type="button" onClick={addVariant} className="bg-slate-800 p-2 rounded hover:bg-slate-700 transition-colors border border-slate-700"><Plus size={18} /></button>
              </div>
              
              <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                 {variants.map((v, i) => (
                    <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative group">
                       <button type="button" onClick={() => removeVariant(i)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"><X size={12}/></button>
                       <div className="space-y-4">
                          <input type="text" value={v.name} onChange={(e) => handleVariantChange(i, 'name', e.target.value)} className="w-full bg-transparent border-b border-slate-700 focus:border-yellow-500 outline-none text-sm text-yellow-500 font-bold pb-1 uppercase" placeholder="Tên màu (VD: Đỏ Đô)" />
                          <div className="flex gap-2">
                             {/* ✅ step="any" */}
                             <InputGroup label="Giá"><StyledInput type="number" step="any" value={v.price} onChange={(e) => handleVariantChange(i, 'price', e.target.value)} className="px-2 py-1.5 text-xs" /></InputGroup>
                             <InputGroup label="SL"><StyledInput type="number" value={v.quantity} onChange={(e) => handleVariantChange(i, 'quantity', e.target.value)} className="px-2 py-1.5 text-xs text-center" /></InputGroup>
                          </div>
                          <div>
                             <label className="text-[10px] uppercase text-slate-500 font-bold mb-2 block tracking-widest flex items-center gap-1"><ImageIcon size={10}/> Gallery màu {v.name || '...'}</label>
                             <div className="grid grid-cols-3 gap-2">
                                {v.previews.map((url, fIdx) => (
                                    <div key={fIdx} className="relative aspect-square rounded overflow-hidden border border-slate-800 group/img">
                                        <img src={url} className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => removeVariantFile(i, fIdx)} className="absolute top-0 right-0 bg-red-500/80 p-0.5 opacity-0 group-hover/img:opacity-100 transition-opacity"><X size={10}/></button>
                                    </div>
                                ))}
                                <label className="aspect-square border border-dashed border-slate-700 rounded flex flex-col items-center justify-center hover:border-blue-500 transition-colors cursor-pointer bg-slate-900/30">
                                    <Plus size={16} className="text-slate-600" />
                                    <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleVariantFilesChange(i, e.target.files)} />
                                </label>
                             </div>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 flex justify-center z-50">
           <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-12 rounded-full shadow-lg flex items-center gap-2 uppercase tracking-wider transition-transform hover:scale-105 disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" /> : <><CheckCircle2 /> Hoàn Tất Đăng Bán</>}
           </button>
        </div>
      </form>
    </div>
  )
}

export default AddBikePage