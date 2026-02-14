import React, { useEffect, useState } from 'react';
import { logger } from '../../../utils/logger';
import { Loading, ErrorMessage, SuccessMessage } from '../components/StatusIndicators';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { Banner } from '../../../types';
import * as adminApiService from '../../../lib/adminService';

export const BannerManagement: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', image_url: '', link: '', is_active: true, position: 0 });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const result = await adminApiService.getAllBanners();
      if (result) {
        setBanners(result.banners.sort((a, b) => a.position - b.position));
        setError(null);
      }
    } catch (err) {
      setError('Failed to load banners');
      logger.error(err as Error, { context: 'Banner management error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setActionLoading('save');
      if (editingId) {
        const result = await adminApiService.updateBanner(editingId, formData);
        if (result) {
          setSuccess('Banner updated successfully');
          fetchBanners();
        }
      } else {
        const result = await adminApiService.createBanner(formData);
        if (result) {
          setSuccess('Banner created successfully');
          fetchBanners();
        }
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ title: '', image_url: '', link: '', is_active: true, position: 0 });
    } catch (err) {
      setError('Failed to save banner');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (bannerId: string) => {
    try {
      setActionLoading(bannerId);
      const success = await adminApiService.deleteBanner(bannerId);
      if (success) {
        setSuccess('Banner deleted successfully');
        fetchBanners();
      }
    } catch (err) {
      setError('Failed to delete banner');
    } finally {
      setActionLoading(null);
    }
  };

  const startEdit = (banner: Banner) => {
    setEditingId(banner.id);
    setFormData({
      title: banner.title,
      image_url: banner.image_url,
      link: banner.link || '',
      is_active: banner.is_active,
      position: banner.position,
    });
    setShowForm(true);
  };

  if (loading) return <Loading message="Loading banners..." />;

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex gap-2">
          <ErrorMessage message={error} />
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {success && (
        <div className="flex gap-2">
          <SuccessMessage message={success} />
          <button onClick={() => setSuccess(null)}>✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Banner Management</h2>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ title: '', image_url: '', link: '', is_active: true, position: 0 });
            setShowForm(true);
          }}
          className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <Plus size={20} />
          Add Banner
        </button>
      </div>

      {/* Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {banners.length > 0 ? (
          banners.map((banner) => (
            <div key={banner.id} className="bg-white rounded-lg shadow overflow-hidden">
              <img
                src={banner.image_url}
                alt={banner.title}
                className="w-full h-40 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900">{banner.title}</h3>
                <p className="text-sm text-gray-600 mt-1">Position: {banner.position}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    banner.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {banner.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(banner)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      disabled={actionLoading === banner.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500 py-8">No banners found</p>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingId ? 'Edit Banner' : 'Add New Banner'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Banner Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link (Optional)</label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input
                  type="number"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active</label>
              </div>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={actionLoading === 'save' || !formData.title || !formData.image_url}
                className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {actionLoading === 'save' ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerManagement;
