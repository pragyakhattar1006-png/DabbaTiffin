import { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [date, setDate] = useState(null);
  const [items, setItems] = useState({ breakfast: null, lunch: null });

  const setItem = (mealType, dailyMenuItem, forDate) => {
    setDate(forDate);
    setItems((prev) => ({ ...prev, [mealType]: dailyMenuItem }));
  };

  const clear = () => {
    setDate(null);
    setItems({ breakfast: null, lunch: null });
  };

  const total = useMemo(
    () => (items.breakfast?.price || 0) + (items.lunch?.price || 0),
    [items]
  );

  const count = (items.breakfast ? 1 : 0) + (items.lunch ? 1 : 0);

  return (
    <CartContext.Provider value={{ date, items, setItem, clear, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
