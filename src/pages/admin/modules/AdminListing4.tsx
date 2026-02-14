import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductListing, type DeliveryCountry } from '../../../contexts/ProductListingContext';
import { Loading, ErrorMessage } from '../components/StatusIndicators';
import { fetchCountries as fetchCountriesFromDB } from '../../../lib/productService';
import { getTaxRules } from '../../../lib/adminService';
import { 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  Trash2,
  Calculator,
  Globe,
  Info
} from 'lucide-react';



interface Country {
  id: string;
  name: string;
  code: string;
  currency?: string;
  dial_code?: string;
}

export const AdminListing4: React.FC = () => {
  const navigate = useNavigate();
  const { productData, updateStep4, goToNextStep, goToPreviousStep, isStepValid } = useProductListing();
  const { step4 } = productData;

  const [countries, setCountries] = useState<Country[]>([]);
  const [gstRatesMap, setGstRatesMap] = useState<Record<string, number>>({ default: 15 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New delivery country form
  const [newDelivery, setNewDelivery] = useState<Omit<DeliveryCountry, 'id'>>({
    countryCode: '',
    countryName: '',
    deliveryCharge: 0,
    minOrderQty: 1,
  });

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      setLoading(true);
      const [countryResult, taxResult] = await Promise.all([
        fetchCountriesFromDB(),
        getTaxRules(),
      ]);

      if (countryResult.error) throw new Error(countryResult.error);
      setCountries((countryResult.data || []).map((c: any) => ({
        id: c.id,
        name: c.country_name,
        code: c.country_code,
        currency: c.currency_code,
      })));

      // Build GST rates map from tax_rules: country → percentage
      const ratesMap: Record<string, number> = { default: 15 };
      (taxResult.data || []).forEach((rule: any) => {
        if (rule.country && rule.percentage != null && rule.is_active !== false) {
          // Map country name or code to percentage
          const code = rule.country_code || rule.country;
          ratesMap[code.toUpperCase()] = rule.percentage;
        }
      });
      setGstRatesMap(ratesMap);

      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load countries');
    } finally {
      setLoading(false);
    }
  };

  // Calculate derived values
  const discount = step4.mrp > 0 && step4.sellingPrice > 0 
    ? Math.round(((step4.mrp - step4.sellingPrice) / step4.mrp) * 100) 
    : 0;

  const platformFeeAmount = (step4.sellingPrice * step4.platformFee) / 100;
  const commissionAmount = (step4.sellingPrice * step4.commission) / 100;
  const gstAmount = (step4.sellingPrice * step4.gstRate) / 100;
  const sellerEarnings = step4.sellingPrice - platformFeeAmount - commissionAmount - gstAmount;

  const handleCountryChange = (countryCode: string) => {
    const gstRate = gstRatesMap[countryCode] ?? gstRatesMap.default ?? 15;
    
    updateStep4({ 
      countryCode,
      gstRate,
    });
  };

  const handleMRPChange = (mrp: number) => {
    updateStep4({ mrp });
    // Auto-validate selling price
    if (step4.sellingPrice > mrp) {
      updateStep4({ sellingPrice: mrp });
    }
  };

  const handleSellingPriceChange = (price: number) => {
    if (price <= step4.mrp) {
      updateStep4({ sellingPrice: price });
    }
  };

  // Delivery country handlers
  const addDeliveryCountry = () => {
    if (newDelivery.countryCode) {
      const country = countries.find(c => c.code === newDelivery.countryCode);
      const delivery: DeliveryCountry = {
        id: crypto.randomUUID(),
        countryCode: newDelivery.countryCode,
        countryName: country?.name || newDelivery.countryCode,
        deliveryCharge: newDelivery.deliveryCharge,
        minOrderQty: newDelivery.minOrderQty,
      };
      updateStep4({ deliveryCountries: [...step4.deliveryCountries, delivery] });
      setNewDelivery({ countryCode: '', countryName: '', deliveryCharge: 0, minOrderQty: 1 });
    }
  };

  const removeDeliveryCountry = (id: string) => {
    updateStep4({ deliveryCountries: step4.deliveryCountries.filter(d => d.id !== id) });
  };

  const handleBack = () => {
    goToPreviousStep();
    navigate('/admin/products/new/step3');
  };

  const handleNext = () => {
    if (isStepValid(4)) {
      goToNextStep();
      navigate('/admin/products/new/step5');
    }
  };

  if (loading) return <Loading message="Loading countries..." />;

  const selectedCountry = countries.find(c => c.code === step4.countryCode);

  return (
    <div className="space-y-6">
      {error && <ErrorMessage message={error} />}

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
        <Info className="text-blue-600 mt-0.5" size={20} />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Pricing Guidelines:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>MRP (Maximum Retail Price) is the price printed on the product</li>
            <li>Selling price must be less than or equal to MRP</li>
            <li>Platform fee (7.5%) and commission (0.5%) are automatically calculated</li>
            <li>GST rate is based on the selected country</li>
          </ul>
        </div>
      </div>

      {/* Primary Country Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Primary Selling Country *
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-3 text-gray-500" size={18} />
            <select
              value={step4.countryCode}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="">Select Country</option>
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name} ({country.code})
                </option>
              ))}
            </select>
          </div>
          {selectedCountry && (
            <p className="text-sm text-gray-500 mt-1">
              Currency: {selectedCountry.currency || 'INR'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            GST/VAT Rate
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={step4.gstRate}
              onChange={(e) => updateStep4({ gstRate: parseFloat(e.target.value) || 0 })}
              min="0"
              max="100"
              step="0.1"
              className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <span className="text-gray-600">%</span>
            <span className="text-sm text-gray-500 ml-2">
              (Auto-filled based on country)
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Calculator size={20} />
          Pricing Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* MRP */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              MRP (Maximum Retail Price) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">₹</span>
              <input
                type="number"
                value={step4.mrp || ''}
                onChange={(e) => handleMRPChange(parseFloat(e.target.value) || 0)}
                min="0"
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>

          {/* Selling Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Selling Price *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">₹</span>
              <input
                type="number"
                value={step4.sellingPrice || ''}
                onChange={(e) => handleSellingPriceChange(parseFloat(e.target.value) || 0)}
                min="0"
                max={step4.mrp || undefined}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            {step4.sellingPrice > step4.mrp && step4.mrp > 0 && (
              <p className="text-sm text-red-500 mt-1">
                Selling price cannot exceed MRP
              </p>
            )}
          </div>

          {/* Discount Display */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discount
            </label>
            <div className={`px-4 py-2 rounded-lg font-medium ${
              discount > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
            }`}>
              {discount}% OFF
            </div>
          </div>
        </div>

        {/* Stock Quantity */}
        <div className="mt-4 max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stock Quantity
          </label>
          <input
            type="number"
            value={step4.stockQuantity || ''}
            onChange={(e) => updateStep4({ stockQuantity: parseInt(e.target.value) || 0 })}
            min="0"
            placeholder="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>
      </div>

      {/* Fees Breakdown */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Fee Breakdown</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500">Platform Fee ({step4.platformFee}%)</p>
            <p className="text-lg font-semibold text-gray-900">₹{platformFeeAmount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Commission ({step4.commission}%)</p>
            <p className="text-lg font-semibold text-gray-900">₹{commissionAmount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">GST/VAT ({step4.gstRate}%)</p>
            <p className="text-lg font-semibold text-gray-900">₹{gstAmount.toFixed(2)}</p>
          </div>
          <div className="bg-green-100 rounded-lg p-2 -m-2">
            <p className="text-xs text-green-700">Your Earnings</p>
            <p className="text-lg font-bold text-green-800">₹{sellerEarnings.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Delivery Countries */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Globe size={20} />
              Delivery Countries & Charges
            </h3>
            <p className="text-sm text-gray-500">Set delivery charges for different countries</p>
          </div>
        </div>

        {/* Existing delivery countries */}
        {step4.deliveryCountries.length > 0 && (
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Country</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Delivery Charge</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Min. Order Qty</th>
                  <th className="py-3 px-4 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {step4.deliveryCountries.map((delivery, index) => (
                  <tr key={delivery.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="py-2 px-4 font-medium text-gray-800">
                      {delivery.countryName} ({delivery.countryCode})
                    </td>
                    <td className="py-2 px-4 text-gray-600">₹{delivery.deliveryCharge}</td>
                    <td className="py-2 px-4 text-gray-600">{delivery.minOrderQty}</td>
                    <td className="py-2 px-4">
                      <button
                        onClick={() => removeDeliveryCountry(delivery.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add new delivery country */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-3">Add Delivery Country</p>
          <div className="grid grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Country</label>
              <select
                value={newDelivery.countryCode}
                onChange={(e) => setNewDelivery({ ...newDelivery, countryCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              >
                <option value="">Select</option>
                {countries
                  .filter(c => !step4.deliveryCountries.find(d => d.countryCode === c.code))
                  .map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Delivery Charge (₹)</label>
              <input
                type="number"
                value={newDelivery.deliveryCharge || ''}
                onChange={(e) => setNewDelivery({ ...newDelivery, deliveryCharge: parseFloat(e.target.value) || 0 })}
                min="0"
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Min Order Qty</label>
              <input
                type="number"
                value={newDelivery.minOrderQty || ''}
                onChange={(e) => setNewDelivery({ ...newDelivery, minOrderQty: parseInt(e.target.value) || 1 })}
                min="1"
                placeholder="1"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <button
              onClick={addDeliveryCountry}
              disabled={!newDelivery.countryCode}
              className="flex items-center justify-center gap-1 px-4 py-2 bg-white text-gray-900 rounded hover:bg-gray-50 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            >
              <Plus size={16} /> Add
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
          Back to Details
        </button>
        <button
          onClick={handleNext}
          disabled={!isStepValid(4)}
          className="flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-50 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Continue to Shipping
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default AdminListing4;
