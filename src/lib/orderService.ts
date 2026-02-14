import { supabase } from './supabase';

// ============================================================
// ORDER SERVICE — Supabase CRUD for orders & related tables
// ============================================================

// ---------- FETCH ORDERS ----------

export async function fetchOrdersBySeller(
  sellerId: string,
  options?: { limit?: number; offset?: number; status?: string }
) {
  let query = supabase
    .from('orders')
    .select('*, order_items(*)', { count: 'exact' })
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (options?.status) query = query.eq('status', options.status);

  const limit = options?.limit || 100;
  const offset = options?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  return { data: data || [], error: error?.message || null, count: count || 0 };
}

export async function fetchOrdersByUser(userId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data: data || [], error: error?.message || null };
}

export async function fetchOrderById(orderId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .single();
  return { data, error: error?.message || null };
}

// ---------- CREATE ORDER ----------

export async function createOrder(orderData: {
  user_id: string;
  seller_id?: string;
  total_amount: number;
  currency?: string;
  shipping_address?: Record<string, unknown>;
  billing_address?: Record<string, unknown>;
  phone?: string;
  notes?: string;
  payment_intent_id?: string;
  items: Array<{
    product_id: string;
    product_name: string;
    product_image?: string;
    quantity: number;
    price: number;
    variant_info?: Record<string, unknown>;
    category?: string;
  }>;
}) {
  const { items, ...order } = orderData;

  const { data, error } = await supabase
    .from('orders')
    .insert({
      user_id: order.user_id,
      seller_id: order.seller_id || null,
      total_amount: order.total_amount,
      currency: order.currency || 'INR',
      shipping_address: order.shipping_address || null,
      billing_address: order.billing_address || null,
      phone: order.phone || null,
      notes: order.notes || null,
      payment_intent_id: order.payment_intent_id || null,
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  // Insert order items
  if (items.length > 0) {
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(
        items.map((item) => ({
          order_id: data.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_image: item.product_image || '',
          quantity: item.quantity,
          price: item.price,
          variant_info: item.variant_info || null,
          category: item.category || null,
        }))
      );
    if (itemsError) {
      console.error('Error inserting order items:', itemsError);
    }
  }

  return { data, error: null };
}

// ---------- UPDATE ORDER ----------

export async function updateOrderStatus(
  orderId: string,
  updates: {
    status?: string;
    tracking_number?: string;
    payment_status?: string;
    completed_at?: string;
  }
) {
  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select('*, order_items(*)')
    .single();
  return { data, error: error?.message || null };
}

// ---------- SELLER PROFILE ----------

export async function fetchSellerProfile(sellerId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', sellerId)
    .single();
  return { data, error: error?.message || null };
}

export async function updateSellerProfile(
  sellerId: string,
  updates: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', sellerId)
    .select()
    .single();
  return { data, error: error?.message || null };
}

// ---------- WITHDRAWALS ----------

export async function createWithdrawal(
  sellerId: string,
  amount: number,
  currency = 'INR',
  bankDetails?: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from('withdrawals')
    .insert({
      seller_id: sellerId,
      amount,
      currency,
      bank_details: bankDetails || null,
    })
    .select()
    .single();
  return { data, error: error?.message || null };
}

export async function fetchWithdrawals(sellerId: string) {
  const { data, error } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });
  return { data: data || [], error: error?.message || null };
}

// ---------- SELLER PAYOUTS ----------

export async function fetchSellerPayouts(sellerId: string) {
  const { data, error } = await supabase
    .from('seller_payouts')
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });
  return { data: data || [], error: error?.message || null };
}
