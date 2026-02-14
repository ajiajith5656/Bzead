import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import type { StripePaymentElementOptions } from '@stripe/stripe-js';
import type { OrderData } from '../../types';
import { supabase } from '../../lib/supabase';
import { useCurrency } from '../../contexts/CurrencyContext';
import { formatCurrency as fmtCurrency } from '../../utils/currency';
import {
  getStripe,
  createPaymentIntent,
  toStripeAmount,
} from '../../lib/stripeService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CheckoutItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  sellerId?: string;
}

interface ShippingAddr {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface CheckoutLocationState {
  items: CheckoutItem[];
  totalAmount: number;
  customerId: string;
  customerEmail: string;
  customerName: string;
  shippingAddress: ShippingAddr;
}

// ---------------------------------------------------------------------------
// Inner form rendered inside <Elements> (has access to stripe & elements)
// ---------------------------------------------------------------------------

const CheckoutForm: React.FC<
  CheckoutLocationState & {
    paymentIntentId: string;
    onSuccess?: (order: OrderData) => void;
    onCancel?: () => void;
  }
> = ({
  items,
  totalAmount,
  customerId,
  customerEmail,
  customerName,
  shippingAddress,
  paymentIntentId,
  onSuccess,
  onCancel,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { currency } = useCurrency();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [billingAddress, setBillingAddress] = useState<ShippingAddr>({ ...shippingAddress });
  const [sameAsShipping, setSameAsShipping] = useState(true);

  // PaymentElement appearance
  const paymentElementOptions: StripePaymentElementOptions = {
    layout: 'tabs',
  };

  // ------ Submit handler ------
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!stripe || !elements) return;

      setIsLoading(true);
      setError(null);

      try {
        // 1. Validate PaymentElement fields
        const { error: submitErr } = await elements.submit();
        if (submitErr) {
          setError(submitErr.message || 'Validation error');
          setIsLoading(false);
          return;
        }

        // 2. Confirm payment (Stripe handles 3-D Secure etc.)
        const billing = sameAsShipping ? shippingAddress : billingAddress;
        const { error: confirmErr, paymentIntent } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            payment_method_data: {
              billing_details: {
                name: customerName,
                email: customerEmail,
                address: {
                  line1: billing.street,
                  city: billing.city,
                  state: billing.state,
                  postal_code: billing.postalCode,
                  country: billing.country,
                },
              },
            },
            // Don't redirect — handle result in-page
            return_url: `${window.location.origin}/checkout/confirmation`,
          },
          redirect: 'if_required',
        });

        if (confirmErr) {
          setError(confirmErr.message || 'Payment failed');
          setIsLoading(false);
          return;
        }

        if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'processing') {
          // 3. Persist order in Supabase
          const { data: order, error: orderErr } = await supabase
            .from('orders')
            .insert({
              user_id: customerId,
              status: paymentIntent.status === 'succeeded' ? 'processing' : 'pending',
              total_amount: totalAmount,
              shipping_address: shippingAddress,
              order_number: `ORD-${Date.now()}`,
              payment_intent_id: paymentIntentId,
            })
            .select('id')
            .single();

          if (orderErr || !order) {
            setError(orderErr?.message || 'Failed to save order');
            setIsLoading(false);
            return;
          }

          // Insert order items
          const orderItems = items.map((item) => ({
            order_id: order.id,
            product_id: item.productId,
            product_name: item.productName,
            quantity: item.quantity,
            price: item.price,
            seller_id: item.sellerId || null,
          }));
          await supabase.from('order_items').insert(orderItems);

          // Record payment
          await supabase.from('payment_intents').insert({
            order_id: order.id,
            stripe_payment_intent_id: paymentIntentId,
            status: paymentIntent.status,
            amount: totalAmount,
            currency: currency.toLowerCase(),
          });

          setSuccess(true);

          const orderData: OrderData = {
            id: order.id,
            customerId,
            customerEmail,
            totalAmount,
            orderStatus: 'processing',
            paymentStatus: 'completed',
            paymentIntentId,
            items,
            shippingAddress,
            billingAddress: billing,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          navigate('/checkout/confirmation', { state: { orderData } });
          onSuccess?.(orderData);
        } else {
          setError(`Unexpected payment status: ${paymentIntent?.status}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Payment error');
      } finally {
        setIsLoading(false);
      }
    },
    [
      stripe,
      elements,
      sameAsShipping,
      billingAddress,
      shippingAddress,
      customerName,
      customerEmail,
      customerId,
      totalAmount,
      items,
      paymentIntentId,
      currency,
      navigate,
      onSuccess,
    ]
  );

  // ------ Success screen (brief, before redirect) ------
  if (success) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-lg p-5 text-center">
          <CheckCircle2 size={64} className="mx-auto mb-4 text-green-600" />
          <h2 className="text-2xl font-bold text-green-900 mb-2">Payment Successful!</h2>
          <p className="text-green-700 mb-6">Your order has been placed and confirmed.</p>
          <div className="bg-white rounded p-4 mb-6 text-left">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Order Amount:</strong> {fmtCurrency(totalAmount, currency)}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Items:</strong> {items.length} product(s)
            </p>
          </div>
          <button
            onClick={onCancel}
            className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // ------ Checkout form ------
  return (
    <div className="w-full max-w-2xl mx-auto">
      <button
        onClick={() => navigate('/checkout/review')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-semibold"
      >
        <ArrowLeft size={18} />
        Back to Review
      </button>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h2>

        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
          <div className="space-y-2 mb-4">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm text-gray-600">
                <span>
                  {item.productName} &times; {item.quantity}
                </span>
                <span>{fmtCurrency(item.price * item.quantity, currency)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 pt-4 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>{fmtCurrency(totalAmount, currency)}</span>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Shipping Address</h3>
          <p className="text-sm text-gray-600">
            {shippingAddress.street}
            <br />
            {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
            <br />
            {shippingAddress.country}
          </p>
        </div>

        {/* Billing Address */}
        <div className="mb-6">
          <label className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={sameAsShipping}
              onChange={(e) => setSameAsShipping(e.target.checked)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm font-semibold text-gray-700">Same as shipping address</span>
          </label>

          {!sameAsShipping && (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Street Address"
                value={billingAddress.street}
                onChange={(e) => setBillingAddress({ ...billingAddress, street: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="City"
                  value={billingAddress.city}
                  onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={billingAddress.state}
                  onChange={(e) => setBillingAddress({ ...billingAddress, state: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Postal Code"
                  value={billingAddress.postalCode}
                  onChange={(e) =>
                    setBillingAddress({ ...billingAddress, postalCode: e.target.value })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Country"
                  value={billingAddress.country}
                  onChange={(e) =>
                    setBillingAddress({ ...billingAddress, country: e.target.value })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Stripe Payment Element */}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Payment Details
            </label>
            <div className="border border-gray-300 rounded-lg p-4 bg-white">
              <PaymentElement options={paymentElementOptions} />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!stripe || !elements || isLoading}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing Payment...
              </>
            ) : (
              `Pay ${totalAmount > 0 ? fmtCurrency(totalAmount, currency) : 'Now'}`
            )}
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-4">
          Your payment is secure and encrypted. Processed by Stripe.
        </p>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Outer wrapper — loads Stripe, creates PaymentIntent, wraps in <Elements>
// ---------------------------------------------------------------------------

const Checkout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currency } = useCurrency();
  const checkoutData = location.state as CheckoutLocationState | undefined;

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect if no checkout data
  useEffect(() => {
    if (!checkoutData) {
      navigate('/cart');
    }
  }, [checkoutData, navigate]);

  // Create PaymentIntent on mount
  useEffect(() => {
    if (!checkoutData) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setInitError(null);

        const stripeAmount = toStripeAmount(checkoutData.totalAmount, currency);

        const result = await createPaymentIntent({
          amount: stripeAmount,
          currency: currency.toLowerCase(),
          metadata: {
            customer_id: checkoutData.customerId,
            customer_email: checkoutData.customerEmail,
            item_count: String(checkoutData.items.length),
          },
        });

        if (!cancelled) {
          setClientSecret(result.clientSecret);
          setPaymentIntentId(result.paymentIntentId);
        }
      } catch (err) {
        if (!cancelled) {
          setInitError(err instanceof Error ? err.message : 'Failed to initialize payment');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [checkoutData, currency]);

  // --- Loading / error states ---
  if (!checkoutData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <p className="text-gray-600">Redirecting to cart...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={36} className="animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Initializing secure payment...</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle size={48} className="mx-auto mb-4 text-red-600" />
            <h2 className="text-xl font-bold text-red-900 mb-2">Payment Initialization Failed</h2>
            <p className="text-red-700 mb-6">{initError}</p>
            <button
              onClick={() => navigate('/checkout/review')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
            >
              Back to Review
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!clientSecret || !paymentIntentId) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <p className="text-gray-600">Something went wrong. Please try again.</p>
      </div>
    );
  }

  // --- Main checkout UI ---
  const stripePromise = getStripe();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold mb-2">
                &#10003;
              </div>
              <span className="text-sm font-semibold text-green-600">Shipping</span>
            </div>
            <div className="flex-1 h-1 bg-green-600 mx-4" />
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold mb-2">
                &#10003;
              </div>
              <span className="text-sm font-semibold text-green-600">Review</span>
            </div>
            <div className="flex-1 h-1 bg-blue-600 mx-4" />
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold mb-2">
                3
              </div>
              <span className="text-sm font-semibold text-blue-600">Payment</span>
            </div>
          </div>
        </div>

        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#2563eb',
                borderRadius: '8px',
              },
            },
          }}
        >
          <CheckoutForm
            {...checkoutData}
            paymentIntentId={paymentIntentId}
          />
        </Elements>
      </div>
    </div>
  );
};

export default Checkout;
