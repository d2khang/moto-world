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

  // Thêm vào giỏ (Dùng ở trang chi tiết)
  const addToCart = (product, variant = null) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => 
        item.id === product.id && item.variantId === (variant?.id || 'base')
      )
      if (existingItem) {
        return prev.map(item => 
          (item.id === product.id && item.variantId === (variant?.id || 'base'))
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: variant ? variant.price : product.price,
        image: variant ? variant.image_url : product.image_url,
        variantId: variant?.id || 'base',
        variantName: variant?.name || 'Tiêu chuẩn',
        quantity: 1
      }]
    })
  }

  // Tăng số lượng (Dùng cho dấu + ở giỏ hàng) -> SỬA LỖI BUG
  const increaseQuantity = (productId, variantId) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === productId && item.variantId === variantId) {
        return { ...item, quantity: item.quantity + 1 }
      }
      return item
    }))
  }

  // Giảm số lượng
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

  const totalAmount = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)

  return (
    <CartContext.Provider value={{ cartItems, addToCart, increaseQuantity, decreaseQuantity, removeFromCart, clearCart, totalAmount }}>
      {children}
    </CartContext.Provider>
  )
}