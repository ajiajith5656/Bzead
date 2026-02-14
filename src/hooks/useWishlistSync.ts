import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWishlist } from '../contexts/WishlistContext';
import logger from '../utils/logger';

/**
 * Hook to automatically sync wishlist with backend when user logs in
 * Call this hook in a top-level component (e.g., App.tsx)
 */
export const useWishlistSync = () => {
  const { user, currentAuthUser } = useAuth();
  const { loadFromBackend } = useWishlist();

  useEffect(() => {
    const syncWishlist = async () => {
      const userId = user?.id || currentAuthUser?.username;
      
      if (userId) {
        try {
          await loadFromBackend(userId);
          logger.log('Wishlist auto-synced on login', { userId });
        } catch (error) {
          logger.error(error as Error, { context: 'Wishlist auto-sync failed' });
        }
      }
    };

    syncWishlist();
  }, [user?.id, currentAuthUser?.username, loadFromBackend]);
};
