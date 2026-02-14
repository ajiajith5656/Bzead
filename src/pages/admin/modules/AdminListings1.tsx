import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductListing, type SizeVariant, type ColorVariant } from '../../../contexts/ProductListingContext';
import { Loading, ErrorMessage } from '../components/StatusIndicators';
import { Plus, Trash2, ChevronRight, AlertCircle } from 'lucide-react';
import { fetchCategories } from '../../../lib/productService';
import { supabase } from '../../../lib/supabase';

interface ColorOption { name: string; hex: string; }

interface Category {
  id: string;
  name: string;
  sub_categories?: { id: string; name: string }[];
}

export const AdminListings1: React.FC = () => {
  const navigate = useNavigate();
  const { productData, updateStep1, goToNextStep, isStepValid } = useProductListing();
  const { step1 } = productData;

  const [categories, setCategories] = useState<Category[]>([]);
  const [COLORS, setCOLORS] = useState<ColorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Size variant form state
  const [newSizeVariant, setNewSizeVariant] = useState<Omit<SizeVariant, 'id'>>({
    size: '',
    quantity: 0,
    stock: 0,
    price: 0,
  });

  // Color variant form state
  const [newColorVariant, setNewColorVariant] = useState<Omit<ColorVariant, 'id'>>({
    color: '',
    sku: '',
    price: 0,
    stock: 0,
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [catResult, colorResult] = await Promise.all([
        fetchCategories(),
        supabase.from('colors').select('name, hex_code').eq('is_active', true).order('name'),
      ]);

      if (catResult.error) throw new Error(catResult.error);
      setCategories((catResult.data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        sub_categories: (c.sub_categories || []).map((s: any) => ({ id: s.id, name: s.name })),
      })));

      if (colorResult.data) {
        setCOLORS(colorResult.data.map((c: any) => ({ name: c.name, hex: c.hex_code })));
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    updateStep1({ [field]: value });
  };

  const selectedCategory = categories.find(c => c.id === step1.categoryId);
  const subCategories = selectedCategory?.sub_categories || [];

  // Size variant handlers
  const addSizeVariant = () => {
    if (newSizeVariant.size && newSizeVariant.stock > 0) {
      const variant: SizeVariant = {
        id: crypto.randomUUID(),
        ...newSizeVariant,
      };
      updateStep1({ sizeVariants: [...step1.sizeVariants, variant] });
      setNewSizeVariant({ size: '', quantity: 0, stock: 0, price: 0 });
    }
  };

  const removeSizeVariant = (id: string) => {
    updateStep1({ sizeVariants: step1.sizeVariants.filter(v => v.id !== id) });
  };

  // Color variant handlers
  const addColorVariant = () => {
    if (newColorVariant.color && newColorVariant.sku) {
      const variant: ColorVariant = {
        id: crypto.randomUUID(),
        ...newColorVariant,
      };
      updateStep1({ colorVariants: [...step1.colorVariants, variant] });
      setNewColorVariant({ color: '', sku: '', price: 0, stock: 0 });
    }
  };

  const removeColorVariant = (id: string) => {
    updateStep1({ colorVariants: step1.colorVariants.filter(v => v.id !== id) });
  };

  const handleNext = () => {
    if (isStepValid(1)) {
      goToNextStep();
      navigate('/admin/products/new/step2');
    }
  };

  if (loading) return <Loading message="Loading categories..." />;

  return (
    <div className="space-y-6">
      {error && <ErrorMessage message={error} />}

      <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-4 rounded-lg">
        <AlertCircle size={20} />
        <span className="text-sm">Fields marked with * are required</span>
      </div>

      {/* Category Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category *
          </label>
          <select
            value={step1.categoryId}
            onChange={(e) => {
              handleInputChange('categoryId', e.target.value);
              handleInputChange('subCategoryId', '');
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sub-Category
          </label>
          <select
            value={step1.subCategoryId}
            onChange={(e) => handleInputChange('subCategoryId', e.target.value)}
            disabled={!step1.categoryId}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-100"
          >
            <option value="">Select Sub-Category</option>
            {subCategories.map((sub: any) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Type
          </label>
          <input
            type="text"
            value={step1.productTypeId}
            onChange={(e) => handleInputChange('productTypeId', e.target.value)}
            placeholder="e.g., T-Shirt, Jeans, Sneakers"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>
      </div>

      {/* Product Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Product Title * <span className="text-gray-500">(Max 250 characters)</span>
        </label>
        <input
          type="text"
          value={step1.productTitle}
          onChange={(e) => handleInputChange('productTitle', e.target.value.slice(0, 250))}
          placeholder="Enter product title"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black focus:border-transparent"
        />
        <p className="text-sm text-gray-500 mt-1">{step1.productTitle.length}/250 characters</p>
      </div>

      {/* Brand & Model */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Brand Name *
          </label>
          <input
            type="text"
            value={step1.brandName}
            onChange={(e) => handleInputChange('brandName', e.target.value)}
            placeholder="Enter brand name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Model Number <span className="text-gray-500">(8-20 alphanumeric)</span>
          </label>
          <input
            type="text"
            value={step1.modelNumber}
            onChange={(e) => {
              const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
              handleInputChange('modelNumber', value);
            }}
            placeholder="e.g., ABC123XYZ"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black focus:border-transparent"
          />
          {step1.modelNumber && (step1.modelNumber.length < 8 || step1.modelNumber.length > 20) && (
            <p className="text-sm text-red-500 mt-1">Model number must be 8-20 characters</p>
          )}
        </div>
      </div>

      {/* Short Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Short Description * <span className="text-gray-500">(Max 350 characters)</span>
        </label>
        <textarea
          value={step1.shortDescription}
          onChange={(e) => handleInputChange('shortDescription', e.target.value.slice(0, 350))}
          placeholder="Enter a brief description of the product"
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black focus:border-transparent resize-none"
        />
        <p className="text-sm text-gray-500 mt-1">{step1.shortDescription.length}/350 characters</p>
      </div>

      {/* Stock */}
      <div className="max-w-xs">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Total Stock Quantity
        </label>
        <input
          type="number"
          value={step1.stock || ''}
          onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
          placeholder="0"
          min="0"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black focus:border-transparent"
        />
      </div>

      {/* Size Variants */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Size Variants</label>
            <p className="text-sm text-gray-500">Does this product have size options?</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={step1.sizeApplicable}
              onChange={(e) => handleInputChange('sizeApplicable', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-black/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
          </label>
        </div>

        {step1.sizeApplicable && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            {/* Size variants table */}
            {step1.sizeVariants.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">Size</th>
                      <th className="text-left py-2 px-2">Quantity</th>
                      <th className="text-left py-2 px-2">Stock</th>
                      <th className="text-left py-2 px-2">Price</th>
                      <th className="text-left py-2 px-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {step1.sizeVariants.map((variant) => (
                      <tr key={variant.id} className="border-b">
                        <td className="py-2 px-2">{variant.size}</td>
                        <td className="py-2 px-2">{variant.quantity}</td>
                        <td className="py-2 px-2">{variant.stock}</td>
                        <td className="py-2 px-2">₹{variant.price}</td>
                        <td className="py-2 px-2">
                          <button
                            onClick={() => removeSizeVariant(variant.id)}
                            className="text-red-600 hover:text-red-800"
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

            {/* Add size form */}
            <div className="grid grid-cols-5 gap-2 items-end">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Size</label>
                <input
                  type="text"
                  value={newSizeVariant.size}
                  onChange={(e) => setNewSizeVariant({ ...newSizeVariant, size: e.target.value })}
                  placeholder="e.g., S, M, L, XL"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Quantity</label>
                <input
                  type="number"
                  value={newSizeVariant.quantity || ''}
                  onChange={(e) => setNewSizeVariant({ ...newSizeVariant, quantity: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Stock</label>
                <input
                  type="number"
                  value={newSizeVariant.stock || ''}
                  onChange={(e) => setNewSizeVariant({ ...newSizeVariant, stock: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Price (₹)</label>
                <input
                  type="number"
                  value={newSizeVariant.price || ''}
                  onChange={(e) => setNewSizeVariant({ ...newSizeVariant, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
              <button
                onClick={addSizeVariant}
                className="flex items-center justify-center gap-1 px-4 py-2 bg-white text-gray-900 rounded hover:bg-gray-50 text-sm"
              >
                <Plus size={16} /> Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Color Variants */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Color Variants</label>
            <p className="text-sm text-gray-500">Does this product have color options?</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={step1.colorApplicable}
              onChange={(e) => handleInputChange('colorApplicable', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-black/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
          </label>
        </div>

        {step1.colorApplicable && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            {/* Color variants table */}
            {step1.colorVariants.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">Color</th>
                      <th className="text-left py-2 px-2">SKU</th>
                      <th className="text-left py-2 px-2">Price</th>
                      <th className="text-left py-2 px-2">Stock</th>
                      <th className="text-left py-2 px-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {step1.colorVariants.map((variant) => (
                      <tr key={variant.id} className="border-b">
                        <td className="py-2 px-2 flex items-center gap-2">
                          <span
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: COLORS.find(c => c.name === variant.color)?.hex || '#ccc' }}
                          />
                          {variant.color}
                        </td>
                        <td className="py-2 px-2 font-mono">{variant.sku}</td>
                        <td className="py-2 px-2">₹{variant.price}</td>
                        <td className="py-2 px-2">{variant.stock}</td>
                        <td className="py-2 px-2">
                          <button
                            onClick={() => removeColorVariant(variant.id)}
                            className="text-red-600 hover:text-red-800"
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

            {/* Add color form */}
            <div className="grid grid-cols-5 gap-2 items-end">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Color</label>
                <select
                  value={newColorVariant.color}
                  onChange={(e) => setNewColorVariant({ ...newColorVariant, color: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                >
                  <option value="">Select Color</option>
                  {COLORS.map((color) => (
                    <option key={color.name} value={color.name}>
                      {color.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">SKU</label>
                <input
                  type="text"
                  value={newColorVariant.sku}
                  onChange={(e) => setNewColorVariant({ ...newColorVariant, sku: e.target.value.toUpperCase() })}
                  placeholder="e.g., PRD-BLK-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Price (₹)</label>
                <input
                  type="number"
                  value={newColorVariant.price || ''}
                  onChange={(e) => setNewColorVariant({ ...newColorVariant, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Stock</label>
                <input
                  type="number"
                  value={newColorVariant.stock || ''}
                  onChange={(e) => setNewColorVariant({ ...newColorVariant, stock: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
              <button
                onClick={addColorVariant}
                className="flex items-center justify-center gap-1 px-4 py-2 bg-white text-gray-900 rounded hover:bg-gray-50 text-sm"
              >
                <Plus size={16} /> Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-6 border-t">
        <button
          onClick={handleNext}
          disabled={!isStepValid(1)}
          className="flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-50 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Continue to Photos
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default AdminListings1;
