import React, { useState, useEffect } from 'react';
import { logger } from '../../utils/logger';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard, ShoppingBag, DollarSign, BarChart2, 
  Package, Settings, LogOut, Bell, TrendingUp, 
  MoreVertical, Clock, AlertTriangle, ArrowUpRight, ArrowDownRight,
  ShieldCheck, X, Info, Menu, Shield, Loader2
} from 'lucide-react';
import SellerVerificationPage from './SellerVerificationPage';
import type { Seller } from '../../types';
import { fetchOrdersBySeller } from '../../lib/orderService';

interface SellerDashboardProps {
  onLogout: () => void;
  sellerEmail: string;
  sellerPhone?: string;
  sellerFullName?: string;
  sellerCountry?: string;
  onNavigate: (view: any) => void;
  verificationStatus: 'unverified' | 'pending' | 'verified';
}

type DashboardSection = 'overview' | 'products' | 'orders' | 'sales' | 'payouts' | 'settings' | 'verification';

const SellerDashboard: React.FC<SellerDashboardProps> = ({ 
  onLogout, 
  sellerEmail, 
  sellerPhone = '', 
  sellerFullName = 'Seller', 
  sellerCountry: _sellerCountry = 'India',
  onNavigate, 
  verificationStatus 
}) => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [_kycSubmitted, setKycSubmitted] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isPending = verificationStatus === 'pending';
  const isVerified = verificationStatus === 'verified';
  const sellerId = (user as any)?.attributes?.sub || user?.id;

  // Fetch orders for dashboard stats
  useEffect(() => {
    if (sellerId && isVerified) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [sellerId, isVerified]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await fetchOrdersBySeller(sellerId!, { limit: 50 });

      if (fetchError) {
        setError('Failed to load dashboard data');
      } else {
        setOrders(data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate dashboard statistics
  const calculateStats = () => {
    const PLATFORM_FEE = 0.10;
    let totalPayouts = 0;
    let activeOrders = 0;
    let deliveredOrders = 0;
    const recentOrders: any[] = [];

    orders.forEach(order => {
      // Calculate payouts (delivered orders only)
      if (order.status === 'delivered') {
        const netAmount = (order.total_amount || 0) * (1 - PLATFORM_FEE);
        totalPayouts += netAmount;
        deliveredOrders++;
      }
      
      // Count active orders
      if (['new', 'processing', 'shipped'].includes(order.status)) {
        activeOrders++;
      }
      
      // Collect recent orders (last 5)
      if (recentOrders.length < 5) {
        recentOrders.push(order);
      }
    });

    const totalOrders = orders.length;
    const conversionRate = totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(1) : '0';

    return {
      totalPayouts,
      activeOrders,
      totalOrders,
      conversionRate: parseFloat(conversionRate),
      recentOrders
    };
  };

  const stats = isVerified ? calculateStats() : {
    totalPayouts: 0,
    activeOrders: 0,
    totalOrders: 0,
    conversionRate: 0,
    recentOrders: []
  };

  // Prevent body scroll when mobile menu is open
  React.useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-white text-gray-900 flex font-sans">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-72 bg-white border-r border-gray-900 flex flex-col p-6 sm:p-8 top-0 h-screen transition-transform duration-300 z-50 ${
        mobileMenuOpen ? 'fixed translate-x-0' : 'fixed -translate-x-full lg:sticky lg:relative lg:translate-x-0'
      }`}>
        <div className="flex items-start justify-between mb-8 sm:mb-12">
          <div className="cursor-pointer" onClick={() => onNavigate('seller-dashboard')}>
            <h1 className="text-2xl font-semibold text-gray-900">Seller Hub</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Merchant Portal</p>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="space-y-3 flex-1">
          <NavItem 
            icon={<LayoutDashboard />} 
            label="Overview" 
            active={activeSection === 'overview'} 
            onClick={() => { setActiveSection('overview'); setMobileMenuOpen(false); }} 
          />
          {!isVerified && (
            <NavItem 
              icon={<Shield />} 
              label="Verification" 
              active={activeSection === 'verification'} 
              onClick={() => { setActiveSection('verification'); setMobileMenuOpen(false); }} 
              badge={isPending ? 'pending' : 'required'}
            />
          )}
          <NavItem 
            icon={<Package />} 
            label="My Products" 
            active={activeSection === 'products'} 
            onClick={() => { onNavigate('seller-product-listing'); setMobileMenuOpen(false); }} 
            disabled={!isVerified}
          />
          <NavItem 
            icon={<ShoppingBag />} 
            label="Order Tracking" 
            active={activeSection === 'orders'} 
            onClick={() => { setActiveSection('orders'); setMobileMenuOpen(false); }} 
            disabled={!isVerified}
          />
          <NavItem 
            icon={<BarChart2 />} 
            label="Sales Reports" 
            active={activeSection === 'sales'} 
            onClick={() => { setActiveSection('sales'); setMobileMenuOpen(false); }} 
            disabled={!isVerified}
          />
          <NavItem 
            icon={<DollarSign />} 
            label="Payout Info" 
            active={activeSection === 'payouts'} 
            onClick={() => { setActiveSection('payouts'); setMobileMenuOpen(false); }} 
            disabled={!isVerified}
          />
          <NavItem 
            icon={<Settings />} 
            label="Store Settings" 
            active={activeSection === 'settings'} 
            onClick={() => { setActiveSection('settings'); setMobileMenuOpen(false); }} 
          />
        </nav>

        <div className="pt-8 border-t border-gray-900">
          <button onClick={onLogout} className="flex items-center gap-3 w-full p-4 text-red-500 hover:bg-red-500/5 rounded-xl font-bold text-sm transition-all text-left">
            <LogOut size={18} />
            End Session
          </button>
        </div>
      </aside>

      <main className="flex-1 w-full max-w-full overflow-x-hidden p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16 overflow-y-auto">
        <header className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-8 md:mb-12">
          <div className="flex items-center gap-3 sm:gap-4 w-full">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight truncate">
                {activeSection === 'overview' ? 'Overview' : activeSection.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')}
              </h2>
              <p className="text-gray-500 text-xs sm:text-sm font-medium mt-0.5 sm:mt-1">Manage your premium marketplace presence</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            {verificationStatus === 'unverified' && (
              <button 
                onClick={() => onNavigate('seller-verify')}
                className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 sm:px-6 py-3 rounded-lg sm:rounded-xl transition-all shadow-lg shadow-yellow-500/10 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest animate-pulse"
              >
                <ShieldCheck size={16} />
                <span>Verify My Store</span>
              </button>
            )}

            {isPending && (
              <div className="w-full sm:w-auto bg-blue-500/10 border border-blue-500/30 text-blue-400 px-4 sm:px-6 py-3 rounded-lg sm:rounded-xl flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest justify-center">
                <Clock size={16} />
                <span>Pending</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-start w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
              <button className="p-2.5 sm:p-3 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl relative text-gray-500 hover:text-gray-900 transition-colors">
                <Bell size={18} className="sm:w-5 sm:h-5" />
                <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-500 rounded-full border border-black"></span>
              </button>
              <div className="h-8 sm:h-10 w-px bg-gray-50"></div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="text-right hidden md:block">
                  <p className="text-[10px] sm:text-xs font-bold text-gray-900 uppercase tracking-wider">Merchant Elite</p>
                  <p className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-widest mt-0.5 ${isVerified ? 'text-green-500' : isPending ? 'text-blue-500' : 'text-gray-600'}`}>
                    {isVerified ? 'Verified' : isPending ? 'Pending' : 'Unverified'}
                  </p>
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-yellow-500 font-bold text-sm sm:text-base">
                  BZ
                </div>
              </div>
            </div>
          </div>
        </header>

        {activeSection === 'overview' && renderOverview(verificationStatus, onNavigate, () => setActiveSection('verification'), stats, loading, error, fetchOrders)}
        
        {activeSection === 'verification' && (
          <SellerVerificationPage 
            seller={{
              id: sellerId || '',
              user_id: sellerId || '',
              shop_name: sellerFullName,
              email: sellerEmail,
              phone: sellerPhone,
              total_listings: 0,
              kyc_status: verificationStatus === 'verified' ? 'approved' : verificationStatus,
              product_approval_status: 'pending',
              created_at: new Date().toISOString(),
              is_active: true,
            } as Seller}
            onStatusUpdate={(updates) => {
              logger.log('Verification status updated', { updates });
              if (updates.kyc_status === 'pending' || updates.kyc_status === 'verified') {
                setKycSubmitted(true);
              }
            }}
            onCancel={() => setActiveSection('overview')}
          />
        )}
        
        {activeSection !== 'overview' && activeSection !== 'settings' && !isVerified && (
          <div className="bg-[#0a0a0a] border border-gray-900 rounded-xl sm:rounded-2xl md:rounded-3xl p-6 sm:p-10 md:p-16 lg:p-20 text-center animate-in fade-in duration-500">
             <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 md:mb-8 lg:mb-10 text-gray-600">
               <ShieldCheck size={24} className="sm:w-10 sm:h-10 md:w-12 md:h-12" />
             </div>
             <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Access Restricted</h3>
             <p className="text-gray-500 text-xs sm:text-sm md:text-base font-medium mb-6 sm:mb-8 md:mb-10 lg:mb-12 max-w-lg mx-auto leading-relaxed">Full dashboard capabilities are unlocked once your business verification is completed and approved by our administration team.</p>
             {verificationStatus === 'unverified' && (
               <button 
                 onClick={() => onNavigate('seller-verify')}
                 className="bg-white text-black font-bold px-8 sm:px-10 md:px-12 py-3 sm:py-4 md:py-5 rounded-lg sm:rounded-xl md:rounded-2xl text-[10px] uppercase tracking-[0.2em] hover:bg-yellow-500 transition-all shadow-2xl"
               >
                 Start Verification Now
               </button>
             )}
          </div>
        )}

        {activeSection === 'settings' && (
          <div className="bg-[#0a0a0a] border border-gray-900 rounded-xl sm:rounded-2xl md:rounded-3xl p-6 sm:p-10 md:p-16 lg:p-20 text-center">
            <Settings size={24} className="mx-auto mb-4 sm:mb-6 md:mb-8 text-gray-800 sm:w-12 sm:h-12 md:w-16 md:h-16" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Store Configuration</h3>
            <p className="text-gray-500 text-xs sm:text-sm md:text-base font-medium">Store profile and policy settings are being updated for production.</p>
          </div>
        )}
      </main>
    </div>
  );
};

const renderOverview = (
  status: 'unverified' | 'pending' | 'verified', 
  onNavigate: (v: any) => void, 
  onVerificationClick?: () => void,
  stats?: any,
  loading?: boolean,
  error?: string | null,
  onRetry?: () => void
) => (
  <div className="animate-in fade-in duration-500">
    {status === 'unverified' && (
      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 md:mb-10 flex flex-col items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6 transition-all hover:bg-yellow-500/10">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full">
          <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-yellow-500 rounded-lg sm:rounded-xl flex items-center justify-center text-black shadow-2xl shadow-yellow-500/20 flex-shrink-0">
            <AlertTriangle size={22} className="sm:w-8 sm:h-8" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg sm:text-xl md:text-2xl font-semibold mb-1">Store Verification Required</h4>
            <p className="text-gray-500 text-xs sm:text-sm md:text-base font-medium">Verify your business identity to list products and access global customers.</p>
          </div>
        </div>
        <button 
          onClick={onVerificationClick}
          className="w-full sm:w-auto bg-white text-black font-bold px-6 sm:px-8 py-3 rounded-lg sm:rounded-xl text-[10px] uppercase tracking-[0.2em] hover:bg-yellow-500 transition-all active:scale-95 shadow-2xl whitespace-nowrap"
        >
          Begin Verification
        </button>
      </div>
    )}

    {status === 'pending' && (
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 md:mb-10 flex flex-col items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full">
          <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-blue-500 rounded-lg sm:rounded-xl flex items-center justify-center text-gray-900 shadow-2xl shadow-blue-500/20 flex-shrink-0">
            <Clock size={22} className="sm:w-8 sm:h-8" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg sm:text-xl md:text-2xl font-semibold mb-1">Review In Progress</h4>
            <p className="text-gray-500 text-xs sm:text-sm md:text-base font-medium">Our compliance team is reviewing your documents. Turnaround is typically 48-72 hours.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-blue-400 font-bold text-[10px] uppercase tracking-[0.2em] bg-blue-500/10 px-4 sm:px-6 py-2 sm:py-3 rounded-lg border border-blue-500/20">
           <Info size={16} /> Pending Approval
        </div>
      </div>
    )}

    {loading && status === 'verified' && (
      <div className="bg-[#0a0a0a] border border-gray-900 rounded-xl p-12 flex items-center justify-center gap-4 mb-6">
        <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
        <span className="text-gray-500">Loading dashboard data...</span>
      </div>
    )}

    {error && status === 'verified' && (
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 mb-6 flex items-center justify-between">
        <span className="text-red-400 text-sm">{error}</span>
        <button
          onClick={onRetry}
          className="text-red-400 hover:text-red-300 text-sm font-bold underline"
        >
          Retry
        </button>
      </div>
    )}

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 md:mb-12">
      <MerchantStat 
        label="Total Payouts" 
        value={status === 'verified' ? `₹${(stats?.totalPayouts || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "₹0.00"} 
        trend={status === 'verified' ? "+14.2%" : "0%"} 
        icon={<DollarSign />} 
        positive 
        loading={loading && status === 'verified'}
      />
      <MerchantStat 
        label="Active Orders" 
        value={status === 'verified' ? String(stats?.activeOrders || 0) : "0"} 
        trend={status === 'verified' ? "+5.1%" : "0%"} 
        icon={<Package />} 
        positive 
        loading={loading && status === 'verified'}
      />
      <MerchantStat 
        label="Total Orders" 
        value={status === 'verified' ? String(stats?.totalOrders || 0) : "0"} 
        trend={status === 'verified' ? "+8.3%" : "0%"} 
        icon={<ShoppingBag />} 
        positive 
        loading={loading && status === 'verified'}
      />
      <MerchantStat 
        label="Conversion Rate" 
        value={status === 'verified' ? `${stats?.conversionRate || 0}%` : "0%"} 
        trend={status === 'verified' ? "+12.1%" : "0%"} 
        icon={<TrendingUp />} 
        positive 
        loading={loading && status === 'verified'}
      />
    </div>

    <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
      <div className="lg:col-span-2 bg-[#0a0a0a] border border-gray-900 rounded-xl sm:rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-center items-center text-center group hover:border-yellow-500/20 transition-all">
        <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gray-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-gray-700 mb-4 sm:mb-6 md:mb-8 border border-gray-200 group-hover:scale-110 transition-transform">
          <BarChart2 size={24} className="sm:w-10 sm:h-10 md:w-12 md:h-12" />
        </div>
        <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-2">Performance Analytics</h3>
        <p className="text-gray-500 text-xs sm:text-sm md:text-base font-medium max-w-sm leading-relaxed">Deep-learning sales insights and global traffic trends will be available once your store is active.</p>
      </div>
      
      <div className="bg-[#0a0a0a] border border-gray-900 rounded-xl sm:rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col">
        <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] mb-10 flex items-center justify-between">
          Recent Orders
          <button className="text-yellow-500 hover:text-gray-900 transition-colors"><MoreVertical size={18} /></button>
        </h3>
        <div className="space-y-10 flex-1">
          {loading && status === 'verified' ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 text-xs font-semibold gap-4">
              <Loader2 size={24} className="animate-spin" />
              Loading orders...
            </div>
          ) : status === 'verified' && stats?.recentOrders && stats.recentOrders.length > 0 ? (
            stats.recentOrders.map((order: any) => (
              <RecentOrder
                key={order.id}
                orderId={order.order_number}
                amount={`₹${(order.total_amount || 0).toLocaleString('en-IN')}`}
                time={new Date(order.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                status={order.status}
              />
            ))
          ) : status === 'verified' && (!stats?.recentOrders || stats.recentOrders.length === 0) ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-700 text-xs font-semibold uppercase tracking-widest gap-4 opacity-50">
               <Package size={24} className="text-gray-800" />
               No Orders Yet
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-700 text-xs font-semibold uppercase tracking-widest gap-4 opacity-50">
               <Package size={24} className="text-gray-800" />
               No Transaction Logs
            </div>
          )}
        </div>
        <button disabled={status !== 'verified'} onClick={() => onNavigate('seller-product-listing')} className="mt-12 w-full py-5 bg-[#111] hover:bg-white hover:text-black border border-gray-200 text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] rounded-2xl transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-2xl">
          Manage Inventory
        </button>
      </div>
    </div>
  </div>
);

const NavItem = ({ icon, label, active, onClick, disabled = false, badge }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void, disabled?: boolean, badge?: 'required' | 'pending' }) => (
  <button 
    disabled={disabled}
    onClick={onClick}
    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-bold text-sm text-left ${
    disabled ? 'opacity-20 cursor-not-allowed' :
    active ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 scale-[1.02]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
  }`}>
    {React.cloneElement(icon as React.ReactElement<any>, { size: 18 })}
    <span className="flex-1">{label}</span>
    {badge && (
      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
        badge === 'required' 
          ? 'bg-red-500/20 text-red-400'
          : 'bg-blue-500/20 text-blue-400'
      }`}>
        {badge === 'required' ? 'Required' : 'Pending'}
      </span>
    )}
  </button>
);

const MerchantStat = ({ label, value, trend, icon, positive, loading }: { label: string, value: string, trend: string, icon: React.ReactNode, positive: boolean, loading?: boolean }) => (
  <div className="bg-[#0a0a0a] border border-gray-900 p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl hover:border-yellow-500/30 transition-all group">
    <div className="flex justify-between items-start mb-3 sm:mb-4 md:mb-6">
      <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white border border-gray-200 rounded-lg sm:rounded-xl flex items-center justify-center text-yellow-500 group-hover:scale-110 transition-transform">
        {React.cloneElement(icon as React.ReactElement<any>, { size: 20, className: 'sm:w-6 sm:h-6' })}
      </div>
      <div className={`flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg ${positive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
        {positive ? <ArrowUpRight size={10} className="sm:w-3 sm:h-3" /> : <ArrowDownRight size={10} className="sm:w-3 sm:h-3" />}
        {trend}
      </div>
    </div>
    <p className="text-[9px] sm:text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-0.5 sm:mb-1">{label}</p>
    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight">
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin inline" />
      ) : (
        value
      )}
    </h3>
  </div>
);

const RecentOrder = ({ orderId, amount, time, status }: { orderId: string, amount: string, time: string, status: string }) => (
  <div className="flex items-center justify-between border-b border-gray-900 pb-8 last:border-0 last:pb-0 group">
    <div className="flex items-center gap-5">
      <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full group-hover:scale-150 transition-transform shadow-[0_0_15px_rgba(234,179,8,0.5)]"></div>
      <div>
        <p className="text-sm font-bold text-gray-900">Order #{orderId}</p>
        <p className="text-[10px] font-semibold text-gray-500 flex items-center gap-2 mt-0.5">
          {time} <span className="text-gray-800">•</span> <span className="text-yellow-500/80 uppercase tracking-wider">{getStatusLabel(status)}</span>
        </p>
      </div>
    </div>
    <span className="text-sm font-bold text-gray-900 group-hover:text-yellow-500 transition-colors">{amount}</span>
  </div>
);

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'new': 'New',
    'processing': 'Processing',
    'shipped': 'Shipped',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled',
    'returned': 'Returned'
  };
  return labels[status] || status;
};

export default SellerDashboard;
