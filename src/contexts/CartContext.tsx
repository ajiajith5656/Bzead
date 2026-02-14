import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Product } from '../types';
import { createOrder } from '../lib/orderService';

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  createOrderFromCart: (userId: string, shippingAddress: any, billingAddress?: any, paymentMethod?: string) => Promise<any>;
  isCreatingOrder: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem('beauzead_cart');
    if (savedCart) {
      try { setItems(JSON.parse(savedCart)); } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('beauzead_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, quantity: number = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(productId); return; }
    setItems((prev) => prev.map((item) => item.product.id === productId ? { ...item, quantity } : item));
  };

  const clearCart = () => setItems([]);

  const createOrderFromCart = async (
    userId: string,
    shippingAddress: any,
    billingAddress?: any,
    _paymentMethod: string = 'card'
  ) => {
    try {
      setIsCreatingOrder(true);
      if (items.length === 0) throw new Error('Cart is empty. Cannot create order.');

      const totalAmount = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

      // Use centralized orderService for consistent order creation
      const result = await createOrder({
        user_id: userId,
        seller_id: items[0]?.product.seller_id || undefined,
        total_amount: totalAmount,
        currency: items[0]?.product.currency || 'INR',
        shipping_address: shippingAddress,
        billing_address: billingAddress || undefined,
        items: items.map((item) => ({
          product_id: item.product.id,
          product_name: item.product.name,
          product_image: item.product.image_url || '',
          quantity: item.quantity,
          price: item.product.price,
          category: item.product.category || undefined,
        })),
      });

      if (result.error) throw new Error(result.error);

      clearCart();
      return result.data;
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, createOrderFromCart, isCreatingOrder }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) throw new Error('useCart must be used within a CartProvider');
  return context;
};
