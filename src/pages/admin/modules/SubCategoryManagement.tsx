import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import {
  fetchCategories,
  fetchSubCategories,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory as deleteSubCategoryApi,
} from '../../../lib/productService';

interface Category {
  id: string;
  name: string;
}

interface SubCategory {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export const SubCategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadSubcategories();
    }
  }, [selectedCategory]);

  const loadCategories = async () => {
    const { data } = await fetchCategories(false);
    if (data) {
      const cats = data.map((c: any) => ({ id: c.id, name: c.name }));
      setCategories(cats);
      if (cats.length > 0) setSelectedCategory(cats[0].id);
    }
    setLoading(false);
  };

  const loadSubcategories = async () => {
    setLoading(true);
    const { data } = await fetchSubCategories(selectedCategory);
    setSubcategories((data || []).map((s: any) => ({
      id: s.id,
      category_id: s.category_id,
      name: s.name,
      description: s.description,
      is_active: s.is_active,
    })));
    setLoading(false);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({ name: '', description: '' });
    setShowForm(true);
  };

  const handleEdit = (sub: SubCategory) => {
    setEditingId(sub.id);
    setFormData({ name: sub.name, description: sub.description || '' });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) { alert('Name is required'); return; }
    if (!selectedCategory) { alert('Please select a category'); return; }

    if (editingId) {
      const { error } = await updateSubCategory(editingId, { name: formData.name, description: formData.description });
      if (!error) {
        alert('Updated successfully');
        loadSubcategories();
        setShowForm(false);
      } else {
        alert(error);
      }
    } else {
      const { error } = await createSubCategory({ category_id: selectedCategory, name: formData.name, description: formData.description });
      if (!error) {
        alert('Created successfully');
        loadSubcategories();
        setShowForm(false);
      } else {
        alert(error);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this subcategory?')) {
      const { error } = await deleteSubCategoryApi(id);
      if (!error) {
        alert('Deleted successfully');
        loadSubcategories();
      } else {
        alert(error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Sub-Categories</h1>
            <p className="text-gray-600 mt-2">Manage subcategories for each category</p>
          </div>
          <button
            onClick={handleAddNew}
            className="bg-blue-600 hover:bg-blue-700 text-gray-900 font-bold px-6 py-3 rounded-lg flex items-center gap-2"
          >
            <Plus size={20} /> Add Sub-Category
          </button>
        </div>

        {/* Category Selector */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Select Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Choose a category...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border-l-4 border-blue-600">
            <h2 className="text-xl font-bold mb-6">
              {editingId ? 'Edit Sub-Category' : 'Add New Sub-Category'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Mobiles & Smartphones"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  rows={3}
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

        {/* Subcategories List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-blue-600" size={24} />
          </div>
        ) : !selectedCategory ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600 text-lg">Please select a category first</p>
          </div>
        ) : subcategories.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600 text-lg">No subcategories found for this category</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {subcategories.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{sub.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {sub.description || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${sub.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {sub.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(sub)}
                        className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                      >
                        <Edit2 size={16} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(sub.id)}
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
        )}
      </div>
    </div>
  );
};
