import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Edit, Trash2, Plus, Package, Search, AlertCircle, ArrowDown, ArrowUpRight } from 'lucide-react'
// 1. Import toast
import toast from 'react-hot-toast'

function AdminBikeManager() {
  const [bikes, setBikes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()

  // 1. Lấy danh sách xe
  const fetchBikes = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/bikes/?size=100')
      const bikeData = res.data.items ? res.data.items : res.data
      
      if (Array.isArray(bikeData)) {
        setBikes(bikeData)
      } else {
        setBikes([])
        console.error("Dữ liệu không đúng định dạng:", bikeData)
      }
    } catch (error) {
      console.error("Lỗi tải xe:", error)
      toast.error("Không thể tải danh sách xe. Vui lòng thử lại!")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBikes()
  }, [])

  // 2. Xử lý xóa xe
  const handleDelete = async (id, name) => {
    if (window.confirm(`⚠️ CẢNH BÁO: Bạn có chắc muốn xóa xe "${name}" không? Hành động này không thể hoàn tác!`)) {
      const token = localStorage.getItem('token')
      const toastId = toast.loading("Đang xóa xe...");
      
      try {
        await axios.delete(`http://localhost:8000/api/bikes/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        setBikes(bikes.filter(bike => bike.id !== id))
        toast.success(`Đã xóa xe "${name}" thành công!`, { id: toastId })
        
      } catch (error) {
        console.error(error)
        const msg = error.response?.data?.detail || "Lỗi không xác định"
        toast.error(`Xóa thất bại: ${msg}`, { id: toastId })
      }
    }
  }

  const filteredBikes = bikes.filter(bike => 
    bike.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bike.make?.name || bike.brand || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-white pb-20 pt-24">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
             <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 uppercase tracking-tighter flex items-center gap-2">
                <Package className="text-green-500" /> Quản Lý Kho Xe
             </h1>
             <p className="text-gray-400 text-sm mt-1">Tổng số xe hiện có: <span className="text-white font-bold">{bikes.length}</span></p>
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-3 text-gray-500 w-4 h-4"/>
                <input 
                  type="text" 
                  placeholder="Tìm tên xe, hãng..." 
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:border-green-500 outline-none text-white placeholder-slate-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <Link to="/admin/add-bike" className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg transition whitespace-nowrap active:scale-95">
                <Plus size={18} /> Thêm Xe
             </Link>
          </div>
        </div>

        {/* BẢNG DANH SÁCH */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 text-gray-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-700">
                  <th className="p-4">Hình ảnh</th>
                  <th className="p-4">Tên xe / Hãng</th>
                  <th className="p-4">Giá / Khuyến Mãi</th>
                  <th className="p-4 text-center">Tồn kho</th>
                  <th className="p-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {loading ? (
                   <tr><td colSpan="5" className="p-8 text-center text-gray-500 animate-pulse uppercase font-bold tracking-widest">Đang tải dữ liệu kho...</td></tr>
                ) : filteredBikes.length === 0 ? (
                   <tr><td colSpan="5" className="p-8 text-center text-gray-500 italic">Không tìm thấy xe nào phù hợp.</td></tr>
                ) : (
                  filteredBikes.map((bike) => (
                    <tr key={bike.id} className="hover:bg-slate-700/30 transition group">
                      <td className="p-4">
                        <div className="w-16 h-12 rounded-lg overflow-hidden border border-slate-600 relative bg-slate-900">
                           <img src={bike.image_url || "https://via.placeholder.com/150"} alt={bike.name} className="w-full h-full object-cover" />
                           {bike.discount_price && (
                              <div className="absolute top-0 right-0 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-bl-md shadow-sm">SALE</div>
                           )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-white text-sm group-hover:text-green-400 transition-colors">{bike.name}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{bike.make?.name || bike.brand} • {bike.type}</div>
                      </td>
                      
                      <td className="p-4">
                        {bike.discount_price ? (
                            <div>
                                <div className="text-[10px] text-gray-500 line-through font-bold">
                                    {new Intl.NumberFormat('vi-VN').format(bike.price)} ₫
                                </div>
                                <div className="font-mono text-red-400 font-black text-sm flex items-center gap-1">
                                    <ArrowDown size={12}/> {new Intl.NumberFormat('vi-VN').format(bike.discount_price)} ₫
                                </div>
                            </div>
                        ) : (
                            <div className="font-mono text-green-400 font-bold text-sm">
                                {new Intl.NumberFormat('vi-VN').format(bike.price)} ₫
                            </div>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        {bike.quantity <= 0 ? (
                            <span className="bg-red-500/10 text-red-500 px-2 py-1 rounded text-[10px] font-black border border-red-500/20 uppercase">Hết hàng</span>
                        ) : bike.quantity <= 3 ? (
                            <span className="bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded text-[10px] font-black border border-yellow-500/20 uppercase">Sắp hết ({bike.quantity})</span>
                        ) : (
                            <span className="bg-slate-700 text-white px-3 py-1 rounded text-xs font-bold border border-slate-600">{bike.quantity}</span>
                        )}
                      </td>
                      
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          {/* Nút Xem chi tiết (Mới thêm) */}
                          <Link 
                            to={`/bikes/${bike.id}`}
                            className="p-2 bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white rounded-lg transition"
                            title="Xem trang hiển thị"
                            target="_blank"
                          >
                             <ArrowUpRight size={16} />
                          </Link>

                          <Link 
                            to={`/admin/edit-bike/${bike.id}`}
                            className="p-2 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white rounded-lg transition"
                            title="Sửa thông tin"
                          >
                             <Edit size={16} />
                          </Link>
                          
                          <button 
                            onClick={() => handleDelete(bike.id, bike.name)}
                            className="p-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-lg transition"
                            title="Xóa xe"
                          >
                             <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="mt-6 flex items-start gap-3 bg-blue-900/10 border border-blue-800/30 p-4 rounded-xl text-sm text-blue-200">
           <AlertCircle className="w-5 h-5 flex-shrink-0 text-blue-400 mt-0.5" />
           <p className="opacity-80 leading-relaxed">
             Đây là trang quản trị kho hàng. Tại đây bạn có thể kiểm soát số lượng tồn kho, cập nhật giá bán hoặc gỡ bỏ các sản phẩm. 
             Mọi thay đổi quan trọng sẽ được hệ thống tự động ghi lại vào <Link to="/admin/logs" className="font-bold underline hover:text-white decoration-blue-400 underline-offset-2">Nhật ký hoạt động</Link>.
           </p>
        </div>

      </div>
    </div>
  )
}

export default AdminBikeManager