import React, { useEffect, useState } from 'react';
import { logger } from '../../../utils/logger';
import { Loading, ErrorMessage } from '../components/StatusIndicators';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { Promotion } from '../../../types';
import * as adminApiService from '../../../lib/adminService';

export const PromotionManagement: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const result = await adminApiService.getAllPromotions();
      if (result) {
        setPromotions((result.promotions || []) as Promotion[]);
        setError(null);
      }
    } catch (err) {
      setError('Failed to load promotions');
      logger.error(err as Error, { context: 'Promotion management error' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading message="Loading promotions..." />;

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex gap-2">
          <ErrorMessage message={error} />
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Promotions & Offers</h2>
        <button className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-50 flex items-center gap-2">
          <Plus size={20} />
          Create Promo
        </button>
      </div>

      {/* Promotions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Discount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Applicable To</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Expiry</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {promotions.length > 0 ? (
                promotions.map((promo) => (
                  <tr key={promo.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{promo.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {promo.discount_value}
                      {promo.discount_type === 'percentage' ? '%' : ' $'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{promo.applicable_to.toUpperCase()}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(promo.end_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        promo.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {promo.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit size={18} />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No promotions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PromotionManagement;
