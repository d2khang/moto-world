import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Package, Calendar, Clock, CheckCircle, XCircle, ArrowLeft, 
  MapPin, CreditCard, ChevronDown, ChevronUp, Truck, ShoppingBag, Phone 
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const res = await axios.get('http://127.0.0.1:8000/api/orders/my-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data);
    } catch (error) {
      console.error("Lỗi tải đơn hàng:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN') + ' - ' + date.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
  };

  const renderStatus = (status) => {
    const s = status ? status.toLowerCase() : 'pending';
    const styles = {
      completed: { color: 'text-green-400 bg-green-500/10 border-green-500/20', icon: <CheckCircle size={16}/>, label: 'Giao thành công' },
      cancelled: { color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: <XCircle size={16}/>, label: 'Đã hủy' },
      processing: { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: <Truck size={16}/>, label: 'Đang vận chuyển' },
      pending: { color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', icon: <Clock size={16}/>, label: 'Chờ xác nhận' },
    };
    
    const config = styles[s] || styles.pending;

    return (
      <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${config.color} uppercase tracking-wider`}>
        {config.icon} {config.label}
      </span>
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="animate-pulse">Đang tải dữ liệu đơn hàng...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 pt-24 pb-20">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-2 text-sm font-medium">
              <ArrowLeft size={16}/> Quay lại trang chủ
            </button>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <Package className="text-blue-500" size={32} />
              LỊCH SỬ ĐƠN HÀNG
            </h1>
          </div>
          <div className="hidden md:block text-right text-slate-500 text-sm">
            <p>Tổng đơn hàng</p>
            <p className="text-2xl font-bold text-white">{orders.length}</p>
          </div>
        </div>

        {/* LIST ORDERS */}
        {orders.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-slate-800 border-dashed">
            <ShoppingBag size={64} className="mx-auto text-slate-700 mb-6"/>
            <h3 className="text-xl font-bold text-white mb-2">Bạn chưa có đơn hàng nào</h3>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">Hãy khám phá các mẫu xe mới nhất của Moto World và đặt hàng ngay hôm nay.</p>
            <Link to="/bikes" className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/25 transition-all transform hover:-translate-y-1">
              Khám phá ngay
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-600 transition-all duration-300 shadow-lg shadow-black/20">
                
                {/* CARD HEADER */}
                <div 
                  onClick={() => toggleExpand(order.id)}
                  className="p-5 cursor-pointer bg-slate-800/30 hover:bg-slate-800/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black text-white">#{order.id}</span>
                      <span className="text-slate-500 hidden md:inline">|</span>
                      <span className="text-sm text-slate-400 flex items-center gap-1">
                        <Calendar size={14}/> {formatDate(order.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 md:mt-0">
                      {renderStatus(order.status)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 min-w-[200px]">
                    <div className="text-right">
                      <p className="text-xs text-slate-500 font-bold uppercase">Tổng tiền</p>
                      <p className="text-xl font-black text-blue-400">{formatPrice(order.total_price)}</p>
                    </div>
                    <div className={`p-2 rounded-full bg-slate-800 text-slate-400 transition-transform duration-300 ${expandedOrderId === order.id ? 'rotate-180' : ''}`}>
                      <ChevronDown size={20}/>
                    </div>
                  </div>
                </div>

                {/* CARD BODY */}
                {expandedOrderId === order.id && (
                  <div className="p-6 border-t border-slate-800 bg-slate-900/50 animate-in fade-in slide-in-from-top-2 duration-300">
                    
                    {/* Danh sách sản phẩm */}
                    <h4 className="text-sm font-bold text-slate-400 uppercase mb-4 tracking-wider">Sản phẩm đã mua</h4>
                    <div className="space-y-4 mb-6">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-4 p-3 rounded-xl bg-slate-950 border border-slate-800">
                            <div className="w-20 h-20 bg-slate-800 rounded-lg overflow-hidden border border-slate-700 flex-shrink-0">
                              <img 
                                src={item.image_url || "https://via.placeholder.com/150"} 
                                alt={item.product_name} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <h5 className="font-bold text-white text-lg">{item.product_name}</h5>
                              {item.variant_name && <p className="text-sm text-slate-400">Phân loại: {item.variant_name}</p>}
                              <p className="text-sm text-slate-500 mt-1">Số lượng: <span className="text-white font-bold">x{item.quantity}</span></p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-400">{formatPrice(item.price)}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-500 italic text-sm">Không có thông tin chi tiết sản phẩm.</p>
                      )}
                    </div>

                    {/* Thông tin giao nhận */}
                    <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-slate-800/50">
                      <div>
                        <h4 className="flex items-center gap-2 text-sm font-bold text-slate-300 mb-2">
                          <MapPin size={16} className="text-red-500"/> Địa chỉ nhận hàng
                        </h4>
                        <div className="text-sm text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800">
                          <p className="font-bold text-white mb-1">{order.customer_name || "Khách hàng"}</p>
                          <p>{order.customer_phone || "SĐT: Chưa cập nhật"}</p>
                          <p className="mt-1">{order.customer_address || "Địa chỉ: Tại cửa hàng"}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="flex items-center gap-2 text-sm font-bold text-slate-300 mb-2">
                          <CreditCard size={16} className="text-purple-500"/> Thanh toán & Ghi chú
                        </h4>
                        <div className="text-sm text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800">
                          <p className="flex justify-between mb-1">
                            <span>Phương thức:</span> 
                            <span className="font-bold text-white uppercase">{order.payment_method || "Tiền mặt"}</span>
                          </p>
                          <p className="flex justify-between">
                            <span>Ghi chú:</span> 
                            <span className="italic text-slate-500">{order.note || "Không có ghi chú"}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Footer Card - ĐÃ CHỈNH SỬA */}
                    <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end gap-3">
                      <a 
                        href="tel:0969696969"
                        className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold bg-white text-slate-900 hover:bg-blue-500 hover:text-white transition-all shadow-lg hover:shadow-blue-500/30"
                      >
                        <Phone size={18} />
                        Hỗ trợ: 0969.69.69.69
                      </a>
                    </div>

                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;