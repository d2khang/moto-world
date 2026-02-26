import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { 
  Edit, Trash2, Plus, Package, Search, AlertCircle, 
  ArrowDown, ArrowUpRight, Database, RefreshCw 
} from 'lucide-react'
import toast from 'react-hot-toast'

function AdminBikeManager() {
  const [bikes, setBikes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 1. Hàm lấy dữ liệu
  const fetchBikes = async () => {
    setIsRefreshing(true)
    try {
      const res = await axios.get('http://localhost:8000/api/bikes/?size=100')
      const bikeData = res.data.items ? res.data.items : res.data
      setBikes(Array.isArray(bikeData) ? bikeData : [])
    } catch (error) {
      toast.error("Không thể đồng bộ dữ liệu kho!")
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => { fetchBikes() }, [])

  const handleDelete = async (id, name) => {
    if (window.confirm(`Xác nhận xóa vĩnh viễn dòng xe "${name}"?`)) {
      const token = localStorage.getItem('token')
      try {
        await axios.delete(`http://localhost:8000/api/bikes/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setBikes(bikes.filter(bike => bike.id !== id))
        toast.success("Đã dọn dẹp dữ liệu")
      } catch (error) {
        toast.error("Lỗi khi xóa")
      }
    }
  }

  // --- LOGIC XỬ LÝ DỮ LIỆU THÔNG MINH ---
  
  // A. Khử trùng lặp (Fix lỗi 17 xe rác)
  const uniqueBikes = useMemo(() => {
    const map = new Map();
    bikes.forEach(item => {
        if (!map.has(item.id)) map.set(item.id, item);
    });
    return Array.from(map.values());
  }, [bikes]);

  // B. Hàm tính tồn kho thực tế cho từng xe (Cơ chế tính toán kép)
  const getRealStock = (bike) => {
    // Ưu tiên dùng total_quantity từ backend, nếu bằng 0 hoặc ko có thì tự cộng dồn variants
    if (bike.total_quantity && bike.total_quantity > 0) return bike.total_quantity;
    if (bike.variants && bike.variants.length > 0) {
        return bike.variants.reduce((sum, v) => sum + (v.quantity || 0), 0);
    }
    return bike.quantity || 0; // Cuối cùng mới dùng cột quantity cũ
  };

  // C. Tìm kiếm
  const filteredBikes = uniqueBikes.filter(bike => 
    bike.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bike.make?.name || bike.brand || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  // D. Tính tổng số xe toàn bộ cửa hàng (Header)
  const totalUnitsInStock = uniqueBikes.reduce((sum, bike) => sum + getRealStock(bike), 0)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20 pt-24 px-4 md:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER: THỐNG KÊ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
                <div className="flex items-center gap-4 text-green-400 mb-2">
                    <Package size={24}/>
                    <span className="text-xs font-black uppercase tracking-widest">Dòng xe</span>
                </div>
                <div className="text-4xl font-black text-white">{uniqueBikes.length} <span className="text-sm text-slate-500 font-bold ml-2">Model</span></div>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
                <div className="flex items-center gap-4 text-blue-400 mb-2">
                    <Database size={24}/>
                    <span className="text-xs font-black uppercase tracking-widest">Tổng kho</span>
                </div>
                <div className="text-4xl font-black text-white">{totalUnitsInStock} <span className="text-sm text-slate-500 font-bold ml-2">Chiếc</span></div>
            </div>

            <div className="flex flex-col justify-between gap-3">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5"/>
                    <input 
                        type="text" placeholder="Tìm kiếm..." 
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-12 pr-4 py-3.5 text-sm outline-none focus:border-green-500/50 transition-all"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchBikes} disabled={isRefreshing} className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition disabled:opacity-50">
                        <RefreshCw size={20} className={`${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <Link to="/admin/add-bike" className="flex-1 bg-green-600 hover:bg-green-500 text-white rounded-xl font-black flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
                        <Plus size={18} /> Đăng Xe Mới
                    </Link>
                </div>
            </div>
        </div>

        {/* BẢNG DỮ LIỆU */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-800/30 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-800">
                  <th className="p-6">Sản phẩm</th>
                  <th className="p-6">Thông tin</th>
                  <th className="p-6">Giá bán</th>
                  <th className="p-6 text-center">Tồn kho tổng</th>
                  <th className="p-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                   <tr><td colSpan="5" className="p-32 text-center text-slate-600 animate-pulse font-black">ĐANG TẢI...</td></tr>
                ) : filteredBikes.length === 0 ? (
                   <tr><td colSpan="5" className="p-32 text-center text-slate-500 italic">Kho hàng trống.</td></tr>
                ) : (
                  filteredBikes.map((bike) => {
                    const currentStock = getRealStock(bike);
                    return (
                      <tr key={bike.id} className="hover:bg-slate-800/20 transition-colors group">
                        <td className="p-6">
                          <div className="w-24 h-16 rounded-xl overflow-hidden border border-slate-700 bg-black">
                              <img src={bike.image_url || "https://via.placeholder.com/150"} alt={bike.name} className="w-full h-full object-cover" />
                          </div>
                        </td>

                        <td className="p-6">
                          <div className="font-black text-white text-base uppercase tracking-tight">{bike.name}</div>
                          <div className="text-[10px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded inline-block font-black uppercase border border-slate-800 mt-2">
                             {bike.make?.name || bike.brand}
                          </div>
                        </td>
                        
                        <td className="p-6 font-mono text-sm font-black text-green-500">
                          {new Intl.NumberFormat('vi-VN').format(bike.price)} ₫
                        </td>

                        <td className="p-6 text-center">
                          <div className="inline-flex flex-col items-center">
                              {/* HIỂN THỊ CON SỐ 4 CHUẨN XÁC NHẤT */}
                              <div className={`text-xl font-black px-6 py-2 rounded-2xl border shadow-xl ${
                                  currentStock <= 0 ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-slate-950 text-green-400 border-slate-800'
                              }`}>
                                  {currentStock}
                              </div>
                              
                              {/* CHẤM MÀU CHI TIẾT */}
                              <div className="flex justify-center -space-x-1.5 mt-3">
                                  {bike.variants?.map((v, idx) => (
                                      <div key={idx} className="group/v relative">
                                          <div 
                                              className="w-4 h-4 rounded-full border-2 border-slate-900 shadow-lg cursor-help transition-transform hover:scale-125 hover:z-10" 
                                              style={{ backgroundColor: v.color_hex || '#475569' }}
                                              title={`${v.name}: ${v.quantity} xe`}
                                          ></div>
                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/v:block bg-white text-black text-[9px] font-black px-2 py-1 rounded shadow-xl whitespace-nowrap z-50">
                                              {v.name.toUpperCase()}: {v.quantity} XE
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                        </td>
                        
                        <td className="p-6 text-right">
                          <div className="flex justify-end gap-3 opacity-40 group-hover:opacity-100 transition-opacity">
                            <Link to={`/bikes/${bike.id}`} target="_blank" className="p-2.5 bg-slate-950 hover:bg-slate-800 text-slate-400 rounded-xl border border-slate-800">
                               <ArrowUpRight size={18} />
                            </Link>
                            <Link to={`/admin/edit-bike/${bike.id}`} className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/20">
                               <Edit size={18} />
                            </Link>
                            <button onClick={() => handleDelete(bike.id, bike.name)} className="p-2.5 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20">
                               <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminBikeManager