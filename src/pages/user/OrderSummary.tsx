import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, ShoppingBag, Edit2, Package } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';

interface ShippingData {
  street: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  fullName: string;
  phone: string;
  email: string;
  notes?: string;
}

const OrderSummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const { items } = useCart();
  const { user, currentAuthUser } = useAuth();
  const { formatPrice, convertPrice } = useCurrency();
  const [shippingData, setShippingData] = useState<ShippingData | null>(null);
  const [shippingCost] = useState(10); // Fixed shipping cost, can be dynamic
  const [taxRate] = useState(0.08); // 8% tax rate

  useEffect(() => {
    // Load shipping data from localStorage
    const savedShipping = localStorage.getItem('beauzead_checkout_shipping');
    if (savedShipping) {
      setShippingData(JSON.parse(savedShipping));
    } else {
      // Redirect back to shipping if no address
      navigate('/checkout/shipping');
    }

    // Redirect if cart is empty
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items, navigate]);

  // Convert totalPrice (already in user currency from CartContext via convertPrice)
  const convertedTotal = items.reduce((sum, item) => sum + convertPrice(item.product.price, item.product.currency) * item.quantity, 0);
  const convertedShipping = convertPrice(shippingCost, 'USD');

  const calculateTax = () => {
    return convertedTotal * taxRate;
  };

  const calculateTotal = () => {
    return convertedTotal + convertedShipping + calculateTax();
  };

  const handleProceedToPayment = () => {
    // Navigate to payment page with all order data
    navigate('/checkout/payment', {
      state: {
        items: items.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          sellerId: item.product.seller_id, // CRITICAL: Required for seller payouts
        })),
        totalAmount: calculateTotal(),
        shippingAddress: shippingData ? {
          street: shippingData.street,
          city: shippingData.city,
          state: shippingData.state,
          postalCode: shippingData.postalCode,
          country: shippingData.country,
        } : undefined,
        customerId: user?.id || currentAuthUser?.username || 'guest',
        customerEmail: shippingData?.email || user?.email || '',
        customerName: shippingData?.fullName || user?.full_name || user?.first_name || '',
      },
    });
  };

  if (!shippingData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <button
          onClick={() => navigate('/checkout/shipping')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-semibold"
        >
          <ArrowLeft size={20} />
          Back to Shipping
        </button>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-green-600 text-gray-900 flex items-center justify-center font-bold mb-2">
                ✓
              </div>
              <span className="text-sm font-semibold text-green-600">Shipping</span>
            </div>
            <div className="flex-1 h-1 bg-blue-600 mx-4"></div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-gray-900 flex items-center justify-center font-bold mb-2">
                2
              </div>
              <span className="text-sm font-semibold text-blue-600">Review</span>
            </div>
            <div className="flex-1 h-1 bg-gray-300 mx-4"></div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold mb-2">
                3
              </div>
              <span className="text-sm text-gray-500">Payment</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address Card */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <MapPin size={24} className="text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Shipping Address</h2>
                </div>
                <button
                  onClick={() => navigate('/checkout/shipping')}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-semibold"
                >
                  <Edit2 size={16} />
                  Edit
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-1">{shippingData.fullName}</p>
                <p className="text-sm text-gray-600">{shippingData.phone}</p>
                <p className="text-sm text-gray-600">{shippingData.email}</p>
                <p className="text-sm text-gray-600 mt-2">{shippingData.street}</p>
                {shippingData.street2 && (
                  <p className="text-sm text-gray-600">{shippingData.street2}</p>
                )}
                <p className="text-sm text-gray-600">
                  {shippingData.city}, {shippingData.state} {shippingData.postalCode}
                </p>
                <p className="text-sm text-gray-600">{shippingData.country}</p>
                {shippingData.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 font-semibold mb-1">Delivery Notes:</p>
                    <p className="text-sm text-gray-600">{shippingData.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items Card */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <ShoppingBag size={24} className="text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Order Items</h2>
              </div>
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0"
                  >
                    {item.product.images && item.product.images.length > 0 ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Package size={32} className="text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                      <p className="text-sm text-gray-600">
                        {String(item.product.category || 'Uncategorized')}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatPrice(item.product.price * item.quantity, item.product.currency)}</p>
                      <p className="text-xs text-gray-500">{formatPrice(item.product.price, item.product.currency)} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal ({items.length} items)</span>
                  <span className="font-semibold text-gray-900">{formatPrice(convertedTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-semibold text-gray-900">{formatPrice(convertedShipping)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (8%)</span>
                  <span className="font-semibold text-gray-900">{formatPrice(calculateTax())}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-blue-600">{formatPrice(calculateTotal())}</span>
                </div>
              </div>

              <button
                onClick={handleProceedToPayment}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-gray-900 rounded-lg font-semibold transition-colors"
              >
                Proceed to Payment
              </button>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Accepted Payment Methods</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="px-3 py-2 bg-gray-100 rounded text-xs font-semibold text-gray-700">
                    Visa
                  </div>
                  <div className="px-3 py-2 bg-gray-100 rounded text-xs font-semibold text-gray-700">
                    Mastercard
                  </div>
                  <div className="px-3 py-2 bg-gray-100 rounded text-xs font-semibold text-gray-700">
                    Amex
                  </div>
                  <div className="px-3 py-2 bg-gray-100 rounded text-xs font-semibold text-gray-700">
                    Discover
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 flex-shrink-0 text-green-600">
                    <svg
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      className="w-full h-full"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900 mb-1">
                      Secure Checkout
                    </p>
                    <p className="text-xs text-gray-600">
                      Your payment information is encrypted and secure. We use Stripe for payment processing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummaryPage;
