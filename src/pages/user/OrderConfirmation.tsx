import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2, Package, MapPin, CreditCard, Download, ArrowRight, Loader2 } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { formatCurrency as fmtCurrency } from '../../utils/currency';
import { fetchOrderById } from '../../lib/orderService';

interface OrderData {
  id: string;
  customerId: string;
  customerEmail: string;
  totalAmount: number;
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: string;
  paymentIntentId: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
}

const OrderConfirmationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId } = useParams<{ orderId?: string }>();
  const { clearCart } = useCart();
  const { currency } = useCurrency();
  const [orderData, setOrderData] = useState<OrderData | undefined>(
    location.state?.orderData as OrderData | undefined
  );
  const [loading, setLoading] = useState(!orderData);

  useEffect(() => {
    // If we have order data from navigation state, clear cart and done
    if (location.state?.orderData) {
      clearCart();
      localStorage.removeItem('beauzead_checkout_shipping');
      return;
    }

    // If no state but we have an orderId param, fetch from Supabase
    const id = orderId || location.pathname.split('/').pop();
    if (id && id !== 'confirmation') {
      const loadOrder = async () => {
        try {
          setLoading(true);
          const result = await fetchOrderById(id);
          if (result.data) {
            const d = result.data;
            const items = (d.order_items || []).map((item: any) => ({
              productId: item.product_id,
              productName: item.product_name,
              quantity: item.quantity,
              price: item.price,
            }));
            setOrderData({
              id: d.id,
              customerId: d.user_id,
              customerEmail: '',
              totalAmount: d.total_amount,
              orderStatus: d.status || 'processing',
              paymentStatus: d.payment_status || 'completed',
              paymentIntentId: d.payment_intent_id || '',
              items,
              shippingAddress: d.shipping_address || { street: '', city: '', state: '', postalCode: '', country: '' },
              createdAt: d.created_at,
              updatedAt: d.updated_at || d.created_at,
            });
          } else {
            navigate('/');
          }
        } catch {
          navigate('/');
        } finally {
          setLoading(false);
        }
      };
      loadOrder();
    } else if (!orderData) {
      navigate('/');
    }
  }, [orderId, location.state, location.pathname, navigate, clearCart, orderData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin mr-3" />
        <span className="text-lg text-gray-700">Loading order details...</span>
      </div>
    );
  }

  if (!orderData) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-blue-100 text-blue-700';
      case 'shipped':
        return 'bg-purple-100 text-purple-700';
      case 'delivered':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center mb-6">
          <CheckCircle2 size={80} className="mx-auto mb-4 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-lg text-gray-600 mb-4">
            Thank you for your purchase. Your order has been successfully placed.
          </p>
          <div className="inline-block bg-gray-100 rounded-lg px-6 py-3">
            <p className="text-sm text-gray-600 font-semibold">Order Number</p>
            <p className="text-2xl font-bold text-gray-900">{orderData.id}</p>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Confirmation email sent to <span className="font-semibold">{orderData.customerEmail}</span>
          </p>
        </div>

        {/* Order Status */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Order Status</h2>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(orderData.orderStatus)}`}>
              {orderData.orderStatus.charAt(0).toUpperCase() + orderData.orderStatus.slice(1)}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Placed on {formatDate(orderData.createdAt)}
          </p>
          
          {/* Order Timeline */}
          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={20} className="text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Order Placed</p>
                <p className="text-sm text-gray-600">Your order has been received and is being processed</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                orderData.orderStatus === 'processing' || orderData.orderStatus === 'shipped' || orderData.orderStatus === 'delivered'
                  ? 'bg-blue-100'
                  : 'bg-gray-100'
              }`}>
                <Package size={20} className={
                  orderData.orderStatus === 'processing' || orderData.orderStatus === 'shipped' || orderData.orderStatus === 'delivered'
                    ? 'text-blue-600'
                    : 'text-gray-500'
                } />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Processing</p>
                <p className="text-sm text-gray-600">Your order is being prepared for shipment</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                orderData.orderStatus === 'shipped' || orderData.orderStatus === 'delivered'
                  ? 'bg-purple-100'
                  : 'bg-gray-100'
              }`}>
                <ArrowRight size={20} className={
                  orderData.orderStatus === 'shipped' || orderData.orderStatus === 'delivered'
                    ? 'text-purple-600'
                    : 'text-gray-500'
                } />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Shipped</p>
                <p className="text-sm text-gray-600">Your order is on its way</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                orderData.orderStatus === 'delivered'
                  ? 'bg-green-100'
                  : 'bg-gray-100'
              }`}>
                <CheckCircle2 size={20} className={
                  orderData.orderStatus === 'delivered'
                    ? 'text-green-600'
                    : 'text-gray-500'
                } />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Delivered</p>
                <p className="text-sm text-gray-600">Your order has been delivered</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Order Details</h2>
          
          {/* Items */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Items</h3>
            <div className="space-y-3">
              {orderData.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center pb-3 border-b border-gray-200 last:border-0 last:pb-0">
                  <div>
                    <p className="font-semibold text-gray-900">{item.productName}</p>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-bold text-gray-900">{fmtCurrency(item.price * item.quantity, currency)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={20} className="text-blue-600" />
              <h3 className="font-semibold text-gray-900">Shipping Address</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">{orderData.shippingAddress.street}</p>
              <p className="text-sm text-gray-600">
                {orderData.shippingAddress.city}, {orderData.shippingAddress.state}{' '}
                {orderData.shippingAddress.postalCode}
              </p>
              <p className="text-sm text-gray-600">{orderData.shippingAddress.country}</p>
            </div>
          </div>

          {/* Payment Information */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard size={20} className="text-blue-600" />
              <h3 className="font-semibold text-gray-900">Payment Information</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-600">Payment Status</p>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  {orderData.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">Transaction ID</p>
                <p className="text-sm font-mono text-gray-700">{orderData.paymentIntentId}</p>
              </div>
            </div>
          </div>

          {/* Order Total */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Paid</span>
              <span className="text-blue-600">{fmtCurrency(orderData.totalAmount, currency)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/orders')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-gray-900 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Package size={18} />
            View All Orders
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors"
          >
            Continue Shopping
          </button>
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Download size={18} />
            Print Receipt
          </button>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
          <p className="text-sm text-blue-700 mb-4">
            If you have any questions about your order, please don't hesitate to contact our customer support team.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="mailto:support@metricfluxsolutions.shop"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              support@metricfluxsolutions.shop
            </a>
            <span className="text-gray-500">|</span>
            <a
              href="tel:+1234567890"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              +1 (234) 567-890
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
