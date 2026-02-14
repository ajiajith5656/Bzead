import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SellerProductListing from './SellerProductListing';
import { logger } from '../../utils/logger';

export const SellerProductListingWrapper: React.FC = () => {
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
    if (view === 'seller-verify') navigate('/seller/verify');
    if (view === 'seller-product-listing' || view === 'seller-products') navigate('/seller/products');
    if (view === 'seller-orders') navigate('/seller/orders');
    if (view === 'seller-wallet') navigate('/seller/wallet');
  };

  const sellerEmail = user?.email || currentAuthUser?.email || '';

  return (
    <SellerProductListing
      onLogout={handleLogout}
      sellerEmail={sellerEmail}
      onNavigate={handleNavigate}
    />
  );
};

export default SellerProductListingWrapper;
