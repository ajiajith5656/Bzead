import React, { useState, useEffect } from 'react';
import { logger } from '../../utils/logger';
import { useAuth } from '../../contexts/AuthContext';
import { Edit2, Save, X, Upload, Loader2, AlertCircle } from 'lucide-react';
import { fetchSellerProfile, updateSellerProfile } from '../../lib/orderService';

export const SellerProfile: React.FC = () => {
  const { user } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    business_name: '',
    description: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    bank_details: {
      bankName: '',
      accountNumber: '',
      ifscCode: ''
    }
  });

  const [shopLogo, setShopLogo] = useState('https://via.placeholder.com/200');
  const sellerId = (user as any)?.attributes?.sub || user?.id;

  // Fetch seller data on component mount
  useEffect(() => {
    if (sellerId) {
      fetchSellerData();
    }
  }, [sellerId]);

  const fetchSellerData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: seller, error: fetchError } = await fetchSellerProfile(sellerId!);

      if (fetchError) {
        setError('Failed to load seller profile');
      } else if (seller) {
        setFormData({
          business_name: seller.full_name || '',
          description: '',
          email: seller.email || '',
          phone: seller.phone || '',
          website: '',
          address: '',
          bank_details: {
            bankName: '',
            accountNumber: '',
            ifscCode: ''
          }
        });
      }
    } catch (err) {
      console.error('Error fetching seller data:', err);
      setError('Failed to load seller profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setShopLogo(event.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const { data: updatedProfile, error: saveError } = await updateSellerProfile(
        sellerId!,
        {
          full_name: formData.business_name,
          email: formData.email,
          phone: formData.phone,
        }
      );

      if (saveError || !updatedProfile) {
        setError('Failed to save profile');
        alert('Error saving profile. Please try again.');
      } else {
        logger.log('Profile saved successfully', updatedProfile);
        setIsEditing(false);
        alert('Profile updated successfully!');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile');
      alert('Error saving profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-md p-12 flex items-center justify-center gap-4">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading seller profile...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-red-500">
            <div className="flex items-center gap-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-800">{error}</h3>
                <button
                  onClick={fetchSellerData}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Seller Profile</h1>
                  <p className="text-gray-600 mt-2">Manage your shop information and settings</p>
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-blue-600 text-gray-900 px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
                  disabled={saving}
                >
                  {isEditing ? (
                    <>
                      <X className="w-4 h-4" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit2 className="w-4 h-4" />
                      Edit Profile
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Shop Logo Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center gap-8">
                <div>
                  <img
                    src={shopLogo}
                    alt="Shop Logo"
                    className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Shop Logo</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Upload a logo that represents your shop. Recommended size: 512x512px
                  </p>
                  {isEditing && (
                    <label className="inline-block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <span className="inline-flex items-center gap-2 bg-blue-600 text-gray-900 px-4 py-2 rounded-lg hover:bg-blue-700 transition cursor-pointer disabled:opacity-50"
                        style={{ opacity: saving ? 0.5 : 1, pointerEvents: saving ? 'none' : 'auto' }}
                      >
                        <Upload className="w-4 h-4" />
                        Change Logo
                      </span>
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
              {/* Shop Information */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Shop Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                    <input
                      type="text"
                      name="business_name"
                      value={formData.business_name}
                      onChange={handleInputChange}
                      disabled={!isEditing || saving}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shop Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      disabled={!isEditing || saving}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      disabled={!isEditing || saving}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>

              <hr />

              {/* Contact Information */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing || saving}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing || saving}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>

              <hr />

              {/* Address Information */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Address</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={!isEditing || saving}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>

              <hr />

              {/* Bank Information */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Bank Information</h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-blue-800 text-sm">
                    Bank details are encrypted and secure. They are used only for payment settlements.
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      name="bankName"
                      value={formData.bank_details.bankName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        bank_details: { ...prev.bank_details, bankName: e.target.value }
                      }))}
                      disabled={!isEditing || saving}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    <input
                      type="password"
                      name="accountNumber"
                      value={formData.bank_details.accountNumber}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        bank_details: { ...prev.bank_details, accountNumber: e.target.value }
                      }))}
                      disabled={!isEditing || saving}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      name="ifscCode"
                      value={formData.bank_details.ifscCode}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        bank_details: { ...prev.bank_details, ifscCode: e.target.value }
                      }))}
                      disabled={!isEditing || saving}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              {isEditing && (
                <div className="flex gap-4 pt-6 border-t">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-blue-600 text-gray-900 py-3 rounded-lg hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {!saving && <Save className="w-4 h-4" />}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    disabled={saving}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SellerProfile;
