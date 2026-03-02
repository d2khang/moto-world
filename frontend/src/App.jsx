import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute' 
import { CartProvider } from './context/CartContext'
import { CompareProvider } from './context/CompareContext'
import { Toaster } from 'react-hot-toast'
import AIChatBot from './components/AIChatBot'

// --- CÁC TRANG ---
import HomePage from './pages/HomePage'
import BikeDetailPage from './pages/BikeDetailPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CartPage from './pages/CartPage' 
import BikeListPage from './pages/BikeListPage'
import GioiThieuPage from './pages/GioiThieuPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import WarrantyPage from './pages/WarrantyPage'
import InstallmentPage from './pages/InstallmentPage'
import RecruitmentPage from './pages/RecruitmentPage'
import UserProfilePage from './pages/UserProfilePage' 
import PaymentResultPage from './pages/PaymentResultPage';
import ComparePage from './pages/ComparePage'
import OrderHistory from './pages/OrderHistory';
import PaymentMethodsPage from './pages/PaymentMethodsPage'; // <--- MỚI THÊM

// --- ADMIN ---
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminUserManager from './pages/AdminUserManager';
import AdminBikeManager from './pages/AdminBikeManager'
import AdminOrdersPage from './pages/AdminOrdersPage'
import AddBikePage from './pages/AddBikePage'
import EditBikePage from './pages/EditBikePage'
import AdminCouponPage from './pages/AdminCouponPage'
import AdminPromoManager from './pages/AdminPromoManager' 
import AdminLogsPage from './pages/AdminLogsPage'

function App() {
  return (
    <CartProvider>
      <CompareProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-slate-900 flex flex-col relative">
            <Toaster position="top-right" reverseOrder={false} />
            <Navbar />
            <div className="flex-grow">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/bikes" element={<BikeListPage />} />
                <Route path="/bikes/:id" element={<BikeDetailPage />} />
                <Route path="/about" element={<GioiThieuPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/compare" element={<ComparePage />} />
                <Route path="/warranty" element={<WarrantyPage />} />
                <Route path="/installment" element={<InstallmentPage />} />
                <Route path="/recruitment" element={<RecruitmentPage />} />
                <Route path="/payment-methods" element={<PaymentMethodsPage />} /> {/* <--- ROUTE MỚI */}
                
                <Route path="/my-orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />

                <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
                <Route path="/payment-result" element={<PaymentResultPage />} />

                {/* Khu vực Admin */}
                <Route path="/admin/users" element={<ProtectedRoute onlySuperAdmin={true}><AdminUserManager /></ProtectedRoute>} />
                <Route path="/admin/logs" element={<ProtectedRoute onlySuperAdmin={true}><AdminLogsPage /></ProtectedRoute>} />
                <Route path="/admin/dashboard" element={<ProtectedRoute requireAdmin={true}><AdminDashboardPage /></ProtectedRoute>} />
                <Route path="/admin/bikes" element={<ProtectedRoute requireAdmin={true}><AdminBikeManager /></ProtectedRoute>} />
                <Route path="/admin/orders" element={<ProtectedRoute requireAdmin={true}><AdminOrdersPage /></ProtectedRoute>} />
                <Route path="/admin/coupons" element={<ProtectedRoute requireAdmin={true}><AdminCouponPage /></ProtectedRoute>} />
                <Route path="/admin/promo" element={<ProtectedRoute requireAdmin={true}><AdminPromoManager /></ProtectedRoute>} />
                <Route path="/admin/add-bike" element={<ProtectedRoute requireAdmin={true}><AddBikePage /></ProtectedRoute>} />
                <Route path="/add-bike" element={<ProtectedRoute requireAdmin={true}><AddBikePage /></ProtectedRoute>} />
                <Route path="/admin/edit-bike/:id" element={<ProtectedRoute requireAdmin={true}><EditBikePage /></ProtectedRoute>} />
                <Route path="/bikes/:id/edit" element={<ProtectedRoute requireAdmin={true}><EditBikePage /></ProtectedRoute>} />
              </Routes>
            </div>
            <Footer />
            <AIChatBot />
          </div>
        </BrowserRouter>
      </CompareProvider>
    </CartProvider>
  )
}

export default App