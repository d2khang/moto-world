import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx'; 
import { 
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, 
  Title, Tooltip, Legend, ArcElement 
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { DollarSign, ShoppingBag, Users, Layers, TrendingUp, FileDown, Filter } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

// Đăng ký các thành phần biểu đồ
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [summary, setSummary] = useState({ revenue: 0, orders: 0, bikes: 0, users: 0 });
  const [revenueData, setRevenueData] = useState({ labels: [], data: [] });
  const [brandData, setBrandData] = useState({ labels: [], data: [] });
  const [topBikes, setTopBikes] = useState([]); 
  const [loading, setLoading] = useState(true);

  // State cho bộ lọc ngày
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // --- EFFECT: KIỂM TRA QUYỀN & TẢI DỮ LIỆU ---
  useEffect(() => {
    // 1. Lấy thông tin user
    const userString = localStorage.getItem('user');
    if (!userString) {
      navigate('/login');
      return;
    }

    const user = JSON.parse(userString);
    const role = (user.role || '').toString().trim().toLowerCase();
    const username = (user.username || '').toString().trim().toLowerCase();

    // 2. LOGIC QUAN TRỌNG: Cho phép cả ADMIN và STAFF truy cập
    const hasPermission = role === 'admin' || role === 'staff' || username === 'admin';

    if (!hasPermission) {
      toast.error("Bạn không có quyền truy cập trang này!");
      navigate('/'); // Đá về trang chủ nếu là khách
      return;
    }

    fetchData();
  }, [navigate]);

  // --- HÀM TẢI DỮ LIỆU TỪ API ---
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Tạo query params cho lọc ngày
      const dateParams = startDate && endDate ? `?start_date=${startDate}&end_date=${endDate}` : '';

      // Gọi 4 API đồng thời để tối ưu tốc độ
      const [resSummary, resRevenue, resBrand, resTop] = await Promise.all([
        axios.get(`http://localhost:8000/api/stats/summary${dateParams}`, { headers }),
        axios.get('http://localhost:8000/api/stats/revenue-chart', { headers }),
        axios.get('http://localhost:8000/api/stats/brand-chart', { headers }),
        axios.get('http://localhost:8000/api/stats/top-bikes', { headers })
      ]);

      if (resSummary.data) setSummary(resSummary.data);
      if (resRevenue.data) setRevenueData(resRevenue.data);
      if (resBrand.data) setBrandData(resBrand.data);
      if (resTop.data) setTopBikes(resTop.data); 
      
      setLoading(false);
    } catch (error) {
      console.error("Lỗi tải thống kê:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn("Backend chặn quyền (403/401)");
      }
      setLoading(false);
    }
  };

  // --- HÀM XUẤT EXCEL ---
  const exportToExcel = () => {
    // Sheet 1: Tổng quan
    const dataSummary = [
      { "Hạng mục": "Tổng doanh thu", "Giá trị": summary.revenue, "Đơn vị": "VNĐ" },
      { "Hạng mục": "Số lượng đơn hàng", "Giá trị": summary.orders, "Đơn vị": "Đơn" },
      { "Hạng mục": "Tổng xe trong kho", "Giá trị": summary.bikes, "Đơn vị": "Chiếc" },
      { "Hạng mục": "Tổng thành viên", "Giá trị": summary.users, "Đơn vị": "Người" },
      { "Hạng mục": "Thời gian lọc", "Giá trị": startDate && endDate ? `${startDate} đến ${endDate}` : "Tất cả", "Đơn vị": "" }
    ];

    // Sheet 2: Top xe bán chạy
    const dataTopBikes = topBikes.map(bike => ({
        "Tên xe": bike.name,
        "Số lượng bán": bike.sold,
        "Doanh thu": bike.revenue
    }));

    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(dataSummary);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Tong_Quan");
    
    const wsTopBikes = XLSX.utils.json_to_sheet(dataTopBikes);
    XLSX.utils.book_append_sheet(wb, wsTopBikes, "Top_Xe_Ban_Chay");
    
    XLSX.writeFile(wb, `Bao_Cao_MotoWorld_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // --- CẤU HÌNH BIỂU ĐỒ ---
  const barChartData = {
    labels: (revenueData.labels && revenueData.labels.length > 0) ? revenueData.labels : ['Đang cập nhật'],
    datasets: [
      {
        label: 'Doanh Thu (VNĐ)',
        data: (revenueData.data && revenueData.data.length > 0) ? revenueData.data : [0],
        backgroundColor: 'rgba(34, 197, 94, 0.8)', // Màu xanh lá
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const doughnutChartData = {
    labels: (brandData.labels && brandData.labels.length > 0) ? brandData.labels : ['Trống'],
    datasets: [
      {
        data: (brandData.data && brandData.data.length > 0) ? brandData.data : [1],
        backgroundColor: ['#ef4444', '#3b82f6', '#eab308', '#06b6d4', '#8b5cf6', '#f97316'],
        borderWidth: 0,
      },
    ],
  };

  // --- MÀN HÌNH LOADING ---
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-white font-bold animate-pulse uppercase tracking-widest text-xs">Đang tải dữ liệu thống kê...</p>
      </div>
    );
  }

  // --- GIAO DIỆN CHÍNH ---
  return (
    <div className="min-h-screen bg-slate-900 text-white pt-24 pb-12 px-6 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 border-b border-slate-700 pb-4 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
              Thống Kê Hệ Thống
            </h1>
            <p className="text-gray-400 text-sm mt-1">Dữ liệu phân tích doanh thu và kho bãi</p>
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
             <button onClick={exportToExcel} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-lg shadow-blue-900/20 active:scale-95 whitespace-nowrap">
                <FileDown size={18} /> Xuất Báo Cáo
             </button>
             <Link to="/admin/orders" className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-bold border border-slate-600 transition flex items-center gap-2 whitespace-nowrap hover:border-slate-500">
                Quản Lý Đơn Hàng
             </Link>
          </div>
        </div>

        {/* BỘ LỌC NGÀY THÁNG */}
        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 mb-8 flex flex-wrap items-center gap-4 shadow-xl">
            <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-700">
               <span className="text-[10px] font-black uppercase text-gray-500">Từ ngày:</span>
               <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-sm focus:outline-none text-white w-32 cursor-pointer" />
            </div>
            <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-700">
               <span className="text-[10px] font-black uppercase text-gray-500">Đến ngày:</span>
               <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-sm focus:outline-none text-white w-32 cursor-pointer" />
            </div>
            <button 
                onClick={() => { setLoading(true); fetchData(); }} 
                className="bg-green-600 hover:bg-green-500 text-white px-5 py-2 rounded-lg text-xs font-black uppercase flex items-center gap-2 transition shadow-lg shadow-green-900/20 active:scale-95 ml-auto md:ml-0"
            >
               <Filter size={14} /> Lọc Dữ Liệu
            </button>
        </div>

        {/* STAT CARDS (Thẻ thống kê) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard title="Tổng Doanh Thu" value={(summary.revenue || 0).toLocaleString('vi-VN') + ' đ'} icon={<DollarSign size={24} className="text-green-500"/>} color="border-green-500/30 hover:border-green-500" />
          <StatCard title="Số Đơn Hàng" value={summary.orders || 0} icon={<ShoppingBag size={24} className="text-blue-500"/>} color="border-blue-500/30 hover:border-blue-500" />
          <StatCard title="Tồn Kho Xe" value={summary.bikes || 0} icon={<Layers size={24} className="text-purple-500"/>} color="border-purple-500/30 hover:border-purple-500" />
          <StatCard title="Thành Viên VIP" value={summary.users || 0} icon={<Users size={24} className="text-yellow-500"/>} color="border-yellow-500/30 hover:border-yellow-500" />
        </div>

        {/* BIỂU ĐỒ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Cột trái: Biểu đồ doanh thu */}
          <div className="lg:col-span-2 bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl relative overflow-hidden">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 z-10 relative">
                <TrendingUp className="text-green-500" size={20}/> Biểu Đồ Doanh Thu
            </h3>
            <div className="h-80 w-full relative z-10">
                <Bar 
                    data={barChartData} 
                    options={{ 
                        maintainAspectRatio: false, 
                        responsive: true,
                        plugins: {
                            legend: { display: false },
                            tooltip: { 
                                backgroundColor: '#1e293b', 
                                titleColor: '#fff', 
                                bodyColor: '#cbd5e1',
                                borderColor: '#334155',
                                borderWidth: 1,
                                padding: 10,
                                cornerRadius: 8
                            }
                        },
                        scales: {
                            y: { 
                                beginAtZero: true, 
                                grid: { color: '#334155', borderDash: [5, 5] },
                                ticks: { color: '#94a3b8', font: { size: 10 } }
                            },
                            x: { 
                                grid: { display: false },
                                ticks: { color: '#e2e8f0', font: { weight: 'bold' } }
                            }
                        }
                    }} 
                />
            </div>
          </div>

          {/* Cột phải: Biểu đồ thương hiệu */}
          <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl flex flex-col">
            <h3 className="text-lg font-bold mb-6 text-center">Tỉ Lệ Thương Hiệu</h3>
            <div className="h-64 flex justify-center items-center relative">
                <Doughnut 
                    data={doughnutChartData} 
                    options={{ 
                        maintainAspectRatio: false,
                        cutout: '65%',
                        plugins: {
                            legend: { 
                                position: 'bottom', 
                                labels: { color: '#cbd5e1', font: { size: 11 }, boxWidth: 10, padding: 15 } 
                            }
                        }
                    }} 
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black text-white">{summary.bikes}</span>
                    <span className="text-[10px] uppercase text-gray-500 font-bold">Tổng xe</span>
                </div>
            </div>
          </div>
        </div>

        {/* BẢNG TOP SẢN PHẨM */}
        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl overflow-hidden">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold flex items-center gap-2 text-yellow-500">
                <Layers size={20}/> Top 5 Mẫu Xe Bán Chạy Nhất
             </h3>
             <span className="text-xs text-gray-500 italic bg-slate-900 px-3 py-1 rounded-full border border-slate-700">Dữ liệu thời gian thực</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700 text-[10px] uppercase text-gray-500 font-black tracking-wider">
                  <th className="py-4 px-4 text-left">#</th>
                  <th className="py-4 px-4">Tên Mẫu Xe</th>
                  <th className="py-4 px-4 text-center">Đã Bán</th>
                  <th className="py-4 px-4 text-right">Doanh Thu Đóng Góp</th>
                  <th className="py-4 px-4 text-center">Hiệu Suất</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {topBikes.length > 0 ? topBikes.map((bike, idx) => (
                  <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition group">
                    <td className="py-4 px-4 text-gray-500 font-mono">0{idx + 1}</td>
                    <td className="py-4 px-4 font-bold text-white group-hover:text-green-400 transition-colors">{bike.name}</td>
                    <td className="py-4 px-4 text-center">
                        <span className="bg-blue-900/30 text-blue-400 px-3 py-1 rounded-full font-bold text-xs border border-blue-500/20">
                            {bike.sold} chiếc
                        </span>
                    </td>
                    <td className="py-4 px-4 text-right text-white font-mono font-bold tracking-tight">
                        {(bike.revenue || 0).toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-4 px-4">
                        <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full" 
                                style={{ width: `${Math.min((bike.revenue / (topBikes[0]?.revenue || 1)) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" className="py-8 text-center text-gray-500 italic text-sm">Chưa có dữ liệu bán hàng...</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component con: Thẻ thống kê
const StatCard = ({ title, value, icon, color }) => (
  <div className={`bg-slate-800 p-6 rounded-2xl border ${color} shadow-lg hover:transform hover:-translate-y-1 transition duration-300`}>
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{title}</p>
        <h3 className="text-2xl font-black mt-1 text-white">{value}</h3>
      </div>
      <div className="p-3 bg-slate-900 rounded-xl border border-slate-700">{icon}</div>
    </div>
  </div>
);

export default AdminDashboardPage;