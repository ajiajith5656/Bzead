import React, { useState, useEffect } from 'react';
import { logger } from '../../utils/logger';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, Loader2, Package, Tag, AlertCircle } from 'lucide-react';
import { getNotifications, markNotificationRead, deleteNotification } from '../../lib/adminService';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'promotion' | 'system' | 'review';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export const NotificationsPage: React.FC = () => {
  const { user, currentAuthUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    // Check if user is logged in
    if (!user && !currentAuthUser) {
      navigate('/login');
      return;
    }

    // Load notifications from orders
    loadNotifications();
  }, [user, currentAuthUser, navigate]);

  const loadNotifications = async () => {
    try {
      setLoading(true);

      const userId = user?.id || currentAuthUser?.username;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Fetch notifications from Supabase
      const result = await getNotifications(userId);
      const fetchedNotifications: Notification[] = (result.data || []).map((n: any) => ({
        id: n.id,
        title: n.title || 'Notification',
        message: n.message || n.body || '',
        type: (n.type || 'system') as 'order' | 'promotion' | 'system' | 'review',
        timestamp: n.created_at || new Date().toISOString(),
        read: n.is_read || false,
        actionUrl: n.action_url,
      }));

      setNotifications(fetchedNotifications);
    } catch (error) {
      logger.error(error as Error, { context: 'Failed to load notifications' });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const filteredNotifications =
    selectedFilter === 'all'
      ? notifications
      : selectedFilter === 'unread'
        ? notifications.filter((n) => !n.read)
        : notifications.filter((n) => n.read);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package className="w-5 h-5 text-blue-400" />;
      case 'promotion':
        return <Tag className="w-5 h-5 text-green-400" />;
      case 'system':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <span className="text-lg text-gray-700">Loading notifications...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-600 mt-2">Stay updated with your orders and promotions</p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex gap-4 border-b">
            {(['all', 'unread', 'read'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-2 font-medium transition-colors ${
                  selectedFilter === filter
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                {filter === 'unread' && unreadCount > 0 && (
                  <span className="ml-2 bg-red-600 text-gray-900 text-xs rounded-full px-2 py-0.5">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white rounded-lg shadow p-4 border-l-4 transition-all ${
                    notification.read
                      ? 'border-gray-300'
                      : 'border-blue-600 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`flex-shrink-0 mt-1 ${!notification.read && 'text-blue-600'}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                          {notification.title}
                        </h3>
                        <p className={`text-sm mt-1 ${notification.read ? 'text-gray-600' : 'text-gray-700'}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">{formatTime(notification.timestamp)}</p>
                        {notification.actionUrl && (
                          <button
                            onClick={() => navigate(notification.actionUrl!)}
                            className="text-blue-600 text-sm font-medium hover:text-blue-700 mt-2"
                          >
                            View Details →
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-blue-600 transition-colors"
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Bell className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-gray-900 mb-2">No Notifications</h2>
                <p className="text-gray-600">
                  You're all caught up! Check back later for updates.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default NotificationsPage;
