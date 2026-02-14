import React, { useState, useEffect } from 'react';
import { logger } from '../../utils/logger';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, Lock, Mail, Bell, Eye, EyeOff, Loader2, Check } from 'lucide-react';

interface UserSettings {
  email: string;
  fullName: string;
  phone: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  emailNotifications: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  twoFactorEnabled: boolean;
}

export const UserSettings: React.FC = () => {
  const { user, currentAuthUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');

  const [settings, setSettings] = useState<UserSettings>({
    email: '',
    fullName: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    emailNotifications: true,
    orderUpdates: true,
    promotions: false,
    twoFactorEnabled: false,
  });

  useEffect(() => {
    // Check if user is logged in
    if (!user && !currentAuthUser) {
      navigate('/login');
      return;
    }

    // Simulate fetching user settings
    const loadSettings = async () => {
      try {
        setLoading(true);
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        setSettings((prev) => ({
          ...prev,
          email: user?.email || currentAuthUser?.email || '',
          fullName: user?.full_name || 'User',
          phone: '+91 9876543210',
        }));
      } catch (error) {
        logger.error(error as Error, { context: 'Failed to load settings' });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user, currentAuthUser, navigate]);

  const handleProfileChange = (field: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setSuccessMessage('');
      setErrorMessage('');

      // Validate
      if (!settings.fullName.trim()) {
        setErrorMessage('Full name is required');
        setSaving(false);
        return;
      }

      if (!settings.phone.trim()) {
        setErrorMessage('Phone number is required');
        setSaving(false);
        return;
      }

      // Simulate saving
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setSaving(true);
      setSuccessMessage('');
      setErrorMessage('');

      // Validate
      if (!settings.currentPassword) {
        setErrorMessage('Current password is required');
        setSaving(false);
        return;
      }

      if (!settings.newPassword || settings.newPassword.length < 8) {
        setErrorMessage('New password must be at least 8 characters');
        setSaving(false);
        return;
      }

      if (settings.newPassword !== settings.confirmPassword) {
        setErrorMessage('Passwords do not match');
        setSaving(false);
        return;
      }

      // Simulate password change
      await new Promise((resolve) => setTimeout(resolve, 1200));

      setSuccessMessage('Password changed successfully!');
      setSettings((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setSaving(true);
      setSuccessMessage('');
      setErrorMessage('');

      // Simulate saving
      await new Promise((resolve) => setTimeout(resolve, 800));

      setSuccessMessage('Notification preferences updated!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Failed to update notifications');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-grow max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="h-8 w-8 text-amber-600" />
            <h1 className="text-2xl font-bold text-amber-600">Settings</h1>
          </div>
          <p className="text-gray-500">Manage your account preferences</p>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-900 border border-green-700 rounded-lg p-4 flex items-center gap-3 text-green-200 animate-fadeIn">
            <Check className="h-5 w-5" />
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 bg-red-900 border border-red-700 rounded-lg p-4 text-red-200 animate-fadeIn">
            {errorMessage}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 text-amber-600 animate-spin mr-3" />
            <span className="text-gray-900 text-lg">Loading settings...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Tabs */}
            <div className="lg:col-span-1">
              <div className="space-y-2 sticky top-24">
                {([
                  { id: 'profile' as const, label: 'Profile', icon: '👤' },
                  { id: 'security' as const, label: 'Security', icon: '🔒' },
                  { id: 'notifications' as const, label: 'Notifications', icon: '🔔' },
                ]).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-3 ${
                      activeTab === tab.id
                        ? 'bg-amber-500 text-black'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>

                  {/* Full Name */}
                  <div>
                    <label className="block text-gray-900 font-medium mb-2">Full Name</label>
                    <input
                      type="text"
                      value={settings.fullName}
                      onChange={(e) => handleProfileChange('fullName', e.target.value)}
                      className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Email (Read-only) */}
                  <div>
                    <label className="block text-gray-900 font-medium mb-2">Email Address</label>
                    <input
                      type="email"
                      value={settings.email}
                      disabled
                      className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-gray-500 placeholder-gray-500 opacity-60 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-gray-900 font-medium mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={settings.phone}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                      className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="bg-amber-500 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Settings</h2>

                  {/* Current Password */}
                  <div>
                    <label className="block text-gray-900 font-medium mb-2">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={settings.currentPassword}
                        onChange={(e) => handleProfileChange('currentPassword', e.target.value)}
                        className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-amber-500 pr-10"
                      />
                      <button
                        onClick={() => setShowPasswords((prev) => ({ ...prev, current: !prev.current }))}
                        className="absolute right-3 top-2.5 text-gray-500 hover:text-amber-600"
                      >
                        {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-gray-900 font-medium mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={settings.newPassword}
                        onChange={(e) => handleProfileChange('newPassword', e.target.value)}
                        placeholder="Min 8 characters"
                        className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-amber-500 pr-10"
                      />
                      <button
                        onClick={() => setShowPasswords((prev) => ({ ...prev, new: !prev.new }))}
                        className="absolute right-3 top-2.5 text-gray-500 hover:text-amber-600"
                      >
                        {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-gray-900 font-medium mb-2">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={settings.confirmPassword}
                        onChange={(e) => handleProfileChange('confirmPassword', e.target.value)}
                        className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-amber-500 pr-10"
                      />
                      <button
                        onClick={() => setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))}
                        className="absolute right-3 top-2.5 text-gray-500 hover:text-amber-600"
                      >
                        {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleChangePassword}
                    disabled={saving}
                    className="bg-amber-500 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Change Password
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Notification Preferences</h2>

                  {/* Email Notifications */}
                  <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="font-medium text-gray-900">Email Notifications</p>
                        <p className="text-sm text-gray-500">Receive email updates about your account</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => handleProfileChange('emailNotifications', e.target.checked)}
                      className="w-5 h-5 rounded cursor-pointer"
                    />
                  </div>

                  {/* Order Updates */}
                  <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="font-medium text-gray-900">Order Updates</p>
                        <p className="text-sm text-gray-500">Get notified about your order status</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.orderUpdates}
                      onChange={(e) => handleProfileChange('orderUpdates', e.target.checked)}
                      className="w-5 h-5 rounded cursor-pointer"
                    />
                  </div>

                  {/* Promotions */}
                  <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🎉</span>
                      <div>
                        <p className="font-medium text-gray-900">Promotional Offers</p>
                        <p className="text-sm text-gray-500">Receive special deals and offers</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.promotions}
                      onChange={(e) => handleProfileChange('promotions', e.target.checked)}
                      className="w-5 h-5 rounded cursor-pointer"
                    />
                  </div>

                  {/* Two Factor Authentication */}
                  <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Lock className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-500">Add an extra layer of security</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.twoFactorEnabled}
                      onChange={(e) => handleProfileChange('twoFactorEnabled', e.target.checked)}
                      className="w-5 h-5 rounded cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={handleSaveNotifications}
                    disabled={saving}
                    className="bg-amber-500 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Save Preferences
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
