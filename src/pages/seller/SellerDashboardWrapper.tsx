import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SellerDashboard from './SellerDashboard';
import { logger } from '../../utils/logger';
import { Loader2 } from 'lucide-react';
import { getSellerKYCStatus } from '../../lib/kycService';

export const SellerDashboardWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { signOut, user, currentAuthUser } = useAuth();
  
  const [verificationStatus, setVerificationStatus] = useState<'unverified' | 'pending' | 'verified'>('unverified');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sellerId = (user as any)?.attributes?.sub || user?.id || currentAuthUser?.username;

  // Fetch seller verification status
  useEffect(() => {
    if (sellerId) {
      fetchSellerStatus();
    } else {
      setLoading(false);
    }
  }, [sellerId]);

  const fetchSellerStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const { kycData, error: kycError } = await getSellerKYCStatus(sellerId!);

      if (kycError) {
        // No KYC record yet — default to unverified
        setVerificationStatus('unverified');
      } else if (kycData) {
        const status = kycData.kyc_status || 'unverified';
        // Map 'approved' to 'verified' for dashboard display
        const mapped = status === 'approved' ? 'verified' : status === 'pending' ? 'pending' : 'unverified';
        setVerificationStatus(mapped as 'unverified' | 'pending' | 'verified');
      }
    } catch (err) {
      console.error('Error fetching seller status:', err);
      setError('Failed to load seller information');
      setVerificationStatus('unverified');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      // Redirect to seller landing page after logout
      navigate('/seller');
    } catch (error) {
      logger.error(error as Error, { context: 'Seller logout error' });
    }
  };

  const handleNavigate = (view: string) => {
    if (view === 'seller-dashboard') navigate('/seller/dashboard');
    if (view === 'seller-verify') navigate('/seller/verify');
    if (view === 'seller-product-listing') navigate('/seller/products');
  };

  // Get seller info from auth
  const sellerEmail = user?.email || currentAuthUser?.email || currentAuthUser?.attributes?.email || 'seller@example.com';
  const sellerPhone = user?.phone || currentAuthUser?.attributes?.phone_number || '';
  const sellerFullName = user?.full_name || currentAuthUser?.attributes?.name || 'Seller';
  const sellerCountry = 'India'; // This should come from user profile

  // Show loading state while fetching seller data
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
          <p className="text-gray-500 text-sm">Loading seller dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state if failed to fetch
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={fetchSellerStatus}
            className="text-yellow-500 hover:text-yellow-400 text-sm font-bold underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <SellerDashboard
      onLogout={handleLogout}
      sellerEmail={sellerEmail}
      sellerPhone={sellerPhone}
      sellerFullName={sellerFullName}
      sellerCountry={sellerCountry}
      onNavigate={handleNavigate}
      verificationStatus={verificationStatus}
    />
  );
};
