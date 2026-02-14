import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Product } from '../types';
import { supabase } from '../lib/supabase';

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
    _billingAddress?: any,
    _paymentMethod: string = 'card'
  ) => {
    try {
      setIsCreatingOrder(true);
      if (items.length === 0) throw new Error('Cart is empty. Cannot create order.');

      const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      const taxAmount = Math.round(subtotal * 0.18);
      const shippingCost = 100;
      const totalAmount = subtotal + taxAmount + shippingCost;

      // TODO: Connect to your backend order API
      // Create order in Supabase
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          order_number: `ORD-${Date.now()}`,
          status: 'pending',
          total_amount: totalAmount,
          shipping_address: shippingAddress,
        })
        .select()
        .single();

      if (orderErr || !order) throw new Error(orderErr?.message || 'Failed to create order');

      // Insert order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
      }));
      await supabase.from('order_items').insert(orderItems);

      clearCart();
      return order;
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
