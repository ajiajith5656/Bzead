import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { logger } from '../../../utils/logger';

interface AdminHeaderProps {
  adminName: string;
  adminId: string;
  onMenuToggle?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ adminName, adminId, onMenuToggle }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | null>(null);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setStatusMessage(null);
    setStatusType(null);
    try {
      await signOut();
      setStatusType('success');
      setStatusMessage('Logged out successfully. Redirecting...');
      setTimeout(() => {
        setShowLogoutDialog(false);
        navigate('/seller');
      }, 600);
    } catch (error) {
      logger.error(error as Error, { context: 'Admin logout error' });
      setStatusType('error');
      setStatusMessage('Failed to logout. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleCancel = () => {
    setIsCanceling(true);
    setStatusMessage(null);
    setStatusType(null);
    setTimeout(() => {
      setShowLogoutDialog(false);
      setIsCanceling(false);
    }, 400);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white text-gray-900 h-16 flex items-center justify-between px-6 z-40 shadow-lg">
        {/* Left: Hamburger Menu */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 hover:bg-gray-50 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>

        {/* Center: Logo/Title */}
        <div className="flex-1 text-center">
          <h1 className="text-xl font-bold tracking-wide">MetricFlux – Admin Panel</h1>
        </div>

        {/* Right: Admin Info & Logout */}
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex flex-col text-right text-sm">
            <span className="font-semibold">{adminName}</span>
            <span className="text-gray-500 text-xs">{adminId}</span>
          </div>

          <button
            onClick={() => setShowLogoutDialog(true)}
            className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
            aria-label="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Logout Confirmation Dialog */}
      {showLogoutDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Confirm Logout</h2>
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                disabled={isLoggingOut || isCanceling}
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>

            {statusMessage && (
              <div
                className={`mb-4 rounded-lg px-3 py-2 text-sm font-medium ${
                  statusType === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {statusMessage}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                disabled={isLoggingOut || isCanceling}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isCanceling ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block animate-spin">⏳</span>
                    Canceling...
                  </span>
                ) : (
                  'Cancel'
                )}
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut || isCanceling}
                className="px-4 py-2 bg-red-600 text-gray-900 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isLoggingOut ? (
                  <>
                    <span className="inline-block animate-spin">⏳</span>
                    Logging out...
                  </>
                ) : (
                  'Logout'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminHeader;
