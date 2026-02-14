# Important Fixes — Column Mismatches (Code vs Database)

All 27 mismatches found during the full integration audit. Each entry shows what the code uses vs what actually exists in the Supabase database.

---

## 1. `orders` table

| # | File | Line | Code Uses | DB Has | Fix Needed |
|---|------|------|-----------|--------|------------|
| 1 | `src/lib/orderService.ts` | L17 | `seller_id` (in `.eq()`) | No `seller_id` column | Add column to DB or remove filter |
| 2 | `src/lib/orderService.ts` | L83 | `phone` (in insert) | No `phone` column | Add column to DB or remove from insert |
| 3 | `src/lib/orderService.ts` | L84 | `payment_intent_id` (in insert) | No `payment_intent_id` column (has `payment_method`) | Add column to DB or use `payment_method` |
| 4 | `src/lib/orderService.ts` | L126 | `completed_at` (in update) | No `completed_at` column | Add column to DB or remove from update |
| 5 | `src/pages/user/Checkout.tsx` | L148 | `order_number` (in insert) | No `order_number` column | Add column to DB or remove from insert |
| 6 | `src/pages/user/Checkout.tsx` | L149 | `payment_intent_id` (in insert) | No `payment_intent_id` column | Add column to DB or remove from insert |

**Actual `orders` columns:** `id, user_id, status, total_amount, currency, shipping_address, billing_address, payment_method, payment_status, tracking_number, notes, created_at, updated_at`

---

## 2. `order_items` table

| # | File | Line | Code Uses | DB Has | Fix Needed |
|---|------|------|-----------|--------|------------|
| 7 | `src/lib/orderService.ts` | L98 | `product_name` (in insert) | No `product_name` column | Add column to DB or remove from insert |
| 8 | `src/lib/orderService.ts` | L99 | `product_image` (in insert) | No `product_image` column | Add column to DB or remove from insert |
| 9 | `src/lib/orderService.ts` | L102 | `variant_info` (in insert) | No `variant_info` column (has `variant`) | Add column to DB or use `variant` |
| 10 | `src/lib/orderService.ts` | L103 | `category` (in insert) | No `category` column | Add column to DB or remove from insert |
| 11 | `src/pages/user/Checkout.tsx` | L164 | `product_name` (in insert) | No `product_name` column | Add column to DB or remove from insert |

**Actual `order_items` columns:** `id, order_id, product_id, quantity, price, seller_id, variant, created_at`

---

## 3. `product_variants` table

| # | File | Line | Code Uses | DB Has | Fix Needed |
|---|------|------|-----------|--------|------------|
| 12 | `src/lib/productService.ts` | ~L233 | `variant_type` (in insert) | No `variant_type` column (has `name`) | Use `name` instead |
| 13 | `src/lib/productService.ts` | ~L234 | `size` (in insert) | No `size` column (has `value`) | Use `value` instead |
| 14 | `src/lib/productService.ts` | ~L236 | `quantity` (in insert) | No `quantity` column (has `stock`) | Use `stock` instead |
| 15 | `src/lib/productService.ts` | ~L243 | `color` (in insert) | No `color` column | Use `value` instead |
| 16 | `src/lib/productService.ts` | ~L244 | `color_hex` (in insert) | No `color_hex` column | Remove or add column to DB |

**Actual `product_variants` columns:** `id, product_id, name, value, sku, price, stock, created_at`

---

## 4. `categories` table

| # | File | Line | Code Uses | DB Has | Fix Needed |
|---|------|------|-----------|--------|------------|
| 17 | `src/lib/productService.ts` | L78 | `description` (in select) | No `description` column | Add column to DB or remove from select |
| 18 | `src/lib/productService.ts` | L78 | `display_order` (in select/order) | No `display_order` column | Add column to DB or remove from query |
| 19 | `src/lib/productService.ts` | L90 | `description` (in insert) | No `description` column | Add column to DB or remove from insert |
| 20 | `src/lib/productService.ts` | L90 | `display_order` (in insert) | No `display_order` column | Add column to DB or remove from insert |

**Actual `categories` columns:** `id, name, image_url, is_active, parent_id, slug, created_at`

---

## 5. `sub_categories` table

| # | File | Line | Code Uses | DB Has | Fix Needed |
|---|------|------|-----------|--------|------------|
| 21 | `src/lib/productService.ts` | L78 | `description` (in nested select) | No `description` column | Add column to DB or remove from select |
| 22 | `src/lib/productService.ts` | L127 | `description` (in insert) | No `description` column | Add column to DB or remove from insert |

**Actual `sub_categories` columns:** `id, category_id, name, slug, is_active, created_at`

---

## 6. `products` table

| # | File | Line | Code Uses | DB Has | Fix Needed |
|---|------|------|-----------|--------|------------|
| 23 | `src/lib/productService.ts` | L65 | `rating` (in select) | No `rating` column | Add column to DB or remove from select |
| 24 | `src/lib/productService.ts` | ~L330 | `rating` (in update via `submitReview`) | No `rating` column | Add column to DB or remove from update |
| 25 | `src/lib/productService.ts` | ~L330 | `review_count` (in update via `submitReview`) | No `review_count` column | Add column to DB or remove from update |

**Note:** `tags` is inserted by `createProduct` — verify if column exists.

---

## 7. `profiles` table

| # | File | Line | Code Uses | DB Has | Fix Needed |
|---|------|------|-----------|--------|------------|
| 26 | `src/lib/adminService.ts` | L73 | `badge` (in update) | No `badge` column | Add column to DB or remove function |

---

## 8. `colors` table

| # | File | Line | Code Uses | DB Has | Fix Needed |
|---|------|------|-----------|--------|------------|
| 27 | `src/pages/admin/modules/AdminListings1.tsx` | — | `hex_code` (in select) | Column is `hex` | Change code to `hex` or rename DB column |

**Actual `colors` columns:** `id, name, hex, is_active, created_at`

---

## 9. `payment_intents` table

| # | File | Line | Code Uses | DB Has | Fix Needed |
|---|------|------|-----------|--------|------------|
| 28 | `src/pages/user/Checkout.tsx` | L180 | `stripe_payment_intent_id` (in insert) | Column is `stripe_payment_id` | Change code to `stripe_payment_id` or rename DB column |

**Actual `payment_intents` columns:** `id, order_id, stripe_payment_id, status, amount, currency, user_id, created_at`

---

## 10. `tax_id_types` table

| # | File | Line | Code Uses | DB Has | Fix Needed |
|---|------|------|-----------|--------|------------|
| 29 | `src/lib/kycService.ts` | L206 | `placeholder` (in select) | Column is `format_hint` | Change code to `format_hint` or rename DB column |

---

## 11. `document_types` table

| # | File | Line | Code Uses | DB Has | Fix Needed |
|---|------|------|-----------|--------|------------|
| 30 | `src/lib/kycService.ts` | L227 | `value` (in select) | Column is `code` | Change code to `code` or rename DB column |

---

## Summary

- **Total mismatches:** 30
- **Tables affected:** 11 (`orders`, `order_items`, `product_variants`, `categories`, `sub_categories`, `products`, `profiles`, `colors`, `payment_intents`, `tax_id_types`, `document_types`)
- **Files affected:** 5 (`orderService.ts`, `productService.ts`, `adminService.ts`, `Checkout.tsx`, `kycService.ts`, `AdminListings1.tsx`)

### Quick Wins (simple column name renames in code)
- `hex_code` → `hex` in AdminListings1.tsx
- `placeholder` → `format_hint` in kycService.ts
- `value` → `code` in kycService.ts
- `stripe_payment_intent_id` → `stripe_payment_id` in Checkout.tsx

### Needs Decision (add DB columns OR change code logic)
- `orders`: missing `seller_id`, `phone`, `payment_intent_id`, `order_number`, `completed_at`
- `order_items`: missing `product_name`, `product_image`, `variant_info`, `category`
- `product_variants`: schema mismatch — code uses `variant_type/size/color/color_hex/quantity`, DB uses `name/value/sku/stock`
- `categories`: missing `description`, `display_order`
- `sub_categories`: missing `description`
- `products`: missing `rating`, `review_count`
- `profiles`: missing `badge`
