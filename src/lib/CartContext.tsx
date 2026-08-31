import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface CartItem {
  productId: string;
  productName: string;
  productVariantId: string | null;
  variantLabel: string | null;
  unitPrice: number;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  updateQuantity: (productId: string, productVariantId: string | null, qty: number) => void;
  removeItem: (productId: string, productVariantId: string | null) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue>({
  items: [],
  addItem: () => {},
  updateQuantity: () => {},
  removeItem: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalPrice: 0,
});

const CART_KEY = "mrpork_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_KEY);
      return stored ? (JSON.parse(stored) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (newItem: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const idx = prev.findIndex(
        (it) => it.productId === newItem.productId && it.productVariantId === newItem.productVariantId
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, productVariantId: string | null, qty: number) => {
    if (qty <= 0) {
      setItems((prev) =>
        prev.filter((it) => !(it.productId === productId && it.productVariantId === productVariantId))
      );
      return;
    }
    setItems((prev) =>
      prev.map((it) =>
        it.productId === productId && it.productVariantId === productVariantId
          ? { ...it, quantity: qty }
          : it
      )
    );
  };

  const removeItem = (productId: string, productVariantId: string | null) => {
    setItems((prev) =>
      prev.filter((it) => !(it.productId === productId && it.productVariantId === productVariantId))
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, it) => sum + it.quantity, 0);
  const totalPrice = items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, updateQuantity, removeItem, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
