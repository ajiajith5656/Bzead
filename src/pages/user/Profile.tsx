import React, { useState, useEffect } from 'react';
import logger from '../../utils/logger';
import { useNavigate } from 'react-router-dom';
import { LogOut, Loader2, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface CountryOption {
  id: string;
  country_name: string;
}

type EditingField = 'name' | 'email' | 'phone' | 'country' | 'password' | null;

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState<EditingField>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [countries, setCountries] = useState<CountryOption[]>([]);

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    countryId: '',
  });

  // Temp edit values for inline editing
  const [editValue, setEditValue] = useState('');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Fetch countries list
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const { data } = await supabase
          .from('countries')
          .select('id, country_name')
          .eq('is_active', true)
          .order('country_name');
        if (data) setCountries(data);
      } catch (err) {
        logger.error(err as Error, { context: 'Failed to load countries' });
      }
    };
    loadCountries();
  }, []);

  // Fetch user profile on mount (join with countries table)
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        if (!user?.id) {
          navigate('/login');
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('full_name, email, phone, country_id, countries(id, country_name)')
          .eq('id', user.id)
          .single();

        if (fetchError) {
          // Fallback to auth context data
          setProfileData({
            name: user.full_name || '',
            email: user.email || '',
            phone: user.phone || '',
            country: '',
            countryId: '',
          });
        } else if (data) {
          const countryData = data.countries as any;
          setProfileData({
            name: data.full_name || '',
            email: data.email || '',
            phone: data.phone || '',
            country: countryData?.country_name || '',
            countryId: data.country_id || '',
          });
        }
      } catch (err) {
        logger.error(err as Error, { context: 'Failed to fetch user profile' });
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, navigate]);

  const startEditing = (field: EditingField) => {
    setEditingField(field);
    setError(null);
    setSuccessMessage(null);
    if (field === 'name') setEditValue(profileData.name);
    else if (field === 'email') setEditValue(profileData.email);
    else if (field === 'phone') setEditValue(profileData.phone);
    else if (field === 'country') setEditValue(profileData.countryId);
    else if (field === 'password') {
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue('');
    setError(null);
  };

  const handleSaveField = async (field: 'name' | 'email' | 'phone' | 'country') => {
    try {
      setSaving(true);
      setError(null);

      if (!user?.id) throw new Error('User not authenticated');

      if (field === 'country') {
        // Update country_id FK
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ country_id: editValue || null })
          .eq('id', user.id);
        if (updateError) throw updateError;

        const selectedCountry = countries.find(c => c.id === editValue);
        setProfileData(prev => ({
          ...prev,
          country: selectedCountry?.country_name || '',
          countryId: editValue,
        }));
      } else if (field === 'email') {
        // Sync email with Supabase auth + profiles table
        const { error: authError } = await supabase.auth.updateUser({ email: editValue });
        if (authError) throw authError;

        const { error: profileError } = await supabase
          .from('profiles')
          .update({ email: editValue })
          .eq('id', user.id);
        if (profileError) throw profileError;

        setProfileData(prev => ({ ...prev, email: editValue }));
      } else {
        const updateMap: Record<string, string> = {
          name: 'full_name',
          phone: 'phone',
        };
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ [updateMap[field]]: editValue })
          .eq('id', user.id);
        if (updateError) throw updateError;

        setProfileData(prev => ({ ...prev, [field]: editValue }));
      }

      setSuccessMessage(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully!`);
      setEditingField(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      logger.error(err as Error, { context: `Failed to update ${field}` });
      setError(`Failed to update ${field}. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setSaving(true);
      setError(null);

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('New passwords do not match.');
        setSaving(false);
        return;
      }
      if (passwordData.newPassword.length < 6) {
        setError('Password must be at least 6 characters.');
        setSaving(false);
        return;
      }

      const { error: pwError } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (pwError) throw pwError;

      setSuccessMessage('Password updated successfully!');
      setEditingField(null);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      logger.error(err as Error, { context: 'Failed to change password' });
      setError('Failed to change password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <span className="text-lg text-gray-700">Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Login & Security</h1>
        <p className="text-gray-500 text-sm mb-6">Manage your personal information and account security</p>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <span className="text-green-800 text-sm">{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="ml-auto">
              <X className="h-4 w-4 text-green-600" />
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && editingField === null && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <span className="text-red-800 text-sm">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="h-4 w-4 text-red-600" />
            </button>
          </div>
        )}

        {/* Profile Rows Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-200">

          {/* ── Name ── */}
          <div className="px-6 py-5">
            {editingField === 'name' ? (
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900">Name</label>
                <input
                  type="text"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  autoFocus
                />
                {error && editingField === 'name' && (
                  <p className="text-red-600 text-xs">{error}</p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleSaveField('name')}
                    disabled={saving}
                    className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-gray-900 text-sm font-medium rounded-full transition disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={cancelEditing} className="px-5 py-2 text-sm text-gray-600 hover:text-gray-900 transition">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Name</p>
                  <p className="text-sm text-gray-600 mt-0.5">{profileData.name || '—'}</p>
                </div>
                <button
                  onClick={() => startEditing('name')}
                  className="px-5 py-1.5 border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* ── Email ── */}
          <div className="px-6 py-5">
            {editingField === 'email' ? (
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900">Email</label>
                <input
                  type="email"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  autoFocus
                />
                {error && editingField === 'email' && (
                  <p className="text-red-600 text-xs">{error}</p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleSaveField('email')}
                    disabled={saving}
                    className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-gray-900 text-sm font-medium rounded-full transition disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={cancelEditing} className="px-5 py-2 text-sm text-gray-600 hover:text-gray-900 transition">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Email</p>
                  <p className="text-sm text-gray-600 mt-0.5">{profileData.email || '—'}</p>
                </div>
                <button
                  onClick={() => startEditing('email')}
                  className="px-5 py-1.5 border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* ── Primary Mobile Number ── */}
          <div className="px-6 py-5">
            {editingField === 'phone' ? (
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900">Primary mobile number</label>
                <input
                  type="tel"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  autoFocus
                />
                {error && editingField === 'phone' && (
                  <p className="text-red-600 text-xs">{error}</p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleSaveField('phone')}
                    disabled={saving}
                    className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-gray-900 text-sm font-medium rounded-full transition disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={cancelEditing} className="px-5 py-2 text-sm text-gray-600 hover:text-gray-900 transition">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Primary mobile number</p>
                  <p className="text-sm text-gray-600 mt-0.5">{profileData.phone || '—'}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Quickly sign-in, easily recover passwords, and receive security notifications with this mobile number.
                  </p>
                </div>
                <button
                  onClick={() => startEditing('phone')}
                  className="px-5 py-1.5 border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50 transition flex-shrink-0"
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* ── Country ── */}
          <div className="px-6 py-5">
            {editingField === 'country' ? (
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900">Country</label>
                <select
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  autoFocus
                >
                  <option value="">Select a country</option>
                  {countries.map(c => (
                    <option key={c.id} value={c.id}>{c.country_name}</option>
                  ))}
                </select>
                {error && editingField === 'country' && (
                  <p className="text-red-600 text-xs">{error}</p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleSaveField('country')}
                    disabled={saving}
                    className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-gray-900 text-sm font-medium rounded-full transition disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={cancelEditing} className="px-5 py-2 text-sm text-gray-600 hover:text-gray-900 transition">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Country</p>
                  <p className="text-sm text-gray-600 mt-0.5">{profileData.country || 'Not set'}</p>
                </div>
                <button
                  onClick={() => startEditing('country')}
                  className="px-5 py-1.5 border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* ── Password ── */}
          <div className="px-6 py-5">
            {editingField === 'password' ? (
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900">Change Password</label>
                <input
                  type="password"
                  placeholder="Current password"
                  value={passwordData.currentPassword}
                  onChange={e => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  autoFocus
                />
                <input
                  type="password"
                  placeholder="New password"
                  value={passwordData.newPassword}
                  onChange={e => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordData.confirmPassword}
                  onChange={e => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                {error && editingField === 'password' && (
                  <p className="text-red-600 text-xs">{error}</p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={handleChangePassword}
                    disabled={saving}
                    className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-gray-900 text-sm font-medium rounded-full transition disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={cancelEditing} className="px-5 py-2 text-sm text-gray-600 hover:text-gray-900 transition">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Password</p>
                  <p className="text-sm text-gray-600 mt-0.5">••••••••••</p>
                </div>
                <button
                  onClick={() => startEditing('password')}
                  className="px-5 py-1.5 border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <div className="mt-8">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2 font-medium"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
