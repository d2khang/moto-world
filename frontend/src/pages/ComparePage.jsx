import React, { useState } from 'react';
import { useCompare } from '../context/CompareContext';
import { Link } from 'react-router-dom';
import { Trash2, Plus, ArrowRight, X, AlertTriangle, Zap, Wrench, Ruler, CheckCircle2 } from 'lucide-react';
import BikeSelectModal from '../components/BikeSelectModal';

const ComparePage = () => {
  const { compareList, removeFromCompare, addToCompare } = useCompare();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper parse JSON
  const getSpecs = (bike) => {
    try { return JSON.parse(bike.description); } catch { return {}; }
  };

  const handleSelectBike = (bike) => {
    addToCompare(bike);
    setIsModalOpen(false);
  }

  // Định nghĩa các nhóm thông số
  const specGroups = [
    {
        title: "Động cơ & Hiệu suất",
        icon: <Zap className="w-5 h-5 text-yellow-400"/>,
        color: "from-yellow-500/20 to-orange-500/5",
        border: "border-yellow-500/30",
        keys: ["Loại động cơ", "Dung tích", "Công suất cực đại", "Mô-men xoắn cực đại", "Hộp số", "Tiêu thụ nhiên liệu"]
    },
    {
        title: "Kết cấu & Phanh",
        icon: <Wrench className="w-5 h-5 text-blue-400"/>,
        color: "from-blue-500/20 to-cyan-500/5",
        border: "border-blue-500/30",
        keys: ["Khung xe", "Hệ thống treo trước", "Hệ thống treo sau", "Phanh trước", "Phanh sau", "Lốp trước", "Lốp sau"]
    },
    {
        title: "Kích thước & Trọng lượng",
        icon: <Ruler className="w-5 h-5 text-red-400"/>,
        color: "from-red-500/20 to-pink-500/5",
        border: "border-red-500/30",
        keys: ["Dài x Rộng x Cao", "Chiều cao yên", "Chiều dài cơ sở", "Khoảng sáng gầm", "Khối lượng ướt", "Dung tích bình xăng"]
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-200 pt-24 pb-20 px-4 relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <BikeSelectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectBike}
        existingIds={compareList.map(b => b.id)}
      />

      <div className="max-w-[1400px] mx-auto">
        {/* Header Title */}
        <div className="text-center mb-10 relative z-10">
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-slate-400 drop-shadow-lg">
                So Sánh Chi Tiết
            </h1>
            <p className="text-slate-400 mt-2 text-sm font-medium">
                Đang chọn <span className="text-blue-400 font-bold">{compareList.length}</span> / 3 mẫu xe
            </p>
        </div>

        {compareList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-slate-800/30 backdrop-blur-sm rounded-3xl border border-dashed border-slate-700 max-w-2xl mx-auto hover:border-blue-500/50 transition-colors group">
                <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                    <AlertTriangle size={32} className="text-slate-500 group-hover:text-blue-400 transition-colors"/>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Chưa có xe nào để so sánh</h2>
                <p className="text-slate-400 mb-8 text-sm">Vui lòng chọn ít nhất 2 xe để thấy sự khác biệt</p>
                <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-blue-600/20 flex items-center gap-2 hover:-translate-y-1 transition-all">
                    <Plus size={20}/> Chọn xe ngay
                </button>
            </div>
        ) : (
            <div className="overflow-x-auto pb-4 custom-scrollbar">
                <table className="w-full min-w-[1000px] border-collapse text-sm">
                    {/* --- TABLE HEAD (Sticky) --- */}
                    <thead className="sticky top-[80px] z-40">
                        <tr>
                            {/* Cột tiêu đề rỗng */}
                            <th className="w-[250px] bg-[#0B1120] p-4 text-left border-b border-slate-800">
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Thông số</div>
                            </th>

                            {/* Cột Xe */}
                            {compareList.map((bike) => (
                                <th key={bike.id} className="w-[300px] p-0 align-top border-b border-slate-800 bg-[#0B1120]/95 backdrop-blur-md relative group transition-colors hover:bg-[#131b2e]">
                                    <div className="p-4 relative">
                                        {/* Nút xóa nổi */}
                                        <button 
                                            onClick={() => removeFromCompare(bike.id)} 
                                            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-slate-900/80 hover:bg-red-500 text-slate-400 hover:text-white rounded-full transition-all shadow-lg backdrop-blur-sm z-50 border border-slate-700 hover:border-red-500"
                                            title="Bỏ xe này"
                                        >
                                            <X size={14}/>
                                        </button>

                                        {/* Ảnh xe */}
                                        <Link to={`/bikes/${bike.id}`} className="block relative">
                                            <div className="h-40 w-full flex items-center justify-center mb-4 overflow-hidden rounded-xl bg-gradient-to-b from-slate-800/50 to-transparent p-2 group-hover:from-blue-900/20 transition-all">
                                                <img 
                                                    src={bike.image_url} 
                                                    alt={bike.name} 
                                                    className="max-h-full max-w-full object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-500"
                                                />
                                            </div>
                                            {/* Tên & Giá */}
                                            <div className="text-center">
                                                <h3 className="font-black text-lg uppercase leading-tight mb-1 text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-1">{bike.name}</h3>
                                                <p className="text-emerald-400 font-mono text-xl font-bold tracking-tight">
                                                    {new Intl.NumberFormat('vi-VN').format(bike.discount_price || bike.price)} ₫
                                                </p>
                                            </div>
                                        </Link>
                                    </div>
                                    {/* Border gradient bottom */}
                                    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </th>
                            ))}

                            {/* Cột Thêm Xe (Nếu còn chỗ) */}
                            {[...Array(3 - compareList.length)].map((_, idx) => (
                                <th key={idx} className="w-[300px] p-4 align-middle bg-[#0B1120]/50 border-b border-slate-800 border-dashed border-l border-l-slate-800/50">
                                    <button 
                                        onClick={() => setIsModalOpen(true)} 
                                        className="w-full h-full min-h-[220px] rounded-2xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center gap-3 text-slate-500 hover:text-blue-400 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
                                    >
                                        <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                                            <Plus size={24}/>
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-widest">Thêm xe so sánh</span>
                                    </button>
                                </th>
                            ))}
                        </tr>
                    </thead>

                    {/* --- TABLE BODY --- */}
                    <tbody>
                        {specGroups.map((group, groupIdx) => (
                            <React.Fragment key={groupIdx}>
                                {/* Tiêu đề nhóm thông số */}
                                <tr className={`bg-gradient-to-r ${group.color}`}>
                                    <td colSpan={4} className={`p-4 border-y ${group.border} backdrop-blur-sm`}>
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-slate-900 rounded-lg border border-slate-700 shadow-sm">
                                                {group.icon}
                                            </div>
                                            <span className="font-black text-white uppercase text-xs tracking-widest">{group.title}</span>
                                        </div>
                                    </td>
                                </tr>

                                {/* Các dòng thông số con */}
                                {group.keys.map((key, rowIdx) => (
                                    <tr key={key} className="group/row hover:bg-slate-800/40 transition-colors border-b border-slate-800/50">
                                        {/* Tên thông số (Sticky trái trên mobile nếu cần, ở đây desktop ok) */}
                                        <td className="p-4 text-slate-400 text-sm font-medium bg-[#0B1120] border-r border-slate-800 group-hover/row:text-white transition-colors w-[250px]">
                                            {key}
                                        </td>

                                        {/* Giá trị của từng xe */}
                                        {compareList.map(bike => {
                                            const specs = getSpecs(bike);
                                            // Tìm giá trị trong engine, chassis hoặc dimensions
                                            const val = specs.engine?.[key] || specs.chassis?.[key] || specs.dimensions?.[key] || "---";
                                            
                                            return (
                                                <td key={bike.id} className="p-4 text-center font-bold text-slate-200 border-r border-slate-800/50 last:border-0 group-hover/row:bg-slate-800/20 transition-colors">
                                                    {val}
                                                </td>
                                            )
                                        })}

                                        {/* Ô trống cho xe chưa thêm */}
                                        {[...Array(3 - compareList.length)].map((_, i) => (
                                            <td key={i} className="p-4 border-r border-slate-800/50 last:border-0"></td>
                                        ))}
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}

                        {/* --- FOOTER ACTIONS --- */}
                        <tr className="bg-[#0B1120]">
                            <td className="p-4 border-t border-slate-800"></td>
                            {compareList.map(bike => (
                                <td key={bike.id} className="p-6 text-center border-t border-slate-800 border-r border-slate-800/50 last:border-0">
                                    <Link 
                                        to={`/bikes/${bike.id}`} 
                                        className="inline-flex items-center justify-center w-full py-3 bg-slate-800 hover:bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-blue-600/30 group"
                                    >
                                        Xem Chi Tiết <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform"/>
                                    </Link>
                                </td>
                            ))}
                            {[...Array(3 - compareList.length)].map((_, i) => <td key={i} className="p-4 border-t border-slate-800 border-r border-slate-800/50 last:border-0"></td>)}
                        </tr>
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
};

export default ComparePage;