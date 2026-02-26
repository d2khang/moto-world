import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Activity, Clock, RefreshCw, Calendar, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast' // 1. Import toast

export default function AdminLogsPage() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // State cho bộ lọc ngày
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    // 1. Kiểm tra quyền truy cập (Chỉ Admin mới được xem Log)
    const userString = localStorage.getItem('user')
    if (!userString) { navigate('/login'); return }

    const user = JSON.parse(userString)
    const role = (user.role || '').toString().trim().toLowerCase()
    const username = (user.username || '').toString().trim().toLowerCase()
    
    // Logic: Chỉ Admin hoặc Super Admin được vào
    if (role !== 'admin' && username !== 'admin') {
        toast.error("⛔ Bạn không có quyền truy cập Nhật Ký Hoạt Động!")
        navigate('/admin/dashboard')
        return
    }

    fetchLogs()
  }, [navigate])

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:8000/api/logs/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setLogs(res.data)
    } catch (error) {
      console.error("Lỗi tải log:", error)
      if (error.response?.status === 403) {
          toast.error("Phiên đăng nhập hết hạn hoặc không đủ quyền")
          navigate('/admin/dashboard')
      } else {
          toast.error("Không thể tải nhật ký hoạt động")
      }
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchLogs()
  }

  // --- LOGIC LỌC DỮ LIỆU (Client-side) ---
  const filteredLogs = logs.filter(log => {
    const logDate = new Date(log.timestamp).getTime()
    
    // Lọc ngày bắt đầu (Tính từ 00:00:00)
    if (startDate) {
        const start = new Date(startDate).setHours(0, 0, 0, 0)
        if (logDate < start) return false
    }

    // Lọc ngày kết thúc (Tính đến 23:59:59)
    if (endDate) {
        const end = new Date(endDate).setHours(23, 59, 59, 999)
        if (logDate > end) return false
    }

    return true
  })

  // Hàm chọn màu sắc cho trạng thái
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'success': return 'text-green-500 bg-green-500/10 border-green-500/20'
      case 'warning': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
      case 'error': return 'text-red-500 bg-red-500/10 border-red-500/20'
      default: return 'text-gray-500 bg-gray-500/10'
    }
  }

  // Hàm format nội dung log cho dễ đọc
  const formatLogTarget = (targetStr) => {
    if (!targetStr) return "---";
    
    // Xử lý Coupon
    if (targetStr.includes('COUPON - Details:')) {
        try {
            const jsonPart = targetStr.split('Details:')[1].trim(); 
            const data = JSON.parse(jsonPart);
            return (
                <span className="font-mono text-yellow-400">
                    Mã: <b>{data.code}</b> (Giảm {data.value}%)
                </span>
            );
        } catch (e) { return targetStr; }
    }
    
    // Xử lý Đơn hàng
    if (targetStr.includes('Đơn #')) {
        return <span className="text-blue-400 font-bold">{targetStr}</span>;
    }

    return targetStr;
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-white pb-20 pt-24">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER + BỘ LỌC */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-500 uppercase tracking-tighter flex items-center gap-3">
                <Activity className="text-red-500" /> Nhật Ký Hoạt Động
            </h1>
            <p className="text-gray-400 text-sm mt-1">Theo dõi các tác vụ quan trọng và bảo mật hệ thống</p>
            </div>
            
            {/* THANH CÔNG CỤ (DATE PICKER + REFRESH) */}
            <div className="flex flex-wrap gap-3 w-full md:w-auto bg-slate-800 p-2 rounded-xl border border-slate-700 shadow-lg">
                <div className="flex items-center gap-2 px-2">
                    <Calendar size={16} className="text-gray-400"/>
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-transparent border-none text-sm text-white focus:ring-0 outline-none w-32 cursor-pointer placeholder-gray-500"
                        title="Từ ngày"
                    />
                    <span className="text-gray-600">➜</span>
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-transparent border-none text-sm text-white focus:ring-0 outline-none w-32 cursor-pointer placeholder-gray-500"
                        title="Đến ngày"
                    />
                </div>

                <div className="w-px bg-slate-700 mx-1 hidden md:block"></div>

                <button 
                    onClick={handleRefresh} 
                    disabled={isRefreshing}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ml-auto"
                >
                    <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                    {isRefreshing ? "Đang tải..." : "Làm mới"}
                </button>
            </div>
        </div>

        {/* BẢNG LOG */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                <tr className="bg-slate-900/50 text-gray-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-700">
                    <th className="p-5">Thời gian</th>
                    <th className="p-5">Người thực hiện</th>
                    <th className="p-5">Hành động</th>
                    <th className="p-5">Chi tiết / Đối tượng</th>
                    <th className="p-5 text-center">Trạng thái</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50 text-sm">
                {loading ? (
                    <tr><td colSpan="5" className="p-10 text-center text-gray-500 animate-pulse">Đang tải dữ liệu nhật ký...</td></tr>
                ) : filteredLogs.length === 0 ? (
                    <tr>
                        <td colSpan="5" className="p-10 text-center text-gray-500 flex flex-col items-center gap-2">
                            <AlertTriangle size={32} className="opacity-20"/>
                            {startDate || endDate ? "Không tìm thấy nhật ký trong khoảng thời gian này." : "Chưa có nhật ký hoạt động nào."}
                        </td>
                    </tr>
                ) : (
                    filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-700/30 transition-colors group">
                        <td className="p-5 text-gray-400 font-mono text-xs whitespace-nowrap border-l-2 border-transparent hover:border-blue-500">
                            <div className="flex items-center gap-2">
                                <Clock size={14} className="text-slate-600 group-hover:text-blue-400 transition-colors"/>
                                {new Date(log.timestamp).toLocaleString('vi-VN')}
                            </div>
                        </td>
                        <td className="p-5 font-bold text-blue-400">{log.user}</td>
                        <td className="p-5 font-bold text-white">
                            {log.action === "CREATE_COUPON" ? "Tạo mã giảm giá" : 
                             log.action === "UPDATE_BANNER" ? "Cập nhật Banner" :
                             log.action}
                        </td>
                        <td className="p-5 text-gray-300 text-xs">
                            {formatLogTarget(log.target)}
                        </td>
                        <td className="p-5 text-center">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusColor(log.status)}`}>
                                {log.status}
                            </span>
                        </td>
                    </tr>
                    ))
                )}
                </tbody>
            </table>
            </div>
            
            {/* Footer hiển thị số lượng */}
            <div className="p-4 border-t border-slate-700 text-xs text-gray-500 flex justify-between items-center bg-slate-900/30">
                <span>Dữ liệu được lưu trữ bảo mật.</span>
                <span>Hiển thị <b>{filteredLogs.length}</b> / {logs.length} bản ghi</span>
            </div>
        </div>

      </div>
    </div>
  )
}