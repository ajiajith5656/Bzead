# Bzead (BeauZead) E-Commerce Platform

## Project Overview
Multi-tenant e-commerce platform with three portals: **User**, **Seller**, and **Admin**.
Built with React 19 + TypeScript + Vite frontend, **Supabase** backend (DB, Auth, Storage, Edge Functions), and **Stripe** for payments.

## Tech Stack
- **Frontend**: React 19, TypeScript 5.9, React Router 7, TailwindCSS 3
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Payments**: Stripe (Elements + PaymentIntents)
- **Build**: Vite 7, ESLint 9, Vitest 4
- **Currency**: Multi-currency with exchange rate API + hardcoded fallback

## Architecture

### Directory Structure
- `src/lib/` — Service layer (Supabase CRUD): `supabase.ts`, `productService.ts`, `orderService.ts`, `adminService.ts`, `kycService.ts`, `stripeService.ts`
- `src/contexts/` — React contexts: Auth, Cart, Wishlist, Currency, ProductListing
- `src/pages/user/` — Buyer-facing pages
- `src/pages/seller/` — Seller dashboard pages
- `src/pages/admin/` — Admin panel (lazy-loaded modules)
- `src/components/` — Shared UI components (Header, Footer, etc.)
- `src/utils/` — Utility functions (currency, domain, imageUpload, logger, validation)
- `src/types/index.ts` — All TypeScript interfaces

### Multi-Tenant Routing
- Main domain → User portal
- `sellers.*` subdomain → Seller portal
- `admin.*` subdomain → Admin portal
- Locally falls back to path-based routing (`/seller/*`, `/admin/*`)
- Domain detection in `src/utils/domain.ts`

### Auth Flow
- Supabase Auth with email/password + OTP verification
- `AuthContext` uses `onAuthStateChange` with `INITIAL_SESSION` event
- Profile stored in `profiles` table, created via DB trigger on signup
- Roles: `user`, `seller`, `admin` — stored in `profiles.role`
- Stale token cleanup on app init (see `clearStaleToken()`)

### Payment Flow
- **Dev**: Vite dev middleware at `/api/create-payment-intent` (uses `STRIPE_SECRET_KEY` env var)
- **Prod**: Supabase Edge Function `create-payment-intent`
- Client sends amount → server creates PaymentIntent → client confirms via Stripe Elements
- Zero-decimal currencies handled in `stripeService.ts`

### Data Flow
- All Supabase queries go through service files in `src/lib/`
- Contexts (`CartContext`, `WishlistContext`) manage local state + optional backend sync
- Cart persists to `localStorage` (key: `beauzead_cart`)
- Wishlist persists to `localStorage` + syncs to `wishlists` table on login

### Database Tables (Supabase) — 42 tables total

#### Core User & Auth
- `profiles` (25 cols) — User/seller/admin accounts, role, country_id, business_type_id, is_verified
- `user_addresses` — User shipping/billing addresses (used by adminService.ts)
- `addresses` — User addresses (used by AdminAddressManagement.tsx)
- `notifications` — User notification records

#### Products & Catalog
- `products` — Product listings
- `product_variants` — SKU-level variants (size, color, price)
- `categories` — Top-level product categories
- `sub_categories` — Nested sub-categories
- `colors` — Color reference table
- `delivery_countries` — Per-product country delivery rules
- `offer_rules` — Discount/offer logic per product

#### Orders & Payments
- `orders` — Order headers
- `order_items` — Individual items within orders
- `payment_intents` — Stripe PaymentIntent tracking
- `payment_refunds` — Refund records
- `cart_items` — Server-side cart items

#### Seller Management
- `seller_kyc` (55 cols) — 4-step KYC verification (draft → pending → approved/rejected)
- `seller_kyc_documents` — Uploaded KYC document metadata
- `seller_payouts` — Payout records to sellers
- `withdrawals` — Seller withdrawal requests

#### KYC & Verification Reference
- `tax_id_types` — Country-specific tax ID types (PAN, SSN, UTR, etc.) for KYC Step 2
- `document_types` — Country-specific identity documents for KYC Step 4
- `kyc_requirements` — Legacy document requirement definitions per country
- `countries` — Country reference (name, code, currency, phone_code)
- `business_types` — Business type reference (sole proprietor, LLC, etc.)

#### Admin & Finance
- `account_heads` — Chart of accounts
- `audit_logs` — Admin action audit trail
- `bank_book_entries` — Bank transaction journal
- `daybook_entries` — Daily transaction journal
- `expense_entries` — Expense records
- `expense_categories` — Expense category reference
- `platform_costs` — Platform operational costs
- `tax_rules` — Tax calculation rules
- `membership_plans` — Seller membership tiers

#### Content & Marketing
- `banners` — Homepage/promotional banners
- `promotions` — Promotion campaigns
- `complaints` — Customer complaints
- `reviews` — Product reviews with rating
- `wishlists` — User wishlist (user_id + product_id)
- `special_days` — Special date-based promotions
- `courier_partners` — Shipping carrier reference
- `partner_brands` — Partner brand logos for seller landing page

### Storage Buckets
- `product-images` — Product and category images
- `kyc-documents` — Seller KYC document uploads (private)

## Environment Variables
Required in `.env` (copy from `.env.example`):
```
VITE_SUPABASE_URL=          # Required — app crashes without it
VITE_SUPABASE_ANON_KEY=     # Required — app crashes without it
VITE_STRIPE_PUBLISHABLE_KEY= # Required for payments
STRIPE_SECRET_KEY=          # Server-side only (no VITE_ prefix)
VITE_DOMAIN=                # Optional — production domain
VITE_SELLER_DOMAIN=         # Optional — seller subdomain
VITE_ADMIN_DOMAIN=          # Optional — admin subdomain
VITE_EXCHANGE_RATE_API_KEY= # Optional — falls back to hardcoded rates
```

## Build & Test Commands
```bash
npm run dev          # Start dev server (port 5173)
npm run build        # TypeScript check + Vite build
npm run test         # Run vitest
npm run test:watch   # Vitest in watch mode
npm run lint         # ESLint
```

## Conventions
- **Snake_case** for database columns (`seller_id`, `total_amount`, `created_at`)
- **CamelCase** for TypeScript/React code
- Service functions return `{ data, error }` pattern (error is string | null)
- All Supabase queries include error handling with `error?.message || null`
- Lazy-loading for all page components via `React.lazy()` with code-splitting
- Named exports use `.then()` wrapper pattern for lazy imports
- Currency formatting uses `useCurrency()` context hook → `formatPrice(amount, fromCurrency)`

## Seller KYC Verification Flow

### 4-Step Form (`SellerKYCVerification.tsx`)
1. **Personal Information** — auto-populated from `profiles`, editable name/phone/country; saves address
2. **Business Information** — business type, name, tax ID (country-specific dropdown from `tax_id_types`), business address, brand name, declaration
3. **Bank Details** — holder name, bank/branch, account number, SWIFT/IFSC/routing code, account type, authorization
4. **Document Upload** — identity doc type (country-specific from `document_types`), front/back images, business reg doc, tax doc, bank proof, 3 consent checkboxes

### KYC Tables
- `seller_kyc` — main KYC record (one per seller), stores all 4 steps + draft/pending/approved/rejected status
- `tax_id_types` — country-specific tax ID types (PAN/India, SSN/US, UTR/UK, etc.) with `country_code` filter
- `document_types` — country-specific identity documents with `country_code` + `category` columns
- `countries` — reference table for country dropdown
- `business_types` — reference table for business type dropdown

### KYC Service (`kycService.ts`)
- `generateKYCFormId()` — creates `BZ-KYC-XXXXXXXX` identifier
- `saveKYCStep1/2/3()` — saves each step as draft, advances `current_step`
- `submitKYCStep4()` — uploads documents, sets status to `pending`, generates reference number
- `getSellerKYCDraft()` — loads existing draft for resume
- `fetchTaxIdTypes(countryCode)` / `fetchIdentityDocTypes(countryCode)` — country-specific dropdowns
- Step 1 also updates `profiles` table when seller edits name/phone/country
- Once completed, previous steps are locked (can't go back)
- Only one active KYC (draft or pending) per seller
- Admin approve/reject via `approveKYC()` / `rejectKYC()`

## Security Model
- RLS (Row Level Security) on all Supabase tables
- Admin operations in `adminService.ts` rely on RLS for authorization
- `VITE_SUPABASE_ANON_KEY` is public (by design) — all auth goes through Supabase
- Stripe amounts should be validated server-side in Edge Functions
- `X-Client-Info` header set to `metricflux-web` on all Supabase requests
