import React, { useEffect, useState } from 'react';
import { Loading } from '../components/StatusIndicators';
import { Search, Trash2, Ban, X } from 'lucide-react';
import type { User } from '../../../types';
import { logger } from '../../../utils/logger';
import * as adminApi from '../../../lib/adminService';

interface PaginationState {
  page: number;
  limit: number;
  total: number;
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfileType, setSelectedProfileType] = useState<string>('');
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 50,
    total: 0,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const result = await adminApi.getAllUsers({
        limit: pagination.limit,
        offset: (pagination.page - 1) * pagination.limit,
        search: searchTerm || undefined,
      });

      if (result) {
        setUsers(result.users as User[]);
        setPagination((prev) => ({ ...prev, total: result.total }));
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
      logger.error(err as Error, { context: 'Error fetching users' });
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: string) => {
    try {
      setActionLoading(userId);
      await adminApi.banUser(userId);
      setSuccess('User banned successfully');
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to ban user');
      logger.error(err as Error, { context: 'Error banning user' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      setActionLoading(userId);
      await adminApi.unbanUser(userId);
      setSuccess('User unbanned successfully');
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to unban user');
      logger.error(err as Error, { context: 'Error unbanning user' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      setActionLoading(userId);
      await adminApi.deleteUser(userId);
      setSuccess('User deleted successfully');
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
      logger.error(err as Error, { context: 'Error deleting user' });
    } finally {
      setActionLoading(null);
      setShowDeleteConfirm(null);
    }
  };

  // Client-side filtering
  const filteredUsers = users.filter(user => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
    const matchesSearch = !searchTerm || 
      fullName.includes(searchTerm.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesProfileType = !selectedProfileType || user.role === selectedProfileType;

    return matchesSearch && matchesProfileType;
  });

  const totalPages = Math.ceil(filteredUsers.length / pagination.limit);

  if (loading) return <Loading message="Loading users..." />;

  return (
    <div className="space-y-4">
      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex justify-between items-center">
          <span className="text-red-800">{error}</span>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <X size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex justify-between items-center">
          <span className="text-green-800">{success}</span>
          <button onClick={() => setSuccess(null)} className="text-green-600 hover:text-green-800">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Total Users: {filteredUsers.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <select
            value={selectedProfileType}
            onChange={(e) => {
              setSelectedProfileType(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="seller">Seller</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Purchases</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.userId || user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'admin'
                          ? 'bg-red-100 text-red-800'
                          : user.role === 'seller'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role?.toUpperCase() || 'USER'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.total_purchases || 0}</td>
                    <td className="px-4 py-3 text-sm">
                      {user.is_banned ? (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                          Banned
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (user.is_banned) {
                              handleUnbanUser(user.userId || user.id);
                            } else {
                              handleBanUser(user.userId || user.id);
                            }
                          }}
                          disabled={actionLoading === (user.userId || user.id)}
                          className={`p-2 rounded-lg disabled:opacity-50 ${
                            user.is_banned
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-orange-600 hover:bg-orange-50'
                          }`}
                          title={user.is_banned ? 'Unban User' : 'Ban User'}
                        >
                          <Ban size={18} />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(user.userId || user.id)}
                          disabled={actionLoading === (user.userId || user.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                          title="Delete User"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow p-4">
          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={pagination.page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-sm text-gray-600">
            Page {pagination.page} of {totalPages}
          </span>

          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
            disabled={pagination.page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Confirm Delete</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this user? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(showDeleteConfirm)}
                disabled={actionLoading === showDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-gray-900 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === showDeleteConfirm ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
