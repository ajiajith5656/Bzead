import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { useWishlistSync } from './hooks/useWishlistSync';
import { detectDomain, type AppDomain } from './utils/domain';

// ── Lazy-loaded page components (code-splitting) ──────────────────────
// Named-only exports use .then() wrapper; default exports load directly.

// Auth
const Login = lazy(() => import('./components/auth/Login').then(m => ({ default: m.Login })));
const Signup = lazy(() => import('./components/auth/Signup').then(m => ({ default: m.Signup })));

// User pages
const MyOrders = lazy(() => import('./pages/user/MyOrders').then(m => ({ default: m.MyOrders })));
const NotificationsPage = lazy(() => import('./pages/user/Notifications'));
const WishlistPage = lazy(() => import('./pages/user/Wishlist').then(m => ({ default: m.WishlistPage })));
const CartPage = lazy(() => import('./pages/user/Cart').then(m => ({ default: m.CartPage })));
const UserSettings = lazy(() => import('./pages/user/Settings').then(m => ({ default: m.UserSettings })));
const ForgotPassword = lazy(() => import('./pages/user/ForgotPassword'));
const Profile = lazy(() => import('./pages/user/Profile'));
const OrderDetails = lazy(() => import('./pages/user/OrderDetails'));
const WriteReview = lazy(() => import('./pages/user/WriteReview'));
const UserAddressManagement = lazy(() => import('./pages/user/AddressManagement'));
const Checkout = lazy(() => import('./pages/user/Checkout'));
const ShippingAddressPage = lazy(() => import('./pages/user/ShippingAddress'));
const OrderSummaryPage = lazy(() => import('./pages/user/OrderSummary'));
const OrderConfirmationPage = lazy(() => import('./pages/user/OrderConfirmation'));

// Seller pages
const SellerDashboardWrapper = lazy(() => import('./pages/seller/SellerDashboardWrapper').then(m => ({ default: m.SellerDashboardWrapper })));
const SellerLanding = lazy(() => import('./pages/seller/SellerLanding').then(m => ({ default: m.SellerLanding })));
const SellerSignup = lazy(() => import('./pages/seller/SellerSignup'));
const SellerLogin = lazy(() => import('./pages/seller/SellerLogin'));
const SellerForgotPassword = lazy(() => import('./pages/seller/SellerForgotPassword'));
const AnalyticsDashboard = lazy(() => import('./pages/seller/AnalyticsDashboard'));
const SellerProfile = lazy(() => import('./pages/seller/SellerProfile'));
const SellerProductListingWrapper = lazy(() => import('./pages/seller/SellerProductListingWrapper'));
const SellerOrderManagementWrapper = lazy(() => import('./pages/seller/SellerOrderManagementWrapper'));
const SellerWalletWrapper = lazy(() => import('./pages/seller/SellerWalletWrapper'));
const SellerVerificationWrapper = lazy(() => import('./pages/seller/SellerVerificationWrapper'));

// Admin pages
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminOverview = lazy(() => import('./pages/admin/modules/AdminOverview'));
const UserManagement = lazy(() => import('./pages/admin/modules/UserManagement'));
const SellerManagement = lazy(() => import('./pages/admin/modules/SellerManagement'));
const ProductManagement = lazy(() => import('./pages/admin/modules/ProductManagement').then(m => ({ default: m.ProductManagement })));
const OrderManagement = lazy(() => import('./pages/admin/modules/OrderManagement'));
const CategoryManagement = lazy(() => import('./pages/admin/modules/CategoryManagement'));
const BannerManagement = lazy(() => import('./pages/admin/modules/BannerManagement'));
const PromotionManagement = lazy(() => import('./pages/admin/modules/PromotionManagement'));
const ReviewManagement = lazy(() => import('./pages/admin/modules/ReviewManagement'));
const ComplaintManagement = lazy(() => import('./pages/admin/modules/ComplaintManagement'));
const AccountsManagement = lazy(() => import('./pages/admin/modules/AccountsManagement'));
const ReportsManagement = lazy(() => import('./pages/admin/modules/ReportsManagement'));
const AdminManagement = lazy(() => import('./pages/admin/modules/AdminManagement'));
const ProfilePage = lazy(() => import('./pages/admin/modules/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/admin/modules/SettingsPage'));
const SellerKYCSubmissionManagement = lazy(() => import('./pages/admin/modules/SellerKYCSubmissionManagement').then(m => ({ default: m.SellerKYCSubmissionManagement })));
const ProductVariantManagement = lazy(() => import('./pages/admin/modules/ProductVariantManagement'));
const SearchManagement = lazy(() => import('./pages/admin/modules/SearchManagement'));
const AuditLogs = lazy(() => import('./pages/admin/modules/AuditLogs'));
const SystemHealth = lazy(() => import('./pages/admin/modules/SystemHealth'));
const AdminAddressManagement = lazy(() => import('./pages/admin/components/AdminAddressManagement'));
const ProductListingLayout = lazy(() => import('./pages/admin/modules/ProductListingLayout'));
const AdminListings1 = lazy(() => import('./pages/admin/modules/AdminListings1'));
const AdminListings2 = lazy(() => import('./pages/admin/modules/AdminListings2'));
const AdminListings3 = lazy(() => import('./pages/admin/modules/AdminListings3'));
const AdminListing4 = lazy(() => import('./pages/admin/modules/AdminListing4'));
const AdminListing5 = lazy(() => import('./pages/admin/modules/AdminListing5'));
const AdminListing6 = lazy(() => import('./pages/admin/modules/AdminListing6'));

// Public pages
const NewHome = lazy(() => import('./pages/NewHome').then(m => ({ default: m.NewHome })));
const ProductDetailsPage = lazy(() => import('./pages/ProductDetailsPage'));
const CategoryProducts = lazy(() => import('./pages/CategoryProducts').then(m => ({ default: m.CategoryProducts })));
const SectionProducts = lazy(() => import('./pages/SectionProducts').then(m => ({ default: m.SectionProducts })));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsService = lazy(() => import('./pages/TermsService'));
const ShippingPolicy = lazy(() => import('./pages/ShippingPolicy'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));
const OTPVerification = lazy(() => import('./pages/OTPVerification'));
const NewPassword = lazy(() => import('./pages/NewPassword'));
const NotFound = lazy(() => import('./pages/NotFound'));

// ── Page loading fallback ─────────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-amber-600 text-lg font-medium">Loading…</span>
    </div>
  </div>
);

// Simple path-based route guard — now subdomain-aware
const RouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authRole, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const domain = detectDomain();
  // Normalize: strip trailing slashes to avoid mismatch (e.g. "/seller/" vs "/seller")
  const path = location.pathname.replace(/\/+$/, '') || '/';

  useEffect(() => {
    if (loading) return;

    // ── Public routes — always accessible ──
    const publicPaths = [
      '/', '/login', '/signup', '/otp-verification', '/forgot-password', '/new-password',
      '/seller', '/seller/login', '/seller/signup', '/seller/otp-verification',
      '/seller/forgot-password', '/seller/new-password',
      '/privacy-policy', '/terms-of-service', '/shipping-policy', '/refund-policy',
    ];

    // Admin login is public ONLY on admin subdomain
    if (domain === 'admin') {
      publicPaths.push('/admin/login');
    }

    const isPublic = publicPaths.includes(path) ||
      path.startsWith('/products') || path.startsWith('/category');

    if (isPublic) return;

    // Block unauthenticated users from all protected routes
    if (!authRole) {
      if (domain === 'admin' || path.startsWith('/admin')) {
        navigate('/admin/login', { replace: true });
      } else if (domain === 'seller' || path.startsWith('/seller')) {
        navigate('/seller/login', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
      return;
    }

    // ADMIN ROUTES: Allow admin ONLY (admin subdomain)
    if (path.startsWith('/admin')) {
      if (authRole !== 'admin') {
        navigate('/', { replace: true });
      }
      return;
    }

    // SELLER ROUTES: Allow seller OR admin
    if (path.startsWith('/seller/dashboard') || path.startsWith('/seller/products') || 
        path.startsWith('/seller/orders') || path.startsWith('/seller/wallet') ||
        path.startsWith('/seller/analytics') || path.startsWith('/seller/profile') ||
        path.startsWith('/seller/verify')) {
      if (authRole !== 'seller' && authRole !== 'admin') {
        navigate('/seller/login', { replace: true });
      }
      return;
    }

    // USER ROUTES: Allow user ONLY (protected user pages)
    if (path.startsWith('/orders') || path.startsWith('/profile') || 
        path.startsWith('/wishlist') || path.startsWith('/cart') ||
        path.startsWith('/checkout') || path.startsWith('/settings') ||
        path.startsWith('/notifications') || path.startsWith('/user')) {
      if (authRole !== 'user') {
        navigate('/login', { replace: true });
      }
    }
  }, [authRole, path, loading, navigate, domain]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-amber-600 text-xl font-medium">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
};

// Auto-sync wishlist when user logs in
const WishlistAutoSync: React.FC = () => {
  useWishlistSync();
  return null;
};

function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <CartProvider>
          <WishlistProvider>
            <Router>
              <WishlistAutoSync />
              <RouteGuard>
                <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<NewHome />} />
                  <Route path="/products/section/:section" element={<SectionProducts />} />
                  <Route path="/products/:productId" element={<ProductDetailsPage />} />
                  <Route path="/category/:categoryId" element={<CategoryProducts />} />
                  
                  {/* Legal Pages */}
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-of-service" element={<TermsService />} />
                  <Route path="/shipping-policy" element={<ShippingPolicy />} />
                  <Route path="/refund-policy" element={<RefundPolicy />} />
                  
                  {/* User Routes */}
                  <Route path="/login" element={<Login role="user" />} />
                  <Route path="/signup" element={<Signup role="user" />} />
                  <Route path="/otp-verification" element={<OTPVerification />} />
                  <Route path="/new-password" element={<NewPassword />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/orders" element={<MyOrders />} />
                  <Route path="/orders/:orderId" element={<OrderDetails />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/wishlist" element={<WishlistPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/settings" element={<UserSettings />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/products/:productId/review" element={<WriteReview />} />
                  <Route path="/user/addresses" element={<UserAddressManagement />} />
                  
                  {/* Checkout Flow Routes */}
                  <Route path="/checkout/shipping" element={<ShippingAddressPage />} />
                  <Route path="/checkout/review" element={<OrderSummaryPage />} />
                  <Route path="/checkout/payment" element={<Checkout />} />
                  <Route path="/checkout/confirmation" element={<OrderConfirmationPage />} />
                  
                  {/* Seller Routes */}
                  <Route path="/seller" element={<SellerLanding />} />
                  <Route path="/seller/login" element={<SellerLogin />} />
                  <Route path="/seller/signup" element={<SellerSignup />} />
                  <Route path="/seller/otp-verification" element={<OTPVerification />} />
                  <Route path="/seller/new-password" element={<NewPassword />} />
                  <Route path="/seller/forgot-password" element={<SellerForgotPassword />} />
                  <Route path="/seller/analytics" element={<AnalyticsDashboard />} />
                  <Route path="/seller/profile" element={<SellerProfile />} />
                  <Route path="/seller/dashboard" element={<SellerDashboardWrapper />} />
                  <Route path="/seller/products" element={<SellerProductListingWrapper />} />
                  <Route path="/seller/orders" element={<SellerOrderManagementWrapper />} />
                  <Route path="/seller/wallet" element={<SellerWalletWrapper />} />
                  <Route path="/seller/verify" element={<SellerVerificationWrapper />} />
                  
                  {/* Admin Routes — admin login only available on admin subdomain */}
                  <Route path="/admin/login" element={<Login role="admin" />} />
                  <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
                  
                  {/* Admin Layout Routes */}
                  <Route element={<AdminLayout />}>
                    <Route path="/admin" element={<AdminOverview />} />
                    <Route path="/admin/users" element={<UserManagement />} />
                    <Route path="/admin/sellers" element={<SellerManagement />} />
                    <Route path="/admin/products" element={<ProductManagement />} />
                    <Route path="/admin/variants" element={<ProductVariantManagement />} />
                    <Route path="/admin/orders" element={<OrderManagement />} />
                    <Route path="/admin/categories" element={<CategoryManagement />} />
                    <Route path="/admin/banners" element={<BannerManagement />} />
                    <Route path="/admin/promotions" element={<PromotionManagement />} />
                    <Route path="/admin/reviews" element={<ReviewManagement />} />
                    <Route path="/admin/complaints" element={<ComplaintManagement />} />
                    <Route path="/admin/accounts" element={<AccountsManagement />} />
                    <Route path="/admin/reports" element={<ReportsManagement />} />
                    <Route path="/admin/admins" element={<AdminManagement />} />
                    <Route path="/admin/profile" element={<ProfilePage />} />
                    <Route path="/admin/settings" element={<SettingsPage />} />
                    <Route path="/admin/search" element={<SearchManagement />} />
                    <Route path="/admin/audit-logs" element={<AuditLogs />} />
                    <Route path="/admin/health" element={<SystemHealth />} />
                    <Route path="/admin/addresses" element={<AdminAddressManagement />} />
                    <Route path="/admin/seller-kyc" element={<SellerKYCSubmissionManagement />} />
                    
                    {/* Product Listing Wizard Routes */}
                    <Route path="/admin/products/new" element={<ProductListingLayout />}>
                      <Route index element={<AdminListings1 />} />
                      <Route path="step1" element={<AdminListings1 />} />
                      <Route path="step2" element={<AdminListings2 />} />
                      <Route path="step3" element={<AdminListings3 />} />
                      <Route path="step4" element={<AdminListing4 />} />
                      <Route path="step5" element={<AdminListing5 />} />
                      <Route path="step6" element={<AdminListing6 />} />
                    </Route>
                  </Route>
                  
                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                </Suspense>
              </RouteGuard>
            </Router>
          </WishlistProvider>
        </CartProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}

export default App;
