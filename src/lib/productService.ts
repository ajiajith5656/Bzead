import { supabase } from './supabase';

// ============================================================
// PRODUCT SERVICE — Supabase CRUD for products & related tables
// ============================================================

// ---------- FETCH ----------

export async function fetchProducts(filters?: {
  sellerId?: string;
  category?: string;
  approvalStatus?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  let query = supabase.from('products').select('*', { count: 'exact' });

  if (filters?.sellerId) query = query.eq('seller_id', filters.sellerId);
  if (filters?.category) query = query.eq('category', filters.category);
  if (filters?.approvalStatus) query = query.eq('approval_status', filters.approvalStatus);
  if (filters?.search) query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);

  query = query.order('created_at', { ascending: false });

  const limit = filters?.limit || 100;
  const offset = filters?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  return { data: data || [], error: error?.message || null, count: count || 0 };
}

export async function fetchProductById(id: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_variants(*), delivery_countries(*), offer_rules(*)')
    .eq('id', id)
    .single();
  return { data, error: error?.message || null };
}

export async function fetchProductReviews(productId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profiles:user_id(full_name, avatar_url)')
    .eq('product_id', productId)
    .eq('is_flagged', false)
    .order('created_at', { ascending: false });
  return { data: data || [], error: error?.message || null };
}

export async function fetchSimilarProducts(category: string, excludeId: string, limit = 8) {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, image_url, brand, price, currency, discount_price, rating')
    .eq('category', category)
    .eq('approval_status', 'approved')
    .eq('is_active', true)
    .neq('id', excludeId)
    .limit(limit);
  return { data: data || [], error: error?.message || null };
}

// ---------- CATEGORIES ----------

export async function fetchCategories(activeOnly = true) {
  let query = supabase
    .from('categories')
    .select('id, name, description, image_url, is_active, display_order, created_at, sub_categories(id, name, description, is_active, created_at)')
    .order('display_order');
  if (activeOnly) query = query.eq('is_active', true);
  const { data, error } = await query;
  return { data: data || [], error: error?.message || null };
}

export async function fetchCategoryById(id: string) {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, description, image_url, is_active, display_order, created_at, sub_categories(id, name, description, is_active, created_at)')
    .eq('id', id)
    .single();
  return { data, error: error?.message || null };
}

export async function createCategory(cat: { name: string; description?: string; image_url?: string; display_order?: number }) {
  const { data, error } = await supabase
    .from('categories')
    .insert({ name: cat.name, description: cat.description || '', image_url: cat.image_url || '', display_order: cat.display_order || 0 })
    .select()
    .single();
  return { data, error: error?.message || null };
}

export async function updateCategory(id: string, updates: { name?: string; description?: string; image_url?: string; is_active?: boolean; display_order?: number }) {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data, error: error?.message || null };
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  return { success: !error, error: error?.message || null };
}

// ---------- SUB-CATEGORIES ----------

export async function fetchSubCategories(categoryId: string) {
  const { data, error } = await supabase
    .from('sub_categories')
    .select('id, category_id, name, description, is_active, created_at')
    .eq('category_id', categoryId)
    .order('name');
  return { data: data || [], error: error?.message || null };
}

export async function createSubCategory(sub: { category_id: string; name: string; description?: string }) {
  const { data, error } = await supabase
    .from('sub_categories')
    .insert({ category_id: sub.category_id, name: sub.name, description: sub.description || '' })
    .select()
    .single();
  return { data, error: error?.message || null };
}

export async function updateSubCategory(id: string, updates: { name?: string; description?: string; is_active?: boolean }) {
  const { data, error } = await supabase
    .from('sub_categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data, error: error?.message || null };
}

export async function deleteSubCategory(id: string) {
  const { error } = await supabase.from('sub_categories').delete().eq('id', id);
  return { success: !error, error: error?.message || null };
}

// ---------- IMAGE UPLOAD (categories) ----------

export async function uploadCategoryImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `categories/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, file, { contentType: file.type });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}

// ---------- COUNTRIES ----------

export async function fetchCountries() {
  const { data, error } = await supabase
    .from('countries')
    .select('id, country_name, country_code, currency_code')
    .order('country_name');
  return { data: data || [], error: error?.message || null };
}

// ---------- CREATE ----------

export async function createProduct(productData: Record<string, unknown>) {
  const sizeVariants = (productData.sizeVariants || productData.size_variants || []) as Record<string, unknown>[];
  const colorVariants = (productData.colorVariants || productData.color_variants || []) as Record<string, unknown>[];
  const deliveryCountries = (productData.deliveryCountries || productData.delivery_countries || []) as Record<string, unknown>[];
  const offerRules = (productData.offerRules || productData.offer_rules || []) as Record<string, unknown>[];

  const dims = (productData.packageDimensions || {}) as Record<string, number>;

  const product = {
    seller_id: productData.seller_id as string,
    name: productData.name as string,
    slug: (productData.slug as string) || (productData.name as string || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    description: (productData.description || '') as string,
    short_description: (productData.short_description || productData.shortDescription || '') as string,
    category: (productData.category || productData.categoryId || '') as string,
    sub_category: (productData.sub_category || productData.subCategoryId || '') as string,
    brand: (productData.brand || productData.brandName || productData.brand_name || '') as string,
    model_number: (productData.model_number || productData.modelNumber || '') as string,
    sku: (productData.sku || '') as string,
    price: Number(productData.price || productData.sellingPrice || 0),
    mrp: Number(productData.mrp || 0),
    discount_price: productData.discount_price ? Number(productData.discount_price) : null,
    currency: (productData.currency || 'INR') as string,
    stock: Number(productData.stock || productData.stockQuantity || 0),
    image_url: (productData.image_url || ((productData.images as string[])?.[0]) || '') as string,
    images: (productData.images || []) as string[],
    videos: (productData.videos || []) as string[],
    highlights: (productData.highlights || []) as string[],
    specifications: productData.specifications || [],
    seller_notes: (productData.sellerNotes || productData.seller_notes || []) as string[],
    gst_rate: Number(productData.gst_rate || productData.gstRate || 0),
    platform_fee: Number(productData.platform_fee || productData.platformFee || 7.5),
    commission: Number(productData.commission || 0.5),
    package_weight: Number(productData.package_weight || productData.packageWeight || 0),
    package_length: Number(productData.package_length || dims.length || 0),
    package_width: Number(productData.package_width || dims.width || 0),
    package_height: Number(productData.package_height || dims.height || 0),
    shipping_type: (productData.shipping_type || productData.shippingType || 'self') as string,
    manufacturer_name: (productData.manufacturer_name || productData.manufacturerName || '') as string,
    manufacturer_address: (productData.manufacturer_address || productData.manufacturerAddress || '') as string,
    packing_details: (productData.packing_details || productData.packingDetails || '') as string,
    courier_partner: (productData.courier_partner || productData.courierPartner || '') as string,
    cancellation_policy_days: Number(productData.cancellation_policy_days || productData.cancellationPolicyDays || 7),
    return_policy_days: Number(productData.return_policy_days || productData.returnPolicyDays || 7),
    approval_status: (productData.approval_status || productData.approvalStatus || 'pending') as string,
    is_active: Boolean(productData.is_active ?? productData.isActive ?? false),
    is_featured: Boolean(productData.is_featured ?? false),
    tags: (productData.tags || []) as string[],
  };

  const { data, error } = await supabase.from('products').insert(product).select().single();
  if (error) return { data: null, error: error.message };

  const productId = data.id;

  // Insert size variants
  if (sizeVariants.length > 0) {
    await supabase.from('product_variants').insert(
      sizeVariants.map(v => ({
        product_id: productId,
        variant_type: 'size',
        size: v.size as string,
        price: Number(v.price || 0),
        stock: Number(v.stock || 0),
        quantity: Number(v.quantity || 0),
      }))
    );
  }

  // Insert color variants
  if (colorVariants.length > 0) {
    await supabase.from('product_variants').insert(
      colorVariants.map(v => ({
        product_id: productId,
        variant_type: 'color',
        color: v.color as string,
        color_hex: (v.hex || v.color_hex || '') as string,
        sku: (v.sku || '') as string,
        price: Number(v.price || 0),
        stock: Number(v.stock || 0),
      }))
    );
  }

  // Insert delivery countries
  if (deliveryCountries.length > 0) {
    await supabase.from('delivery_countries').insert(
      deliveryCountries.map(dc => ({
        product_id: productId,
        country_code: (dc.countryCode || dc.country_code || dc.country || '') as string,
        country_name: (dc.countryName || dc.country_name || '') as string,
        delivery_charge: Number(dc.deliveryCharge || dc.delivery_charge || 0),
        min_order_qty: Number(dc.minOrderQty || dc.min_order_qty || dc.minQuantity || 1),
      }))
    );
  }

  // Insert offer rules
  if (offerRules.length > 0) {
    await supabase.from('offer_rules').insert(
      offerRules.map(or => ({
        product_id: productId,
        offer_type: (or.type || or.offer_type || '') as string,
        buy_quantity: or.buyQuantity != null ? Number(or.buyQuantity) : null,
        get_quantity: or.getQuantity != null ? Number(or.getQuantity) : null,
        special_day_name: (or.specialDayName || or.special_day_name || or.specialDay || null) as string | null,
        discount_percent: or.discountPercent != null ? Number(or.discountPercent) : null,
        start_time: (or.startTime || or.start_time || null) as string | null,
        end_time: (or.endTime || or.end_time || null) as string | null,
        bundle_min_qty: or.bundleMinQty != null ? Number(or.bundleMinQty) : null,
        bundle_discount: or.bundleDiscount != null ? Number(or.bundleDiscount) : null,
        is_active: Boolean(or.isActive ?? or.is_active ?? or.active ?? true),
      }))
    );
  }

  return { data, error: null };
}

// ---------- ADMIN ACTIONS ----------

export async function approveProduct(id: string) {
  const { error } = await supabase
    .from('products')
    .update({ approval_status: 'approved', is_active: true })
    .eq('id', id);
  return { success: !error, error: error?.message || null };
}

export async function rejectProduct(id: string) {
  const { error } = await supabase
    .from('products')
    .update({ approval_status: 'rejected', is_active: false })
    .eq('id', id);
  return { success: !error, error: error?.message || null };
}

export async function toggleProductStatus(id: string) {
  const { data } = await supabase.from('products').select('is_active').eq('id', id).single();
  if (!data) return { success: false, error: 'Product not found' };

  const { error } = await supabase
    .from('products')
    .update({ is_active: !data.is_active })
    .eq('id', id);
  return { success: !error, error: error?.message || null };
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  return { success: !error, error: error?.message || null };
}

// ---------- REVIEWS ----------

export async function submitReview(review: {
  product_id: string;
  user_id: string;
  rating: number;
  heading: string;
  comment: string;
}) {
  const { data, error } = await supabase.from('reviews').insert(review).select().single();
  if (!error && data) {
    // Recalculate product rating
    const { data: allReviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', review.product_id);
    if (allReviews && allReviews.length > 0) {
      const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
      await supabase
        .from('products')
        .update({ rating: Math.round(avg * 10) / 10, review_count: allReviews.length })
        .eq('id', review.product_id);
    }
  }
  return { data, error: error?.message || null };
}

// ---------- UPLOAD ----------

export async function uploadProductImage(file: File, sellerId: string): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `${sellerId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, file, { contentType: file.type });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadProductVideo(file: File, sellerId: string): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `${sellerId}/videos/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, file, { contentType: file.type });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}
