import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductListing } from '../../../contexts/ProductListingContext';
import { supabase } from '../../../lib/supabase';
import { 
  ChevronRight, 
  ChevronLeft, 
  Package,
  Truck,
  Factory,
  RotateCcw,
  XCircle,
  Info
} from 'lucide-react';

export const AdminListing5: React.FC = () => {
  const navigate = useNavigate();
  const { productData, updateStep5, goToNextStep, goToPreviousStep, isStepValid } = useProductListing();
  const { step5 } = productData;
  const [courierPartners, setCourierPartners] = useState<string[]>([]);

  useEffect(() => {
    const loadCouriers = async () => {
      const { data } = await supabase
        .from('courier_partners')
        .select('name')
        .eq('is_active', true)
        .order('name');
      if (data) setCourierPartners(data.map((c: any) => c.name));
    };
    loadCouriers();
  }, []);

  const handleInputChange = (field: string, value: string | number) => {
    updateStep5({ [field]: value } as any);
  };

  const handleBack = () => {
    goToPreviousStep();
    navigate('/admin/products/new/step4');
  };

  const handleNext = () => {
    if (isStepValid(5)) {
      goToNextStep();
      navigate('/admin/products/new/step6');
    }
  };

  // Calculate volumetric weight
  const volumetricWeight = step5.packageLength && step5.packageWidth && step5.packageHeight
    ? (step5.packageLength * step5.packageWidth * step5.packageHeight) / 5000
    : 0;

  const chargeableWeight = Math.max(step5.packageWeight, volumetricWeight);

  return (
    <div className="space-y-6">
      {/* Package Dimensions */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Package size={20} className="text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Package Dimensions</h3>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <div className="flex items-start gap-2">
            <Info className="text-blue-600 mt-0.5" size={18} />
            <div className="text-sm text-blue-800">
              <p>Accurate dimensions help calculate shipping costs correctly.</p>
              <p className="mt-1">Measure the packed product (including packaging materials).</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weight (kg) *
            </label>
            <input
              type="number"
              value={step5.packageWeight || ''}
              onChange={(e) => handleInputChange('packageWeight', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.1"
              placeholder="0.0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Length (cm)
            </label>
            <input
              type="number"
              value={step5.packageLength || ''}
              onChange={(e) => handleInputChange('packageLength', parseFloat(e.target.value) || 0)}
              min="0"
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Width (cm)
            </label>
            <input
              type="number"
              value={step5.packageWidth || ''}
              onChange={(e) => handleInputChange('packageWidth', parseFloat(e.target.value) || 0)}
              min="0"
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Height (cm)
            </label>
            <input
              type="number"
              value={step5.packageHeight || ''}
              onChange={(e) => handleInputChange('packageHeight', parseFloat(e.target.value) || 0)}
              min="0"
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
        </div>

        {/* Volumetric weight calculation */}
        {volumetricWeight > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Volumetric Weight:</span>
              <span className="font-medium">{volumetricWeight.toFixed(2)} kg</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">Chargeable Weight (higher of actual/volumetric):</span>
              <span className="font-bold text-black">{chargeableWeight.toFixed(2)} kg</span>
            </div>
          </div>
        )}
      </div>

      {/* Shipping Type */}
      <div className="border-t pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Truck size={20} className="text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Shipping Type *</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label 
            className={`flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
              step5.shippingType === 'self' 
                ? 'border-black bg-gray-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="shippingType"
              value="self"
              checked={step5.shippingType === 'self'}
              onChange={(e) => handleInputChange('shippingType', e.target.value)}
              className="mt-1"
            />
            <div>
              <p className="font-medium text-gray-900">Self Ship</p>
              <p className="text-sm text-gray-500">
                You manage the shipping logistics. Use your preferred courier partner.
              </p>
            </div>
          </label>

          <label 
            className={`flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
              step5.shippingType === 'platform' 
                ? 'border-black bg-gray-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="shippingType"
              value="platform"
              checked={step5.shippingType === 'platform'}
              onChange={(e) => handleInputChange('shippingType', e.target.value)}
              className="mt-1"
            />
            <div>
              <p className="font-medium text-gray-900">Platform Fulfillment</p>
              <p className="text-sm text-gray-500">
                We handle pickup, packing, and delivery. Additional fees apply.
              </p>
            </div>
          </label>
        </div>

        {step5.shippingType === 'self' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Courier Partner
            </label>
            <select
              value={step5.courierPartner}
              onChange={(e) => handleInputChange('courierPartner', e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="">Select Courier Partner</option>
              {courierPartners.map((partner) => (
                <option key={partner} value={partner}>
                  {partner}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Manufacturer Details */}
      <div className="border-t pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Factory size={20} className="text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Manufacturer Details</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Manufacturer Name
            </label>
            <input
              type="text"
              value={step5.manufacturerName}
              onChange={(e) => handleInputChange('manufacturerName', e.target.value)}
              placeholder="Enter manufacturer/brand name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Manufacturer Address
            </label>
            <input
              type="text"
              value={step5.manufacturerAddress}
              onChange={(e) => handleInputChange('manufacturerAddress', e.target.value)}
              placeholder="City, Country"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Packing Details
          </label>
          <textarea
            value={step5.packingDetails}
            onChange={(e) => handleInputChange('packingDetails', e.target.value)}
            placeholder="e.g., Box, Bubble wrap, Thermocol packaging..."
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black focus:border-transparent resize-none"
          />
        </div>
      </div>

      {/* Policies */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Return & Cancellation Policies</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cancellation Policy */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <XCircle size={18} className="text-red-500" />
              <label className="text-sm font-medium text-gray-700">
                Cancellation Window
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={step5.cancellationPolicyDays || ''}
                onChange={(e) => handleInputChange('cancellationPolicyDays', parseInt(e.target.value) || 0)}
                min="0"
                max="30"
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-center"
              />
              <span className="text-gray-600">days after order placement</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Customers can cancel their order within this period (0 = no cancellation allowed)
            </p>
          </div>

          {/* Return Policy */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <RotateCcw size={18} className="text-blue-500" />
              <label className="text-sm font-medium text-gray-700">
                Return Window
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={step5.returnPolicyDays || ''}
                onChange={(e) => handleInputChange('returnPolicyDays', parseInt(e.target.value) || 0)}
                min="0"
                max="30"
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-center"
              />
              <span className="text-gray-600">days after delivery</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Customers can request a return within this period (0 = no returns allowed)
            </p>
          </div>
        </div>

        {/* Quick Policy Presets */}
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Quick Presets:</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                handleInputChange('cancellationPolicyDays', 1);
                handleInputChange('returnPolicyDays', 7);
              }}
              className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:bg-gray-50"
            >
              Standard (1 day cancel, 7 day return)
            </button>
            <button
              type="button"
              onClick={() => {
                handleInputChange('cancellationPolicyDays', 3);
                handleInputChange('returnPolicyDays', 15);
              }}
              className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:bg-gray-50"
            >
              Extended (3 day cancel, 15 day return)
            </button>
            <button
              type="button"
              onClick={() => {
                handleInputChange('cancellationPolicyDays', 0);
                handleInputChange('returnPolicyDays', 0);
              }}
              className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:bg-gray-50"
            >
              No Returns
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft size={20} />
          Back to Pricing
        </button>
        <button
          onClick={handleNext}
          disabled={!isStepValid(5)}
          className="flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-50 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Continue to Offers
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default AdminListing5;
