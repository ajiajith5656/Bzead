import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductListing, type OfferRule } from '../../../contexts/ProductListingContext';
import { SuccessMessage, ErrorMessage } from '../components/StatusIndicators';
import { useAuth } from '../../../contexts/AuthContext';
import { createProduct, uploadProductImage, uploadProductVideo } from '../../../lib/productService';
import { supabase } from '../../../lib/supabase';
import { 
  ChevronLeft, 
  Plus, 
  Trash2,
  Gift,
  Calendar,
  Clock,
  Package,
  Check,
  Loader2,
  AlertCircle
} from 'lucide-react';

export const AdminListing6: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { productData, updateStep6, getSubmitData, resetForm } = useProductListing();
  const { step6 } = productData;
  const [specialDays, setSpecialDays] = useState<string[]>([]);

  useEffect(() => {
    const loadSpecialDays = async () => {
      const { data } = await supabase
        .from('special_days')
        .select('name')
        .eq('is_active', true)
        .order('name');
      if (data) setSpecialDays(data.map((d: any) => d.name));
    };
    loadSpecialDays();
  }, []);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddOffer, setShowAddOffer] = useState(false);
  const [offerType, setOfferType] = useState<OfferRule['type']>('buy_x_get_y');

  // Form state for new offer
  const [newOffer, setNewOffer] = useState<Partial<OfferRule>>({
    buyQuantity: 2,
    getQuantity: 1,
    discountPercent: 10,
    startTime: '',
    endTime: '',
    bundleMinQty: 3,
    bundleDiscount: 15,
    specialDayName: '',
    isActive: true,
  });

  const addOffer = () => {
    const offer: OfferRule = {
      id: crypto.randomUUID(),
      type: offerType,
      ...newOffer,
      isActive: true,
    };
    updateStep6({ offerRules: [...step6.offerRules, offer] });
    setShowAddOffer(false);
    setNewOffer({
      buyQuantity: 2,
      getQuantity: 1,
      discountPercent: 10,
      startTime: '',
      endTime: '',
      bundleMinQty: 3,
      bundleDiscount: 15,
      specialDayName: '',
      isActive: true,
    });
  };

  const removeOffer = (id: string) => {
    updateStep6({ offerRules: step6.offerRules.filter(o => o.id !== id) });
  };

  const toggleOfferActive = (id: string) => {
    updateStep6({
      offerRules: step6.offerRules.map(o =>
        o.id === id ? { ...o, isActive: !o.isActive } : o
      ),
    });
  };

  const handleBack = () => {
    navigate('/admin/products/new/step5');
  };

  const uploadMediaFiles = async (sellerId: string, submitData: Record<string, unknown>) => {
    const imageFiles = (productData.step2.images || []) as File[];
    const videoFiles = (productData.step2.videos || []) as File[];

    const imageUrls: string[] = [];
    for (const file of imageFiles) {
      const url = await uploadProductImage(file, sellerId);
      imageUrls.push(url);
    }

    const videoUrls: string[] = [];
    for (const file of videoFiles) {
      const url = await uploadProductVideo(file, sellerId);
      videoUrls.push(url);
    }

    submitData.images = imageUrls;
    submitData.videos = videoUrls;
    submitData.image_url = imageUrls[0] || '';
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const sellerId = user?.id;
      if (!sellerId) throw new Error('User not authenticated');

      const submitData = getSubmitData() as Record<string, unknown>;
      submitData.seller_id = sellerId;

      // Upload images & videos to Supabase Storage
      await uploadMediaFiles(sellerId, submitData);

      const result = await createProduct(submitData);

      if (result.error) throw new Error(result.error);

      setSuccess('Product created successfully! It will be reviewed before going live.');
      setTimeout(() => {
        resetForm();
        navigate('/admin/products');
      }, 2000);
    } catch (err: any) {
      console.error('Failed to create product:', err);
      setError(err.message || 'Failed to create product. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const sellerId = user?.id;
      if (!sellerId) throw new Error('User not authenticated');

      const submitData = { ...getSubmitData(), approvalStatus: 'draft' } as Record<string, unknown>;
      submitData.seller_id = sellerId;

      // Upload images & videos to Supabase Storage
      await uploadMediaFiles(sellerId, submitData);

      const result = await createProduct(submitData);

      if (result.error) throw new Error(result.error);

      setSuccess('Draft saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save draft. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getOfferDescription = (offer: OfferRule) => {
    switch (offer.type) {
      case 'buy_x_get_y':
        return `Buy ${offer.buyQuantity} Get ${offer.getQuantity} Free`;
      case 'special_day':
        return `${offer.specialDayName} - ${offer.discountPercent}% OFF`;
      case 'hourly':
        return `${offer.startTime} - ${offer.endTime}: ${offer.discountPercent}% OFF`;
      case 'bundle':
        return `Buy ${offer.bundleMinQty}+ Get ${offer.bundleDiscount}% OFF`;
      default:
        return 'Unknown offer';
    }
  };

  const getOfferIcon = (type: OfferRule['type']) => {
    switch (type) {
      case 'buy_x_get_y':
        return <Gift size={16} className="text-pink-500" />;
      case 'special_day':
        return <Calendar size={16} className="text-purple-500" />;
      case 'hourly':
        return <Clock size={16} className="text-orange-500" />;
      case 'bundle':
        return <Package size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {success && <SuccessMessage message={success} />}
      {error && <ErrorMessage message={error} />}

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
        <AlertCircle className="text-gray-600 mt-0.5" size={20} />
        <div className="text-sm text-gray-600">
          <p className="font-medium text-gray-800 mb-1">Offer Rules (Optional)</p>
          <p>Configure special offers and discounts for this product. You can add these later too.</p>
        </div>
      </div>

      {/* Existing Offers */}
      {step6.offerRules.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-gray-900">Active Offers</h3>
          {step6.offerRules.map((offer) => (
            <div
              key={offer.id}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                offer.isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {getOfferIcon(offer.type)}
                <div>
                  <p className="font-medium text-gray-900">{getOfferDescription(offer)}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {offer.type.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleOfferActive(offer.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    offer.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {offer.isActive ? 'Active' : 'Inactive'}
                </button>
                <button
                  onClick={() => removeOffer(offer.id)}
                  className="p-1 text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Offer Button */}
      {!showAddOffer && (
        <button
          onClick={() => setShowAddOffer(true)}
          className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg w-full justify-center text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
        >
          <Plus size={20} />
          Add Offer Rule
        </button>
      )}

      {/* Add Offer Form */}
      {showAddOffer && (
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Add New Offer</h4>
            <button
              onClick={() => setShowAddOffer(false)}
              className="text-gray-500 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Offer Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Offer Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(['buy_x_get_y', 'special_day', 'hourly', 'bundle'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setOfferType(type)}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    offerType === type
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {getOfferIcon(type)}
                  <span className="text-sm font-medium capitalize">
                    {type.replace('_', ' ').replace('buy x get y', 'Buy X Get Y')}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Buy X Get Y Form */}
          {offerType === 'buy_x_get_y' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buy Quantity
                </label>
                <input
                  type="number"
                  value={newOffer.buyQuantity || ''}
                  onChange={(e) => setNewOffer({ ...newOffer, buyQuantity: parseInt(e.target.value) || 0 })}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Get Free Quantity
                </label>
                <input
                  type="number"
                  value={newOffer.getQuantity || ''}
                  onChange={(e) => setNewOffer({ ...newOffer, getQuantity: parseInt(e.target.value) || 0 })}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Special Day Form */}
          {offerType === 'special_day' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Day
                </label>
                <select
                  value={newOffer.specialDayName || ''}
                  onChange={(e) => setNewOffer({ ...newOffer, specialDayName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select Special Day</option>
                  {specialDays.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount %
                </label>
                <input
                  type="number"
                  value={newOffer.discountPercent || ''}
                  onChange={(e) => setNewOffer({ ...newOffer, discountPercent: parseFloat(e.target.value) || 0 })}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Hourly Offer Form */}
          {offerType === 'hourly' && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={newOffer.startTime || ''}
                  onChange={(e) => setNewOffer({ ...newOffer, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={newOffer.endTime || ''}
                  onChange={(e) => setNewOffer({ ...newOffer, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount %
                </label>
                <input
                  type="number"
                  value={newOffer.discountPercent || ''}
                  onChange={(e) => setNewOffer({ ...newOffer, discountPercent: parseFloat(e.target.value) || 0 })}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Bundle Discount Form */}
          {offerType === 'bundle' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Quantity
                </label>
                <input
                  type="number"
                  value={newOffer.bundleMinQty || ''}
                  onChange={(e) => setNewOffer({ ...newOffer, bundleMinQty: parseInt(e.target.value) || 0 })}
                  min="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bundle Discount %
                </label>
                <input
                  type="number"
                  value={newOffer.bundleDiscount || ''}
                  onChange={(e) => setNewOffer({ ...newOffer, bundleDiscount: parseFloat(e.target.value) || 0 })}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowAddOffer(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={addOffer}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-50"
            >
              <Plus size={16} /> Add Offer
            </button>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Product Summary</h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Product Title:</span>
            <span className="font-medium">{productData.step1.productTitle || 'Not set'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Category:</span>
            <span className="font-medium">{productData.step1.categoryId || 'Not set'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Images:</span>
            <span className="font-medium">{productData.step2.imageUrls.length} uploaded</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Selling Price:</span>
            <span className="font-medium">₹{productData.step4.sellingPrice || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Offer Rules:</span>
            <span className="font-medium">{step6.offerRules.length} configured</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={handleBack}
          disabled={submitting}
          className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <ChevronLeft size={20} />
          Back to Shipping
        </button>
        
        <div className="flex gap-3">
          <button
            onClick={handleSaveDraft}
            disabled={submitting}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-8 py-3 bg-green-600 text-gray-900 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Check size={20} />
                Submit for Review
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminListing6;
