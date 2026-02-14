/**
 * Stripe client-side service
 *
 * Development: calls Vite dev middleware at /api/create-payment-intent
 * Production: calls Supabase Edge Function via supabase.functions.invoke()
 */

import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

// Singleton Stripe instance
let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error('VITE_STRIPE_PUBLISHABLE_KEY is not set');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

interface CreatePaymentIntentParams {
  /** Amount in the smallest currency unit (e.g. cents for USD, paise for INR) */
  amount: number;
  /** ISO 4217 currency code, lowercase (e.g. 'usd', 'inr') */
  currency: string;
  /** Optional metadata to attach to the PaymentIntent */
  metadata?: Record<string, string>;
}

interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
}

/**
 * Create a Stripe PaymentIntent.
 *
 * - In development, hits the Vite dev middleware (/api/create-payment-intent)
 * - In production, calls the Supabase Edge Function
 */
export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<PaymentIntentResult> {
  if (import.meta.env.DEV) {
    // Development: use Vite dev middleware
    const res = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    return res.json();
  } else {
    // Production: use Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: params,
    });

    if (error) {
      throw new Error(error.message || 'Failed to create payment intent');
    }

    if (!data?.clientSecret) {
      throw new Error(data?.error || 'Missing client secret in response');
    }

    return data as PaymentIntentResult;
  }
}

/**
 * Convert a display-level amount to Stripe's smallest currency unit.
 * e.g. $10.50 USD → 1050 cents, ¥1000 JPY → 1000 (JPY has no decimals)
 */
const ZERO_DECIMAL_CURRENCIES = new Set([
  'bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga',
  'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf',
]);

export function toStripeAmount(displayAmount: number, currency: string): number {
  const lc = currency.toLowerCase();
  if (ZERO_DECIMAL_CURRENCIES.has(lc)) {
    return Math.round(displayAmount);
  }
  return Math.round(displayAmount * 100);
}

/**
 * Convert Stripe's smallest-unit amount back to a display amount.
 */
export function fromStripeAmount(stripeAmount: number, currency: string): number {
  const lc = currency.toLowerCase();
  if (ZERO_DECIMAL_CURRENCIES.has(lc)) {
    return stripeAmount;
  }
  return stripeAmount / 100;
}
