import { Navigate } from 'react-router-dom'
// 1. Import thư viện
import toast from 'react-hot-toast'

const ProtectedRoute = ({ children, requireAdmin, onlySuperAdmin }) => {
  // Lấy user an toàn, tránh lỗi JSON parse
  let user = null
  try {
    user = JSON.parse(localStorage.getItem('user'))
  } catch (e) {
    user = null
  }

  // --- 1. KIỂM TRA ĐĂNG NHẬP ---
  if (!user) {
    // Không cần toast ở đây vì trang Login sẽ lo việc đó, hoặc user tự hiểu
    return <Navigate to="/login" replace />
  }

  // --- 2. CHUẨN HÓA QUYỀN HẠN ---
  const role = (user.role || '').toString().trim().toLowerCase()
  const username = (user.username || '').toString().trim().toLowerCase()
  
  // Logic: Admin "xịn" là người có role admin HOẶC username là admin (cứu cánh)
  const isActuallyAdmin = role === 'admin' || username === 'admin'
  const isActuallyStaff = role === 'staff'

  // --- 3. LOGIC CHẶN TRUY CẬP (Dùng Toast thay Alert) ---

  // TRƯỜNG HỢP 1: Trang tối mật (Users, Logs) -> Chỉ Super Admin
  if (onlySuperAdmin === true) {
    if (!isActuallyAdmin) {
      // ✅ Thay Alert bằng Toast
      // Thêm 'id' để tránh toast bị hiện chồng chéo nếu component render 2 lần
      toast.error("⛔ Khu vực cấm! Chỉ dành cho Quản trị viên cấp cao.", {
        id: 'super-admin-denied', 
        duration: 3000
      });
      
      // Đuổi về Dashboard nếu là staff, hoặc về trang chủ nếu là khách
      return <Navigate to={isActuallyStaff ? "/admin/dashboard" : "/"} replace />
    }
  }

  // TRƯỜNG HỢP 2: Trang quản lý chung -> Admin hoặc Staff
  if (requireAdmin === true) {
    if (!isActuallyAdmin && !isActuallyStaff) {
      // ✅ Thay Alert bằng Toast
      toast.error("⛔ Bạn không có quyền truy cập trang quản trị!", {
        id: 'admin-denied',
        duration: 3000
      });
      return <Navigate to="/" replace />
    }
  }

  // 4. Nếu hợp lệ -> Cho phép hiển thị trang con
  return children
}

export default ProtectedRoute