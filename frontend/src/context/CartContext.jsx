import { createContext, useState, useEffect, useContext } from 'react'

const CartContext = createContext()

export const useCart = () => useContext(CartContext)

export const CartProvider = ({ children }) => {
  // 1. KHỞI TẠO GIỎ HÀNG TỪ LOCAL STORAGE
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem('cart')
      return savedCart ? JSON.parse(savedCart) : []
    } catch (error) {
      console.error("Lỗi parse giỏ hàng:", error)
      return []
    }
  })

  // 2. TỰ ĐỘNG LƯU VÀO LOCAL STORAGE KHI GIỎ HÀNG THAY ĐỔI
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems))
  }, [cartItems])

  // --- HÀM THÊM VÀO GIỎ (CORE LOGIC) ---
  const addToCart = (product, variant = null) => {
    setCartItems(prev => {
      // Xác định ID của biến thể (nếu không có thì là 'base')
      const variantId = variant?.id || 'base';

      // Tìm xem sản phẩm + biến thể này đã có trong giỏ chưa
      const existingItem = prev.find(item => 
        item.id === product.id && item.variantId === variantId
      )

      // === A. TÍNH TOÁN GIÁ (Quan trọng) ===
      // 1. Giá gốc: Ưu tiên giá biến thể, nếu không có thì lấy giá xe
      const basePrice = Number(variant?.price || product.price);
      
      // 2. Giá sau giảm:
      // Logic: Nếu xe đang giảm giá (current < price), ta tính số tiền giảm được
      // rồi trừ vào giá của biến thể (nếu biến thể đắt hơn giá gốc)
      let finalSalePrice = basePrice;
      const productPrice = Number(product.price);
      const productCurrentPrice = Number(product.current_price || product.price);

      if (productCurrentPrice < productPrice) {
          const discountAmount = productPrice - productCurrentPrice; // VD: Giảm 10tr
          finalSalePrice = basePrice - discountAmount; // Giá biến thể - 10tr
      }

      // === B. XỬ LÝ HÌNH ẢNH (ĐÃ SỬA) ===
      // Yêu cầu: Luôn dùng ảnh đại diện chính của xe (product.image_url)
      // Bỏ qua ảnh của biến thể (variant.image_url)
      const itemImage = product.image_url;

      // === C. CẬP NHẬT STATE ===
      if (existingItem) {
        // Nếu đã có -> Tăng số lượng & Cập nhật giá/ảnh mới nhất
        return prev.map(item => 
          (item.id === product.id && item.variantId === variantId)
            ? { 
                ...item, 
                quantity: item.quantity + 1,
                price: basePrice,           
                current_price: finalSalePrice,
                image: itemImage // Cập nhật lại ảnh đại diện chính
              }
            : item
        )
      }

      // Nếu chưa có -> Thêm mới
      return [...prev, {
        id: product.id,
        name: product.name,
        price: basePrice,             // Giá gốc (để gạch ngang)
        current_price: finalSalePrice,// Giá thực tế phải trả
        image: itemImage,             // Ảnh đại diện chính của xe
        variantId: variantId,
        variantName: variant?.name || 'Tiêu chuẩn',
        quantity: 1,
        is_flash_sale: product.is_flash_sale || false
      }]
    })
  }

  // --- TĂNG SỐ LƯỢNG ---
  const increaseQuantity = (productId, variantId) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === productId && item.variantId === variantId) {
        return { ...item, quantity: item.quantity + 1 }
      }
      return item
    }))
  }

  // --- GIẢM SỐ LƯỢNG ---
  const decreaseQuantity = (productId, variantId) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === productId && item.variantId === variantId) {
        const newQty = item.quantity - 1
        return { ...item, quantity: newQty > 0 ? newQty : 1 }
      }
      return item
    }))
  }

  // --- XÓA KHỎI GIỎ ---
  const removeFromCart = (productId, variantId) => {
    setCartItems(prev => prev.filter(item => !(item.id === productId && item.variantId === variantId)))
  }

  // --- XÓA HẾT ---
  const clearCart = () => {
    setCartItems([])
    localStorage.removeItem('cart')
  }

  // --- TÍNH TỔNG TIỀN (DÙNG CHO NAVBAR HIỂN THỊ NHANH) ---
  const totalAmount = cartItems.reduce((total, item) => {
      // Ưu tiên dùng giá sale nếu có và thấp hơn giá gốc
      const finalPrice = (item.current_price && item.current_price < item.price) 
                          ? item.current_price 
                          : item.price;
      return total + (Number(finalPrice) * item.quantity);
  }, 0)

  return (
    <CartContext.Provider value={{ 
        cartItems, 
        addToCart, 
        increaseQuantity, 
        decreaseQuantity, 
        removeFromCart, 
        clearCart, 
        totalAmount 
    }}>
      {children}
    </CartContext.Provider>
  )
}