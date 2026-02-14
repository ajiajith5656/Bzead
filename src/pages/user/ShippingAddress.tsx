import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Plus, Check } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import type { UserAddress } from '../../types';

interface ShippingFormData {
  full_name: string;
  phone_number: string;
  email: string;
  country: string;
  street_address_1: string;
  street_address_2?: string;
  city: string;
  state: string;
  postal_code: string;
  delivery_notes?: string;
}

const ShippingAddressPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, totalPrice } = useCart();
  const [useExistingAddress, setUseExistingAddress] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<ShippingFormData>({
    full_name: '',
    phone_number: '',
    email: '',
    country: '',
    street_address_1: '',
    street_address_2: '',
    city: '',
    state: '',
    postal_code: '',
    delivery_notes: '',
  });

  // Load saved addresses from localStorage or API
  useEffect(() => {
    const loadSavedAddresses = () => {
      try {
        const saved = localStorage.getItem('beauzead_addresses');
        if (saved) {
          const addresses = JSON.parse(saved) as UserAddress[];
          setSavedAddresses(addresses);
          
          // Auto-select default address if exists
          const defaultAddress = addresses.find(addr => addr.is_default);
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id);
            setUseExistingAddress(true);
          }
        }

        // Also load user info from localStorage for pre-filling
        const userInfo = localStorage.getItem('beauzead_user');
        if (userInfo) {
          const user = JSON.parse(userInfo);
          setFormData(prev => ({
            ...prev,
            full_name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
            email: user.email || '',
            phone_number: user.phone || '',
          }));
        }
      } catch (err) {
        console.error('Failed to load addresses:', err);
      }
    };

    loadSavedAddresses();
  }, []);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectAddress = (address: UserAddress) => {
    setSelectedAddressId(address.id);
    setFormData({
      full_name: address.full_name,
      phone_number: address.phone_number,
      email: address.email,
      country: address.country,
      street_address_1: address.street_address_1,
      street_address_2: address.street_address_2,
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      delivery_notes: address.delivery_notes,
    });
  };

  const validateForm = (): boolean => {
    if (!formData.full_name.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.phone_number.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Valid email is required');
      return false;
    }
    if (!formData.street_address_1.trim()) {
      setError('Street address is required');
      return false;
    }
    if (!formData.city.trim()) {
      setError('City is required');
      return false;
    }
    if (!formData.state.trim()) {
      setError('State/Province is required');
      return false;
    }
    if (!formData.postal_code.trim()) {
      setError('Postal code is required');
      return false;
    }
    if (!formData.country.trim()) {
      setError('Country is required');
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Store shipping address in localStorage for order summary page
      const shippingData = {
        street: formData.street_address_1,
        street2: formData.street_address_2,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postal_code,
        country: formData.country,
        fullName: formData.full_name,
        phone: formData.phone_number,
        email: formData.email,
        notes: formData.delivery_notes,
      };

      localStorage.setItem('beauzead_checkout_shipping', JSON.stringify(shippingData));

      // Navigate to order summary
      navigate('/checkout/review');
    } catch (err) {
      setError('Failed to save shipping address');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-semibold"
        >
          <ArrowLeft size={20} />
          Back to Cart
        </button>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-gray-900 flex items-center justify-center font-bold mb-2">
                1
              </div>
              <span className="text-sm font-semibold text-blue-600">Shipping</span>
            </div>
            <div className="flex-1 h-1 bg-gray-300 mx-4"></div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold mb-2">
                2
              </div>
              <span className="text-sm text-gray-500">Review</span>
            </div>
            <div className="flex-1 h-1 bg-gray-300 mx-4"></div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold mb-2">
                3
              </div>
              <span className="text-sm text-gray-500">Payment</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <MapPin size={28} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Shipping Address</h1>
          </div>

          {/* Toggle between new address and saved addresses */}
          {savedAddresses.length > 0 && (
            <div className="mb-6 flex gap-4">
              <button
                onClick={() => setUseExistingAddress(false)}
                className={`flex-1 py-3 px-4 rounded-lg border-2 font-semibold transition-all ${
                  !useExistingAddress
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                <Plus size={18} className="inline mr-2" />
                New Address
              </button>
              <button
                onClick={() => setUseExistingAddress(true)}
                className={`flex-1 py-3 px-4 rounded-lg border-2 font-semibold transition-all ${
                  useExistingAddress
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                <MapPin size={18} className="inline mr-2" />
                Saved Addresses ({savedAddresses.length})
              </button>
            </div>
          )}

          {/* Saved Addresses Grid */}
          {useExistingAddress && savedAddresses.length > 0 && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedAddresses.map((address) => (
                <div
                  key={address.id}
                  onClick={() => handleSelectAddress(address)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedAddressId === address.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{address.full_name}</span>
                      {address.is_default && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    {selectedAddressId === address.id && (
                      <Check size={20} className="text-blue-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{address.phone_number}</p>
                  <p className="text-sm text-gray-600">
                    {address.street_address_1}
                    {address.street_address_2 && `, ${address.street_address_2}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    {address.city}, {address.state} {address.postal_code}
                  </p>
                  <p className="text-sm text-gray-600">{address.country}</p>
                </div>
              ))}
            </div>
          )}

          {/* New Address Form */}
          {(!useExistingAddress || savedAddresses.length === 0) && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="+1 (555) 123-4567"
                      required
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              {/* Address Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Street Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="street_address_1"
                      value={formData.street_address_1}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="123 Main Street"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Apartment, Suite, etc. (Optional)
                    </label>
                    <input
                      type="text"
                      name="street_address_2"
                      value={formData.street_address_2}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="Apt 4B"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        placeholder="New York"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        State/Province <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        placeholder="NY"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Postal Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="postal_code"
                        value={formData.postal_code}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        placeholder="10001"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="United States"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Delivery Notes (Optional)
                </label>
                <textarea
                  name="delivery_notes"
                  value={formData.delivery_notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Any special instructions for delivery..."
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-gray-900 rounded-lg font-semibold transition-colors"
              >
                {isLoading ? 'Saving...' : 'Continue to Review Order'}
              </button>
            </form>
          )}

          {/* Continue with Selected Address */}
          {useExistingAddress && selectedAddressId && (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-gray-900 rounded-lg font-semibold transition-colors"
            >
              {isLoading ? 'Saving...' : 'Continue to Review Order'}
            </button>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Items ({items.length})</span>
              <span className="font-semibold">${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping</span>
              <span className="font-semibold">Calculated at next step</span>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-4 flex justify-between text-lg font-bold">
            <span>Subtotal</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingAddressPage;
