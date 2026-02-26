import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, X, Plus, Loader2 } from 'lucide-react';

const BikeSelectModal = ({ isOpen, onClose, onSelect, existingIds }) => {
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Tải danh sách xe khi mở Modal
  useEffect(() => {
    if (isOpen) {
      const fetchBikes = async () => {
        setLoading(true);
        try {
          // Lấy 100 xe để hiển thị
          const res = await axios.get('http://localhost:8000/api/bikes/?size=100');
          const data = res.data.items ? res.data.items : res.data;
          setBikes(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error("Lỗi tải xe:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchBikes();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Lọc xe:
  // 1. Phải khớp từ khóa tìm kiếm
  // 2. KHÔNG được trùng với xe đang so sánh (existingIds)
  const filteredBikes = bikes.filter(bike => 
    bike.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
    !existingIds.includes(bike.id)
  );

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-800 w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800 rounded-t-2xl">
          <h3 className="text-lg font-bold text-white uppercase tracking-wide">Chọn xe để so sánh</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-gray-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-700 bg-slate-900/50">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Tìm tên xe..." 
              className="w-full bg-slate-800 border border-slate-600 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-green-500 outline-none transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500 gap-2">
              <Loader2 className="animate-spin" />
              <span className="text-xs font-bold uppercase">Đang tải danh sách...</span>
            </div>
          ) : filteredBikes.length === 0 ? (
            <div className="text-center py-10 text-gray-500 italic">
              {searchTerm ? 'Không tìm thấy xe nào phù hợp.' : 'Đã hết xe để thêm.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredBikes.map(bike => (
                <div 
                  key={bike.id} 
                  onClick={() => onSelect(bike)}
                  className="flex items-center gap-3 p-2 bg-slate-900/50 border border-slate-700 rounded-xl hover:border-green-500 hover:bg-slate-800 cursor-pointer transition group"
                >
                  <div className="w-16 h-12 bg-slate-800 rounded-lg overflow-hidden shrink-0 border border-slate-600 group-hover:border-green-500/50">
                    <img src={bike.image_url} alt={bike.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate group-hover:text-green-400">{bike.name}</h4>
                    <p className="text-xs text-gray-500 font-mono">{new Intl.NumberFormat('vi-VN').format(bike.price)} ₫</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-gray-500 group-hover:bg-green-600 group-hover:text-white transition">
                    <Plus size={16} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default BikeSelectModal;