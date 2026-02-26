import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

function LoginPage() {
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // Lưu ý: Backend đã được sửa để nhận 'username' là tên hoặc email đều được
    const loginData = new URLSearchParams()
    loginData.append('username', formData.username)
    loginData.append('password', formData.password)

    try {
      const response = await axios.post('http://localhost:8000/api/auth/login', loginData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      
      // 👇 LẤY HẾT DỮ LIỆU TỪ BACKEND
      const { access_token, role, username, full_name, email, phone_number, avatar, address } = response.data 
      
      localStorage.setItem('token', access_token)
      
      // 👇 TẠO OBJECT USER ĐẦY ĐỦ ĐỂ LƯU
      let userData = { 
          username, 
          role,
          full_name, 
          fullname: full_name, // Mapping cho chắc ăn
          email,
          phone: phone_number, // Mapping cho chắc ăn
          phone_number,
          avatar,
          address
      }
      
      localStorage.setItem('user', JSON.stringify(userData))

      toast.success(`Chào mừng trở lại, ${full_name || username}!`, {
        duration: 4000,
        icon: '🚀',
      })
      
      setTimeout(() => {
        window.location.href = '/' 
      }, 1000)

    } catch (err) {
      console.error(err)
      const errorMsg = err.response?.data?.detail || 'Đăng nhập thất bại. Vui lòng kiểm tra lại!'
      toast.error(errorMsg, {
        style: { border: '1px solid #ef4444', padding: '16px', color: '#f8fafc' },
        iconTheme: { primary: '#ef4444', secondary: '#fff' },
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-slate-700">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Đăng Nhập</h2>
            <p className="text-slate-500 text-xs font-bold uppercase mt-2 tracking-widest">Hệ thống Moto World</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            {/* 👇 ĐÃ SỬA NHÃN CHO RÕ RÀNG */}
            <label className="block text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest">
                Tài khoản hoặc Email
            </label>
            <input 
                type="text" 
                name="username" 
                required 
                placeholder="Nhập username hoặc email..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/50 transition-all placeholder:text-slate-700" 
                value={formData.username} 
                onChange={handleChange} 
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest">Mật khẩu</label>
                
                {/* Link Quên mật khẩu */}
                <Link 
                  to="/forgot-password" 
                  className="text-[10px] font-bold text-green-500 hover:text-green-400 hover:underline transition-colors uppercase tracking-wider"
                >
                  Quên mật khẩu?
                </Link>
            </div>

            <div className="relative">
                <input 
                    type={showPassword ? "text" : "password"} 
                    name="password" 
                    required 
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 pr-12 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/50 transition-all placeholder:text-slate-700" 
                    value={formData.password} 
                    onChange={handleChange} 
                />
                <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-green-600/20 uppercase tracking-widest flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Đăng Nhập'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-700 text-center">
          <p className="text-sm text-gray-500 font-medium">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-green-400 hover:text-green-300 font-bold transition-colors underline underline-offset-4">Đăng ký ngay</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage