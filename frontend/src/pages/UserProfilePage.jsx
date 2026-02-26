import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, MapPin, Phone, Lock, Save, Camera, ShieldCheck, Eye, EyeOff, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const UserProfilePage = () => {
  // Lấy user từ localStorage
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  });

  // --- STATE ĐỊA CHỈ ---
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [detailAddress, setDetailAddress] = useState('');

  // --- STATE FORM (THÊM EMAIL) ---
  const [formData, setFormData] = useState({
    fullname: user.fullname || user.full_name || '', // Hỗ trợ cả 2 key
    phone: user.phone || user.phone_number || '',
    email: user.email || '', // Thêm trường email
    avatar: user.avatar || 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png'
  });

  // --- STATE MẬT KHẨU ---
  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPass, setShowPass] = useState({
      current: false,
      new: false,
      confirm: false
  });

  const [uploading, setUploading] = useState(false);

  // --- 1. TẢI DỮ LIỆU TỈNH THÀNH ---
  useEffect(() => {
    axios.get('https://esgoo.net/api-tinhthanh/1/0.htm')
      .then(res => {
        if (res.data.error === 0) setProvinces(res.data.data);
      })
      .catch(err => console.error("Lỗi tải tỉnh thành:", err));

    // Fill địa chỉ cũ nếu có
    if (user.address) {
       // Logic đơn giản: Nếu có địa chỉ cũ thì set vào ô chi tiết để user tự sửa
        setDetailAddress(user.address); 
    }
  }, []);

  // Xử lý chọn Tỉnh/Huyện/Xã
  const handleProvinceChange = (e) => {
    const provinceId = e.target.value;
    setSelectedProvince(provinceId);
    setSelectedDistrict('');
    setSelectedWard('');
    setDistricts([]);
    setWards([]);

    if (provinceId) {
        axios.get(`https://esgoo.net/api-tinhthanh/2/${provinceId}.htm`)
        .then(res => {
            if (res.data.error === 0) setDistricts(res.data.data);
        });
    }
  };

  const handleDistrictChange = (e) => {
    const districtId = e.target.value;
    setSelectedDistrict(districtId);
    setSelectedWard('');
    setWards([]);

    if (districtId) {
        axios.get(`https://esgoo.net/api-tinhthanh/3/${districtId}.htm`)
        .then(res => {
            if (res.data.error === 0) setWards(res.data.data);
        });
    }
  };

  // --- 2. XỬ LÝ UPLOAD ẢNH ---
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ được upload file ảnh!');
      return;
    }

    setUploading(true);
    const toastId = toast.loading("Đang tải ảnh lên...");
    const data = new FormData();
    data.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:8000/api/users/upload-avatar', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      const newAvatarUrl = res.data.url; // Giả sử API trả về { url: "..." }
      
      // Cập nhật LocalStorage
      const updatedUser = { ...user, avatar: newAvatarUrl };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setFormData(prev => ({ ...prev, avatar: newAvatarUrl }));
      
      toast.success("Cập nhật ảnh đại diện thành công!", { id: toastId });
      
    } catch (err) {
      console.error(err);
      toast.error("Lỗi upload ảnh", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  // --- 3. XỬ LÝ CẬP NHẬT THÔNG TIN (BAO GỒM EMAIL) ---
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const toastId = toast.loading("Đang lưu thông tin...");

    // Xử lý địa chỉ
    let fullAddress = detailAddress;
    const pName = provinces.find(p => p.id === selectedProvince)?.full_name || '';
    const dName = districts.find(d => d.id === selectedDistrict)?.full_name || '';
    const wName = wards.find(w => w.id === selectedWard)?.full_name || '';

    if (pName && dName && wName) {
        fullAddress = `${detailAddress}, ${wName}, ${dName}, ${pName}`;
    } else if (user.address && !selectedProvince) {
        fullAddress = user.address; // Giữ nguyên nếu không chọn lại
    }

    try {
        const token = localStorage.getItem('token');
        
        // Gọi API cập nhật lên Server
        // Lưu ý: Backend cần có endpoint PUT /api/users/me (hoặc tương tự) nhận { full_name, email, phone_number, address }
        await axios.put('http://localhost:8000/api/users/me', {
            full_name: formData.fullname,
            email: formData.email,
            phone_number: formData.phone,
            address: fullAddress,
            avatar: formData.avatar
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // Cập nhật LocalStorage
        const updatedUser = { 
            ...user, 
            fullname: formData.fullname, // Hoặc full_name tùy backend trả về
            full_name: formData.fullname,
            email: formData.email,
            phone: formData.phone,
            address: fullAddress,
            avatar: formData.avatar
        };

        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        toast.success("Cập nhật hồ sơ thành công!", { id: toastId });

    } catch (err) {
        console.error(err);
        const msg = err.response?.data?.detail || "Lỗi cập nhật thông tin";
        toast.error(msg, { id: toastId });
    }
  };

  // --- 4. XỬ LÝ ĐỔI MẬT KHẨU ---
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }
    
    const toastId = toast.loading("Đang xử lý đổi mật khẩu...");
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:8000/api/users/change-password', {
        current_password: passData.currentPassword,
        new_password: passData.newPassword
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      toast.success("Đổi mật khẩu thành công! Hãy đăng nhập lại.", { id: toastId });
      
      setTimeout(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }, 2000);

    } catch (err) {
      const msg = err.response?.data?.detail || "Không thể đổi mật khẩu";
      toast.error(`Lỗi: ${msg}`, { id: toastId });
    }
  };

  const togglePass = (field) => {
      setShowPass(prev => ({ ...prev, [field]: !prev[field] }));
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white pt-24 pb-12 px-4 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER: Đã bỏ phần VIP */}
        <div className="flex items-center gap-3 mb-8 border-l-4 border-green-500 pl-4">
          <h1 className="text-3xl font-black uppercase tracking-tighter">Hồ Sơ Của Tôi</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CỘT TRÁI: AVATAR & UPLOAD */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center shadow-xl sticky top-24">
              <div className="relative inline-block group">
                <img 
                  src={formData.avatar} 
                  alt="Avatar" 
                  className="w-40 h-40 rounded-full border-4 border-slate-700 object-cover mx-auto mb-4 group-hover:border-green-500 transition-all"
                />
                
                <label htmlFor="avatar-upload" className="absolute bottom-2 right-2 bg-green-500 p-2 rounded-full text-white cursor-pointer hover:bg-green-400 transition shadow-lg hover:scale-110 z-10">
                  {uploading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Camera size={20} />}
                </label>
                <input 
                  id="avatar-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </div>

              <h2 className="text-xl font-bold text-white mt-2">{user.username}</h2>
              {/* Đã xóa dòng "Hội viên Moto World" */}
            </div>
          </div>

          {/* CỘT PHẢI: FORM THÔNG TIN & ĐỔI MẬT KHẨU */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* FORM 1: THÔNG TIN CÁ NHÂN */}
            <form onSubmit={handleUpdateProfile} className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl">
               <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-green-400 border-b border-slate-700 pb-2">
                 <User size={20}/> Thông Tin Cá Nhân
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                 {/* HỌ TÊN */}
                 <div>
                   <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Họ và tên</label>
                   <input 
                     type="text" 
                     value={formData.fullname} 
                     onChange={(e) => setFormData({...formData, fullname: e.target.value})}
                     className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 focus:border-green-500 focus:outline-none text-white font-bold"
                   />
                 </div>

                 {/* SỐ ĐIỆN THOẠI */}
                 <div>
                   <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Số điện thoại</label>
                   <div className="relative">
                        <Phone className="absolute left-3 top-3 text-slate-500" size={18} />
                        <input 
                            type="text" 
                            value={formData.phone} 
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 pl-10 focus:border-green-500 focus:outline-none text-white font-mono"
                        />
                   </div>
                 </div>

                 {/* EMAIL (MỚI) */}
                 <div className="md:col-span-2">
                   <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Địa chỉ Email</label>
                   <div className="relative">
                        <Mail className="absolute left-3 top-3 text-slate-500" size={18} />
                        <input 
                            type="email" 
                            value={formData.email} 
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 pl-10 focus:border-green-500 focus:outline-none text-white"
                        />
                   </div>
                 </div>
                 
                 {/* --- KHU VỰC CHỌN ĐỊA CHỈ VIỆT NAM --- */}
                 <div className="md:col-span-2 space-y-4 pt-2 border-t border-slate-700/50">
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1 flex items-center gap-2"><MapPin size={14}/> Địa chỉ giao xe</label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <select 
                            className="bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-green-500 outline-none text-xs"
                            value={selectedProvince}
                            onChange={handleProvinceChange}
                        >
                            <option value="">-- Tỉnh / Thành phố --</option>
                            {provinces.map(p => (
                                <option key={p.id} value={p.id}>{p.full_name}</option>
                            ))}
                        </select>

                        <select 
                            className="bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-green-500 outline-none disabled:opacity-50 text-xs"
                            value={selectedDistrict}
                            onChange={handleDistrictChange}
                            disabled={!selectedProvince}
                        >
                            <option value="">-- Quận / Huyện --</option>
                            {districts.map(d => (
                                <option key={d.id} value={d.id}>{d.full_name}</option>
                            ))}
                        </select>

                        <select 
                            className="bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-green-500 outline-none disabled:opacity-50 text-xs"
                            value={selectedWard}
                            onChange={(e) => setSelectedWard(e.target.value)}
                            disabled={!selectedDistrict}
                        >
                            <option value="">-- Phường / Xã --</option>
                            {wards.map(w => (
                                <option key={w.id} value={w.id}>{w.full_name}</option>
                            ))}
                        </select>
                    </div>

                    <input 
                      type="text" 
                      value={detailAddress} 
                      onChange={(e) => setDetailAddress(e.target.value)}
                      placeholder="Số nhà, tên đường, ấp..."
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 focus:border-green-500 focus:outline-none text-white"
                    />
                    {user.address && !selectedProvince && (
                        <p className="text-[10px] text-yellow-500 italic">* Hiện tại: {user.address}</p>
                    )}
                 </div>
               </div>
               
               <button type="submit" className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold ml-auto flex items-center gap-2 transition shadow-lg shadow-green-900/20">
                 <Save size={18}/> Lưu Thay Đổi
               </button>
            </form>

            {/* FORM 2: ĐỔI MẬT KHẨU */}
            <form onSubmit={handleChangePassword} className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Lock size={100} /></div>
               <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-red-400 border-b border-slate-700 pb-2">
                 <Lock size={20}/> Bảo Mật Tài Khoản
               </h3>

               <div className="space-y-4 mb-6">
                 <div>
                   <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Mật khẩu hiện tại</label>
                   <div className="relative">
                       <input 
                         type={showPass.current ? "text" : "password"} 
                         value={passData.currentPassword}
                         onChange={(e) => setPassData({...passData, currentPassword: e.target.value})}
                         className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 pr-10 focus:border-red-500 focus:outline-none transition"
                         placeholder="••••••"
                       />
                       <button type="button" onClick={() => togglePass('current')} className="absolute right-3 top-3 text-gray-400 hover:text-white">
                           {showPass.current ? <EyeOff size={18}/> : <Eye size={18}/>}
                       </button>
                   </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Mật khẩu mới</label>
                     <div className="relative">
                         <input 
                           type={showPass.new ? "text" : "password"} 
                           value={passData.newPassword}
                           onChange={(e) => setPassData({...passData, newPassword: e.target.value})}
                           className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 pr-10 focus:border-red-500 focus:outline-none transition"
                           placeholder="••••••"
                         />
                         <button type="button" onClick={() => togglePass('new')} className="absolute right-3 top-3 text-gray-400 hover:text-white">
                             {showPass.new ? <EyeOff size={18}/> : <Eye size={18}/>}
                         </button>
                     </div>
                   </div>

                   <div>
                     <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Xác nhận mật khẩu</label>
                     <div className="relative">
                         <input 
                           type={showPass.confirm ? "text" : "password"} 
                           value={passData.confirmPassword}
                           onChange={(e) => setPassData({...passData, confirmPassword: e.target.value})}
                           className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 pr-10 focus:border-red-500 focus:outline-none transition"
                           placeholder="••••••"
                         />
                         <button type="button" onClick={() => togglePass('confirm')} className="absolute right-3 top-3 text-gray-400 hover:text-white">
                             {showPass.confirm ? <EyeOff size={18}/> : <Eye size={18}/>}
                         </button>
                     </div>
                   </div>
                 </div>
               </div>

               <button type="submit" className="bg-slate-700 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition ml-auto border border-slate-600">
                 <ShieldCheck size={18}/> Cập Nhật Mật Khẩu
               </button>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;