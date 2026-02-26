import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Key, Lock, ArrowRight, CheckCircle, Eye, EyeOff } from 'lucide-react'; // Đã thêm Eye, EyeOff
import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1); // 1: Nhập Email, 2: Nhập OTP & Pass mới
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  
  // --- STATE MẬT KHẨU ---
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false); // Trạng thái ẩn/hiện pass

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // --- GỬI YÊU CẦU LẤY OTP ---
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('http://localhost:8000/api/auth/forgot-password', { email });
      toast.success('Đã gửi mã OTP! Vui lòng kiểm tra email.');
      setStep(2);
    } catch (error) {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // --- XÁC NHẬN & ĐỔI MẬT KHẨU ---
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    // Kiểm tra khớp mật khẩu
    if (newPassword !== confirmPassword) {
        toast.error("Mật khẩu xác nhận không khớp!");
        return;
    }

    setLoading(true);
    try {
      await axios.post('http://localhost:8000/api/auth/reset-password', {
        email,
        otp,
        new_password: newPassword
      });
      toast.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
      navigate('/login');
    } catch (error) {
      const msg = error.response?.data?.detail || 'Đổi mật khẩu thất bại';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
        
        <h2 className="text-3xl font-black text-white text-center mb-2">QUÊN MẬT KHẨU</h2>
        <p className="text-slate-400 text-center mb-8 text-sm">
          {step === 1 ? "Nhập email để nhận mã xác thực" : "Nhập mã OTP và thiết lập mật khẩu mới"}
        </p>

        {/* --- BƯỚC 1: NHẬP EMAIL --- */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <div>
              <label className="block text-slate-300 text-sm font-bold mb-2">Email đăng ký</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-500" size={20} />
                <input 
                  type="email" 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-green-500 transition"
                  placeholder="vidu@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              {loading ? "Đang gửi..." : <>Gửi mã OTP <ArrowRight size={20}/></>}
            </button>
          </form>
        )}

        {/* --- BƯỚC 2: NHẬP OTP & PASS MỚI --- */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-slate-300 text-sm font-bold mb-2">Mã OTP (6 số)</label>
              <div className="relative">
                <Key className="absolute left-3 top-3 text-slate-500" size={20} />
                <input 
                  type="text" 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-green-500 transition tracking-widest font-bold text-center text-lg"
                  placeholder="123456"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Mật khẩu mới */}
            <div>
              <label className="block text-slate-300 text-sm font-bold mb-2">Mật khẩu mới</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-500" size={20} />
                <input 
                  type={showPass ? "text" : "password"} 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-12 text-white focus:outline-none focus:border-green-500 transition"
                  placeholder="Nhập mật khẩu mới..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 text-slate-500 hover:text-white">
                    {showPass ? <EyeOff size={20}/> : <Eye size={20}/>}
                </button>
              </div>
            </div>

            {/* Nhập lại mật khẩu */}
            <div>
              <label className="block text-slate-300 text-sm font-bold mb-2">Xác nhận mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-500" size={20} />
                <input 
                  type={showPass ? "text" : "password"} 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-12 text-white focus:outline-none focus:border-green-500 transition"
                  placeholder="Nhập lại mật khẩu..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              {loading ? "Đang xử lý..." : <>Xác nhận đổi mật khẩu <CheckCircle size={20}/></>}
            </button>
            
            <div className="text-center">
                <button type="button" onClick={() => setStep(1)} className="text-xs text-slate-500 hover:text-white underline">
                    Gửi lại mã / Nhập lại email
                </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center border-t border-slate-700 pt-4">
          <Link to="/login" className="text-green-400 hover:text-green-300 font-bold text-sm">
            Quay lại Đăng nhập
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ForgotPasswordPage;