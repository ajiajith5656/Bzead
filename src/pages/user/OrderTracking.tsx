import React, { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import type { OrderData } from '../../types';
import { fetchOrdersByUser } from '../../lib/orderService';

interface OrderTrackingProps {
  customerId: string;
  onOrderSelect?: (order: OrderData) => void;
}

const OrderTracking: React.FC<OrderTrackingProps> = ({ customerId, onOrderSelect }) => {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const customerOrders = await fetchOrdersByUser(customerId);
        setOrders(customerOrders as unknown as OrderData[]);
      } catch (err) {
        setError(`Failed to load orders: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [customerId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Loader2 size={24} className="text-blue-600 animate-spin" />;
      case 'shipped':
        return <Truck size={24} className="text-orange-600" />;
      case 'delivered':
        return <CheckCircle2 size={24} className="text-green-600" />;
      case 'pending':
        return <Package size={24} className="text-yellow-600" />;
      case 'cancelled':
        return <AlertCircle size={24} className="text-red-600" />;
      default:
        return <Package size={24} className="text-gray-600" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-orange-100 text-orange-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle size={24} className="text-red-600 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-red-900">Error Loading Orders</h3>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package size={36} className="mx-auto mb-4 text-gray-500" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Yet</h3>
        <p className="text-gray-600">Start shopping to place your first order!</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 gap-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => {
              setSelectedOrder(order);
              if (onOrderSelect) onOrderSelect(order);
            }}
          >
            <div className="p-6">
              {/* Order Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order #{order.id.slice(-8).toUpperCase()}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">${order.totalAmount.toFixed(2)}</p>
                  <span
                    className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(order.orderStatus)}`}
                  >
                    {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                  </span>
                </div>
              </div>

              {/* Items Summary */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  {order.items.length} item(s)
                </p>
                <div className="space-y-1">
                  {order.items.slice(0, 2).map((item: any) => (
                    <p key={item.productId} className="text-sm text-gray-600">
                      • {item.productName} × {item.quantity}
                    </p>
                  ))}
                  {order.items.length > 2 && (
                    <p className="text-sm text-gray-500">
                      + {order.items.length - 2} more item(s)
                    </p>
                  )}
                </div>
              </div>

              {/* Status & Tracking */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(order.orderStatus)}
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {order.orderStatus === 'pending' && 'Order Confirmed'}
                      {order.orderStatus === 'processing' && 'Processing Your Order'}
                      {order.orderStatus === 'shipped' && 'On The Way'}
                      {order.orderStatus === 'delivered' && 'Delivered'}
                      {order.orderStatus === 'cancelled' && 'Cancelled'}
                    </p>
                    {order.trackingNumber && (
                      <p className="text-xs text-gray-600">
                        Tracking: {order.trackingNumber}
                      </p>
                    )}
                  </div>
                </div>

                {/* Payment Status */}
                <div className="text-right">
                  <p className={`text-xs font-semibold ${getPaymentStatusColor(order.paymentStatus)}`}>
                    {order.paymentStatus === 'completed' && '✓ Paid'}
                    {order.paymentStatus === 'pending' && 'Payment Pending'}
                    {order.paymentStatus === 'failed' && '✗ Payment Failed'}
                  </p>
                </div>
              </div>
            </div>

            {/* Expanded View */}
            {selectedOrder?.id === order.id && (
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-6 mb-4">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">
                      Shipping Address
                    </h4>
                    <p className="text-sm text-gray-900">
                      {order.shippingAddress.street}
                      <br />
                      {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                      {order.shippingAddress.postalCode}
                      <br />
                      {order.shippingAddress.country}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">
                      Order Details
                    </h4>
                    <p className="text-sm text-gray-900">
                      <strong>Order ID:</strong> {order.id}
                      <br />
                      <strong>Items:</strong> {order.items.length}
                      <br />
                      <strong>Payment:</strong>{' '}
                      <span className={getPaymentStatusColor(order.paymentStatus)}>
                        {order.paymentStatus}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Order Timeline */}
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase mb-3">Timeline</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={16} className="text-green-600" />
                      <span className="text-sm text-gray-700">
                        Order Placed - {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {order.orderStatus !== 'pending' && (
                      <div className="flex items-center gap-3">
                        {order.orderStatus === 'processing' || order.orderStatus === 'shipped' || order.orderStatus === 'delivered' ? (
                          <CheckCircle2 size={16} className="text-blue-600" />
                        ) : (
                          <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                        )}
                        <span className="text-sm text-gray-700">Processing</span>
                      </div>
                    )}
                    {(order.orderStatus === 'shipped' || order.orderStatus === 'delivered') && (
                      <div className="flex items-center gap-3">
                        <CheckCircle2 size={16} className="text-orange-600" />
                        <span className="text-sm text-gray-700">Shipped</span>
                      </div>
                    )}
                    {order.orderStatus === 'delivered' && (
                      <div className="flex items-center gap-3">
                        <CheckCircle2 size={16} className="text-green-600" />
                        <span className="text-sm text-gray-700">
                          Delivered - {order.completedAt ? new Date(order.completedAt).toLocaleDateString() : 'Recently'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items Details */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 uppercase mb-3">Items</h4>
                  <div className="space-y-2">
                    {order.items.map((item: any) => (
                      <div key={item.productId} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          {item.productName} × {item.quantity}
                        </span>
                        <span className="font-semibold text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderTracking;
