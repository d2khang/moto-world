import React, { useState, useEffect } from 'react'
import axios from 'axios'
// 👇 1. Thêm Trash2 vào import
import { Users, Lock, Unlock, Shield, ShieldOff, Search, UserCheck, Briefcase, Loader2, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function AdminUserManager() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:8000/api/users/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUsers(res.data)
    } catch (error) {
      console.error("Lỗi tải user:", error)
      if (error.response?.status === 403) {
          toast.error("Bạn không có quyền xem danh sách người dùng")
      }
    } finally {
      setLoading(false)
    }
  }

  // --- LOGIC BẢO VỆ NGHIÊM NGẶT (CHỈ SUPER ADMIN) ---
  useEffect(() => {
    const userString = localStorage.getItem('user');
    
    if (!userString) {
      navigate('/login'); 
      return;
    }
    
    const currentUser = JSON.parse(userString);
    const role = (currentUser.role || '').toString().trim().toLowerCase();
    const username = (currentUser.username || '').toString().trim().toLowerCase();

    const isSuperAdmin = role === 'admin' || username === 'admin';

    if (!isSuperAdmin) {
      setUsers([]) 
      toast.error("⛔ CẢNH BÁO: Chỉ Quản trị viên cấp cao mới được vào đây!")
      navigate('/admin/dashboard'); 
      return;
    }

    fetchUsers();
  }, [navigate])

  // 1. Xử lý Khóa/Mở khóa
  const handleToggleStatus = async (user) => {
    const action = user.is_active ? "KHÓA" : "MỞ KHÓA";
    if (!window.confirm(`Bạn có chắc muốn ${action} tài khoản "${user.username}"?`)) return;

    const toastId = toast.loading(`Đang ${action.toLowerCase()} tài khoản...`)
    try {
      const token = localStorage.getItem('token')
      await axios.put(`http://localhost:8000/api/users/${user.id}/status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, is_active: !u.is_active } : u
      ))
      toast.success(`Đã ${action} tài khoản thành công!`, { id: toastId })
    } catch (error) {
      const msg = error.response?.data?.detail || "Không thể thực hiện"
      toast.error(`Lỗi: ${msg}`, { id: toastId })
    }
  }

  // 2. Xử lý Thay đổi Quyền
  const handleChangeRole = async (user) => {
    let newRole = 'user';
    if (user.role === 'user') newRole = 'staff';
    else if (user.role === 'staff') newRole = 'admin';
    else if (user.role === 'admin') newRole = 'user';
    
    const actionText = `ĐỔI QUYỀN từ [${user.role}] sang [${newRole}]`;
    
    if (!window.confirm(`⚠️ CẢNH BÁO: Bạn muốn ${actionText} cho "${user.username}"?`)) return;

    const toastId = toast.loading("Đang cập nhật quyền...")
    try {
      const token = localStorage.getItem('token')
      await axios.put(`http://localhost:8000/api/users/${user.id}/role`, { role: newRole }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole } : u))
      toast.success(`Đã cập nhật quyền thành: ${newRole.toUpperCase()}`, { id: toastId })
    } catch (error) {
      const msg = error.response?.data?.detail || "Không thể thực hiện"
      toast.error(`Lỗi: ${msg}`, { id: toastId })
    }
  }

  // 👇 3. [MỚI] Xử lý XÓA User
  const handleDeleteUser = async (user) => {
    if (user.role === 'admin') {
        toast.error("Không thể xóa tài khoản Admin!");
        return;
    }
    
    if (!window.confirm(`🚨 CẢNH BÁO NGUY HIỂM 🚨\n\nBạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản "${user.username}"?\n\nHành động này không thể hoàn tác!`)) return;

    const toastId = toast.loading("Đang xóa tài khoản...");
    try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:8000/api/users/${user.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // Cập nhật lại danh sách (loại bỏ user vừa xóa)
        setUsers(users.filter(u => u.id !== user.id));
        
        toast.success("Đã xóa tài khoản thành công!", { id: toastId });
    } catch (error) {
        console.error(error);
        const msg = error.response?.data?.detail || "Lỗi khi xóa tài khoản";
        toast.error(msg, { id: toastId });
    }
  }

  // Lọc user
  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-white pt-24 pb-20">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                    <Users className="text-purple-500" /> Quản Lý Người Dùng
                </h1>
                <p className="text-gray-400 text-sm mt-1">Kiểm soát tài khoản khách hàng và nhân viên</p>
            </div>
            
            <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-2.5 text-gray-500 w-4 h-4"/>
                <input 
                    type="text" 
                    placeholder="Tìm theo tên, email..." 
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-purple-500 outline-none text-white placeholder-slate-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        {/* TABLE */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-900/50 text-gray-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-700">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Tài khoản</th>
                  <th className="p-4">Vai trò</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {loading ? (
                  <tr><td colSpan="5" className="p-10 text-center"><div className="flex justify-center gap-2 text-gray-500 font-bold uppercase text-xs"><Loader2 className="animate-spin"/> Đang tải danh sách...</div></td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan="5" className="p-8 text-center text-gray-500 italic">Không tìm thấy người dùng nào.</td></tr>
                ) : (
                  filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-700/30 transition">
                    <td className="p-4 font-mono text-gray-500">#{u.id}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border border-slate-600 shrink-0">
                              {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" alt="avt"/> : <span className="font-bold text-gray-400">{u.username.charAt(0).toUpperCase()}</span>}
                          </div>
                          <div>
                              <div className="font-bold text-white">{u.username}</div>
                              <div className="text-xs text-gray-400">{u.email || "Chưa cập nhật email"}</div>
                          </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {u.role === 'admin' && (
                          <span className="flex items-center gap-1 text-yellow-400 font-bold text-xs bg-yellow-400/10 px-2 py-1 rounded border border-yellow-400/20 w-fit">
                              <Shield size={12}/> Admin
                          </span>
                      )}
                      {u.role === 'staff' && (
                          <span className="flex items-center gap-1 text-blue-400 font-bold text-xs bg-blue-400/10 px-2 py-1 rounded border border-blue-400/20 w-fit">
                              <Briefcase size={12}/> Staff
                          </span>
                      )}
                      {u.role === 'user' && (
                          <span className="text-gray-400 text-xs bg-slate-700 px-2 py-1 rounded w-fit">User</span>
                      )}
                    </td>
                    <td className="p-4">
                      {u.is_active ? (
                          <span className="flex items-center gap-1 text-green-400 font-bold text-xs">
                              <UserCheck size={14}/> Hoạt động
                          </span>
                      ) : (
                          <span className="flex items-center gap-1 text-red-500 font-bold text-xs bg-red-500/10 px-2 py-1 rounded border border-red-500/20 w-fit">
                              <Lock size={14}/> Đã khóa
                          </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                          <button 
                              onClick={() => handleChangeRole(u)}
                              className="p-2 bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white rounded-lg transition"
                              title="Đổi quyền"
                          >
                              {u.role === 'admin' ? <ShieldOff size={16}/> : <Briefcase size={16}/>}
                          </button>

                          <button 
                              onClick={() => handleToggleStatus(u)}
                              className={`p-2 rounded-lg transition ${u.is_active 
                                  ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-white' 
                                  : 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white'}`}
                              title={u.is_active ? "Khóa tài khoản" : "Mở khóa"}
                          >
                              {u.is_active ? <Lock size={16}/> : <Unlock size={16}/>}
                          </button>

                          {/* 👇 4. NÚT XÓA MỚI */}
                          <button 
                              onClick={() => handleDeleteUser(u)}
                              className="p-2 bg-red-600/10 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition"
                              title="Xóa vĩnh viễn"
                          >
                              <Trash2 size={16}/>
                          </button>
                      </div>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}