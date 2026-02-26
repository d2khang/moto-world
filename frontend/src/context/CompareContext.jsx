import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CompareContext = createContext();

export const useCompare = () => useContext(CompareContext);

export const CompareProvider = ({ children }) => {
  const [compareList, setCompareList] = useState(() => {
    // Lấy dữ liệu cũ từ localStorage khi load trang
    try {
      const saved = localStorage.getItem('compareList');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('compareList', JSON.stringify(compareList));
  }, [compareList]);

  // Thêm xe vào so sánh
  const addToCompare = (bike) => {
    if (compareList.find(item => item.id === bike.id)) {
      toast.error("Xe này đã có trong danh sách so sánh!");
      return;
    }
    if (compareList.length >= 3) {
      toast.error("Chỉ được so sánh tối đa 3 xe. Vui lòng bỏ bớt 1 xe.");
      return;
    }
    
    setCompareList([...compareList, bike]);
    toast.success(`Đã thêm "${bike.name}" vào so sánh!`, { icon: '⚖️' });
  };

  // Xóa xe khỏi so sánh
  const removeFromCompare = (id) => {
    setCompareList(compareList.filter(item => item.id !== id));
    toast.success("Đã xóa xe khỏi so sánh.");
  };

  const clearCompare = () => {
    setCompareList([]);
  };

  return (
    <CompareContext.Provider value={{ compareList, addToCompare, removeFromCompare, clearCompare }}>
      {children}
    </CompareContext.Provider>
  );
};