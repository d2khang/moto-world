import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Eye, CheckCircle, XCircle, Truck, Calendar, DollarSign, User, Loader2, Package } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast' // 1. Import toast

export default function AdminOrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [expandedOrderId, setExpandedOrderId] = useState(null) // State để mở rộng xem chi tiết

  useEffect(() => {
    // 1. Kiểm tra quyền truy cập (Admin & Staff)
    const userString = localStorage.getItem('user')
    if (!userString) {
        navigate('/login')
        return
    }
    
    const user = JSON.parse(userString)
    const role = (user.role || '').toString().trim().toLowerCase()
    const username = (user.username || '').toString().trim().toLowerCase()
    
    // Cho phép cả Admin và Staff
    const hasPermission = role === 'admin' || role === 'staff' || username === 'admin'

    if (!hasPermission) {
        toast.error("⛔ Bạn không có quyền truy cập trang này!")
        navigate('/')
        return
    }

    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:8000/api/orders/admin/all', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setOrders(res.data)
    } catch (error) {
      console.error("Lỗi tải đơn hàng:", error)
      toast.error("Không thể tải danh sách đơn hàng")
    } finally {
      setLoading(false)
    }
  }

  // Hàm cập nhật trạng thái
  const updateStatus = async (orderId, newStatus) => {
    // Giữ confirm cho an toàn
    if(!window.confirm(`Xác nhận chuyển đơn #${orderId} sang trạng thái: ${newStatus}?`)) return;

    const toastId = toast.loading("Đang cập nhật trạng thái...")
    try {
      const token = localStorage.getItem('token')
      await axios.put(`http://localhost:8000/api/orders/${orderId}/status`, 
        { status: newStatus }, 
        { headers: { Authorization: `Bearer ${token}` }}
      )
      
      // Cập nhật giao diện ngay lập tức
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      toast.success(`Đơn #${orderId} đã chuyển sang: ${newStatus}`, { id: toastId })
      
    } catch (error) {
      const msg = error.response?.data?.detail || error.message
      toast.error(`Lỗi: ${msg}`, { id: toastId })
    }
  }

  const filteredOrders = filterStatus === 'ALL' 
    ? orders 
    : orders.filter(o => o.status === filterStatus)

  const getStatusStyle = (status) => {
    switch(status) {
      case 'PENDING': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'CONFIRMED': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'SHIPPED': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'COMPLETED': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'CANCELLED': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-400';
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-white pb-20 pt-24">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500 uppercase tracking-tighter mb-8 flex items-center gap-2">
           <Truck className="text-blue-500" /> Quản Lý Đơn Hàng
        </h1>

        {/* TAB TRẠNG THÁI */}
        <div className="flex flex-wrap gap-2 mb-6">
            {['ALL', 'PENDING', 'CONFIRMED', 'SHIPPED', 'COMPLETED', 'CANCELLED'].map(status => (
                <button 
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase border transition ${
                        filterStatus === status 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-900/50' 
                        : 'bg-slate-800 border-slate-700 text-gray-400 hover:bg-slate-700 hover:text-white'
                    }`}
                >
                    {status === 'ALL' ? 'Tất cả' : status}
                </button>
            ))}
        </div>

        {/* BẢNG DANH SÁCH */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 text-gray-400 text-xs uppercase tracking-wider border-b border-slate-700">
                  <th className="p-4">Mã Đơn</th>
                  <th className="p-4">Thông tin khách</th>
                  <th className="p-4">Tổng tiền / Ngày</th>
                  <th className="p-4 text-center">Trạng Thái</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {loading ? (
                    <tr><td colSpan="5" className="p-10 text-center"><div className="flex justify-center gap-2 text-gray-500 uppercase font-bold text-xs"><Loader2 className="animate-spin"/> Đang tải dữ liệu...</div></td></tr>
                ) : filteredOrders.length === 0 ? (
                    <tr><td colSpan="5" className="p-8 text-center text-gray-500 italic">Không có đơn hàng nào ở trạng thái này.</td></tr>
                ) : (
                    filteredOrders.map((order) => (
                    <React.Fragment key={order.id}> 
                    <tr className={`hover:bg-slate-700/30 transition group ${expandedOrderId === order.id ? 'bg-slate-700/20' : ''}`}>
                      <td className="p-4 font-mono text-blue-400 font-bold">#{order.id}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 font-bold text-white">
                            <User size={14} className="text-gray-400"/> {order.customer_name}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 ml-6">{order.customer_phone}</div>
                        <div className="text-xs text-gray-500 mt-0.5 ml-6 italic truncate w-48" title={order.customer_address}>{order.customer_address}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-mono text-green-400 font-bold flex items-center gap-1">
                            <DollarSign size={12}/> {new Intl.NumberFormat('vi-VN').format(order.total_amount)} ₫
                        </div>
                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <Calendar size={12}/> {new Date(order.created_at).toLocaleDateString('vi-VN')}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusStyle(order.status)}`}>
                            {order.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            {/* Nút Xem Chi Tiết */}
                            <button 
                                onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)} 
                                className={`p-2 rounded-lg transition border ${expandedOrderId === order.id ? 'bg-slate-600 text-white border-slate-500' : 'bg-slate-700 text-gray-300 border-slate-600 hover:text-white'}`} 
                                title="Xem chi tiết sản phẩm"
                            >
                                <Eye size={16}/>
                            </button>
                            
                            {/* Nút thao tác nhanh dựa trên trạng thái hiện tại */}
                            {order.status === 'PENDING' && (
                                <>
                                    <button onClick={() => updateStatus(order.id, 'CONFIRMED')} className="p-2 bg-blue-600/20 text-blue-500 hover:bg-blue-600 hover:text-white rounded-lg transition" title="Xác nhận"><CheckCircle size={16}/></button>
                                    <button onClick={() => updateStatus(order.id, 'CANCELLED')} className="p-2 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white rounded-lg transition" title="Hủy đơn"><XCircle size={16}/></button>
                                </>
                            )}
                            {order.status === 'CONFIRMED' && (
                                <button onClick={() => updateStatus(order.id, 'SHIPPED')} className="p-2 bg-purple-600/20 text-purple-500 hover:bg-purple-600 hover:text-white rounded-lg transition" title="Giao hàng"><Truck size={16}/></button>
                            )}
                            {order.status === 'SHIPPED' && (
                                <button onClick={() => updateStatus(order.id, 'COMPLETED')} className="p-2 bg-green-600/20 text-green-500 hover:bg-green-600 hover:text-white rounded-lg transition" title="Hoàn tất"><CheckCircle size={16}/></button>
                            )}
                          </div>
                      </td>
                    </tr>
                    
                    {/* HÀNG CHI TIẾT SẢN PHẨM (EXPANDABLE) */}
                    {expandedOrderId === order.id && (
                        <tr className="bg-slate-900/40 animate-in fade-in zoom-in-95 duration-200">
                            <td colSpan="5" className="p-6 border-t border-slate-700/50 shadow-inner">
                                <div className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2"><Package size={14}/> Danh sách sản phẩm trong đơn #{order.id}</div>
                                <div className="flex flex-wrap gap-4">
                                    {/* Kiểm tra nếu có items thì map, không thì báo trống */}
                                    {order.items && order.items.length > 0 ? order.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4 bg-slate-800 p-3 rounded-xl border border-slate-700 w-full sm:w-auto sm:min-w-[320px] shadow-lg">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-600 bg-slate-900 shrink-0">
                                                <img src={item.image_url || 'https://via.placeholder.com/50'} alt="" className="w-full h-full object-cover"/>
                                            </div>
                                            <div className="flex-grow">
                                                <div className="text-white font-bold text-sm line-clamp-1">{item.product_name}</div>
                                                <div className="text-gray-400 text-xs mt-0.5">{item.variant_name || "Tiêu chuẩn"} <span className="text-yellow-500 font-bold ml-1">x{item.quantity}</span></div>
                                            </div>
                                            <div className="text-green-400 font-mono text-sm font-bold ml-auto">
                                                {new Intl.NumberFormat('vi-VN').format(item.price)} ₫
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-gray-500 italic text-sm">Không có thông tin chi tiết sản phẩm.</div>
                                    )}
                                </div>
                                {order.coupon_code && (
                                    <div className="mt-3 text-xs text-pink-400 font-bold italic">
                                        Đã áp dụng mã giảm giá: {order.coupon_code}
                                    </div>
                                )}
                                {order.note && (
                                    <div className="mt-2 text-xs text-gray-400 italic border-l-2 border-gray-600 pl-2">
                                        Ghi chú: {order.note}
                                    </div>
                                )}
                            </td>
                        </tr>
                    )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}