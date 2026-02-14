import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { MobileNav } from '../../components/layout/MobileNav';
import AddressForm from '../../components/AddressForm';
import type { Address } from '../../components/AddressForm';
import { MapPin, Edit2, Trash2, Plus, ArrowLeft, Home, Briefcase, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import logger from '../../utils/logger';
import {
  getUserAddresses,
  createUserAddress,
  updateUserAddress,
  deleteUserAddress as deleteAddressApi,
} from '../../lib/adminService';

const UserAddressManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user, currentAuthUser } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const editingAddress = editingId ? addresses.find((a) => a.id === editingId) : undefined;

  // Load addresses from User.preferences on mount
  useEffect(() => {
    loadAddresses();
  }, [user, currentAuthUser]);

  const loadAddresses = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const userId = user?.id || currentAuthUser?.username;
      if (!userId) { navigate('/login'); return; }

      const result = await getUserAddresses(userId);
      if (result.data) {
        setAddresses(result.data.map((a: any) => ({
          id: a.id,
          fullName: a.name || a.full_name || '',
          phoneNumber: a.phone || '',
          email: a.email || '',
          country: a.country || 'India',
          streetAddress1: a.address_line1 || a.street || '',
          streetAddress2: a.address_line2 || '',
          city: a.city || '',
          state: a.state || '',
          postalCode: a.pincode || a.postal_code || '',
          addressType: (a.type || a.address_type || 'home') as 'home' | 'work' | 'other',
          isDefault: a.is_default || false,
          createdAt: a.created_at || new Date().toISOString(),
          updatedAt: a.updated_at || new Date().toISOString(),
        })));
      }
    } catch (err) {
      logger.error(err as Error, { context: 'Failed to load addresses' });
      setError('Failed to load addresses');
    } finally {
      setIsLoading(false);
    }
  };

  const saveAddressesToBackend = async (_updatedAddresses: Address[]) => {
    // This is now handled individually per address
  };

  const handleAddAddress = async (data: Address) => {
    try {
      setIsSaving(true);
      setError(null);

      const userId = user?.id || currentAuthUser?.username;
      if (!userId) throw new Error('User not authenticated');

      if (editingId) {
        await updateUserAddress(editingId, {
          name: data.fullName,
          phone: data.phoneNumber,
          address_line1: data.streetAddress1,
          address_line2: data.streetAddress2,
          city: data.city,
          state: data.state,
          postal_code: data.postalCode,
          address_type: data.addressType,
          is_default: data.isDefault,
        });
        setEditingId(null);
      } else {
        const isFirst = addresses.length === 0;
        await createUserAddress({
          user_id: userId,
          name: data.fullName,
          phone: data.phoneNumber,
          address_line1: data.streetAddress1,
          address_line2: data.streetAddress2,
          city: data.city,
          state: data.state,
          postal_code: data.postalCode,
          address_type: data.addressType,
          is_default: data.isDefault || isFirst,
        });
      }

      await loadAddresses();
      setShowForm(false);
      setSuccessMessage(editingId ? 'Address updated!' : 'Address added!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      logger.error(err as Error, { context: 'Failed to add address' });
      setError('Failed to save address');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      await deleteAddressApi(id);
      await loadAddresses();
    } catch (err) {
      logger.error(err as Error, { context: 'Failed to delete address' });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      setIsSaving(true);
      setError(null);

      const updatedAddresses = addresses.map((a) => ({
        ...a,
        isDefault: a.id === id,
      }));

      await saveAddressesToBackend(updatedAddresses);
    } catch (err) {
      logger.error(err as Error, { context: 'Failed to set default address' });
    }
  };

  const handleEditClick = (id: string) => {
    setEditingId(id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const getAddressTypeIcon = (type: 'home' | 'work' | 'other') => {
    switch (type) {
      case 'home':
        return <Home size={16} className="text-amber-600" />;
      case 'work':
        return <Briefcase size={16} className="text-amber-600" />;
      default:
        return <MapPin size={16} className="text-amber-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 pb-16 md:pb-0 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
          <span className="text-lg text-gray-500">Loading addresses...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 pb-16 md:pb-0">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-amber-600 hover:text-yellow-400 transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-900 border border-green-600 rounded-lg p-4 mb-6 flex items-center gap-3">
            <span className="text-green-300">{successMessage}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-900 border border-red-600 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <span className="text-red-300">{error}</span>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">My Addresses</h1>
          <p className="text-gray-500">Manage your delivery addresses</p>
        </div>

        {/* Form */}
        {showForm && (
          <div className="mb-8">
            <AddressForm
              initialData={editingAddress}
              onSubmit={handleAddAddress}
              onCancel={handleCancel}
              isLoading={isSaving}
            />
          </div>
        )}

        {/* Add Address Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            disabled={isSaving}
            className="mb-8 flex items-center gap-2 px-6 py-3 bg-amber-500 text-black rounded-lg hover:bg-yellow-400 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus size={20} />}
            Add New Address
          </button>
        )}

        {/* Addresses List */}
        {addresses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="bg-gray-50 border border-gray-200 rounded-2xl p-6 hover:border-gray-200 transition-colors relative"
              >
                {/* Default Badge */}
                {address.isDefault && (
                  <div className="absolute top-4 right-4 bg-amber-500 text-black text-xs font-semibold px-3 py-1 rounded-full">
                    Default
                  </div>
                )}

                {/* Address Type Icon & Type */}
                <div className="flex items-center gap-2 mb-4">
                  {getAddressTypeIcon(address.addressType)}
                  <span className="text-sm font-semibold text-amber-600 capitalize">{address.addressType}</span>
                </div>

                {/* Address Details */}
                <div className="space-y-3 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{address.fullName}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="text-sm">{address.phoneNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-sm break-all">{address.email}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="text-sm">
                      {address.streetAddress1}
                      {address.streetAddress2 && `, ${address.streetAddress2}`}
                    </p>
                    <p className="text-sm">
                      {address.city}, {address.state} {address.postalCode}
                    </p>
                    <p className="text-sm text-gray-500">{address.country}</p>
                  </div>

                  {address.deliveryNotes && (
                    <div>
                      <p className="text-sm text-gray-500">Delivery Notes</p>
                      <p className="text-sm text-gray-600">{address.deliveryNotes}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleEditClick(address.id)}
                    disabled={isSaving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>

                  <button
                    onClick={() => handleDeleteAddress(address.id)}
                    disabled={address.isDefault || addresses.length === 1 || isSaving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    Delete
                  </button>

                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      disabled={isSaving}
                      className="flex-1 px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-yellow-400 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Set Default'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 border border-gray-200 rounded-2xl">
            <MapPin size={36} className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-500 mb-4">No addresses added yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-black rounded-lg hover:bg-yellow-400 transition-colors font-medium"
            >
              <Plus size={18} />
              Add Your First Address
            </button>
          </div>
        )}
      </div>

      <Footer />
      <MobileNav />
    </div>
  );
};

export default UserAddressManagement;
