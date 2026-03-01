import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { SlidersHorizontal, ChevronLeft, ChevronRight, Search, Palette, DollarSign, Zap, Filter } from 'lucide-react'

// --- 1. IMPORT SLIDER ---
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'

export default function BikeListPage() {
  const [bikes, setBikes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()

  const [filterOptions, setFilterOptions] = useState({
    brands: [],
    types: [],
    colors: []
  })

  // ✅ STATE LƯU GIỚI HẠN MAX (Mặc định tạm 2 tỷ, sẽ update theo API)
  const [dynamicLimits, setDynamicLimits] = useState({
     maxPrice: 2000000000,
     maxCc: 2000
  })

  // --- STATE LỰA CHỌN ---
  const [filterBrand, setFilterBrand] = useState(searchParams.get('brand') || '')
  const [filterType, setFilterType] = useState(searchParams.get('type') || '')
  const [filterColor, setFilterColor] = useState(searchParams.get('color') || '')
  
  // --- STATE CHO SLIDER ---
  // ✅ SỬA LỖI: Mặc định ban đầu là 2 Tỷ để không bị hụt các xe đắt tiền
  const [priceRange, setPriceRange] = useState([0, 2000000000]) 
  const [ccRange, setCcRange] = useState([0, 2000])

  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 })

  // --- 1. LẤY DỮ LIỆU BỘ LỌC & CẤU HÌNH MAX VALUE ĐỘNG ---
  useEffect(() => {
    const fetchFilters = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/bikes/filters')
            setFilterOptions(res.data)

            // ✅ LẤY GIÁ MAX TỪ DATABASE
            const dbMaxPrice = res.data.max_price || 2000000000
            const dbMaxCc = res.data.max_cc || 2000
            
            setDynamicLimits({
                maxPrice: dbMaxPrice,
                maxCc: dbMaxCc
            })

            if (!searchParams.get('max_price')) {
                setPriceRange([0, dbMaxPrice])
            } else {
                setPriceRange([
                    Number(searchParams.get('min_price') || 0), 
                    Number(searchParams.get('max_price') || dbMaxPrice)
                ])
            }

            if (!searchParams.get('max_cc')) {
                setCcRange([0, dbMaxCc])
            } else {
                 setCcRange([
                    Number(searchParams.get('min_cc') || 0), 
                    Number(searchParams.get('max_cc') || dbMaxCc)
                ])
            }

        } catch (error) {
            console.error("Lỗi tải bộ lọc:", error)
        }
    }
    fetchFilters()
  }, []) 

  // --- 2. ĐỒNG BỘ URL KHI URL THAY ĐỔI (BACK/FORWARD) ---
  useEffect(() => {
    setFilterBrand(searchParams.get('brand') || '')
    setFilterType(searchParams.get('type') || '')
    setFilterColor(searchParams.get('color') || '')
  }, [searchParams])

  // --- 3. GỌI API LẤY XE (KHI BẤT KỲ BỘ LỌC NÀO THAY ĐỔI) ---
  useEffect(() => {
    const timer = setTimeout(() => {
        fetchBikes()
    }, 300) 
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.currentPage, filterBrand, filterType, filterColor, priceRange, ccRange, dynamicLimits])

  const fetchBikes = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', pagination.currentPage)
      params.append('size', 12)
      
      if (filterBrand) params.append('brand', filterBrand)
      if (filterType) params.append('type', filterType)
      if (filterColor) params.append('color', filterColor)
      
      if (priceRange[0] > 0) params.append('min_price', priceRange[0])
      
      // ✅ CHỈ GỬI MAX_PRICE NẾU ĐANG KÉO THẤP HƠN MỨC CAO NHẤT
      if (priceRange[1] < dynamicLimits.maxPrice) {
          params.append('max_price', priceRange[1])
      }

      if (ccRange[0] > 0) params.append('min_cc', ccRange[0])
      if (ccRange[1] < dynamicLimits.maxCc) {
          params.append('max_cc', ccRange[1])
      }

      const res = await axios.get(`http://127.0.0.1:8000/api/bikes/?${params.toString()}`)
      
      setBikes(res.data.items || []) 
      setPagination(prev => ({
        ...prev,
        totalPages: res.data.total_pages || 1,
        totalItems: res.data.total || 0
      }))

      // Lưu params lên URL để reload không mất lọc
      setSearchParams(params)
    } catch (error) {
      console.error(error)
      setBikes([])
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(p => ({ ...p, currentPage: newPage }))
      window.scrollTo(0, 0)
    }
  }

  const clearFilters = () => {
    setFilterBrand('')
    setFilterType('')
    setFilterColor('')
    // ✅ Reset về giới hạn động lấy từ API
    setPriceRange([0, dynamicLimits.maxPrice]) 
    setCcRange([0, dynamicLimits.maxCc]) 
    setPagination(p => ({ ...p, currentPage: 1 }))
    setSearchParams({})
  }

  const formatMoneyShort = (num) => {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + ' Tỷ'
    if (num >= 1000000) return (num / 1000000).toFixed(0) + ' Tr'
    return num
  }

  const formatPriceFull = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

  // ✅ COMPONENT GIÁ THỰC TẾ - Backend đã tính sẵn, frontend chỉ hiển thị
  const PriceDisplay = ({ bike }) => {
    if (bike.is_flash_sale) {
      return (
        <div className="flex items-end gap-2">
          <div>
            <div className="text-[10px] text-red-400 font-bold uppercase tracking-wider animate-pulse">⚡ Flash Sale</div>
            <span className="text-xl font-black text-red-400 leading-none">{formatPriceFull(bike.current_price)}</span>
          </div>
          <span className="text-xs text-gray-500 line-through font-bold mb-0.5">{formatPriceFull(bike.price)}</span>
        </div>
      )
    }
    if (bike.is_sale_active) {
      return (
        <div className="flex items-end gap-2">
          <span className="text-xl font-black text-red-500 leading-none">{formatPriceFull(bike.current_price)}</span>
          <span className="text-xs text-gray-500 line-through font-bold mb-0.5">{formatPriceFull(bike.price)}</span>
        </div>
      )
    }
    return <span className="text-xl font-black text-white">{formatPriceFull(bike.current_price)}</span>
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white py-8 px-4 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* === CỘT TRÁI: DANH SÁCH XE === */}
        <div className="lg:col-span-9 order-2 lg:order-1">
          <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
             <h1 className="text-2xl font-bold flex items-center gap-2 uppercase tracking-tighter">
               <Search className="text-green-500"/> Kho Xe Motor
             </h1>
             <span className="text-gray-400 text-sm italic font-medium">Hiển thị {bikes.length} / {pagination.totalItems} xe</span>
          </div>

          {loading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="bg-slate-800 h-80 rounded-2xl animate-pulse border border-slate-700"></div>
                ))}
             </div>
          ) : bikes.length > 0 ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {bikes.map(bike => (
                    <Link to={`/bikes/${bike.id}`} key={bike.id} className="group bg-slate-800 rounded-2xl overflow-hidden shadow-lg border border-slate-700 hover:border-green-500 hover:shadow-green-500/20 flex flex-col transition-all duration-300 hover:-translate-y-1">
                        <div className="relative h-48 overflow-hidden bg-slate-900">
                            <img src={bike.image_url} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" alt={bike.name}/>

                            {/* ✅ Badge dùng is_flash_sale & is_sale_active thực tế từ backend */}
                            {bike.is_flash_sale ? (
                                <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded animate-pulse shadow-lg">⚡ FLASH SALE</div>
                            ) : bike.is_sale_active ? (
                                <div className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg">SALE</div>
                            ) : null}

                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded uppercase border border-white/10">
                                {bike.type}
                            </div>
                        </div>
                        <div className="p-4 flex flex-col flex-grow">
                             <div className="text-[10px] text-green-500 font-bold uppercase mb-1 tracking-wider">{bike.make?.name || bike.brand}</div>
                             <h3 className="font-bold text-lg mb-2 truncate group-hover:text-green-400 transition-colors">{bike.name}</h3>
                             
                             <div className="flex gap-2 text-[10px] text-gray-400 font-bold uppercase mb-4">
                                <span className="bg-slate-900 px-2 py-1 rounded border border-slate-700 flex items-center gap-1"><Zap size={10}/> {bike.engine_cc} CC</span>
                                {bike.color && <span className="bg-slate-900 px-2 py-1 rounded border border-slate-700 flex items-center gap-1"><Palette size={10}/> {bike.color}</span>}
                             </div>
                             
                             <div className="mt-auto pt-4 border-t border-slate-700/50">
                                 {/* ✅ Dùng PriceDisplay thay vì tự tính */}
                                 <PriceDisplay bike={bike} />
                             </div>
                        </div>
                    </Link>
                ))}
             </div>
          ) : (
             <div className="text-center py-20 bg-slate-800/50 rounded-xl border border-dashed border-slate-600">
                <p className="text-xl text-gray-400 mb-4 font-medium">Không tìm thấy xe nào phù hợp!</p>
                <button onClick={clearFilters} className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-full font-bold text-sm transition shadow-lg shadow-green-600/20">
                    Xóa bộ lọc tìm kiếm
                </button>
             </div>
          )}

          {/* Phân trang */}
           {pagination.totalPages > 1 && (
             <div className="mt-12 flex justify-center gap-2">
                 <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 disabled:opacity-30 transition"><ChevronLeft/></button>
                 <span className="px-4 py-2 bg-slate-800 font-bold rounded-lg border border-slate-700 text-sm flex items-center">
                    Trang {pagination.currentPage} / {pagination.totalPages}
                 </span>
                 <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 disabled:opacity-30 transition"><ChevronRight/></button>
             </div>
           )}
        </div>

        {/* === CỘT PHẢI: BỘ LỌC === */}
        <div className="lg:col-span-3 order-1 lg:order-2">
           <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 sticky top-24 shadow-xl">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-700">
                 <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2 text-white">
                    <SlidersHorizontal size={16} className="text-green-500"/> Bộ Lọc
                 </h3>
                 <button onClick={clearFilters} className="text-[10px] text-red-400 font-bold uppercase hover:text-red-300 transition">Reset</button>
              </div>

              <div className="space-y-8">
                
                {/* 1. KHOẢNG GIÁ ĐỘNG */}
                <div>
                   <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-2">
                             <DollarSign size={12}/> Giá bán
                        </h4>
                        <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded border border-green-500/20">
                            {formatMoneyShort(priceRange[0])} - {formatMoneyShort(priceRange[1])}
                        </span>
                   </div>
                   <div className="px-2">
                       <Slider 
                            range 
                            min={0} 
                            max={dynamicLimits.maxPrice} 
                            step={10000000} 
                            value={priceRange}
                            onChange={(val) => {
                                setPriceRange(val);
                                setPagination(p => ({...p, currentPage: 1}));
                            }}
                            trackStyle={[{ backgroundColor: '#22c55e' }]} 
                            handleStyle={[{ borderColor: '#22c55e', backgroundColor: '#0f172a', opacity: 1 }, { borderColor: '#22c55e', backgroundColor: '#0f172a', opacity: 1 }]}
                            railStyle={{ backgroundColor: '#334155' }}
                       />
                   </div>
                </div>

                {/* 2. PHÂN KHỐI ĐỘNG */}
                <div>
                   <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-2">
                             <Zap size={12}/> Phân Khối (CC)
                        </h4>
                        <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded border border-blue-500/20">
                            {ccRange[0]}cc - {ccRange[1]}cc
                        </span>
                   </div>
                   <div className="px-2">
                       <Slider 
                            range 
                            min={0} 
                            max={dynamicLimits.maxCc} 
                            step={50}  
                            value={ccRange}
                            onChange={(val) => {
                                setCcRange(val);
                                setPagination(p => ({...p, currentPage: 1}));
                            }}
                            trackStyle={[{ backgroundColor: '#3b82f6' }]} 
                            handleStyle={[{ borderColor: '#3b82f6', backgroundColor: '#0f172a', opacity: 1 }, { borderColor: '#3b82f6', backgroundColor: '#0f172a', opacity: 1 }]}
                            railStyle={{ backgroundColor: '#334155' }}
                       />
                   </div>
                </div>

                {/* 3. THƯƠNG HIỆU */}
                <div>
                   <h4 className="font-bold text-[10px] text-slate-500 mb-3 uppercase tracking-wider">Thương Hiệu</h4>
                   <div className="flex flex-wrap gap-2">
                      {filterOptions.brands.length > 0 ? filterOptions.brands.map(b => (
                        <button key={b} onClick={() => {setFilterBrand(filterBrand === b ? '' : b); setPagination(p => ({...p, currentPage: 1}))}} 
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${filterBrand === b ? 'bg-green-600 border-green-500 text-white shadow-lg shadow-green-900/50' : 'bg-slate-900 border-slate-700 text-gray-400 hover:border-gray-500 hover:text-gray-300'}`}>
                          {b}
                        </button>
                      )) : <p className="text-xs text-gray-600 italic">Đang tải...</p>}
                   </div>
                </div>

                {/* 4. LOẠI XE */}
                <div>
                   <h4 className="font-bold text-[10px] text-slate-500 mb-3 uppercase tracking-wider">Loại Xe</h4>
                   <div className="flex flex-wrap gap-2">
                      {filterOptions.types.length > 0 ? filterOptions.types.map(t => (
                        <button key={t} onClick={() => {setFilterType(filterType === t ? '' : t); setPagination(p => ({...p, currentPage: 1}))}}
                           className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${filterType === t ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50' : 'bg-slate-900 border-slate-700 text-gray-400 hover:border-gray-500 hover:text-gray-300'}`}>
                           {t}
                        </button>
                      )) : <p className="text-xs text-gray-600 italic">Đang tải...</p>}
                   </div>
                </div>

                {/* 5. MÀU SẮC */}
                <div>
                   <h4 className="font-bold text-[10px] text-slate-500 mb-3 uppercase tracking-wider flex items-center gap-2">
                       <Palette size={12}/> Màu Sắc
                   </h4>
                   <div className="flex flex-wrap gap-2">
                      {filterOptions.colors.length > 0 ? filterOptions.colors.map(c => (
                        <button key={c} onClick={() => {setFilterColor(filterColor === c ? '' : c); setPagination(p => ({...p, currentPage: 1}))}}
                           className={`px-3 py-1.5 rounded text-[10px] font-bold border transition-all ${filterColor === c ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/50' : 'bg-slate-900 border-slate-700 text-gray-400 hover:border-gray-500 hover:text-gray-300'}`}>
                           {c}
                        </button>
                      )) : <p className="text-xs text-gray-600 italic">Chưa có màu nào...</p>}
                   </div>
                </div>

              </div>
           </div>
        </div>

      </div>
    </div>
  )
}