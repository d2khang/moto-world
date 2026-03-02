import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { 
  Plus, Trash2, Save, Package, Percent, 
  Layers, Settings, Wrench, Loader2, X, 
  CheckCircle2, Camera, Upload, Image as ImageIcon, ArrowLeft, Star
} from 'lucide-react'
import toast from 'react-hot-toast'

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
    className={`w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all placeholder:text-slate-800 ${props.className}`} 
  />
)

function EditBikePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // --- 1. STATE DỮ LIỆU ---
  const [formData, setFormData] = useState({
    name: '', brand: '', type: 'Sport', price: '', 
    engine_cc: '', description: '', quantity: 0,
    is_flash_sale: false, flash_sale_price: '', flash_sale_limit: '',
    flash_sale_start: '', flash_sale_end: ''
  })

  const [mainFile, setMainFile] = useState(null)
  const [mainPreview, setMainPreview] = useState(null)

  const [variants, setVariants] = useState([])
  const [specs, setSpecs] = useState({
    engine_type: '', transmission: '', power_hp: '', torque_nm: '', 
    top_speed_kmh: '', seat_height_mm: '', weight_kg: '', fuel_capacity_l: ''
  })

  // --- 2. FETCH DỮ LIỆU CŨ ---
  useEffect(() => {
    const fetchBike = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/bikes/${id}`)
        const b = res.data
        
        setFormData({
          name: b.name || '',
          brand: b.make?.name || b.brand || '',
          type: b.type || 'Sport',
          price: b.price || '',
          engine_cc: b.engine_cc || '',
          description: b.description || '',
          quantity: b.quantity || 0,
          is_flash_sale: b.is_flash_sale || false,
          flash_sale_price: b.flash_sale_price || '',
          flash_sale_limit: b.flash_sale_limit || '',
          flash_sale_start: b.flash_sale_start ? b.flash_sale_start.substring(0, 16) : '',
          flash_sale_end: b.flash_sale_end ? b.flash_sale_end.substring(0, 16) : ''
        })

        setMainPreview(b.image_url)
        if (b.specs) setSpecs(b.specs)
        
        if (b.variants) {
          setVariants(b.variants.map(v => ({
            ...v,
            files: [],           // File mới sẽ upload
            previews: [],        // Preview URL của file mới
            existing_images: v.images || [],  // Ảnh cũ từ DB (variant.images)
            image_url: v.image_url,           // Ảnh đại diện hiện tại
            // ✅ MỚI: Index ảnh được chọn làm avatar (trong mảng files mới)
            // -1 = dùng ảnh đại diện cũ, >= 0 = index trong files mới
            avatarFileIndex: -1
          })))
        }
      } catch (error) {
        toast.error("Không thể tải thông tin xe")
        navigate('/admin/bikes')
      } finally {
        setLoading(false)
      }
    }
    fetchBike()
  }, [id])

  useEffect(() => {
    const totalQty = variants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0)
    setFormData(prev => ({ ...prev, quantity: totalQty }))
  }, [variants])

  // --- 3. HANDLERS ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleMainFileChange = (file) => {
    if (!file) return;
    setMainFile(file)
    setMainPreview(URL.createObjectURL(file))
  }

  const handleVariantFilesChange = (vIdx, selectedFiles) => {
    const filesArray = Array.from(selectedFiles)
    const newVariants = [...variants]
    const prevCount = newVariants[vIdx].files.length
    newVariants[vIdx].files = [...newVariants[vIdx].files, ...filesArray]
    const newPreviews = filesArray.map(file => URL.createObjectURL(file))
    newVariants[vIdx].previews = [...newVariants[vIdx].previews, ...newPreviews]

    // ✅ Nếu chưa chọn avatar và đây là lần upload đầu tiên → tự động chọn ảnh đầu tiên làm avatar
    if (newVariants[vIdx].avatarFileIndex === -1 && prevCount === 0) {
      newVariants[vIdx].avatarFileIndex = 0
    }
    setVariants(newVariants)
  }

  const removeVariantNewFile = (vIdx, fIdx) => {
    const newVariants = [...variants]
    URL.revokeObjectURL(newVariants[vIdx].previews[fIdx])
    newVariants[vIdx].files.splice(fIdx, 1)
    newVariants[vIdx].previews.splice(fIdx, 1)
    // Reset avatar index nếu đang chọn ảnh bị xoá
    if (newVariants[vIdx].avatarFileIndex === fIdx) {
      newVariants[vIdx].avatarFileIndex = newVariants[vIdx].files.length > 0 ? 0 : -1
    } else if (newVariants[vIdx].avatarFileIndex > fIdx) {
      newVariants[vIdx].avatarFileIndex -= 1
    }
    setVariants(newVariants)
  }

  // ✅ MỚI: Chọn ảnh mới làm avatar cho variant
  const setVariantAvatarFile = (vIdx, fIdx) => {
    const newVariants = [...variants]
    newVariants[vIdx].avatarFileIndex = fIdx
    // Xoá image_url cũ vì đã chọn ảnh mới làm avatar
    newVariants[vIdx].image_url = null
    setVariants(newVariants)
  }

  // ✅ MỚI: Chọn ảnh cũ (existing) làm avatar cho variant
  const setVariantAvatarExisting = (vIdx, imageUrl) => {
    const newVariants = [...variants]
    newVariants[vIdx].image_url = imageUrl
    newVariants[vIdx].avatarFileIndex = -1  // Reset file mới
    setVariants(newVariants)
  }

  const removeVariantOldImage = (vIdx, imgIdx) => {
    const newVariants = [...variants]
    // Nếu ảnh bị xoá đang là avatar → reset
    if (newVariants[vIdx].image_url === newVariants[vIdx].existing_images[imgIdx]?.image_url) {
      newVariants[vIdx].image_url = null
    }
    newVariants[vIdx].existing_images.splice(imgIdx, 1)
    setVariants(newVariants)
  }

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants]
    newVariants[index][field] = value
    setVariants(newVariants)
  }

  const addVariant = () => {
    setVariants([...variants, { 
      name: '', price: formData.price, quantity: 1, 
      files: [], previews: [], existing_images: [],
      image_url: null, avatarFileIndex: -1
    }])
  }

  const removeVariant = (index) => {
    if (variants.length <= 1) return toast.error("Cần ít nhất 1 màu!")
    setVariants(variants.filter((_, i) => i !== index))
  }

  // --- 4. SUBMIT UPDATE ---
  const handleSubmit = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) return navigate('/login')

    setSaving(true)
    const toastId = toast.loading("Đang cập nhật dữ liệu...")

    try {
      // BƯỚC 1: CẬP NHẬT THÔNG TIN CƠ BẢN XE
      const payload = {
        ...formData,
        price: Number(formData.price),
        engine_cc: Number(formData.engine_cc) || 0,
        flash_sale_price: formData.flash_sale_price ? Number(formData.flash_sale_price) : null,
        flash_sale_limit: Number(formData.flash_sale_limit) || 0,
        flash_sale_start: formData.flash_sale_start ? new Date(formData.flash_sale_start).toISOString() : null,
        flash_sale_end: formData.flash_sale_end ? new Date(formData.flash_sale_end).toISOString() : null,
        specs: {
          ...specs,
          power_hp: specs.power_hp ? parseFloat(specs.power_hp) : null,
          torque_nm: specs.torque_nm ? parseFloat(specs.torque_nm) : null,
          seat_height_mm: specs.seat_height_mm ? parseInt(specs.seat_height_mm) : null,
          weight_kg: specs.weight_kg ? parseInt(specs.weight_kg) : null,
          fuel_capacity_l: specs.fuel_capacity_l ? parseFloat(specs.fuel_capacity_l) : null,
          top_speed_kmh: specs.top_speed_kmh ? parseInt(specs.top_speed_kmh) : null
        }
      }
      await axios.put(`http://localhost:8000/api/bikes/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      })

      // BƯỚC 2: CẬP NHẬT ẢNH ĐẠI DIỆN CHÍNH
      if (mainFile) {
        const formDataMain = new FormData()
        formDataMain.append('files', mainFile)
        const uploadRes = await axios.post(`http://localhost:8000/api/bikes/${id}/gallery`, formDataMain, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        })
        if (uploadRes.data.urls && uploadRes.data.urls.length > 0) {
          await axios.put(`http://localhost:8000/api/bikes/${id}`, { image_url: uploadRes.data.urls[0] }, {
            headers: { Authorization: `Bearer ${token}` }
          })
        }
      }

      // BƯỚC 3: TẠO LẠI VARIANTS
      // ✅ Gửi image_url hiện tại của variant (ảnh cũ nếu không đổi)
      const variantsPayload = variants.map(v => ({
        name: v.name,
        price: Number(v.price) || Number(formData.price),
        quantity: Number(v.quantity),
        image_url: v.avatarFileIndex === -1 ? (v.image_url || null) : null  // Chỉ giữ ảnh cũ nếu không chọn ảnh mới
      }))

      await axios.post(`http://localhost:8000/api/bikes/${id}/variants/bulk`, variantsPayload, {
        headers: { Authorization: `Bearer ${token}` }
      })

      // Fetch lại để lấy ID variants mới
      const updatedBikeRes = await axios.get(`http://localhost:8000/api/bikes/${id}`)
      const newVariantsFromDB = updatedBikeRes.data.variants

      // BƯỚC 4: UPLOAD ẢNH CHO TỪNG VARIANT
      for (let i = 0; i < newVariantsFromDB.length; i++) {
        const variantId = newVariantsFromDB[i].id
        const variantState = variants[i]
        const filesToUpload = variantState.files

        if (filesToUpload && filesToUpload.length > 0) {
          // ✅ Sắp xếp lại: ảnh được chọn làm avatar lên đầu tiên
          // Backend sẽ tự set ảnh đầu tiên là primary → image_url của variant
          const avatarIdx = variantState.avatarFileIndex
          let orderedFiles = [...filesToUpload]
          if (avatarIdx >= 0 && avatarIdx < orderedFiles.length) {
            const [avatarFile] = orderedFiles.splice(avatarIdx, 1)
            orderedFiles = [avatarFile, ...orderedFiles]
          }

          const fd = new FormData()
          orderedFiles.forEach(f => fd.append('files', f))
          
          await axios.post(`http://localhost:8000/api/bikes/${id}/variants/${variantId}/gallery`, fd, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
          })
        }
      }

      toast.success("Cập nhật thành công!", { id: toastId })
      navigate('/admin/bikes')

    } catch (error) {
      console.error(error)
      toast.error("Lỗi: " + (error.response?.data?.detail || error.message), { id: toastId })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-bold">ĐANG TẢI...</div>

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-24 pt-24 px-4 font-sans">
      <div className="max-w-6xl mx-auto mb-8 flex items-center justify-between">
        <Link to="/admin/bikes" className="p-2 bg-slate-900 rounded-full hover:bg-slate-800 transition border border-slate-800"><ArrowLeft size={24}/></Link>
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3 uppercase">
          <CheckCircle2 className="text-green-500" /> CHỈNH SỬA XE #{id}
        </h1>
        <div className="w-10"></div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CỘT TRÁI: THÔNG TIN CHÍNH */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 1. THÔNG TIN CƠ BẢN & ẢNH ĐẠI DIỆN */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl">
            <SectionHeader icon={Settings} title="Thông Tin & Ảnh Đại Diện" color="text-blue-400" />
            
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-1/3">
                <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">Ảnh bìa hiện tại</label>
                <div className="relative group aspect-[3/4] border-2 border-dashed border-slate-700 rounded-2xl overflow-hidden bg-slate-950 flex flex-col items-center justify-center hover:border-blue-500 transition-all cursor-pointer">
                  {mainPreview ? (
                    <img src={mainPreview} className="w-full h-full object-cover" alt="Main" />
                  ) : (
                    <Upload size={40} className="text-slate-700" />
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                    <Camera size={32} className="text-white mb-2" />
                    <p className="text-[10px] text-white font-bold uppercase">Thay đổi ảnh</p>
                  </div>
                  <input type="file" accept="image/*" onChange={(e) => handleMainFileChange(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 gap-5">
                <InputGroup label="Tên xe hiển thị" required><StyledInput name="name" value={formData.name} onChange={handleChange} /></InputGroup>
                <div className="grid grid-cols-2 gap-4">
                  <InputGroup label="Hãng xe" required><StyledInput name="brand" value={formData.brand} onChange={handleChange} /></InputGroup>
                  <InputGroup label="Phân loại">
                    <select name="type" value={formData.type} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 outline-none focus:border-green-500">
                      {['Sport', 'Naked', 'Adventure', 'Classic', 'Scooter'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </InputGroup>
                </div>
                <InputGroup label="Giá niêm yết (VNĐ)" required><StyledInput type="number" name="price" value={formData.price} onChange={handleChange} className="text-green-400 font-bold font-mono text-lg" /></InputGroup>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-800">
              <InputGroup label="Dung tích động cơ (cc)"><StyledInput type="number" name="engine_cc" value={formData.engine_cc} onChange={handleChange} /></InputGroup>
              <InputGroup label="Tổng kho tự động"><div className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-center font-bold text-yellow-500">{formData.quantity} xe</div></InputGroup>
              <div className="md:col-span-2"><InputGroup label="Giới thiệu xe"><textarea name="description" value={formData.description} rows="3" onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:border-green-500 outline-none resize-none" /></InputGroup></div>
            </div>
          </div>

          {/* 2. FLASH SALE */}
          <div className={`rounded-2xl border p-6 transition-all ${formData.is_flash_sale ? 'bg-red-950/20 border-red-500/30 shadow-lg shadow-red-900/10' : 'bg-slate-900 border-slate-800'}`}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3"><Percent size={20} className={formData.is_flash_sale ? "text-red-400" : "text-slate-500"} /><span className="font-bold">Chương trình Flash Sale</span></div>
              <input type="checkbox" name="is_flash_sale" checked={formData.is_flash_sale} onChange={handleChange} className="w-6 h-6 accent-red-500 cursor-pointer" />
            </div>
            {formData.is_flash_sale && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fadeIn">
                <InputGroup label="Giá Sale"><StyledInput type="number" name="flash_sale_price" value={formData.flash_sale_price} onChange={handleChange} className="text-red-400 border-red-500/30" /></InputGroup>
                <InputGroup label="Giới hạn SL"><StyledInput type="number" name="flash_sale_limit" value={formData.flash_sale_limit} onChange={handleChange} /></InputGroup>
                <InputGroup label="Ngày bắt đầu"><StyledInput type="datetime-local" name="flash_sale_start" value={formData.flash_sale_start} onChange={handleChange} /></InputGroup>
                <InputGroup label="Ngày kết thúc"><StyledInput type="datetime-local" name="flash_sale_end" value={formData.flash_sale_end} onChange={handleChange} /></InputGroup>
              </div>
            )}
          </div>

          {/* 3. THÔNG SỐ KỸ THUẬT */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl">
            <SectionHeader icon={Wrench} title="Thông Số Kỹ Thuật Chi Tiết" color="text-orange-400" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.keys(specs).map(key => (
                <InputGroup key={key} label={key.replace(/_/g,' ').toUpperCase()}>
                  <StyledInput name={key} value={specs[key] || ''} onChange={(e) => setSpecs({...specs, [e.target.name]: e.target.value})} placeholder="..." />
                </InputGroup>
              ))}
            </div>
          </div>
        </div>

        {/* --- CỘT PHẢI: BIẾN THỂ MÀU --- */}
        <div className="space-y-8">
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl sticky top-24 max-h-[calc(100vh-150px)] flex flex-col">
            <div className="flex justify-between mb-4 flex-shrink-0">
              <SectionHeader icon={Layers} title="Phiên Bản Màu" color="text-yellow-400" />
              <button type="button" onClick={addVariant} className="bg-slate-800 p-2 rounded hover:bg-slate-700 transition border border-slate-700"><Plus size={18} /></button>
            </div>
            
            <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
              {variants.map((v, i) => (
                <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative group hover:border-slate-600 transition-colors">
                  <button type="button" onClick={() => removeVariant(i)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10 hover:bg-red-600"><X size={12}/></button>
                  
                  <div className="space-y-4">
                    <input type="text" value={v.name} onChange={(e) => handleVariantChange(i, 'name', e.target.value)} className="w-full bg-transparent border-b border-slate-700 focus:border-yellow-500 outline-none text-sm text-yellow-500 font-bold pb-1 uppercase" placeholder="Tên màu..." />
                    
                    <div className="flex gap-2">
                      <InputGroup label="Giá riêng"><StyledInput type="number" value={v.price} onChange={(e) => handleVariantChange(i, 'price', e.target.value)} className="px-2 py-1.5 text-xs" /></InputGroup>
                      <InputGroup label="Kho"><StyledInput type="number" value={v.quantity} onChange={(e) => handleVariantChange(i, 'quantity', e.target.value)} className="px-2 py-1.5 text-xs text-center" /></InputGroup>
                    </div>

                    {/* ✅ GALLERY CHO VARIANT - CÓ CHỌN ẢNH ĐẠI DIỆN */}
                    <div>
                      <label className="text-[10px] uppercase text-slate-500 font-bold mb-2 block tracking-widest flex items-center gap-1">
                        <ImageIcon size={10}/> Ảnh màu {v.name || '...'}
                      </label>

                      {/* Hướng dẫn */}
                      <p className="text-[10px] text-yellow-500/70 mb-2 flex items-center gap-1">
                        <Star size={8} fill="currentColor"/> Click vào ảnh để chọn làm ảnh đại diện
                      </p>

                      <div className="grid grid-cols-3 gap-2">
                        
                        {/* ẢNH CŨ TỪ DB */}
                        {v.existing_images && v.existing_images.map((img, imgIdx) => {
                          const isAvatar = v.image_url === img.image_url && v.avatarFileIndex === -1
                          return (
                            <div
                              key={`old-${img.id}`}
                              onClick={() => setVariantAvatarExisting(i, img.image_url)}
                              className={`relative aspect-square rounded overflow-hidden border-2 cursor-pointer transition-all ${isAvatar ? 'border-yellow-400 scale-105 shadow-lg shadow-yellow-500/30' : 'border-slate-700 opacity-60 hover:opacity-100 hover:border-slate-500'}`}
                            >
                              <img src={img.image_url} className="w-full h-full object-cover" alt="Old" />
                              {isAvatar && (
                                <div className="absolute inset-0 bg-yellow-500/20 flex items-end justify-center pb-1">
                                  <span className="text-[8px] bg-yellow-500 text-black px-1.5 py-0.5 rounded font-black">ĐẠI DIỆN</span>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeVariantOldImage(i, imgIdx) }}
                                className="absolute top-0 right-0 bg-red-500/80 p-0.5 opacity-0 hover:opacity-100 transition-opacity z-10"
                              >
                                <X size={10}/>
                              </button>
                            </div>
                          )
                        })}

                        {/* ẢNH MỚI CHỌN */}
                        {v.previews.map((url, fIdx) => {
                          const isAvatar = v.avatarFileIndex === fIdx
                          return (
                            <div
                              key={`new-${fIdx}`}
                              onClick={() => setVariantAvatarFile(i, fIdx)}
                              className={`relative aspect-square rounded overflow-hidden border-2 cursor-pointer transition-all ${isAvatar ? 'border-yellow-400 scale-105 shadow-lg shadow-yellow-500/30' : 'border-green-600/50 opacity-80 hover:opacity-100 hover:border-green-500'}`}
                            >
                              <img src={url} className="w-full h-full object-cover" alt="New" />
                              {isAvatar ? (
                                <div className="absolute inset-0 bg-yellow-500/20 flex items-end justify-center pb-1">
                                  <span className="text-[8px] bg-yellow-500 text-black px-1.5 py-0.5 rounded font-black">ĐẠI DIỆN</span>
                                </div>
                              ) : (
                                <div className="absolute bottom-0 inset-x-0 bg-green-500/80 text-[8px] text-white text-center font-bold">MỚI</div>
                              )}
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeVariantNewFile(i, fIdx) }}
                                className="absolute top-0 right-0 bg-red-500/80 p-0.5 opacity-0 hover:opacity-100 transition-opacity z-10"
                              >
                                <X size={10}/>
                              </button>
                            </div>
                          )
                        })}
                        
                        {/* NÚT THÊM ẢNH */}
                        <label className="aspect-square border border-dashed border-slate-700 rounded flex flex-col items-center justify-center hover:border-blue-500 transition-colors cursor-pointer bg-slate-900/30">
                          <Plus size={16} className="text-slate-600" />
                          <span className="text-[8px] text-slate-600 mt-1">Thêm ảnh</span>
                          <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleVariantFilesChange(i, e.target.files)} />
                        </label>
                      </div>

                      {/* Hiển thị ảnh đại diện hiện tại nếu không có ảnh nào */}
                      {v.existing_images.length === 0 && v.previews.length === 0 && v.image_url && (
                        <div className="mt-2 flex items-center gap-2">
                          <img src={v.image_url} className="w-10 h-10 object-cover rounded border border-yellow-500/50" />
                          <span className="text-[10px] text-yellow-500 font-bold">Đang dùng ảnh đại diện cũ</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex justify-center z-50 shadow-2xl">
          <div className="flex gap-4 max-w-6xl w-full justify-center">
            <Link to="/admin/bikes" className="px-8 py-3 rounded-full bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition">HỦY BỎ</Link>
            <button 
              type="submit" 
              disabled={saving} 
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-black py-3 px-16 rounded-full shadow-lg shadow-yellow-900/20 flex items-center gap-2 uppercase tracking-wider transition-transform hover:scale-105 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" /> : <><Save size={20}/> LƯU THAY ĐỔI</>}
            </button>
          </div>
        </div>

      </form>
    </div>
  )
}

export default EditBikePage