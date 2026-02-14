import React, { useState, useEffect } from 'react';
import logger from '../../utils/logger';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, Truck, RotateCcw, Download, Loader2 } from 'lucide-react';
import { fetchOrderById } from '../../lib/orderService';
import { useCurrency } from '../../contexts/CurrencyContext';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image: string;
}

interface Order {
  id: string;
  date: string;
  status: string;
  total: number;
  subtotal: number;
  shipping: number;
  tax: number;
  paymentMethod: string;
  items: OrderItem[];
}

interface ShipmentTracking {
  status: 'pending' | 'shipped' | 'in_transit' | 'delivered';
  estimatedDelivery: string;
  carrier: string;
  trackingNumber: string;
  lastUpdate: string;
}

export const OrderDetails: React.FC = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState<'items' | 'tracking' | 'invoice'>('items');
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [shipping, setShipping] = useState<ShipmentTracking | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) return;

      try {
        setLoading(true);

        // Fetch order from Supabase
        const result = await fetchOrderById(orderId);
        const orderData = result.data;

        if (orderData) {
          // Parse items from JSON
          let orderItems: OrderItem[] = [];
          try {
            const items = typeof orderData.items === 'string' ? JSON.parse(orderData.items) : orderData.items;
            orderItems = Array.isArray(items)
              ? items.map((item: any, index: number) => ({
                  id: `${index}`,
                  productId: item.productId,
                  productName: item.productName,
                  quantity: item.quantity,
                  price: item.price,
                  image: item.image || 'https://via.placeholder.com/150',
                }))
              : [];
          } catch (e) {
            logger.error(e as Error, { context: 'Failed to parse order items' });
            orderItems = [];
          }

          // Format order data
          const formattedOrder: Order = {
            id: orderData.id,
            date: new Date(orderData.created_at).toLocaleDateString('en-IN'),
            status: orderData.status,
            total: orderData.total_amount,
            subtotal: orderData.subtotal,
            shipping: orderData.shipping_cost,
            tax: orderData.tax_amount,
            paymentMethod: orderData.payment_method || 'Card',
            items: orderItems,
          };

          setOrder(formattedOrder);

          // Set shipping tracking info
          setShipping({
            status: orderData.status === 'delivered' ? 'delivered' : 'in_transit',
            estimatedDelivery: new Date(orderData.updated_at).toLocaleDateString('en-IN'),
            carrier: orderData.courier_partner || orderData.carrier || 'Courier Partner',
            trackingNumber: orderData.tracking_number || 'N/A',
            lastUpdate: new Date(orderData.updated_at).toLocaleString('en-IN'),
          });
        }
      } catch (error) {
        logger.error(error as Error, { context: 'Failed to fetch order details' });
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const handleInitiateReturn = (itemId: string) => {
    logger.log('Return initiated', { itemId });
    // TODO: Implement return initiation with backend API
  };

  const handleDownloadInvoice = () => {
    logger.log('Invoice downloaded', { orderId });
    // TODO: Implement invoice download from backend
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'shipped': 'bg-blue-100 text-blue-800',
      'in_transit': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'pending': 'Pending',
      'shipped': 'Shipped',
      'in_transit': 'In Transit',
      'delivered': 'Delivered'
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mr-3" />
            <span className="text-lg text-gray-700">Loading order details...</span>
          </div>
        ) : !order ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Package className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-6">We couldn't find the order you're looking for.</p>
            <button
              onClick={() => navigate('/user/orders')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Orders
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
                  <p className="text-gray-600 mt-2">Order ID: {order.id}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                  <p className="text-gray-600 text-sm mt-2">Order Date: {order.date}</p>
                </div>
              </div>
            </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('items')}
              className={`flex-1 py-4 px-6 font-medium flex items-center justify-center gap-2 ${
                activeTab === 'items'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package className="w-4 h-4" />
              Items
            </button>
            <button
              onClick={() => setActiveTab('tracking')}
              className={`flex-1 py-4 px-6 font-medium flex items-center justify-center gap-2 ${
                activeTab === 'tracking'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Truck className="w-4 h-4" />
              Tracking
            </button>
            <button
              onClick={() => setActiveTab('invoice')}
              className={`flex-1 py-4 px-6 font-medium flex items-center justify-center gap-2 ${
                activeTab === 'invoice'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Download className="w-4 h-4" />
              Invoice
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Items Tab */}
            {activeTab === 'items' && (
              <div className="space-y-6">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4 pb-6 border-b last:border-b-0">
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.productName}</h3>
                      <p className="text-gray-600 text-sm mt-1">Quantity: {item.quantity}</p>
                      <p className="text-gray-600 text-sm">Price: {formatPrice(item.price)}</p>
                      <p className="font-semibold text-gray-900 mt-2">
                        Total: {formatPrice(item.price * item.quantity)}
                      </p>
                      <button
                        onClick={() => handleInitiateReturn(item.id)}
                        className="mt-3 flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Initiate Return
                      </button>
                    </div>
                  </div>
                ))}

                {/* Order Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-semibold">{formatPrice(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="font-semibold">{formatPrice(order.shipping)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax:</span>
                      <span className="font-semibold">{formatPrice(order.tax)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                      <span className="text-gray-900 font-semibold">Total:</span>
                      <span className="text-lg font-bold text-gray-900">{formatPrice(order.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tracking Tab */}
            {activeTab === 'tracking' && shipping && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Truck className="w-6 h-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Shipment Status</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Carrier:</span>
                      <span className="font-semibold">{shipping.carrier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tracking Number:</span>
                      <span className="font-mono text-blue-600 font-semibold">{shipping.trackingNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(shipping.status)}`}>
                        {getStatusLabel(shipping.status)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estimated Delivery:</span>
                      <span className="font-semibold">{shipping.estimatedDelivery}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Update:</span>
                      <span className="text-sm text-gray-600">{shipping.lastUpdate}</span>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Delivery Timeline</h3>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                        <div className="w-0.5 h-12 bg-green-600 my-2"></div>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Order Placed</p>
                        <p className="text-sm text-gray-600">January 15, 2024</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                        <div className="w-0.5 h-12 bg-green-600 my-2"></div>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Order Shipped</p>
                        <p className="text-sm text-gray-600">January 16, 2024</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">In Transit</p>
                        <p className="text-sm text-gray-600">Expected January 18, 2024</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Invoice Tab */}
            {activeTab === 'invoice' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-gray-700 mb-4">
                    Download your order invoice for your records.
                  </p>
                  <button
                    onClick={handleDownloadInvoice}
                    className="bg-blue-600 text-gray-900 px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Invoice (PDF)
                  </button>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Invoice Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Invoice Date:</span>
                      <span className="font-semibold">{order.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Invoice ID:</span>
                      <span className="font-semibold">INV-{order.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-semibold">{order.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between pt-4 border-t">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="text-lg font-bold text-gray-900">{formatPrice(order.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate('/user/orders')}
          className="mt-6 text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Back to Orders
        </button>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;
