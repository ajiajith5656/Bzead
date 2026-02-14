/**
 * SellerVerificationWrapper — Standalone route wrapper for /seller/verify
 * Fetches seller KYC status and renders the SellerVerificationPage.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getSellerKYCStatus } from '../../lib/kycService';
import { SellerVerificationPage } from './SellerVerificationPage';
import { Loader2 } from 'lucide-react';
import type { Seller } from '../../types';

export const SellerVerificationWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { user, currentAuthUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState<string>('unverified');

  const sellerId = (user as any)?.attributes?.sub || user?.id || currentAuthUser?.username || '';
  const sellerEmail = user?.email || currentAuthUser?.email || '';
  const sellerPhone = user?.phone || currentAuthUser?.attributes?.phone_number || '';
  const sellerFullName = user?.full_name || currentAuthUser?.attributes?.name || 'Seller';

  useEffect(() => {
    if (!sellerId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const { kycData } = await getSellerKYCStatus(sellerId);
        if (kycData?.kyc_status) {
          setKycStatus(kycData.kyc_status);
        }
      } catch {
        // Default to unverified
      } finally {
        setLoading(false);
      }
    })();
  }, [sellerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const seller: Seller = {
    id: sellerId,
    user_id: sellerId,
    shop_name: sellerFullName,
    email: sellerEmail,
    phone: sellerPhone,
    total_listings: 0,
    kyc_status: kycStatus === 'approved' ? 'approved' : kycStatus === 'pending' ? 'pending' : kycStatus === 'rejected' ? 'rejected' : 'pending',
    product_approval_status: 'pending',
    created_at: new Date().toISOString(),
    is_active: true,
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <SellerVerificationPage
        seller={seller}
        onStatusUpdate={(updates) => {
          if (updates.kyc_status) {
            setKycStatus(updates.kyc_status);
          }
        }}
        onCancel={() => navigate('/seller/dashboard')}
      />
    </div>
  );
};

export default SellerVerificationWrapper;
