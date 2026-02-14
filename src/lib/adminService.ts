
import { supabase } from './supabase';

// ============================================================
// ADMIN SERVICE — Supabase CRUD for all admin panel operations
// ============================================================

// ---------- SELLERS ----------

export async function getAllSellers(options?: {
  limit?: number;
  offset?: number;
  search?: string;
  kycFilter?: string;
}) {
  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .eq('role', 'seller')
    .order('created_at', { ascending: false });

  if (options?.search) {
    query = query.or(
      `full_name.ilike.%${options.search}%,email.ilike.%${options.search}%`
    );
  }
  if (options?.kycFilter) {
    query = query.eq('is_verified', options.kycFilter === 'approved');
  }

  const limit = options?.limit || 50;
  const offset = options?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  return { sellers: data || [], total: count || 0, error: error?.message || null };
}

export async function updateSellerKYC(
  sellerId: string,
  status: string,
  reason?: string
) {
  const { error } = await supabase
    .from('seller_kyc')
    .update({
      kyc_status: status,
      rejection_reason: reason || null,
      verified_at: new Date().toISOString(),
    })
    .eq('seller_id', sellerId);

  if (!error) {
    await supabase
      .from('profiles')
      .update({
        is_verified: status === 'approved',
        approved: status === 'approved',
      })
      .eq('id', sellerId);
  }

  return { success: !error, error: error?.message || null };
}

export async function updateSellerBadge(
  sellerId: string,
  badge: string
) {
  // Store badge without altering the user's role
  const { error } = await supabase
    .from('profiles')
    .update({ badge })
    .eq('id', sellerId);
  return { success: !error, error: error?.message || null };
}

// ---------- USERS ----------

export async function getAllUsers(options?: {
  limit?: number;
  offset?: number;
  search?: string;
}) {
  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .eq('role', 'user')
    .order('created_at', { ascending: false });

  if (options?.search) {
    query = query.or(
      `full_name.ilike.%${options.search}%,email.ilike.%${options.search}%`
    );
  }

  const limit = options?.limit || 50;
  const offset = options?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  return { users: data || [], total: count || 0, error: error?.message || null };
}

export async function banUser(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ is_banned: true })
    .eq('id', userId);
  return { success: !error, error: error?.message || null };
}

export async function unbanUser(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ is_banned: false })
    .eq('id', userId);
  return { success: !error, error: error?.message || null };
}

export async function deleteUser(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);
  return { success: !error, error: error?.message || null };
}

// ---------- ORDERS ----------

export async function getAllOrders(options?: {
  limit?: number;
  offset?: number;
  status?: string;
}) {
  let query = supabase
    .from('orders')
    .select('*, order_items(*)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (options?.status) query = query.eq('status', options.status);

  const limit = options?.limit || 50;
  const offset = options?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  return { orders: data || [], total: count || 0, error: error?.message || null };
}

export async function updateOrderStatus(orderId: string, status: string) {
  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId);
  return { success: !error, error: error?.message || null };
}

export async function processRefund(
  orderId: string,
  amount: number,
  reason?: string
) {
  const { data, error } = await supabase
    .from('payment_refunds')
    .insert({
      order_id: orderId,
      amount,
      reason: reason || '',
      status: 'processed',
    })
    .select('id')
    .single();

  if (!error) {
    await supabase
      .from('orders')
      .update({ status: 'refunded' })
      .eq('id', orderId);
  }

  return {
    success: !error,
    refundId: data?.id || '',
    error: error?.message || null,
  };
}

// ---------- COMPLAINTS ----------

export async function getAllComplaints(options?: {
  limit?: number;
  offset?: number;
  status?: string;
}) {
  let query = supabase
    .from('complaints')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (options?.status) query = query.eq('status', options.status);

  const limit = options?.limit || 50;
  const offset = options?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  return { complaints: data || [], total: count || 0, error: error?.message || null };
}

export async function updateComplaintStatus(
  complaintId: string,
  status: string,
  resolution?: string
) {
  const { error } = await supabase
    .from('complaints')
    .update({
      status,
      resolution: resolution || null,
      resolved_at: status === 'resolved' ? new Date().toISOString() : null,
    })
    .eq('id', complaintId);
  return { success: !error, error: error?.message || null };
}

// ---------- REVIEWS ----------

export async function getAllReviews(options?: {
  limit?: number;
  offset?: number;
  flagged?: boolean;
}) {
  let query = supabase
    .from('reviews')
    .select('*, profiles:user_id(full_name, email)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (options?.flagged !== undefined) {
    query = query.eq('is_flagged', options.flagged);
  }

  const limit = options?.limit || 50;
  const offset = options?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  return { reviews: data || [], total: count || 0, error: error?.message || null };
}

export async function flagReview(reviewId: string) {
  const { error } = await supabase
    .from('reviews')
    .update({ is_flagged: true })
    .eq('id', reviewId);
  return { success: !error, error: error?.message || null };
}

export async function deleteReview(reviewId: string) {
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId);
  return { success: !error, error: error?.message || null };
}

// ---------- BANNERS ----------

export async function getAllBanners() {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .order('position', { ascending: true });
  return { banners: data || [], error: error?.message || null };
}

export async function createBanner(banner: {
  title: string;
  image_url: string;
  link?: string;
  is_active?: boolean;
  position?: number;
}) {
  const { data, error } = await supabase
    .from('banners')
    .insert(banner)
    .select()
    .single();
  return { data, error: error?.message || null };
}

export async function updateBanner(
  bannerId: string,
  updates: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from('banners')
    .update(updates)
    .eq('id', bannerId)
    .select()
    .single();
  return { data, error: error?.message || null };
}

export async function deleteBanner(bannerId: string) {
  const { error } = await supabase
    .from('banners')
    .delete()
    .eq('id', bannerId);
  return { success: !error, error: error?.message || null };
}

// ---------- PROMOTIONS ----------

export async function getAllPromotions() {
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .order('created_at', { ascending: false });
  return { promotions: data || [], error: error?.message || null };
}

export async function createPromotion(promo: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('promotions')
    .insert(promo)
    .select()
    .single();
  return { data, error: error?.message || null };
}

export async function updatePromotion(
  promoId: string,
  updates: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from('promotions')
    .update(updates)
    .eq('id', promoId)
    .select()
    .single();
  return { data, error: error?.message || null };
}

export async function deletePromotion(promoId: string) {
  const { error } = await supabase
    .from('promotions')
    .delete()
    .eq('id', promoId);
  return { success: !error, error: error?.message || null };
}

// ---------- ACCOUNTS ----------

export async function getAccountSummary() {
  // Aggregate from orders, expenses, payouts
  const { data: orders } = await supabase
    .from('orders')
    .select('total_amount, status, currency');

  const totalRevenue = (orders || [])
    .filter((o: any) => o.status !== 'cancelled' && o.status !== 'refunded')
    .reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);

  const { data: expenses } = await supabase
    .from('expense_entries')
    .select('amount');
  const totalExpenses = (expenses || []).reduce(
    (sum: number, e: any) => sum + (e.amount || 0),
    0
  );

  const { data: payouts } = await supabase
    .from('seller_payouts')
    .select('amount');
  const totalPayouts = (payouts || []).reduce(
    (sum: number, p: any) => sum + (p.amount || 0),
    0
  );

  return {
    totalRevenue,
    totalExpenses,
    totalPayouts,
    netProfit: totalRevenue - totalExpenses - totalPayouts,
    currency: 'INR',
  };
}

export async function getDaybook(options?: {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
}) {
  let query = supabase
    .from('daybook_entries')
    .select('*', { count: 'exact' })
    .order('entry_date', { ascending: false });

  if (options?.startDate) query = query.gte('entry_date', options.startDate);
  if (options?.endDate) query = query.lte('entry_date', options.endDate);

  const limit = options?.limit || 50;
  const offset = options?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  return { entries: data || [], total: count || 0, error: error?.message || null };
}

export async function getBankBook(options?: {
  limit?: number;
  offset?: number;
}) {
  let query = supabase
    .from('bank_book_entries')
    .select('*', { count: 'exact' })
    .order('entry_date', { ascending: false });

  const limit = options?.limit || 50;
  const offset = options?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  return { entries: data || [], total: count || 0, error: error?.message || null };
}

export async function getAccountHeads() {
  const { data, error } = await supabase
    .from('account_heads')
    .select('*')
    .order('name');
  return { data: data || [], error: error?.message || null };
}

export async function getExpenses(options?: {
  limit?: number;
  offset?: number;
}) {
  let query = supabase
    .from('expense_entries')
    .select('*', { count: 'exact' })
    .order('expense_date', { ascending: false });

  const limit = options?.limit || 50;
  const offset = options?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  return { expenses: data || [], total: count || 0, error: error?.message || null };
}

export async function getSellerPayouts(options?: {
  limit?: number;
  offset?: number;
}) {
  let query = supabase
    .from('seller_payouts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  const limit = options?.limit || 50;
  const offset = options?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  return { payouts: data || [], total: count || 0, error: error?.message || null };
}

export async function getMembershipPlans() {
  const { data, error } = await supabase
    .from('membership_plans')
    .select('*')
    .order('price');
  return { data: data || [], error: error?.message || null };
}

export async function getTaxRules() {
  const { data, error } = await supabase
    .from('tax_rules')
    .select('*')
    .order('name');
  return { data: data || [], error: error?.message || null };
}

export async function getPlatformCosts() {
  const { data, error } = await supabase
    .from('platform_costs')
    .select('*')
    .order('created_at', { ascending: false });
  return { data: data || [], error: error?.message || null };
}

export async function generateReport(params: {
  type: string;
  startDate?: string;
  endDate?: string;
  format?: string;
}) {
  // Build report data from DB
  let reportData: any[] = [];

  if (params.type === 'sales' || params.type === 'revenue') {
    let query = supabase.from('orders').select('*');
    if (params.startDate) query = query.gte('created_at', params.startDate);
    if (params.endDate) query = query.lte('created_at', params.endDate);
    const { data } = await query;
    reportData = data || [];
  } else if (params.type === 'sellers') {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'seller');
    reportData = data || [];
  } else if (params.type === 'users') {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'user');
    reportData = data || [];
  }

  // Create CSV blob
  if (reportData.length === 0) {
    return new Blob(['No data found'], { type: 'text/plain' });
  }

  const headers = Object.keys(reportData[0]).join(',');
  const rows = reportData.map((r) =>
    Object.values(r)
      .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
      .join(',')
  );
  const csv = [headers, ...rows].join('\n');
  return new Blob([csv], { type: 'text/csv' });
}

// ---------- ADMIN PROFILE ----------

export async function getAdminProfile(adminId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', adminId)
    .single();
  return { data, error: error?.message || null };
}

// ---------- NOTIFICATIONS ----------

export async function getNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data: data || [], error: error?.message || null };
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
  return { success: !error, error: error?.message || null };
}

export async function deleteNotification(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);
  return { success: !error, error: error?.message || null };
}

// ---------- USER ADDRESSES ----------

export async function getUserAddresses(userId: string) {
  const { data, error } = await supabase
    .from('user_addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false });
  return { data: data || [], error: error?.message || null };
}

export async function createUserAddress(address: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('user_addresses')
    .insert(address)
    .select()
    .single();
  return { data, error: error?.message || null };
}

export async function updateUserAddress(
  addressId: string,
  updates: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from('user_addresses')
    .update(updates)
    .eq('id', addressId)
    .select()
    .single();
  return { data, error: error?.message || null };
}

export async function deleteUserAddress(addressId: string) {
  const { error } = await supabase
    .from('user_addresses')
    .delete()
    .eq('id', addressId);
  return { success: !error, error: error?.message || null };
}

// ---------- WISHLISTS ----------

export async function getWishlist(userId: string) {
  const { data, error } = await supabase
    .from('wishlists')
    .select('*, products(*)')
    .eq('user_id', userId);
  return { data: data || [], error: error?.message || null };
}

export async function addToWishlist(userId: string, productId: string) {
  const { error } = await supabase
    .from('wishlists')
    .upsert({ user_id: userId, product_id: productId }, { onConflict: 'user_id,product_id' });
  return { success: !error, error: error?.message || null };
}

export async function removeFromWishlist(userId: string, productId: string) {
  const { error } = await supabase
    .from('wishlists')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId);
  return { success: !error, error: error?.message || null };
}

// ---------- CART ----------

export async function getCartItems(userId: string) {
  const { data, error } = await supabase
    .from('cart_items')
    .select('*, products(*)')
    .eq('user_id', userId);
  return { data: data || [], error: error?.message || null };
}

export async function upsertCartItem(
  userId: string,
  productId: string,
  quantity: number
) {
  const { error } = await supabase
    .from('cart_items')
    .upsert(
      { user_id: userId, product_id: productId, quantity },
      { onConflict: 'user_id,product_id' }
    );
  return { success: !error, error: error?.message || null };
}

export async function removeCartItem(userId: string, productId: string) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId);
  return { success: !error, error: error?.message || null };
}

export async function clearCart(userId: string) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId);
  return { success: !error, error: error?.message || null };
}

// ---------- REVIEWS (User) ----------

export async function createReview(review: {
  user_id: string;
  product_id: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
}) {
  const { data, error } = await supabase
    .from('reviews')
    .insert(review)
    .select()
    .single();
  return { data, error: error?.message || null };
}

// ---------- AUDIT LOGS ----------

export async function getAuditLogs(options?: {
  limit?: number;
  offset?: number;
}) {
  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  const limit = options?.limit || 50;
  const offset = options?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  return { logs: data || [], total: count || 0, error: error?.message || null };
}

// ---------- SEARCH (Admin Global) ----------

export async function adminGlobalSearch(
  query: string,
  filters: string[] = []
) {
  const results: Array<{
    type: string;
    id: string;
    title: string;
    description: string;
    metadata: string;
  }> = [];

  const searchTerm = `%${query}%`;

  if (filters.length === 0 || filters.includes('users')) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('role', 'user')
      .or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
      .limit(10);
    (data || []).forEach((u: any) => {
      results.push({
        type: 'user',
        id: u.id,
        title: u.full_name || u.email,
        description: `User: ${u.email}`,
        metadata: u.role,
      });
    });
  }

  if (filters.length === 0 || filters.includes('sellers')) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('role', 'seller')
      .or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
      .limit(10);
    (data || []).forEach((s: any) => {
      results.push({
        type: 'seller',
        id: s.id,
        title: s.full_name || s.email,
        description: `Seller: ${s.email}`,
        metadata: s.role,
      });
    });
  }

  if (filters.length === 0 || filters.includes('products')) {
    const { data } = await supabase
      .from('products')
      .select('id, name, category, price')
      .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
      .limit(10);
    (data || []).forEach((p: any) => {
      results.push({
        type: 'product',
        id: p.id,
        title: p.name,
        description: `Category: ${p.category}`,
        metadata: `₹${p.price}`,
      });
    });
  }

  if (filters.length === 0 || filters.includes('orders')) {
    const { data } = await supabase
      .from('orders')
      .select('id, status, total_amount, created_at')
      .or(`id.ilike.${searchTerm},status.ilike.${searchTerm}`)
      .limit(10);
    (data || []).forEach((o: any) => {
      results.push({
        type: 'order',
        id: o.id,
        title: `Order ${o.id.slice(0, 8)}`,
        description: `Status: ${o.status}`,
        metadata: `₹${o.total_amount}`,
      });
    });
  }

  return results;
}

// ---------- PRODUCT IMAGES (Admin) ----------

export async function getProductImages(productId: string) {
  const { data, error } = await supabase
    .from('products')
    .select('id, images, image_url')
    .eq('id', productId)
    .single();

  if (error || !data) return [];

  const images: Array<{
    id: string;
    product_id: string;
    image_url: string;
    imageUrl: string;
    is_main: boolean;
    isMainImage: boolean;
    display_order: number;
    displayOrder: number;
  }> = [];

  // Main image
  if (data.image_url) {
    images.push({
      id: `main_${productId}`,
      product_id: productId,
      image_url: data.image_url,
      imageUrl: data.image_url,
      is_main: true,
      isMainImage: true,
      display_order: 0,
      displayOrder: 0,
    });
  }

  // Additional images from JSONB array
  const additionalImages = (data.images || []) as string[];
  additionalImages.forEach((url: string, idx: number) => {
    if (url !== data.image_url) {
      images.push({
        id: `img_${productId}_${idx}`,
        product_id: productId,
        image_url: url,
        imageUrl: url,
        is_main: false,
        isMainImage: false,
        display_order: idx + 1,
        displayOrder: idx + 1,
      });
    }
  });

  return images;
}

export async function uploadProductImageFile(
  _productId: string,
  file: File,
  _userId: string
): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `products/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, file, { contentType: file.type });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}

// ---------- KYC REQUIREMENTS ----------

export async function getAllKYCRequirements() {
  const { data, error } = await supabase
    .from('seller_kyc_documents')
    .select('*')
    .order('created_at', { ascending: false });
  return { data: data || [], error: error?.message || null };
}

export async function createKYCRequirement(req: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('seller_kyc_documents')
    .insert(req)
    .select()
    .single();
  return { data, error: error?.message || null };
}

export async function updateKYCRequirement(
  id: string,
  updates: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from('seller_kyc_documents')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data, error: error?.message || null };
}

export async function deleteKYCRequirement(id: string) {
  const { error } = await supabase
    .from('seller_kyc_documents')
    .delete()
    .eq('id', id);
  return { success: !error, error: error?.message || null };
}

// ---------- SYSTEM HEALTH ----------

export async function getSystemHealth() {
  // Gather counts from key tables
  const [profiles, products, orders, complaints] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('complaints').select('id', { count: 'exact', head: true }),
  ]);

  return {
    totalUsers: profiles.count || 0,
    totalProducts: products.count || 0,
    totalOrders: orders.count || 0,
    totalComplaints: complaints.count || 0,
    dbStatus: 'healthy',
    lastChecked: new Date().toISOString(),
  };
}
