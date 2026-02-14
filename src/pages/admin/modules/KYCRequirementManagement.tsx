import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import {
  getAllKYCRequirements,
  createKYCRequirement,
  updateKYCRequirement,
  deleteKYCRequirement,
} from '../../../lib/adminService';

type KYCRequirement = any;

export const KYCRequirementManagement: React.FC = () => {
  const [requirements, setRequirements] = useState<KYCRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    country: '',
    registrationType: '',
    requiredDocuments: '',
    description: ''
  });

  // Fetch all KYC requirements
  useEffect(() => {
    loadRequirements();
  }, []);

  const loadRequirements = async () => {
    setLoading(true);
    const result = await getAllKYCRequirements();
    setRequirements(result.data || []);
    setLoading(false);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({ country: '', registrationType: '', requiredDocuments: '', description: '' });
    setShowForm(true);
  };

  const handleEdit = (req: KYCRequirement) => {
    setEditingId(req.id);
    setFormData({
      country: req.country,
      registrationType: req.registrationType,
      requiredDocuments: req.requiredDocuments,
      description: req.description || ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.country || !formData.registrationType || !formData.requiredDocuments) {
      alert('Please fill all required fields');
      return;
    }

    if (editingId) {
      // Update existing
      const updated = await updateKYCRequirement(
        editingId,
        {
          country: formData.country,
          registration_type: formData.registrationType,
          required_documents: formData.requiredDocuments,
          description: formData.description,
        }
      );
      if (updated) {
        alert('Updated successfully');
        loadRequirements();
        setShowForm(false);
      }
    } else {
      // Create new
      const created = await createKYCRequirement({
        country: formData.country,
        registration_type: formData.registrationType,
        required_documents: formData.requiredDocuments,
        description: formData.description,
      });
      if (created) {
        alert('Created successfully');
        loadRequirements();
        setShowForm(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this requirement?')) {
      const success = await deleteKYCRequirement(id);
      if (success) {
        alert('Deleted successfully');
        loadRequirements();
      }
    }
  };

  // Group by country for better display
  const groupedByCountry = requirements.reduce((acc, req) => {
    if (!acc[req.country]) acc[req.country] = [];
    acc[req.country].push(req);
    return acc;
  }, {} as Record<string, KYCRequirement[]>);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-xl font-bold text-gray-900">KYC Requirements</h1>
            <p className="text-gray-600 mt-2">Manage verification requirements by country and registration type</p>
          </div>
          <button
            onClick={handleAddNew}
            className="bg-blue-600 hover:bg-blue-700 text-gray-900 font-bold px-6 py-3 rounded-lg flex items-center gap-2"
          >
            <Plus size={20} /> Add Requirement
          </button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border-l-4 border-blue-600">
            <h2 className="text-xl font-bold mb-6">{editingId ? 'Edit Requirement' : 'Add New Requirement'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Country *</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="e.g., India"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Registration Type *</label>
                  <input
                    type="text"
                    value={formData.registrationType}
                    onChange={(e) => setFormData({ ...formData, registrationType: e.target.value })}
                    placeholder="e.g., Individual"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Required Documents *</label>
                <input
                  type="text"
                  value={formData.requiredDocuments}
                  onChange={(e) => setFormData({ ...formData, requiredDocuments: e.target.value })}
                  placeholder="e.g., PAN, GST"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional notes..."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-gray-900 font-bold px-6 py-2 rounded-lg"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-400 hover:bg-gray-500 text-gray-900 font-bold px-6 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Requirements List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-blue-600" size={24} />
          </div>
        ) : (
          <div className="space-y-8">
            {Object.keys(groupedByCountry).sort().map((country) => (
              <div key={country} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
                  <h3 className="text-lg font-bold text-gray-900">{country}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Registration Type</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Required Documents</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {groupedByCountry[country].map((req: KYCRequirement) => (
                        <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{req.registrationType}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{req.requiredDocuments}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{req.description || '—'}</td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <button
                              onClick={() => handleEdit(req)}
                              className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                            >
                              <Edit2 size={16} /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(req.id)}
                              className="text-red-600 hover:text-red-800 font-semibold inline-flex items-center gap-1"
                            >
                              <Trash2 size={16} /> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {requirements.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No KYC requirements found. Create one to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};
