import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { SlidersHorizontal, Check, ChevronLeft, ChevronRight, Search, Palette, DollarSign, Zap } from 'lucide-react'

// --- 1. IMPORT SLIDER VÀ CSS ---
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'

export default function BikeListPage() {
  const [bikes, setBikes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()

  // --- STATE DỮ LIỆU BỘ LỌC TỪ API ---
  const [filterOptions, setFilterOptions] = useState({
    brands: [],
    types: [],
    colors: []
  })

  // --- STATE LỰA CHỌN ---
  const [filterBrand, setFilterBrand] = useState(searchParams.get('brand') || '')
  const [filterType, setFilterType] = useState(searchParams.get('type') || '')
  const [filterColor, setFilterColor] = useState(searchParams.get('color') || '')
  
  // --- STATE CHO SLIDER (MỚI) ---
  // Giá: 0 đến 2 Tỷ
  const [priceRange, setPriceRange] = useState([0, 2000000000]) 
  // CC: 0 đến 2000cc
  const [ccRange, setCcRange] = useState([0, 2000])

  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 })

  // --- LẤY BỘ LỌC ĐỘNG ---
  useEffect(() => {
    const fetchFilters = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/bikes/filters')
            setFilterOptions(res.data)
        } catch (error) {
            console.error("Lỗi tải bộ lọc:", error)
        }
    }
    fetchFilters()
  }, [])

  // --- ĐỒNG BỘ URL ---
  useEffect(() => {
    setFilterBrand(searchParams.get('brand') || '')
    setFilterType(searchParams.get('type') || '')
    setFilterColor(searchParams.get('color') || '')
    
    // Lưu ý: Với slider, ta giữ giá trị mặc định khi load trang để tránh phức tạp
    // Nếu muốn lưu range lên URL, cần logic parse phức tạp hơn.
    setPagination(p => ({ ...p, currentPage: 1 }))
  }, [searchParams])

  // --- GỌI API LẤY XE (KHI BẤT KỲ BỘ LỌC NÀO THAY ĐỔI) ---
  useEffect(() => {
    // Debounce nhỏ để tránh gọi API quá nhiều khi đang kéo
    const timer = setTimeout(() => {
        fetchBikes()
    }, 300) 
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.currentPage, filterBrand, filterType, filterColor, priceRange, ccRange])

  const fetchBikes = async () => {
    setLoading(true)
    try {
      let url = `http://127.0.0.1:8000/api/bikes/?page=${pagination.currentPage}&size=12`
      
      if (filterBrand) url += `&brand=${filterBrand}`
      if (filterType) url += `&type=${filterType}`
      if (filterColor) url += `&color=${filterColor}`
      
      // Gửi giá trị Slider lên API
      url += `&min_price=${priceRange[0]}&max_price=${priceRange[1]}`
      url += `&min_cc=${ccRange[0]}&max_cc=${ccRange[1]}`

      const res = await axios.get(url)
      setBikes(res.data.items || []) 
      setPagination(prev => ({
        ...prev,
        totalPages: res.data.total_pages || 1,
        totalItems: res.data.total || 0
      }))
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
    setPriceRange([0, 2000000000]) // Reset giá về mặc định
    setCcRange([0, 2000])          // Reset CC về mặc định
    setPagination(p => ({ ...p, currentPage: 1 }))
    setSearchParams({})
  }

  // Hàm format tiền gọn (Ví dụ: 1.5 Tỷ)
  const formatMoneyShort = (num) => {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + ' Tỷ'
    if (num >= 1000000) return (num / 1000000).toFixed(0) + ' Tr'
    return num
  }

  const formatPriceFull = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

  return (
    <div className="min-h-screen bg-slate-900 text-white py-8 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* === CỘT TRÁI: DANH SÁCH XE (9 PHẦN) === */}
        <div className="lg:col-span-9 order-2 lg:order-1">
          <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
             <h1 className="text-2xl font-bold flex items-center gap-2 uppercase tracking-tighter">
               <Search className="text-green-400"/> Kho Xe Motor
             </h1>
             <span className="text-gray-400 text-sm italic">Hiển thị {bikes.length} / {pagination.totalItems} xe</span>
          </div>

          {loading ? (
             <div className="text-center py-20 animate-pulse text-gray-500 font-bold">ĐANG TẢI DỮ LIỆU...</div>
          ) : bikes.length > 0 ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {bikes.map(bike => (
                    <Link to={`/bikes/${bike.id}`} key={bike.id} className="group bg-slate-800 rounded-2xl overflow-hidden shadow-lg border border-slate-700 hover:border-green-500 flex flex-col transition-all duration-300 hover:-translate-y-1">
                        <div className="relative h-48 overflow-hidden">
                            <img src={bike.image_url} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" alt={bike.name}/>
                             {bike.discount_price ? (
                                <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded animate-pulse">SALE</div>
                            ) : null}
                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded uppercase">
                                {bike.type}
                            </div>
                        </div>
                        <div className="p-4 flex flex-col flex-grow">
                             <div className="text-[10px] text-green-500 font-bold uppercase mb-1">{bike.make?.name || bike.brand}</div>
                             <h3 className="font-bold text-lg mb-2 truncate group-hover:text-green-400">{bike.name}</h3>
                             
                             {/* Hiển thị thông số nhỏ */}
                             <div className="flex gap-3 text-[10px] text-gray-400 font-bold uppercase mb-4">
                                <span className="bg-slate-900 px-2 py-1 rounded border border-slate-700">{bike.engine_cc} CC</span>
                                {bike.color && <span className="bg-slate-900 px-2 py-1 rounded border border-slate-700">{bike.color}</span>}
                             </div>
                             
                             <div className="mt-auto">
                                 {bike.discount_price ? (
                                     <div>
                                         <span className="text-xs text-gray-500 line-through font-bold mr-2">{formatPriceFull(bike.price)}</span>
                                         <span className="text-xl font-black text-red-500">{formatPriceFull(bike.discount_price)}</span>
                                     </div>
                                 ) : (
                                     <span className="text-xl font-black text-white">{formatPriceFull(bike.price)}</span>
                                 )}
                             </div>
                        </div>
                    </Link>
                ))}
             </div>
          ) : (
             <div className="text-center py-20 bg-slate-800/50 rounded-xl border border-dashed border-slate-600">
                <p className="text-xl text-gray-400 mb-2">Không tìm thấy xe nào phù hợp!</p>
                <button onClick={clearFilters} className="text-green-400 hover:underline font-bold uppercase text-xs">Xóa bộ lọc</button>
             </div>
          )}

          {/* Phân trang */}
           {pagination.totalPages > 1 && (
             <div className="mt-12 flex justify-center gap-2">
                 <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1} className="p-2 bg-slate-800 rounded disabled:opacity-20"><ChevronLeft/></button>
                 <span className="px-4 py-2 bg-slate-800 font-bold rounded">Trang {pagination.currentPage}</span>
                 <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages} className="p-2 bg-slate-800 rounded disabled:opacity-20"><ChevronRight/></button>
             </div>
           )}
        </div>

        {/* === CỘT PHẢI: BỘ LỌC (3 PHẦN) === */}
        <div className="lg:col-span-3 order-1 lg:order-2">
           <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 sticky top-24 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2"><SlidersHorizontal size={16}/> Bộ Lọc</h3>
                 <button onClick={clearFilters} className="text-[10px] text-red-500 font-bold uppercase hover:underline">Xóa tất cả</button>
              </div>

              <div className="space-y-8">
                
                {/* 1. HÃNG XE */}
                <div>
                   <h4 className="font-black text-[10px] text-gray-500 mb-3 uppercase tracking-wider">Thương Hiệu</h4>
                   <div className="grid grid-cols-2 gap-2">
                      {filterOptions.brands.length > 0 ? filterOptions.brands.map(b => (
                        <button key={b} onClick={() => {setFilterBrand(b); setPagination(p => ({...p, currentPage: 1}))}} 
                          className={`px-2 py-2 rounded-lg text-xs font-bold border transition ${filterBrand === b ? 'bg-green-600 border-green-500 text-white' : 'bg-slate-900 border-slate-700 text-gray-400 hover:border-gray-500'}`}>
                          {b}
                        </button>
                      )) : <p className="text-xs text-gray-500 italic">Đang tải...</p>}
                   </div>
                </div>

                {/* 2. THANH KÉO GIÁ (SLIDER) */}
                <div>
                   <div className="flex justify-between items-center mb-4">
                        <h4 className="font-black text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-2">
                             <DollarSign size={12}/> Khoảng Giá
                        </h4>
                        <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded">
                            {formatMoneyShort(priceRange[0])} - {formatMoneyShort(priceRange[1])}
                        </span>
                   </div>
                   <div className="px-2">
                       <Slider 
                            range 
                            min={0} 
                            max={2000000000} // Max 2 Tỷ
                            step={10000000}  // Bước nhảy 10 Triệu
                            value={priceRange}
                            onChange={(val) => setPriceRange(val)}
                            trackStyle={[{ backgroundColor: '#22c55e' }]} // Màu xanh lá
                            handleStyle={[
                                { borderColor: '#22c55e', backgroundColor: '#0f172a', opacity: 1 }, 
                                { borderColor: '#22c55e', backgroundColor: '#0f172a', opacity: 1 }
                            ]}
                            railStyle={{ backgroundColor: '#334155' }}
                       />
                   </div>
                </div>

                {/* 3. THANH KÉO PHÂN KHỐI (SLIDER) */}
                <div>
                   <div className="flex justify-between items-center mb-4">
                        <h4 className="font-black text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-2">
                             <Zap size={12}/> Phân Khối (CC)
                        </h4>
                        <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded">
                            {ccRange[0]}cc - {ccRange[1]}cc
                        </span>
                   </div>
                   <div className="px-2">
                       <Slider 
                            range 
                            min={0} 
                            max={2000} // Max 2000cc
                            step={50}  // Bước nhảy 50cc
                            value={ccRange}
                            onChange={(val) => setCcRange(val)}
                            trackStyle={[{ backgroundColor: '#3b82f6' }]} // Màu xanh dương
                            handleStyle={[
                                { borderColor: '#3b82f6', backgroundColor: '#0f172a', opacity: 1 }, 
                                { borderColor: '#3b82f6', backgroundColor: '#0f172a', opacity: 1 }
                            ]}
                            railStyle={{ backgroundColor: '#334155' }}
                       />
                   </div>
                </div>

                {/* 4. MÀU SẮC */}
                <div>
                   <h4 className="font-black text-[10px] text-gray-500 mb-3 uppercase tracking-wider flex items-center gap-2">
                       <Palette size={12}/> Màu Sắc
                   </h4>
                   <div className="flex flex-wrap gap-2">
                      {filterOptions.colors.length > 0 ? filterOptions.colors.map(c => (
                        <button key={c} onClick={() => {setFilterColor(c); setPagination(p => ({...p, currentPage: 1}))}}
                           className={`px-3 py-1.5 rounded text-[10px] font-bold border transition ${filterColor === c ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-900 border-slate-700 text-gray-400 hover:border-gray-500'}`}>
                           {c}
                        </button>
                      )) : <p className="text-xs text-gray-500 italic">Đang tải...</p>}
                   </div>
                </div>

                {/* 5. DÒNG XE */}
                <div>
                   <h4 className="font-black text-[10px] text-gray-500 mb-3 uppercase tracking-wider">Dòng Xe</h4>
                   <div className="flex flex-wrap gap-2">
                      {filterOptions.types.length > 0 ? filterOptions.types.map(t => (
                        <button key={t} onClick={() => {setFilterType(t); setPagination(p => ({...p, currentPage: 1}))}}
                           className={`px-3 py-1.5 rounded-full text-[10px] font-black border transition ${filterType === t ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-slate-900 border-slate-700 text-gray-400 hover:border-gray-500'}`}>
                           {t}
                        </button>
                      )) : <p className="text-xs text-gray-500 italic">Đang tải...</p>}
                   </div>
                </div>

              </div>
           </div>
        </div>

      </div>
    </div>
  )
}