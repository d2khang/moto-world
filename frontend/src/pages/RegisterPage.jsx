import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Lock, Mail, Phone, ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast'; // 1. Import toast

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    phone_number: ''
  });
  
  // State hiện/ẩn mật khẩu & Loading
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Hàm kiểm tra độ mạnh mật khẩu
  const validatePassword = (password) => {
    const minLength = /.{8,}/;
    const hasLowerCase = /[a-z]/;
    const hasUpperCase = /[A-Z]/;
    const hasNumber = /\d/;

    if (!minLength.test(password)) return "Mật khẩu phải trên 8 ký tự.";
    if (!hasLowerCase.test(password)) return "Thiếu chữ thường (a-z).";
    if (!hasUpperCase.test(password)) return "Thiếu chữ hoa (A-Z).";
    if (!hasNumber.test(password)) return "Thiếu số (0-9).";
    return null;
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // 1. Kiểm tra mật khẩu trước khi gửi
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      toast.error(passwordError); // Hiện lỗi bằng toast
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Đang tạo tài khoản...");

    try {
      await axios.post('http://localhost:8000/api/auth/register', formData);
      
      toast.success('Đăng ký thành công! Hãy đăng nhập ngay.', { id: toastId });
      
      // Chuyển hướng sau 1s
      setTimeout(() => navigate('/login'), 1000);
      
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Đăng ký thất bại';
      toast.error(errorMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-slate-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Đăng Ký</h1>
          <p className="text-gray-400 text-sm mt-2">Tạo tài khoản thành viên Moto World</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-3.5 text-gray-500 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Tên đăng nhập" 
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-12 text-white focus:border-green-500 outline-none transition placeholder-slate-500"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
          </div>

          <div className="relative">
            <ShieldCheck className="absolute left-4 top-3.5 text-gray-500 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Họ và tên" 
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-12 text-white focus:border-green-500 outline-none transition placeholder-slate-500"
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-gray-500 w-5 h-5" />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Mật khẩu" 
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-12 pr-12 text-white focus:border-green-500 outline-none transition placeholder-slate-500"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-3.5 text-gray-500 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <p className="text-[10px] text-gray-500 ml-2 italic">
            *Yêu cầu: Trên 8 ký tự, gồm chữ hoa, thường và số.
          </p>

          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-gray-500 w-5 h-5" />
            <input 
              type="email" 
              placeholder="Email" 
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-12 text-white focus:border-green-500 outline-none transition placeholder-slate-500"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="relative">
            <Phone className="absolute left-4 top-3.5 text-gray-500 w-5 h-5" />
            <input 
              type="tel" 
              placeholder="Số điện thoại" 
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-12 text-white focus:border-green-500 outline-none transition placeholder-slate-500"
              value={formData.phone_number}
              onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition shadow-lg shadow-green-900/20 mt-4 uppercase tracking-wider flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Đăng Ký Ngay'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-green-400 hover:text-green-300 font-bold underline underline-offset-4 transition-colors">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;