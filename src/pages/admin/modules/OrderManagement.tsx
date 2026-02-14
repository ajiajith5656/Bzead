import React, { useEffect, useState } from 'react';
import { Loading, ErrorMessage, SuccessMessage } from '../components/StatusIndicators';
import { Eye, DollarSign } from 'lucide-react';
import type { Order } from '../../../types';
import { logger } from '../../../utils/logger';
import * as adminApiService from '../../../lib/adminService';

interface PaginationState {
  page: number;
  limit: number;
  total: number;
}

export const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    total: 0,
  });

  useEffect(() => {
    fetchOrders();
  }, [pagination.page, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const result = await adminApiService.getAllOrders({
        limit: pagination.limit,
        offset: (pagination.page - 1) * pagination.limit,
        status: statusFilter || undefined,
      });
      if (result) {
        setOrders(result.orders);
        setPagination((prev) => ({ ...prev, total: result.total }));
        setError(null);
      }
    } catch (err) {
      setError('Failed to load orders');
      logger.error(err as Error, { context: 'Order management error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      setActionLoading(orderId);
      const result = await adminApiService.updateOrderStatus(orderId, newStatus);
      if (result) {
        setSuccess(`Order status updated to ${newStatus}`);
        fetchOrders();
        setShowDetails(false);
      }
    } catch (err) {
      setError('Failed to update order status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleProcessRefund = async (orderId: string, amount: number) => {
    try {
      setActionLoading(orderId);
      const result = await adminApiService.processRefund(
        orderId, 
        amount,
        'Admin-initiated refund: requested_by_customer'
      );
      if (result?.success) {
        setSuccess(`Refund processed successfully. Refund ID: ${result.refundId}`);
        fetchOrders();
        setShowRefundDialog(false);
      } else {
        setError(result?.error || 'Failed to process refund');
      }
    } catch (err) {
      setError('Failed to process refund');
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const statuses = ['new', 'processing', 'shipped', 'delivered', 'cancelled', 'return_requested', 'returned'];

  if (loading) return <Loading message="Loading orders..." />;

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-900">Order Management</h2>
        <p className="text-gray-600">Total Orders: {pagination.total}</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black"
        >
          <option value="">All Statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>{status.toUpperCase()}</option>
          ))}
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Order ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">User</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Payment</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{order.id.slice(0, 8)}...</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{order.user_id}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">${order.total.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        order.payment_status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.payment_status?.toUpperCase() || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowDetails(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No orders found
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

      {/* Order Details Modal */}
      {showDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
              <button onClick={() => setShowDetails(false)} className="text-2xl">✕</button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Order ID</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedOrder.status.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="text-lg font-semibold text-gray-900">${selectedOrder.total.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="text-lg font-semibold text-gray-900">{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-3">Update Status</p>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value)}
                  disabled={actionLoading === selectedOrder.id}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black disabled:opacity-50"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>{status.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                <div className="border-t pt-4">
                  <button
                    onClick={() => setShowRefundDialog(true)}
                    className="px-4 py-2 bg-red-600 text-gray-900 rounded-lg hover:bg-red-700 flex items-center gap-2"
                  >
                    <DollarSign size={18} />
                    Process Refund
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Dialog */}
      {showRefundDialog && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Process Refund</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Refund Amount</label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(parseFloat(e.target.value))}
                  max={selectedOrder.total}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black"
                />
                <p className="text-xs text-gray-600 mt-1">Max: ${selectedOrder.total.toFixed(2)}</p>
              </div>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => setShowRefundDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleProcessRefund(selectedOrder.id, refundAmount)}
                disabled={actionLoading === selectedOrder.id || refundAmount <= 0}
                className="px-4 py-2 bg-red-600 text-gray-900 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === selectedOrder.id ? 'Processing...' : 'Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
