import { createContext, useState, useEffect, useContext } from 'react'

const CartContext = createContext()

export const useCart = () => useContext(CartContext)

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('cart')
    return savedCart ? JSON.parse(savedCart) : []
  })

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems))
  }, [cartItems])

  // --- 1. HÀM THÊM VÀO GIỎ (ĐÃ FIX LOGIC GIÁ KHUYẾN MÃI) ---
  const addToCart = (product, variant = null) => {
    setCartItems(prev => {
      const variantId = variant?.id || 'base';

      const existingItem = prev.find(item => 
        item.id === product.id && item.variantId === variantId
      )

      // === LOGIC TÍNH GIÁ QUAN TRỌNG ===
      
      // 1. Xác định giá gốc của phiên bản (Lấy từ biến thể nếu có, không thì lấy từ xe mẹ)
      const basePrice = variant ? variant.price : product.price;
      
      // 2. Tính toán giá bán thực tế (Sale Price)
      let finalSalePrice = basePrice;

      // Kiểm tra xe mẹ có đang giảm giá không (Backend trả về current_price < price)
      if (product.current_price && product.current_price < product.price) {
          // Tính số tiền mặt được giảm (Ví dụ: 464tr - 454tr = 10tr)
          const cashDiscount = product.price - product.current_price;
          
          // Áp dụng mức giảm tiền mặt này vào giá của biến thể
          finalSalePrice = basePrice - cashDiscount;
      }

      // === LOGIC ẢNH ===
      // Ưu tiên ảnh biến thể, nếu không có dùng ảnh xe mẹ
      let itemImage = product.image_url;
      if (variant && variant.image_url) {
          itemImage = variant.image_url;
      }

      if (existingItem) {
        return prev.map(item => 
          (item.id === product.id && item.variantId === variantId)
            ? { 
                ...item, 
                quantity: item.quantity + 1,
                price: basePrice,           // Cập nhật lại giá gốc mới nhất
                current_price: finalSalePrice // Cập nhật lại giá sale mới nhất
              }
            : item
        )
      }

      return [...prev, {
        id: product.id,
        name: product.name,
        price: basePrice,               // Lưu để hiển thị giá gạch ngang
        current_price: finalSalePrice,  // Lưu giá thực tế người dùng phải trả
        image: itemImage,
        variantId: variantId,
        variantName: variant?.name || (variant?.color_name ? variant.color_name : 'Tiêu chuẩn'),
        quantity: 1,
        is_flash_sale: product.is_flash_sale || false
      }]
    })
  }

  // --- 2. TĂNG SỐ LƯỢNG ---
  const increaseQuantity = (productId, variantId) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === productId && item.variantId === variantId) {
        return { ...item, quantity: item.quantity + 1 }
      }
      return item
    }))
  }

  // --- 3. GIẢM SỐ LƯỢNG ---
  const decreaseQuantity = (productId, variantId) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === productId && item.variantId === variantId) {
        return { ...item, quantity: item.quantity > 1 ? item.quantity - 1 : 1 }
      }
      return item
    }))
  }

  const removeFromCart = (productId, variantId) => {
    setCartItems(prev => prev.filter(item => !(item.id === productId && item.variantId === variantId)))
  }

  const clearCart = () => {
    setCartItems([])
  }

  // --- 4. TÍNH TỔNG TIỀN (DÙNG GIÁ SALE THỰC TẾ) ---
  const totalAmount = cartItems.reduce((total, item) => {
      const finalPrice = item.current_price || item.price;
      return total + (finalPrice * item.quantity);
  }, 0)

  return (
    <CartContext.Provider value={{ cartItems, addToCart, increaseQuantity, decreaseQuantity, removeFromCart, clearCart, totalAmount }}>
      {children}
    </CartContext.Provider>
  )
}