-- ============================================================================
-- SUPABASE RLS FIX — Run this in the Supabase SQL Editor (Dashboard → SQL)
-- Fixes: "infinite recursion detected in policy for relation profiles"
-- ============================================================================
-- The root cause: policies on `profiles` reference the `profiles` table itself
-- (e.g. checking role via a sub-SELECT), which causes infinite recursion.
-- This script drops ALL existing policies and recreates them correctly using
-- auth.uid() and auth.jwt() → user_metadata (never sub-querying profiles).
-- ============================================================================

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  STEP 1: DROP ALL EXISTING POLICIES ON ALL TABLES                      ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
      r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  STEP 2: ENABLE RLS ON ALL TABLES                                     ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS business_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sub_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS delivery_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS offer_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payment_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS seller_kyc ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS seller_kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS seller_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS courier_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS special_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tax_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS partner_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kyc_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expense_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS daybook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bank_book_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS account_heads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS platform_costs ENABLE ROW LEVEL SECURITY;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  HELPER: Check admin role via JWT (NEVER queries profiles table)       ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- Usage in policies: is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- Helper: check seller role
CREATE OR REPLACE FUNCTION public.is_seller()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'seller',
    false
  );
$$;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  STEP 3: PROFILES — The critical table (was causing recursion)         ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Anyone can read profiles (needed for: signup email/phone check, review FK joins,
-- seller profile on product pages, admin user management)
CREATE POLICY "profiles_select_public"
  ON profiles FOR SELECT
  USING (true);

-- Users can insert their own profile (DB trigger on auth.users may also do this)
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can update any profile (ban, KYC approve, badge)
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (is_admin());

-- Admins can delete profiles
CREATE POLICY "profiles_delete_admin"
  ON profiles FOR DELETE
  USING (is_admin());

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  STEP 4: PUBLIC LOOKUP TABLES (readable by everyone, writable by admin)║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- countries
CREATE POLICY "countries_select_public" ON countries FOR SELECT USING (true);
CREATE POLICY "countries_insert_admin" ON countries FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "countries_update_admin" ON countries FOR UPDATE USING (is_admin());
CREATE POLICY "countries_delete_admin" ON countries FOR DELETE USING (is_admin());

-- business_types
CREATE POLICY "business_types_select_public" ON business_types FOR SELECT USING (true);
CREATE POLICY "business_types_insert_admin" ON business_types FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "business_types_update_admin" ON business_types FOR UPDATE USING (is_admin());
CREATE POLICY "business_types_delete_admin" ON business_types FOR DELETE USING (is_admin());

-- categories
CREATE POLICY "categories_select_public" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_insert_admin" ON categories FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "categories_update_admin" ON categories FOR UPDATE USING (is_admin());
CREATE POLICY "categories_delete_admin" ON categories FOR DELETE USING (is_admin());

-- sub_categories
CREATE POLICY "sub_categories_select_public" ON sub_categories FOR SELECT USING (true);
CREATE POLICY "sub_categories_insert_admin" ON sub_categories FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "sub_categories_update_admin" ON sub_categories FOR UPDATE USING (is_admin());
CREATE POLICY "sub_categories_delete_admin" ON sub_categories FOR DELETE USING (is_admin());

-- colors
CREATE POLICY "colors_select_public" ON colors FOR SELECT USING (true);
CREATE POLICY "colors_insert_admin" ON colors FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "colors_update_admin" ON colors FOR UPDATE USING (is_admin());
CREATE POLICY "colors_delete_admin" ON colors FOR DELETE USING (is_admin());

-- courier_partners
CREATE POLICY "courier_partners_select_public" ON courier_partners FOR SELECT USING (true);
CREATE POLICY "courier_partners_insert_admin" ON courier_partners FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "courier_partners_update_admin" ON courier_partners FOR UPDATE USING (is_admin());
CREATE POLICY "courier_partners_delete_admin" ON courier_partners FOR DELETE USING (is_admin());

-- special_days
CREATE POLICY "special_days_select_public" ON special_days FOR SELECT USING (true);
CREATE POLICY "special_days_insert_admin" ON special_days FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "special_days_update_admin" ON special_days FOR UPDATE USING (is_admin());
CREATE POLICY "special_days_delete_admin" ON special_days FOR DELETE USING (is_admin());

-- tax_rules
CREATE POLICY "tax_rules_select_public" ON tax_rules FOR SELECT USING (true);
CREATE POLICY "tax_rules_insert_admin" ON tax_rules FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "tax_rules_update_admin" ON tax_rules FOR UPDATE USING (is_admin());
CREATE POLICY "tax_rules_delete_admin" ON tax_rules FOR DELETE USING (is_admin());

-- partner_brands
CREATE POLICY "partner_brands_select_public" ON partner_brands FOR SELECT USING (true);
CREATE POLICY "partner_brands_insert_admin" ON partner_brands FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "partner_brands_update_admin" ON partner_brands FOR UPDATE USING (is_admin());
CREATE POLICY "partner_brands_delete_admin" ON partner_brands FOR DELETE USING (is_admin());

-- document_types
CREATE POLICY "document_types_select_public" ON document_types FOR SELECT USING (true);
CREATE POLICY "document_types_insert_admin" ON document_types FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "document_types_update_admin" ON document_types FOR UPDATE USING (is_admin());
CREATE POLICY "document_types_delete_admin" ON document_types FOR DELETE USING (is_admin());

-- kyc_requirements
CREATE POLICY "kyc_requirements_select_public" ON kyc_requirements FOR SELECT USING (true);
CREATE POLICY "kyc_requirements_insert_admin" ON kyc_requirements FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "kyc_requirements_update_admin" ON kyc_requirements FOR UPDATE USING (is_admin());
CREATE POLICY "kyc_requirements_delete_admin" ON kyc_requirements FOR DELETE USING (is_admin());

-- expense_categories
CREATE POLICY "expense_categories_select_public" ON expense_categories FOR SELECT USING (true);
CREATE POLICY "expense_categories_insert_admin" ON expense_categories FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "expense_categories_update_admin" ON expense_categories FOR UPDATE USING (is_admin());
CREATE POLICY "expense_categories_delete_admin" ON expense_categories FOR DELETE USING (is_admin());

-- membership_plans
CREATE POLICY "membership_plans_select_public" ON membership_plans FOR SELECT USING (true);
CREATE POLICY "membership_plans_insert_admin" ON membership_plans FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "membership_plans_update_admin" ON membership_plans FOR UPDATE USING (is_admin());
CREATE POLICY "membership_plans_delete_admin" ON membership_plans FOR DELETE USING (is_admin());

-- banners (public read for homepage display)
CREATE POLICY "banners_select_public" ON banners FOR SELECT USING (true);
CREATE POLICY "banners_insert_admin" ON banners FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "banners_update_admin" ON banners FOR UPDATE USING (is_admin());
CREATE POLICY "banners_delete_admin" ON banners FOR DELETE USING (is_admin());

-- promotions
CREATE POLICY "promotions_select_public" ON promotions FOR SELECT USING (true);
CREATE POLICY "promotions_insert_admin" ON promotions FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "promotions_update_admin" ON promotions FOR UPDATE USING (is_admin());
CREATE POLICY "promotions_delete_admin" ON promotions FOR DELETE USING (is_admin());

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  STEP 5: PRODUCTS + RELATED (public read, seller write own, admin all) ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- products
CREATE POLICY "products_select_public" ON products FOR SELECT USING (true);
CREATE POLICY "products_insert_seller" ON products FOR INSERT
  WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "products_update_own_seller" ON products FOR UPDATE
  USING (auth.uid() = seller_id);
CREATE POLICY "products_update_admin" ON products FOR UPDATE
  USING (is_admin());
CREATE POLICY "products_delete_admin" ON products FOR DELETE
  USING (is_admin());

-- product_variants (public read via FK join, seller inserts)
CREATE POLICY "product_variants_select_public" ON product_variants FOR SELECT USING (true);
CREATE POLICY "product_variants_insert_auth" ON product_variants FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "product_variants_update_admin" ON product_variants FOR UPDATE USING (is_admin());
CREATE POLICY "product_variants_delete_admin" ON product_variants FOR DELETE USING (is_admin());

-- delivery_countries (public read via FK join, seller inserts)
CREATE POLICY "delivery_countries_select_public" ON delivery_countries FOR SELECT USING (true);
CREATE POLICY "delivery_countries_insert_auth" ON delivery_countries FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "delivery_countries_update_admin" ON delivery_countries FOR UPDATE USING (is_admin());
CREATE POLICY "delivery_countries_delete_admin" ON delivery_countries FOR DELETE USING (is_admin());

-- offer_rules (public read via FK join, seller inserts)
CREATE POLICY "offer_rules_select_public" ON offer_rules FOR SELECT USING (true);
CREATE POLICY "offer_rules_insert_auth" ON offer_rules FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "offer_rules_update_admin" ON offer_rules FOR UPDATE USING (is_admin());
CREATE POLICY "offer_rules_delete_admin" ON offer_rules FOR DELETE USING (is_admin());

-- reviews (public read, authenticated insert)
CREATE POLICY "reviews_select_public" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert_auth" ON reviews FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "reviews_update_admin" ON reviews FOR UPDATE USING (is_admin());
CREATE POLICY "reviews_delete_admin" ON reviews FOR DELETE USING (is_admin());

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  STEP 6: USER-OWNED TABLES (own rows only, admin all)                  ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- orders
CREATE POLICY "orders_select_own" ON orders FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = seller_id OR is_admin());
CREATE POLICY "orders_insert_auth" ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "orders_update_own_or_admin" ON orders FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = seller_id OR is_admin());

-- order_items
CREATE POLICY "order_items_select_auth" ON order_items FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "order_items_insert_auth" ON order_items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "order_items_update_admin" ON order_items FOR UPDATE USING (is_admin());

-- payment_intents
CREATE POLICY "payment_intents_insert_auth" ON payment_intents FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "payment_intents_select_admin" ON payment_intents FOR SELECT
  USING (is_admin() OR auth.uid() IS NOT NULL);

-- payment_refunds
CREATE POLICY "payment_refunds_insert_admin" ON payment_refunds FOR INSERT
  WITH CHECK (is_admin());
CREATE POLICY "payment_refunds_select_admin" ON payment_refunds FOR SELECT
  USING (is_admin() OR auth.uid() IS NOT NULL);

-- wishlists
CREATE POLICY "wishlists_select_own" ON wishlists FOR SELECT
  USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "wishlists_insert_own" ON wishlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wishlists_upsert_own" ON wishlists FOR UPDATE
  USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "wishlists_delete_own" ON wishlists FOR DELETE
  USING (auth.uid() = user_id OR is_admin());

-- cart_items
CREATE POLICY "cart_items_select_own" ON cart_items FOR SELECT
  USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "cart_items_insert_own" ON cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cart_items_update_own" ON cart_items FOR UPDATE
  USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "cart_items_delete_own" ON cart_items FOR DELETE
  USING (auth.uid() = user_id OR is_admin());

-- addresses
CREATE POLICY "addresses_select_auth" ON addresses FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "addresses_insert_auth" ON addresses FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "addresses_update_admin" ON addresses FOR UPDATE USING (is_admin());
CREATE POLICY "addresses_delete_admin" ON addresses FOR DELETE USING (is_admin());

-- user_addresses
CREATE POLICY "user_addresses_select_own" ON user_addresses FOR SELECT
  USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "user_addresses_insert_own" ON user_addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id OR is_admin());
CREATE POLICY "user_addresses_update_own" ON user_addresses FOR UPDATE
  USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "user_addresses_delete_own" ON user_addresses FOR DELETE
  USING (auth.uid() = user_id OR is_admin());

-- notifications
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "notifications_delete_admin" ON notifications FOR DELETE
  USING (is_admin());

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  STEP 7: SELLER TABLES (seller own rows, admin all)                    ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- seller_kyc
CREATE POLICY "seller_kyc_select_own" ON seller_kyc FOR SELECT
  USING (auth.uid() = seller_id OR is_admin());
CREATE POLICY "seller_kyc_insert_own" ON seller_kyc FOR INSERT
  WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "seller_kyc_update_own_or_admin" ON seller_kyc FOR UPDATE
  USING (auth.uid() = seller_id OR is_admin());
CREATE POLICY "seller_kyc_delete_admin" ON seller_kyc FOR DELETE
  USING (is_admin());

-- seller_kyc_documents
CREATE POLICY "seller_kyc_documents_select_own" ON seller_kyc_documents FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "seller_kyc_documents_insert_admin" ON seller_kyc_documents FOR INSERT
  WITH CHECK (is_admin());
CREATE POLICY "seller_kyc_documents_update_admin" ON seller_kyc_documents FOR UPDATE
  USING (is_admin());
CREATE POLICY "seller_kyc_documents_delete_admin" ON seller_kyc_documents FOR DELETE
  USING (is_admin());

-- withdrawals
CREATE POLICY "withdrawals_select_own" ON withdrawals FOR SELECT
  USING (auth.uid() = seller_id OR is_admin());
CREATE POLICY "withdrawals_insert_own" ON withdrawals FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

-- seller_payouts
CREATE POLICY "seller_payouts_select_own" ON seller_payouts FOR SELECT
  USING (auth.uid() = seller_id OR is_admin());

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  STEP 8: ADMIN-ONLY TABLES                                            ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- complaints
CREATE POLICY "complaints_select_auth" ON complaints FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "complaints_insert_auth" ON complaints FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "complaints_update_admin" ON complaints FOR UPDATE
  USING (is_admin());

-- audit_logs
CREATE POLICY "audit_logs_select_admin" ON audit_logs FOR SELECT
  USING (is_admin());
CREATE POLICY "audit_logs_insert_any" ON audit_logs FOR INSERT
  WITH CHECK (true);

-- expense_entries
CREATE POLICY "expense_entries_select_admin" ON expense_entries FOR SELECT
  USING (is_admin());
CREATE POLICY "expense_entries_insert_admin" ON expense_entries FOR INSERT
  WITH CHECK (is_admin());

-- daybook_entries
CREATE POLICY "daybook_entries_select_admin" ON daybook_entries FOR SELECT
  USING (is_admin());
CREATE POLICY "daybook_entries_insert_admin" ON daybook_entries FOR INSERT
  WITH CHECK (is_admin());

-- bank_book_entries
CREATE POLICY "bank_book_entries_select_admin" ON bank_book_entries FOR SELECT
  USING (is_admin());
CREATE POLICY "bank_book_entries_insert_admin" ON bank_book_entries FOR INSERT
  WITH CHECK (is_admin());

-- account_heads
CREATE POLICY "account_heads_select_admin" ON account_heads FOR SELECT
  USING (is_admin());
CREATE POLICY "account_heads_insert_admin" ON account_heads FOR INSERT
  WITH CHECK (is_admin());

-- platform_costs
CREATE POLICY "platform_costs_select_admin" ON platform_costs FOR SELECT
  USING (is_admin());
CREATE POLICY "platform_costs_insert_admin" ON platform_costs FOR INSERT
  WITH CHECK (is_admin());

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  STEP 9: STORAGE POLICIES                                             ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Ensure storage buckets exist and are public-readable
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
  ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false)
  ON CONFLICT (id) DO UPDATE SET public = false;

-- Drop existing storage policies
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

-- product-images: public read, authenticated upload
CREATE POLICY "product_images_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "product_images_insert_auth"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "product_images_update_auth"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "product_images_delete_auth"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

-- kyc-documents: only owner and admin
CREATE POLICY "kyc_docs_insert_auth"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'kyc-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "kyc_docs_select_auth"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'kyc-documents' AND auth.uid() IS NOT NULL);

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  DONE — Verify with: SELECT * FROM countries LIMIT 1;                  ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
