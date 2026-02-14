import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, User, LogOut, Package, ChevronDown, Loader2, Menu, Bell, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { SUPPORTED_CURRENCIES } from '../../utils/currency';
import { getSellerDomainUrl } from '../../utils/domain';
import logger from '../../utils/logger';

// TODO: Backend stubs — connect to your API
const requireLogin = (_v: boolean) => {};

export const Header: React.FC = () => {
  const { user, currentAuthUser, signOut } = useAuth();
  const { totalItems } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { currency, setCurrency, loading: currencyLoading } = useCurrency();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [navigationLoading, setNavigationLoading] = useState(false);
  const [loadingLink, setLoadingLink] = useState<string | null>(null);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if user is logged in (either user profile or auth user exists)
  const isLoggedIn = user || currentAuthUser;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
        setShowLoginDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigation = async (link: string) => {
    setLoadingLink(link);
    setNavigationLoading(true);
    setShowProfileDropdown(false);
    setShowMobileMenu(false);
    
    // Simulate loading delay
    setTimeout(() => {
      navigate(link);
      setNavigationLoading(false);
      setLoadingLink(null);
    }, 300);
  };

  const handleSignOut = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm('Are you sure you want to logout?');
    
    if (!confirmed) {
      return; // User canceled
    }
    
    setNavigationLoading(true);
    try {
      const roleBeforeSignout = await signOut();
      setShowProfileDropdown(false);
      setShowMobileMenu(false);
      
      // Redirect based on previous role
      setTimeout(() => {
        if (roleBeforeSignout && (roleBeforeSignout === 'admin' || roleBeforeSignout === 'seller')) {
          window.location.href = getSellerDomainUrl('/login');
        } else {
          navigate('/');
        }
        setNavigationLoading(false);
      }, 300);
    } catch (error) {
      logger.error(error as Error, { context: 'Logout error' });
      setNavigationLoading(false);
    }
  };

  // Get display name from user
  const getDisplayName = () => {
    if (user?.full_name) return user.full_name;
    if (user?.email) {
      // Extract name from email (before @)
      return user.email.split('@')[0];
    }
    return 'User';
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/images/logo/logo.svg" 
              alt="Beauzead" 
              className="h-10 w-auto"
              onError={(e) => {
                // Fallback to text logo if image not found
                e.currentTarget.style.display = 'none';
              }}
            />
          </Link>

          {/* Desktop Right Side Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Currency Selector */}
            <div className="relative">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="appearance-none bg-gray-50 text-amber-600 border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm font-medium hover:border-amber-500 transition-all duration-300 cursor-pointer"
                disabled={currencyLoading}
              >
                {SUPPORTED_CURRENCIES.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.symbol} {curr.code}
                  </option>
                ))}
              </select>
              {currencyLoading && (
                <Loader2 className="absolute right-2 top-2.5 h-4 w-4 text-amber-600 animate-spin" />
              )}
            </div>

            {/* Become a Seller Button */}
            <a
              href={getSellerDomainUrl('/signup')}
              className="text-sm font-medium text-amber-600 hover:text-amber-600-light transition-all duration-300"
            >
              Become a Seller
            </a>

            {/* Wishlist */}
            <button
              onClick={() => {
                if (!isLoggedIn) {
                  requireLogin(false);
                } else {
                  handleNavigation('/wishlist');
                }
              }}
              disabled={navigationLoading}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-all duration-300 disabled:opacity-50"
            >
              {loadingLink === '/wishlist' ? (
                <Loader2 className="h-6 w-6 text-amber-600 animate-spin" />
              ) : (
                <Heart className="h-6 w-6 text-amber-600" />
              )}
              {wishlistItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {wishlistItems.length}
                </span>
              )}
            </button>

            {/* Cart */}
            <button
              onClick={() => {
                if (!isLoggedIn) {
                  requireLogin(false);
                } else {
                  handleNavigation('/cart');
                }
              }}
              disabled={navigationLoading}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-all duration-300 disabled:opacity-50"
            >
              {loadingLink === '/cart' ? (
                <Loader2 className="h-6 w-6 text-amber-600 animate-spin" />
              ) : (
                <ShoppingCart className="h-6 w-6 text-gray-700" />
              )}
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>

            {/* User Profile / Login */}
            {isLoggedIn ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onMouseEnter={() => setShowProfileDropdown(true)}
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 hover:bg-gray-100"
                  disabled={navigationLoading}
                >
                  {navigationLoading && loadingLink?.startsWith('/') ? (
                    <Loader2 className="h-5 w-5 text-amber-600 animate-spin" />
                  ) : (
                    <User className="h-5 w-5 text-amber-600" />
                  )}
                  <span className="text-gray-900 font-medium text-sm">
                    Profile
                  </span>
                  <ChevronDown className="h-4 w-4 text-amber-600" />
                </button>

                {showProfileDropdown && (
                  <div 
                    className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-2 animate-fadeIn"
                    onMouseLeave={() => setShowProfileDropdown(false)}
                  >
                    <button
                      onClick={() => handleNavigation('/orders')}
                      disabled={navigationLoading}
                      className="w-full text-left block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
                    >
                      {loadingLink === '/orders' ? (
                        <>
                          <Loader2 className="inline h-4 w-4 text-amber-600 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Package className="h-4 w-4 text-amber-600" />
                          My Orders
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleNavigation('/profile')}
                      disabled={navigationLoading}
                      className="w-full text-left block px-4 py-3 text-sm text-gray-900 hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
                    >
                      {loadingLink === '/profile' ? (
                        <>
                          <Loader2 className="inline h-4 w-4 text-amber-600 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <User className="h-4 w-4 text-amber-600" />
                          Profile
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleNavigation('/notifications')}
                      disabled={navigationLoading}
                      className="w-full text-left block px-4 py-3 text-sm text-gray-900 hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
                    >
                      {loadingLink === '/notifications' ? (
                        <>
                          <Loader2 className="h-4 w-4 text-amber-600 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Bell className="h-4 w-4 text-amber-600" />
                          Notifications
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleNavigation('/settings')}
                      disabled={navigationLoading}
                      className="w-full text-left block px-4 py-3 text-sm text-gray-900 hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
                    >
                      {loadingLink === '/settings' ? (
                        <>
                          <Loader2 className="h-4 w-4 text-amber-600 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Settings className="h-4 w-4 text-amber-600" />
                          Settings
                        </>
                      )}
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={handleSignOut}
                      disabled={navigationLoading}
                      className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-gray-50 hover:text-red-300 transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
                    >
                      {navigationLoading && loadingLink === 'logout' ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Logging out...
                        </>
                      ) : (
                        <>
                          <LogOut className="h-4 w-4" />
                          Logout
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button
                  onMouseEnter={() => setShowLoginDropdown(true)}
                  onClick={() => navigate('/login')}
                  className="bg-amber-500 text-white font-semibold px-6 py-2 rounded-lg hover:bg-amber-600 transition-all duration-300 text-sm shadow-sm"
                >
                  Login
                </button>

                {showLoginDropdown && (
                  <div 
                    className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-2 animate-fadeIn"
                    onMouseLeave={() => setShowLoginDropdown(false)}
                  >
                    <div className="px-4 py-2 text-xs text-gray-500 font-medium uppercase">
                      Quick Access
                    </div>
                    <Link
                      to="/signup"
                      className="block px-4 py-3 text-sm text-gray-900 hover:bg-gray-50 transition-all duration-300"
                      onClick={() => setShowLoginDropdown(false)}
                    >
                      <User className="inline h-4 w-4 mr-3 text-amber-600" />
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Right Side - Only Cart, Wishlist, and Hamburger */}
          <div className="flex md:hidden items-center space-x-2">
            {/* Wishlist Icon */}
            <button
              onClick={() => {
                if (!isLoggedIn) {
                  requireLogin(false);
                } else {
                  window.location.href = '/wishlist';
                }
              }}
              className="relative p-2"
            >
              <Heart className="h-6 w-6 text-amber-600" />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {wishlistItems.length}
                </span>
              )}
            </button>

            {/* Cart Icon */}
            <button
              onClick={() => {
                if (!isLoggedIn) {
                  requireLogin(false);
                } else {
                  window.location.href = '/cart';
                }
              }}
              className="relative p-2"
            >
              <ShoppingCart className="h-6 w-6 text-amber-600" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Hamburger Menu */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 text-amber-600"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {showMobileMenu && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-3 space-y-2">
            {/* Currency Selector */}
            <div className="relative mb-3">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full appearance-none bg-white text-amber-600 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium"
                disabled={currencyLoading}
              >
                {SUPPORTED_CURRENCIES.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.symbol} {curr.code}
                  </option>
                ))}
              </select>
            </div>

            {/* Login/Profile Section */}
            {user ? (
              <div className="space-y-2">
                <div className="px-3 py-2 text-gray-900 font-medium border-b border-gray-200">
                  {getDisplayName()}
                </div>
                <Link
                  to="/profile"
                  className="block px-3 py-2 text-sm text-gray-900 hover:bg-gray-50 rounded transition-all duration-300"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <User className="inline h-4 w-4 mr-2 text-amber-600" />
                  Profile
                </Link>
                <Link
                  to="/orders"
                  className="block px-3 py-2 text-sm text-gray-900 hover:bg-gray-50 rounded transition-all duration-300"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Package className="inline h-4 w-4 mr-2 text-amber-600" />
                  Orders
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-50 rounded transition-all duration-300"
                >
                  <LogOut className="inline h-4 w-4 mr-2" />
                  Log Out
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/login"
                  className="block bg-amber-500 text-white font-semibold px-4 py-2 rounded-lg text-center hover:bg-amber-600 transition-all duration-300"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="block bg-white border-2 border-amber-500 text-amber-600 font-semibold px-4 py-2 rounded-lg text-center hover:bg-amber-500 hover:text-black transition-all duration-300"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Become a Seller */}
            <a
              href={getSellerDomainUrl('/signup')}
              className="block px-3 py-2 text-sm text-amber-600 hover:bg-gray-50 rounded transition-all duration-300"
              onClick={() => setShowMobileMenu(false)}
            >
              Become a Seller
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
