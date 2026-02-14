# Beauzead E-Commerce

## Auth — Supabase (Integrated)

### Roles
- `user` — Buyers
- `seller` — Merchants
- `admin` — Backend-only creation

### Pages

| Feature | User | Seller | Admin |
|---|---|---|---|
| Login | `/login` | `/seller/login` | Redirects to `/seller/login` |
| Signup | `/signup` | `/seller/signup` | No signup |
| OTP | `/otp-verification` | `/seller/otp-verification` | N/A |
| Forgot Password | `/forgot-password` | `/seller/forgot-password` | N/A |
| New Password | `/new-password` | `/seller/new-password` | N/A |

### Flows

**Signup:** Form → Supabase `signUp()` → 6-digit email OTP → `verifyOtp()` → Auto sign-in → Redirect  
**Login:** `signInWithPassword()` → Fetch profile → Role-based redirect  
**Forgot Password:** `resetPasswordForEmail()` → OTP → `verifyOtp(recovery)` → `updateUser(password)` → Login  
**Admin:** Created via Supabase Dashboard or `auth.admin.createUser()`, then `update profiles set role='admin'`

### Route Guards

- `/admin/*` → `admin` only
- `/seller/dashboard`, `/seller/products`, etc. → `seller` or `admin`
- `/orders`, `/cart`, `/profile`, etc. → `user` only
- Unauthenticated → redirected to `/login` or `/seller/login`

### Setup

1. Create project at [supabase.com](https://supabase.com)
2. Copy `.env.example` → `.env` and fill `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
3. Run `supabase/setup.sql` in SQL Editor (creates profiles, countries, business_types + RLS + triggers)
4. **Supabase Dashboard → Authentication → Email Templates → set OTP format to 6-digit code**
5. `npm install && npm run dev`

### Key Files

- `src/lib/supabase.ts` — Supabase client
- `src/contexts/AuthContext.tsx` — All auth logic (signUp, signIn, OTP, reset)
- `supabase/setup.sql` — DB schema, triggers, RLS, seed data

### SQL Tables

See `supabase/setup.sql` for:
- `countries` — 10 countries seeded (IN, US, GB, CA, AU, DE, FR, JP, SG, AE)
- `business_types` — Individual, Brand, Freelancing
- `profiles` — Linked to `auth.users`, auto-created on signup via trigger
- RLS policies — users read/update own, admins read/update all

## User Section — Page Status

### Auth Pages (Connected to Supabase)

| Page | Route | Functions |
|---|---|---|
| Login | `/login` | Email/password sign in, role-based redirect, forgot password link |
| Signup | `/signup` | Full name, email, password, country select, password validation → OTP |
| OTP Verification | `/otp-verification` | 6-digit input, auto-focus, resend timer (30s), signup + password reset |
| Forgot Password | `/forgot-password` | Email → sends reset OTP → OTP page |
| New Password | `/new-password` | New + confirm password with strength validation → login |

### User Pages (Stubbed / Local Only)

| Page | Route | Functions | Status |
|---|---|---|---|
| Profile | `/profile` | Info edit, addresses link, security, notification prefs | Stubbed — graphql no-op |
| Settings | `/settings` | Profile edit, change password, notification toggles | Stubbed — setTimeout |
| My Orders | `/orders` | Order list, filter tabs, status badges | Stubbed — always empty |
| Order Details | `/orders/:orderId` | Items, tracking timeline, invoice download | Stubbed — always "not found" |
| Wishlist | `/wishlist` | List items, remove, add to cart, total value/savings | Local — localStorage |
| Cart | `/cart` | Quantity +/-, remove, coupon (stub), GST calc, checkout | Local — localStorage |
| Shipping Address | `/checkout/shipping` | New/saved address form, validation, progress stepper | Local — localStorage |
| Order Summary | `/checkout/review` | Review items + shipping + totals before payment | Local — localStorage |
| Checkout | `/checkout/payment` | Stripe card form, billing address, pay button | Stubbed — fake Stripe |
| Order Confirmation | `/checkout/confirmation` | Success display, order number, timeline, print receipt | Local — route state |
| Notifications | `/notifications` | Filter tabs, mark read/delete, notification types | Stubbed — always empty |
| Address Management | `/user/addresses` | CRUD addresses, set default, home/work/other types | Stubbed — graphql no-op |
| Write Review | `/products/:id/review` | Star rating, title/body, image upload, benefit tags | Stubbed — graphql no-op |

### Contexts (Local Only)

| Context | Functions | Status |
|---|---|---|
| CartContext | addToCart, removeFromCart, updateQuantity, clearCart, createOrderFromCart | localStorage, fake order ID |
| WishlistContext | addToWishlist, removeFromWishlist, isInWishlist, syncToBackend, loadFromBackend | localStorage, sync empty |

### Integration Priority

1. Profile + Settings
2. Address Management
3. Wishlist + Cart (sync across devices)
4. Orders flow (My Orders → Order Details → Tracking)
5. Notifications
6. Write Review
7. Checkout / Stripe (later)

---

## TODO

- [ ] Run SQL migrations (`01_countries.sql` → `07_admin_setup.sql`) on Supabase dashboard
- [ ] Create `kyc-documents` storage bucket (private) in Supabase
- [ ] Add RLS policy: sellers can only access their own `kyc-documents/{seller_id}/` folder
- [ ] Wire remaining seller dashboard pages (Orders, Wallet, Analytics) to Supabase
- [ ] Connect CartContext & WishlistContext to Supabase for cross-device sync
- [ ] Build order flow end-to-end (Checkout → Payment → Order Confirmation → Tracking)
- [ ] Add email notifications on KYC status change (approved / rejected)
- [ ] Implement admin role guard on `/admin/*` routes (currently no auth check)
- [ ] Add pagination to admin KYC table for large datasets
- [ ] Product search & filtering with Supabase full-text search
