import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, MapPin, Phone, Mail, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import PromoPopup from '../components/PromoPopup';

// ===== DANH SÁCH ẢNH XE SLIDESHOW =====
const HERO_SLIDES = [
  {
    url: 'https://www.ducativietnam.com/upload/images/SF-V4-03-hero-1600x1000.jpg',
    brand: 'DUCATI',
    model: 'Streetfighter V4',
  },
  {
    url: 'https://images.unsplash.com/photo-1635073908681-b4dfbd6015e8?fm=jpg&q=60&w=3000&auto=format&fit=crop',
    brand: 'BMW',
    model: 'S1000RR',
  },
  {
    url: 'https://4kwallpapers.com/images/wallpapers/honda-cbr1000rr-r-fireblade-sp-2021-5k-3840x2160-2782.jpg',
    brand: 'HONDA',
    model: 'CBR1000RR-R Fireblade SP',
  },
  {
    url: 'https://www.scramblerducati.com/wp-content/uploads/2024/10/Scrambler-Full-Throttle-MY25-pagina-prodotto-single-media-1920x1080-06.jpg',
    brand: 'DUCATI',
    model: 'Scrambler Full Throttle',
  },
  {
    url: 'https://wallpapercave.com/wp/wp1890082.jpg',
    brand: 'KAWASAKI',
    model: 'Ninja H2',
  },
];

function HomePage() {
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  // ===== AUTO SLIDESHOW =====
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);

    const fetchBikes = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/bikes/?size=8');
        setBikes(res.data.items ? res.data.items : res.data);
      } catch (error) {
        console.error("Lỗi tải danh sách xe:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBikes();
  }, []);

  const handleCategoryClick = (category) => {
    navigate(`/bikes?type=${category}`);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);

  // ✅ COMPONENT GIÁ THỰC TẾ - Backend đã tính sẵn, frontend chỉ hiển thị
  const PriceDisplay = ({ bike }) => {
    if (bike.is_flash_sale) {
      return (
        <div>
          <div className="text-[10px] text-red-400 font-bold animate-pulse">⚡ FLASH SALE</div>
          <div className="text-xl font-black text-red-400">{formatPrice(bike.current_price)}</div>
          <div className="text-xs text-gray-500 line-through font-bold">{formatPrice(bike.price)}</div>
        </div>
      );
    }
    if (bike.is_sale_active) {
      return (
        <div>
          <div className="text-xs text-gray-500 line-through font-bold">{formatPrice(bike.price)}</div>
          <div className="text-xl font-black text-red-500">{formatPrice(bike.current_price)}</div>
        </div>
      );
    }
    return <div className="text-xl font-black text-green-400">{formatPrice(bike.current_price)}</div>;
  };

  return (
    <div className="bg-slate-900 min-h-screen text-white">

      <PromoPopup />

      {/* HERO SECTION - SLIDESHOW */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">

        {/* ẢNH SLIDESHOW */}
        {HERO_SLIDES.map((slide, idx) => (
          <div
            key={idx}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
            style={{
              backgroundImage: `url('${slide.url}')`,
              opacity: idx === currentSlide ? 1 : 0,
            }}
          />
        ))}

        {/* OVERLAY */}
        <div className="absolute inset-0 bg-black/60"></div>

        {/* BRAND BADGE */}
        <div className="absolute top-6 right-8 z-20 text-right">
          <div className="text-xs text-gray-400 uppercase tracking-widest">Đang hiển thị</div>
          <div className="text-2xl font-black text-white">{HERO_SLIDES[currentSlide].brand}</div>
          <div className="text-sm text-green-400 font-semibold">{HERO_SLIDES[currentSlide].model}</div>
        </div>

        {/* NỘI DUNG */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-6 drop-shadow-lg">
            CHỌN ĐÚNG XE. <br /> CHƠI ĐÚNG CHẤT.
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-8 font-light">
            Showroom mô tô phân khối lớn & đồ chơi xe uy tín hàng đầu. <br />
            Thông số rõ ràng. Mua nhanh, an tâm.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/bikes" className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-10 rounded-full transition transform hover:scale-105 shadow-lg flex items-center justify-center gap-2 text-lg">
              Mua Xe Ngay <ArrowRight className="w-6 h-6" />
            </Link>
          </div>
        </div>

        {/* NÚT PREV / NEXT */}
        <button
          onClick={prevSlide}
          className="absolute left-4 z-20 w-10 h-10 bg-black/40 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 z-20 w-10 h-10 bg-black/40 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition"
        >
          <ChevronRight size={22} />
        </button>

        {/* DOTS CHỈ SỐ SLIDE */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`rounded-full transition-all duration-300 ${
                idx === currentSlide
                  ? 'w-8 h-2 bg-green-400'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </section>

      {/* SECTION 1: DANH MỤC */}
      <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <span className="w-2 h-8 bg-green-500 rounded"></span> Danh Mục Nổi Bật
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button onClick={() => handleCategoryClick('Sport')} className="bg-slate-800 p-6 rounded-xl hover:bg-slate-700 transition cursor-pointer border border-slate-700 hover:border-green-500 group">
            <h3 className="text-lg font-bold text-center group-hover:text-green-400">Sport / Supersport</h3>
          </button>
          <button onClick={() => handleCategoryClick('Naked')} className="bg-slate-800 p-6 rounded-xl hover:bg-slate-700 transition cursor-pointer border border-slate-700 hover:border-green-500 group">
            <h3 className="text-lg font-bold text-center group-hover:text-green-400">Naked / Street</h3>
          </button>
          <button onClick={() => handleCategoryClick('Adventure')} className="bg-slate-800 p-6 rounded-xl hover:bg-slate-700 transition cursor-pointer border border-slate-700 hover:border-green-500 group">
            <h3 className="text-lg font-bold text-center group-hover:text-green-400">Adventure / Touring</h3>
          </button>
          <button onClick={() => handleCategoryClick('Cruiser')} className="bg-slate-800 p-6 rounded-xl hover:bg-slate-700 transition cursor-pointer border border-slate-700 hover:border-green-500 group">
            <h3 className="text-lg font-bold text-center group-hover:text-green-400">Cruiser / Classic</h3>
          </button>
        </div>
      </section>

      {/* SECTION 2: XE MỚI */}
      <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto bg-slate-900">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <span className="w-2 h-8 bg-blue-500 rounded"></span> Xe Mới Lên Kệ
          </h2>
          <Link to="/bikes" className="text-green-400 hover:text-green-300 font-semibold flex items-center gap-1">
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400 animate-pulse">Đang tải dữ liệu xe...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bikes.map((bike) => (
              <Link to={`/bikes/${bike.id}`} key={bike.id} className="group bg-slate-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition border border-slate-700 hover:border-green-500 flex flex-col relative h-full">
                <div className="relative h-48 overflow-hidden w-full">
                  <img
                    src={bike.image_url || "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop"}
                    alt={bike.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                  />
                  {/* ✅ Badge dùng is_flash_sale & is_sale_active thực tế từ backend */}
                  {bike.is_flash_sale ? (
                    <div className="absolute top-2 left-2 bg-red-600 text-[10px] font-bold px-2 py-1 rounded text-white shadow animate-pulse">⚡ FLASH SALE</div>
                  ) : bike.is_sale_active ? (
                    <div className="absolute top-2 left-2 bg-orange-500 text-[10px] font-bold px-2 py-1 rounded text-white shadow">SALE</div>
                  ) : (
                    <div className="absolute top-2 left-2 bg-blue-600 text-[10px] font-bold px-2 py-1 rounded text-white shadow">NEW</div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <div className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider">{bike.make?.name || bike.brand || 'Motor'}</div>
                  <h3 className="font-bold text-lg mb-2 truncate group-hover:text-green-400 transition">{bike.name}</h3>
                  <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 mb-4 mt-auto uppercase bg-slate-900/50 p-2 rounded">
                    <span>{bike.engine_cc} cc</span>
                    <span>{bike.type}</span>
                  </div>
                  <div className="mt-auto">
                    {/* ✅ Dùng PriceDisplay thay vì tự tính */}
                    <PriceDisplay bike={bike} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 3: ĐĂNG KÝ */}
      {!isLoggedIn && (
        <section className="py-20 bg-gradient-to-r from-slate-900 to-slate-800 border-t border-slate-700">
          <div className="max-w-4xl mx-auto text-center px-4">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-6">THAM GIA CỘNG ĐỒNG MOTO WORLD</h2>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Đăng ký tài khoản ngay để nhận thông báo về xe mới, lưu xe yêu thích và đặt hàng nhanh chóng.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-10 rounded-full text-lg shadow-lg hover:shadow-green-500/50 transition transform hover:-translate-y-1">
                Đăng Ký Ngay
              </Link>
              <Link to="/login" className="bg-transparent border-2 border-slate-500 hover:border-white text-gray-300 hover:text-white font-bold py-4 px-10 rounded-full text-lg transition">
                Đăng Nhập
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 4: LIÊN HỆ */}
      <section className="py-16 bg-slate-900 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700 shadow-2xl backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-white uppercase mb-8 border-b border-slate-700 pb-4 tracking-wider">Thông Tin Liên Hệ</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 rounded-full bg-blue-900/30 flex items-center justify-center flex-shrink-0 text-blue-500 border border-blue-500/20 group-hover:scale-110 transition-transform">
                  <MapPin size={24} />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-bold uppercase mb-1">Trụ sở chính</div>
                  <div className="text-lg font-bold text-white">Khu dân cư 586, Cái Răng, Cần Thơ</div>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 rounded-full bg-green-900/30 flex items-center justify-center flex-shrink-0 text-green-500 border border-green-500/20 group-hover:scale-110 transition-transform">
                  <Phone size={24} />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-bold uppercase mb-1">Hotline 24/7</div>
                  <div className="text-2xl font-black text-green-500 tracking-wider">0969.69.69.69</div>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 rounded-full bg-yellow-900/30 flex items-center justify-center flex-shrink-0 text-yellow-500 border border-yellow-500/20 group-hover:scale-110 transition-transform">
                  <Mail size={24} />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-bold uppercase mb-1">Email Hỗ Trợ</div>
                  <div className="text-lg font-bold text-white">motoworld6699@gmail.com</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black py-10 text-center border-t border-slate-900">
        <h3 className="text-2xl font-black text-white mb-4 tracking-tighter uppercase">MOTO WORLD SHOWROOM</h3>
        <div className="text-gray-500 text-sm space-y-2 font-medium">
          <p className="flex justify-center gap-2 items-center"><Phone size={14} /> Hotline: 0969.69.69.69 • <Mail size={14} /> Email: motoworld6699@gmail.com</p>
          <p className="flex justify-center gap-2 items-center"><Clock size={14} /> Mở cửa: 08:00 – 21:00 (Tất cả các ngày trong tuần)</p>
          <p className="pt-6 opacity-40 text-xs">© 2026 Moto World. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}

export default HomePage;