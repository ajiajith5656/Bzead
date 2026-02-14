import React, { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingCart, Loader2 } from 'lucide-react';

export const CartPage: React.FC = () => {
  const { user, currentAuthUser } = useAuth();
  const { items: cartItems, removeFromCart, updateQuantity } = useCart();
  const { formatPrice, convertPrice } = useCurrency();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    // Check if user is logged in
    if (!user && !currentAuthUser) {
      navigate('/login');
      return;
    }
    setLoading(false);
  }, [user, currentAuthUser, navigate]);

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(productId);
      return;
    }

    try {
      setUpdatingId(productId);
      // Simulate update delay
      await new Promise((resolve) => setTimeout(resolve, 300));
      updateQuantity(productId, newQuantity);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    try {
      setUpdatingId(productId);
      // Simulate removal delay
      await new Promise((resolve) => setTimeout(resolve, 300));
      removeFromCart(productId);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleApplyCoupon = async () => {
    try {
      if (!couponCode.trim()) {
        alert('Please enter a coupon code');
        return;
      }

      // TODO: Call backend coupon validation API
      // For now, show a message that coupon validation is coming soon
      setDiscount(0);
      alert('Coupon validation service is coming soon. Please check back later.');
    } catch (error) {
      console.error('Coupon validation error:', error);
      alert('Failed to validate coupon code');
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (convertPrice(item.product.price, item.product.currency) * item.quantity), 0);
  const discountAmount = Math.round(subtotal * discount);
  const tax = Math.round((subtotal - discountAmount) * 0.18); // 18% GST
  const total = subtotal - discountAmount + tax;

  const handleCheckout = () => {
    // Navigate to shipping address page to start checkout flow
    navigate('/checkout/shipping');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-amber-600 mb-2">Shopping Cart</h1>
          <p className="text-gray-500">{cartItems.length} items in cart</p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 text-amber-600 animate-spin mr-3" />
            <span className="text-gray-900 text-lg">Loading your cart...</span>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-12 text-center">
            <ShoppingCart className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Cart is Empty</h2>
            <p className="text-gray-500 mb-6">
              Add items to your cart to get started with shopping.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-amber-500 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition-all duration-300"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((cartItem) => (
                <div
                  key={cartItem.product.id}
                  className={`bg-gray-50 border border-gray-200 rounded-lg overflow-hidden hover:border-amber-500 transition-all duration-300 flex gap-4 p-4 group ${
                    updatingId === cartItem.product.id ? 'opacity-50' : ''
                  }`}
                >
                  {/* Image */}
                  <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={cartItem.product.image_url}
                      alt={cartItem.product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-grow">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{cartItem.product.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">{cartItem.product.brand || 'Brand'}</p>
                    <p className="text-lg font-bold text-amber-600">{formatPrice(cartItem.product.price, cartItem.product.currency)}</p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => handleRemoveItem(cartItem.product.id)}
                      disabled={updatingId === cartItem.product.id}
                      className="text-gray-500 hover:text-red-400 transition-all duration-300 disabled:opacity-50"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>

                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => handleUpdateQuantity(cartItem.product.id, cartItem.quantity - 1)}
                        disabled={updatingId === cartItem.product.id}
                        className="p-1 hover:bg-gray-100 rounded transition-all duration-300 disabled:opacity-50 text-amber-600"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center text-gray-900 font-semibold">
                        {cartItem.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(cartItem.product.id, cartItem.quantity + 1)}
                        disabled={updatingId === cartItem.product.id}
                        className="p-1 hover:bg-gray-100 rounded transition-all duration-300 disabled:opacity-50 text-amber-600"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Coupon Code Section */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-3">Apply Coupon Code</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="flex-grow bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={!couponCode}
                    className="bg-amber-500 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition-all duration-300 disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Coupon codes available from the seller</p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sticky top-24 space-y-4">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>

                <div className="space-y-3 border-b border-gray-200 pb-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Discount ({Math.round(discount * 100)}%)</span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Tax (18% GST)</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                </div>

                <div className="flex justify-between text-2xl font-bold text-amber-600">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full bg-amber-500 text-black py-3 rounded-lg font-bold text-lg hover:bg-yellow-500 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Proceed to Checkout
                </button>

                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-gray-100 text-gray-900 py-2 rounded-lg font-medium hover:bg-gray-100 transition-all duration-300"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
