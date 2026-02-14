import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Product } from '../types';
import { supabase } from '../lib/supabase';

interface WishlistContextType {
  items: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  syncToBackend: (userId: string) => Promise<void>;
  loadFromBackend: (userId: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    const savedWishlist = localStorage.getItem('beauzead_wishlist');
    if (savedWishlist) {
      try { setItems(JSON.parse(savedWishlist)); } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('beauzead_wishlist', JSON.stringify(items));
  }, [items]);

  const syncToBackend = async (userId: string) => {
    // Sync local wishlist items to Supabase wishlists table
    for (const product of items) {
      await supabase
        .from('wishlists')
        .upsert(
          { user_id: userId, product_id: product.id },
          { onConflict: 'user_id,product_id' }
        );
    }
  };

  const loadFromBackend = async (userId: string) => {
    // Load wishlist from Supabase wishlists table with product data
    const { data } = await supabase
      .from('wishlists')
      .select('*, products(*)')
      .eq('user_id', userId);

    if (data && data.length > 0) {
      const backendProducts = data
        .map((w: any) => w.products)
        .filter(Boolean) as Product[];
      setItems(backendProducts);
    }
  };

  const addToWishlist = (product: Product) => {
    setItems((prev) => {
      if (!prev.find((item) => item.id === product.id)) return [...prev, product];
      return prev;
    });
  };

  const removeFromWishlist = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const isInWishlist = (productId: string) => items.some((item) => item.id === productId);

  const clearWishlist = () => setItems([]);

  return (
    <WishlistContext.Provider value={{ items, addToWishlist, removeFromWishlist, isInWishlist, clearWishlist, syncToBackend, loadFromBackend }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
};
