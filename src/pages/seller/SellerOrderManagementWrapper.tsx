import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SellerOrderManagement from './SellerOrderManagement';
import { logger } from '../../utils/logger';

export const SellerOrderManagementWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { signOut, user, currentAuthUser } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/seller');
    } catch (error) {
      logger.error(error as Error, { context: 'Seller logout error' });
    }
  };

  const handleNavigate = (view: string) => {
    if (view === 'seller-dashboard') navigate('/seller/dashboard');
    if (view === 'seller-products') navigate('/seller/products');
    if (view === 'seller-orders') navigate('/seller/orders');
    if (view === 'seller-wallet') navigate('/seller/wallet');
  };

  const sellerEmail = user?.email || currentAuthUser?.email || '';

  return (
    <SellerOrderManagement
      onLogout={handleLogout}
      sellerEmail={sellerEmail}
      onNavigate={handleNavigate}
    />
  );
};

export default SellerOrderManagementWrapper;
