export interface User {
  id: string;
  userId?: string;
  email: string;
  role: 'user' | 'seller' | 'admin';
  first_name?: string;
  last_name?: string;
  full_name?: string;
  created_at: string;
  approved?: boolean;
  phone?: string;
  address?: string;
  avatar_url?: string;
  is_verified?: boolean;
  total_purchases?: number;
  cancellations?: number;
  is_banned?: boolean;
  signup_date?: string;
  updated_at?: string;
}

export interface Admin {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  created_at: string;
  last_login?: string;
  permissions: string[];
  is_active: boolean;
  status?: 'active' | 'inactive';
}

export interface Seller {
  id: string;
  user_id: string;
  shop_name: string;
  email: string;
  phone: string;
  total_listings: number;
  badge?: 'silver' | 'gold' | 'platinum';
  kyc_status: 'pending' | 'approved' | 'rejected' | 'verified' | 'action_required' | 'restricted';
  product_approval_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  seller_type?: 'individual' | 'brand' | 'freelancing';
  is_active: boolean;
  total_revenue?: number;
  total_orders?: number;
  rating?: number;
  
  // Stripe Connect fields
  stripe_account_id?: string;
  stripe_onboarding_completed?: boolean;
  payouts_enabled?: boolean;
  charges_enabled?: boolean;
  kyc_last_update?: string;
  stripe_account_type?: 'express' | 'standard' | 'custom';
}

export interface Product {
  id: string;
  productId?: string; // alias — frontend convenience, DB uses `id`
  name: string;
  slug?: string;
  description: string;
  short_description?: string;
  price: number;
  mrp?: number;
  discount_price?: number;
  currency: string;
  image_url: string;
  images?: string[];
  videos?: string[];
  seller_id: string;
  category: string;
  sub_category?: string;
  brand?: string;
  model_number?: string;
  sku?: string;
  stock: number;
  highlights?: string[];
  specifications?: Record<string, string>;
  seller_notes?: string[];
  gst_rate?: number;
  platform_fee?: number;
  commission?: number;
  package_weight?: number;
  package_length?: number;
  package_width?: number;
  package_height?: number;
  shipping_type?: string;
  manufacturer_name?: string;
  manufacturer_address?: string;
  packing_details?: string;
  courier_partner?: string;
  cancellation_policy_days?: number;
  return_policy_days?: number;
  approval_status?: 'draft' | 'pending' | 'approved' | 'rejected';
  is_active?: boolean;
  is_featured?: boolean;
  tags?: string[];
  rating?: number;
  review_count?: number;
  created_at: string;
  updated_at?: string;
  // Frontend-only convenience fields (not in DB)
  discount?: number;
  isNew?: boolean;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  product?: Product;
}

export interface Order {
  id: string;
  user_id: string;
  total: number;
  currency: string;
  status: 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'return_requested' | 'returned';
  created_at: string;
  items?: OrderItem[];
  seller_id?: string;
  address?: string;
  phone?: string;
  updated_at?: string;
  payment_status?: 'pending' | 'completed' | 'failed';
  tracking_number?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  product?: Product;
}

export interface UserAddress {
  id: string;
  user_id: string;
  full_name: string;
  phone_number: string;
  email: string;
  country: string;
  street_address_1: string;
  street_address_2?: string;
  city: string;
  state: string;
  postal_code: string;
  address_type: 'home' | 'work' | 'other';
  delivery_notes?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  sub_categories?: SubCategory[];
}

export interface SubCategory {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface Banner {
  id: string;
  title: string;
  image_url: string;
  link?: string;
  is_active: boolean;
  position: number;
  created_at: string;
  updated_at?: string;
}

export interface Promotion {
  id: string;
  title: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  applicable_to: 'user' | 'seller' | 'common';
  applicable_ids?: string[];
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  max_uses?: number;
  current_uses?: number;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  is_verified?: boolean;
  is_flagged?: boolean;
}

export interface Complaint {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at?: string;
  assigned_to?: string;
  resolution?: string;
}

export interface Withdrawal {
  id: string;
  seller_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'completed' | 'failed';
  created_at: string;
  processed_at?: string;
}

export interface BusinessMetrics {
  total_sales: number;
  total_expenses: number;
  total_products: number;
  total_users: number;
  total_sellers: number;
  total_bookings: number;
  ongoing_orders: number;
  returns_cancellations: number;
}

export interface DashboardData {
  metrics: BusinessMetrics;
  top_categories: Category[];
  top_sellers: Seller[];
  user_registrations: number;
  prime_members: number;
  seller_registrations: number;
}

export interface AccountSummary {
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  total_payouts: number;
  total_taxes: number;
  currency: string;
}

export interface DaybookEntry {
  id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference?: string;
}

export interface BankBookEntry {
  id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  bank_reference?: string;
}

export interface AccountHead {
  id: string;
  name: string;
  type: 'asset' | 'liability' | 'income' | 'expense';
  is_active: boolean;
  created_at: string;
}

export interface ExpenseEntry {
  id: string;
  date: string;
  amount: number;
  category: string;
  description?: string;
  vendor?: string;
  status?: 'pending' | 'approved' | 'paid';
}

export interface SellerPayout {
  id: string;
  seller_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'completed' | 'failed';
  scheduled_at?: string;
  processed_at?: string;
}

export interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration_days: number;
  is_active: boolean;
}

export interface TaxRule {
  id: string;
  name: string;
  percentage: number;
  country?: string;
  is_active: boolean;
}

export interface PlatformCost {
  id: string;
  name: string;
  amount: number;
  currency: string;
  billing_cycle: 'monthly' | 'quarterly' | 'yearly' | 'one_time';
  is_active: boolean;
}
export interface SellerKYC {
  id: string;
  seller_id: string;

  // Pre-filled from signup (auto-populated)
  email: string;
  phone: string;
  full_name: string;
  country: string;

  // Tier 2 - Tax & Business Information
  pan: string;
  gstin?: string;

  // Identity Verification
  id_type: 'aadhar' | 'passport' | 'voter' | 'driver_license';
  id_number: string;
  id_document_url: string;
  id_document_file?: File;

  // Address Information
  business_address: UserAddress;
  address_proof_url: string;
  address_proof_file?: File;

  // Bank Details
  bank_holder_name: string;
  account_number: string;
  account_type: 'checking' | 'savings' | 'current';
  ifsc_code: string;
  bank_statement_url: string;
  bank_statement_file?: File;

  // Compliance & Legal
  pep_declaration: boolean;
  sanctions_check: boolean;
  aml_compliance: boolean;
  tax_compliance: boolean;
  terms_accepted: boolean;

  // KYC Status & Metadata
  kyc_status: 'draft' | 'pending' | 'approved' | 'rejected';
  kyc_tier: 1 | 2 | 3;
  rejection_reason?: string;
  verified_by_admin?: string;
  verified_at?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
  submitted_at?: string;
}

// =====================================================
// PAYMENT & ORDER TYPES
// =====================================================

export interface StripePaymentIntent {
  id: string;
  clientSecret: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded';
  amount: number;
  currency: string;
  customerId: string;
  customerEmail: string;
  metadata?: Record<string, string>;
  created_at: string;
}

export interface OrderData {
  id: string;
  customerId: string;
  customerEmail: string;
  totalAmount: number;
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentIntentId?: string;
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
  notes?: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CheckoutSession {
  id: string;
  sessionId: string;
  customerId: string;
  customerEmail: string;
  status: 'open' | 'complete' | 'expired';
  url?: string;
  successUrl: string;
  cancelUrl: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  createdAt: string;
  expiresAt: string;
}

export interface PaymentRefund {
  id: string;
  refundId: string;
  paymentIntentId: string;
  amount: number;
  status: 'succeeded' | 'failed' | 'canceled';
  reason: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'abandoned';
  createdAt: string;
}