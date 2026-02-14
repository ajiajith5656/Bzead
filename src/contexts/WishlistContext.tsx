import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  // Track the current user ID for backend operations
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const savedWishlist = localStorage.getItem('beauzead_wishlist');
    if (savedWishlist) {
      try { setItems(JSON.parse(savedWishlist)); } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('beauzead_wishlist', JSON.stringify(items));
  }, [items]);

  const syncToBackend = useCallback(async (userId: string) => {
    // Sync local wishlist items to Supabase wishlists table
    for (const product of items) {
      await supabase
        .from('wishlists')
        .upsert(
          { user_id: userId, product_id: product.id },
          { onConflict: 'user_id,product_id' }
        );
    }
  }, [items]);

  const loadFromBackend = useCallback(async (userId: string) => {
    currentUserIdRef.current = userId;
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
  }, []);

  const addToWishlist = useCallback((product: Product) => {
    setItems((prev) => {
      if (!prev.find((item) => item.id === product.id)) return [...prev, product];
      return prev;
    });

    // Also persist to backend if user is logged in
    const userId = currentUserIdRef.current;
    if (userId) {
      supabase
        .from('wishlists')
        .upsert(
          { user_id: userId, product_id: product.id },
          { onConflict: 'user_id,product_id' }
        )
        .then(({ error }) => {
          if (error) console.error('Failed to add wishlist item to backend:', error.message);
        });
    }
  }, []);

  const removeFromWishlist = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));

    // Also remove from backend if user is logged in
    const userId = currentUserIdRef.current;
    if (userId) {
      supabase
        .from('wishlists')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId)
        .then(({ error }) => {
          if (error) console.error('Failed to remove wishlist item from backend:', error.message);
        });
    }
  }, []);

  const isInWishlist = useCallback((productId: string) => items.some((item) => item.id === productId), [items]);

  const clearWishlist = useCallback(() => {
    setItems([]);
    // Optionally clear backend too
    const userId = currentUserIdRef.current;
    if (userId) {
      supabase
        .from('wishlists')
        .delete()
        .eq('user_id', userId)
        .then(({ error }) => {
          if (error) console.error('Failed to clear wishlist from backend:', error.message);
        });
    }
  }, []);

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
