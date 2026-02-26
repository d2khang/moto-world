import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { 
  ShoppingCart, User, Users, LogOut, ChevronDown, ChevronRight, Bell, 
  Package, ClipboardList, Ticket, Activity, PlusCircle, LayoutDashboard, Megaphone,
  Scale, FileText // Thêm FileText nếu muốn icon khác
} from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useCompare } from '../context/CompareContext' 

const BRANDS = ["Honda", "Yamaha", "Kawasaki", "Suzuki", "Ducati", "BMW Motorrad", "KTM", "Triumph"]

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString('vi-VN')
}

export default function Navbar() {
  const { cartItems } = useCart()
  const { compareList } = useCompare() 
  const navigate = useNavigate()
  
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  })

  const [notifications, setNotifications] = useState([])
  const [showNotif, setShowNotif] = useState(false)
  const notifRef = useRef(null)

  const safeRole = (user?.role || '').toString().trim().toLowerCase()
  const safeUsername = (user?.username || '').toString().trim().toLowerCase()

  const isSuperAdmin = safeRole === 'admin' || safeUsername === 'admin'
  const canAccessAdmin = isSuperAdmin || safeRole === 'staff'

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token') 
      if (!token) return

      const res = await axios.get('http://127.0.0.1:8000/api/notifications/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifications(res.data)
    } catch (err) {
      console.error("Lỗi thông báo:", err)
    }
  }

  const handleReadNotif = async (id) => {
    try {
      const token = localStorage.getItem('token')
      await axios.put(`http://127.0.0.1:8000/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (user) {
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotif(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/login')
  }
  
  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <nav className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 gap-2">

          {/* === 1. LOGO === */}
          <Link to="/" className="group flex items-center gap-2 flex-shrink-0 relative z-20">
            <div className="w-8 h-8 bg-gradient-to-tr from-green-400 to-blue-500 rounded-lg rotate-3 group-hover:rotate-12 transition-transform duration-300"></div>
            <span className="text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 group-hover:to-green-400 transition-all">
              MOTO WORLD
            </span>
          </Link>

          {/* === 2. MENU CHÍNH === */}
          <div className="hidden lg:flex items-center gap-5 xl:gap-8 text-[11px] font-black uppercase tracking-widest text-slate-300 relative z-20">
            <Link to="/" className="hover:text-green-400 transition-colors whitespace-nowrap">Trang Chủ</Link>
            
            <div className="relative group h-20 flex items-center cursor-pointer">
              <Link to="/bikes" className="flex items-center gap-1 group-hover:text-green-400 transition-colors whitespace-nowrap">
                Thương Hiệu <ChevronDown size={14} className="group-hover:rotate-180 transition-transform"/>
              </Link>
              
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                <div className="grid grid-cols-1 gap-1">
                  {BRANDS.map((brand) => (
                    <Link key={brand} to={`/bikes?brand=${brand}`} className="px-4 py-2.5 rounded-xl hover:bg-slate-800 hover:text-green-400 flex justify-between items-center transition-colors">
                      {brand} <ChevronRight size={12} className="opacity-50"/>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link to="/about" className="hover:text-green-400 transition-colors whitespace-nowrap">Về Chúng Tôi</Link>
          </div>

          {/* === 3. KHU VỰC ADMIN === */}
          {canAccessAdmin && (
            <div className="hidden lg:flex items-center gap-1 bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700/50 mx-2 xl:mx-4 flex-shrink-0 relative z-30">
              <AdminLink to="/admin/dashboard" icon={<LayoutDashboard size={16}/>} color="text-blue-400" bg="hover:bg-blue-500/10" tooltip="Thống kê" />
              <AdminLink to="/admin/bikes" icon={<Package size={16}/>} color="text-green-400" bg="hover:bg-green-500/10" tooltip="Kho xe" />
              <AdminLink to="/admin/orders" icon={<ClipboardList size={16}/>} color="text-yellow-400" bg="hover:bg-yellow-500/10" tooltip="Đơn hàng" />
              <AdminLink to="/admin/coupons" icon={<Ticket size={16}/>} color="text-pink-400" bg="hover:bg-pink-500/10" tooltip="Mã giảm giá" />
              <AdminLink to="/admin/promo" icon={<Megaphone size={16}/>} color="text-orange-400" bg="hover:bg-orange-500/10" tooltip="Quản lý Banner" />
              
              {isSuperAdmin && (
                <>
                  <div className="w-px h-6 bg-slate-700 mx-1"></div>
                  <AdminLink to="/admin/users" icon={<Users size={16}/>} color="text-purple-400" bg="hover:bg-purple-500/10" tooltip="Người dùng" />
                  <AdminLink to="/admin/logs" icon={<Activity size={16}/>} color="text-red-400" bg="hover:bg-red-500/10" tooltip="Nhật ký hoạt động" />
                </>
              )}
            </div>
          )}

          {/* === 4. USER ACTIONS === */}
          <div className="flex items-center gap-3 xl:gap-5 flex-shrink-0 relative z-30">
            {canAccessAdmin && (
              <Link to="/admin/add-bike" className="hidden md:flex bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase items-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-orange-500/20 whitespace-nowrap">
                <PlusCircle size={14}/> <span className="mt-0.5">Đăng Xe</span>
              </Link>
            )}

            <div className="flex items-center gap-3 border-r border-slate-800 pr-3 xl:pr-5">
              
              {/* --- NÚT SO SÁNH --- */}
              <Link to="/compare" className="relative p-2 text-slate-400 hover:text-blue-400 transition-colors group" title="So sánh xe">
                <Scale size={20} />
                {compareList.length > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-blue-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border border-slate-900 group-hover:scale-110 transition-transform">
                    {compareList.length}
                  </span>
                )}
              </Link>

              {/* 👇 [MỚI] NÚT LỊCH SỬ ĐƠN HÀNG (ICON) 👇 */}
              {user && (
                <Link to="/my-orders" className="relative p-2 text-slate-400 hover:text-purple-400 transition-colors group" title="Lịch sử đơn hàng">
                  <ClipboardList size={20} />
                </Link>
              )}

              {/* --- CÁI CHUÔNG THÔNG BÁO --- */}
              {user && (
                <div className="relative" ref={notifRef}>
                  <button onClick={() => setShowNotif(!showNotif)} className="relative p-2 text-slate-400 hover:text-yellow-400 transition-colors">
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full animate-bounce border border-slate-900">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* DROPDOWN DANH SÁCH */}
                  {showNotif && (
                    <div className="absolute right-0 mt-4 w-80 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[100]">
                      <div className="p-3 bg-slate-900/50 border-b border-slate-700 flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase text-slate-500">Thông báo ({unreadCount})</span>
                          <button onClick={fetchNotifications} className="text-[10px] text-blue-400 hover:underline">Làm mới</button>
                      </div>

                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length > 0 ? notifications.map((n) => (
                          <div 
                            key={n.id} 
                            onClick={() => handleReadNotif(n.id)}
                            className={`p-3 border-b border-slate-700/50 cursor-pointer transition hover:bg-slate-700 flex flex-col gap-1 ${n.is_read ? 'opacity-50 bg-slate-800' : 'bg-slate-700/20 border-l-4 border-l-green-500'}`}
                          >
                            <div className="flex justify-between items-start">
                                <h4 className={`text-sm font-bold ${n.is_read ? 'text-gray-400' : 'text-green-400'}`}>{n.title}</h4>
                                {!n.is_read && <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-1"></span>}
                            </div>
                            <p className="text-xs text-slate-300 line-clamp-2">{n.message}</p>
                            <span className="text-[9px] text-slate-500 text-right">{formatDate(n.created_at)}</span>
                          </div>
                        )) : (
                          <div className="p-8 text-center text-xs text-slate-500 italic flex flex-col items-center gap-2">
                             <Bell size={24} className="opacity-20"/>
                             Chưa có thông báo nào.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* GIỎ HÀNG: CHỈ HIỆN VỚI KHÁCH HÀNG */}
              {!canAccessAdmin && (
                <Link to="/cart" className="relative p-2 text-slate-400 hover:text-green-400 transition-colors group">
                  <ShoppingCart size={20} />
                  {cartItems.length > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-green-500 text-slate-900 text-[9px] font-black flex items-center justify-center rounded-full group-hover:scale-110 transition-transform">
                      {cartItems.length}
                    </span>
                  )}
                </Link>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-2 xl:gap-3 group relative cursor-pointer">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-white group-hover:text-green-400 transition-colors whitespace-nowrap">{user.username}</div>
                  {/* Tôi đã xóa dòng chữ Lịch sử đơn nhỏ xíu ở đây đi vì đã có Icon ở trên rồi */}
                </div>
                <Link to="/profile" className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden group-hover:border-green-500 transition-colors flex-shrink-0">
                  {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="avt"/> : <div className="w-full h-full flex items-center justify-center text-slate-500"><User size={20}/></div>}
                </Link>
                
                <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-500 transition-colors" title="Đăng xuất">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Link to="/login" className="px-3 xl:px-5 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition-colors whitespace-nowrap">Đăng nhập</Link>
                <Link to="/register" className="px-3 xl:px-5 py-2.5 bg-green-600 rounded-xl text-xs font-bold text-white hover:bg-green-500 transition-all shadow-lg shadow-green-900/20 whitespace-nowrap">Đăng ký</Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  )
}

const AdminLink = ({ to, icon, color, bg, tooltip }) => (
  <Link to={to} className={`p-2.5 rounded-xl transition-all duration-300 group relative ${color} ${bg}`}>
    {icon}
    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-[9px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
      {tooltip} 
    </span>
  </Link>
)