import React, { useState, useEffect } from 'react';
import { logger } from '../../utils/logger';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard, Package, ShoppingBag, DollarSign, 
  Settings, LogOut, TrendingUp, TrendingDown, 
  Download, AlertCircle, 
  CheckCircle, Clock, ArrowUpRight, ArrowDownRight,
  Wallet, RefreshCw, Search, Loader2, X
} from 'lucide-react';
import { formatPrice } from '../../constants';
import { fetchOrdersBySeller, createWithdrawal } from '../../lib/orderService';

interface Transaction {
  id: string;
  date: string;
  orderId: string;
  type: 'credit' | 'debit' | 'refund' | 'commission' | 'withdrawal';
  description: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  balance: number;
}

interface SellerWalletProps {
  onLogout: () => void;
  sellerEmail: string;
  onNavigate: (view: any) => void;
}

const SellerWallet: React.FC<SellerWalletProps> = ({ onLogout, sellerEmail, onNavigate }) => {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<'all' | 'credit' | 'debit' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('primary');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  // Fetch orders and calculate wallet data
  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const sellerId = (user as any)?.attributes?.sub || user?.id || sellerEmail;
        
        const { data, error: fetchError } = await fetchOrdersBySeller(sellerId, { limit: 100 });

        if (fetchError) {
          setError('Failed to load wallet data. Please try again.');
        } else {
          setOrders(data);
        }
      } catch (err) {
        logger.error('Failed to fetch wallet data:', err as Record<string, any>);
        setError('Failed to load wallet data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchWalletData();
    }
  }, [user]);

  // Calculate wallet balance from orders
  const calculateWalletBalance = () => {
    const PLATFORM_FEE = 0.10; // 10% platform fee
    
    let available = 0;
    let pending = 0;
    let withdrawn = 0;
    let totalEarnings = 0;

    orders.forEach((order: any) => {
      if (!order.total_amount) return;
      
      const orderAmount = order.total_amount;
      const platformFee = Math.round(orderAmount * PLATFORM_FEE);
      const netAmount = orderAmount - platformFee;

      // Delivered orders → available balance
      if (order.status === 'delivered') {
        available += netAmount;
        totalEarnings += orderAmount;
      }
      // Processing/Shipped → pending
      else if (order.status === 'processing' || order.status === 'shipped') {
        pending += netAmount;
        totalEarnings += orderAmount;
      }
      // All except cancelled/returned count toward total
      else if (order.status !== 'cancelled' && order.status !== 'returned') {
        totalEarnings += orderAmount;
      }
    });

    return { available, pending, withdrawn, totalEarnings };
  };

  // Generate transaction history from orders
  const generateTransactions = (): Transaction[] => {
    const transactions: Transaction[] = [];
    const PLATFORM_FEE = 0.10;
    let runningBalance = 0;

    // Sort orders by date descending
    const sortedOrders = [...orders].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    sortedOrders.forEach((order: any) => {
      if (!order.total_amount) return;

      const orderAmount = order.total_amount;
      const platformFee = Math.round(orderAmount * PLATFORM_FEE);
      const netAmount = orderAmount - platformFee;

      // Add credit transaction
      if (order.status === 'delivered' || order.status === 'processing' || order.status === 'shipped') {
        runningBalance += netAmount;
        transactions.push({
          id: `${order.id}-credit`,
          date: new Date(order.created_at).toLocaleString(),
          orderId: order.order_number,
          type: 'credit',
          description: `Order payment received - ${order.order_number}`,
          amount: netAmount,
          status: order.status === 'delivered' ? 'completed' : 'pending',
          balance: runningBalance
        });
      }

      // Add commission fee
      if (platformFee > 0) {
        runningBalance -= platformFee;
        transactions.push({
          id: `${order.id}-commission`,
          date: new Date(order.created_at).toLocaleString(),
          orderId: order.order_number,
          type: 'commission',
          description: `Platform commission (10%)`,
          amount: -platformFee,
          status: 'completed',
          balance: runningBalance
        });
      }

      // Handle refunds
      if (order.status === 'cancelled' || order.status === 'returned') {
        runningBalance -= netAmount;
        transactions.push({
          id: `${order.id}-refund`,
          date: new Date(order.updated_at).toLocaleString(),
          orderId: order.order_number,
          type: 'refund',
          description: `Order cancelled - refund processed`,
          amount: -netAmount,
          status: 'completed',
          balance: runningBalance
        });
      }
    });

    return transactions;
  };

  const walletBalance = calculateWalletBalance();
  const transactions = generateTransactions();

  const filteredTransactions = transactions.filter(txn => {
    const matchesFilter = 
      activeFilter === 'all' ||
      (activeFilter === 'credit' && (txn.type === 'credit')) ||
      (activeFilter === 'debit' && (txn.type === 'debit' || txn.type === 'commission' || txn.type === 'withdrawal' || txn.type === 'refund')) ||
      (activeFilter === 'pending' && txn.status === 'pending');
    
    const matchesSearch = 
      txn.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) > walletBalance.available) {
      alert('Invalid withdrawal amount');
      return;
    }

    try {
      setWithdrawing(true);
      const sellerId = (user as any)?.attributes?.sub || user?.id || sellerEmail;
      
      const { data: withdrawal, error: wError } = await createWithdrawal(
        sellerId,
        parseFloat(withdrawAmount)
      );

      if (wError || !withdrawal) {
        alert('Withdrawal failed: ' + (wError || 'Unknown error'));
      } else {
        logger.log('Withdrawal successful', withdrawal);
        alert('Withdrawal request submitted successfully!');
        setShowWithdrawModal(false);
        setWithdrawAmount('');
      }
    } catch (err) {
      logger.error('Withdrawal error:', err as Record<string, any>);
      alert('Failed to process withdrawal. Please try again.');
    } finally {
      setWithdrawing(false);
    }
  };

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'credit':
        return <ArrowDownRight className="text-green-600" size={18} />;
      case 'debit':
      case 'commission':
      case 'withdrawal':
        return <ArrowUpRight className="text-red-600" size={18} />;
      case 'refund':
        return <RefreshCw className="text-orange-600" size={18} />;
      default:
        return <DollarSign className="text-gray-600" size={18} />;
    }
  };

  const getStatusBadge = (status: Transaction['status']) => {
    const badges = {
      pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-700', border: 'border-yellow-500/20', label: 'Pending' },
      completed: { bg: 'bg-green-500/10', text: 'text-green-700', border: 'border-green-500/20', label: 'Completed' },
      failed: { bg: 'bg-red-500/10', text: 'text-red-700', border: 'border-red-500/20', label: 'Failed' }
    };
    const badge = badges[status];
    return (
      <span className={`${badge.bg} ${badge.text} ${badge.border} border text-[9px] font-bold px-2 py-0.5 rounded uppercase`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 hidden lg:flex flex-col p-6 sticky top-0 h-screen">
        <div className="mb-10 cursor-pointer" onClick={() => onNavigate('seller-dashboard')}>
          <h1 className="text-xl font-bold text-gray-900">MetricFlux Seller</h1>
          <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mt-0.5">Business Portal</p>
        </div>

        <nav className="space-y-2 flex-1">
          <NavItem icon={<LayoutDashboard />} label="Dashboard" onClick={() => onNavigate('seller-dashboard')} />
          <NavItem icon={<ShoppingBag />} label="Order Management" onClick={() => onNavigate('seller-orders')} />
          <NavItem icon={<Package />} label="Products" onClick={() => onNavigate('seller-products')} />
          <NavItem icon={<DollarSign />} label="Wallet & Payouts" active />
          <NavItem icon={<TrendingUp />} label="Analytics" />
          <NavItem icon={<Settings />} label="Settings" />
        </nav>

        <div className="pt-6 border-t border-gray-200">
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Seller ID</p>
            <p className="text-xs font-semibold text-gray-900 truncate">{sellerEmail}</p>
          </div>
          <button onClick={onLogout} className="flex items-center gap-3 w-full p-3 text-red-600 hover:bg-red-50 rounded-xl font-semibold text-sm transition-all">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-6 md:p-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Wallet & Payouts</h2>
              <p className="text-gray-600 text-sm font-medium mt-1">Manage your earnings and withdrawals</p>
            </div>
            <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold px-6 py-2.5 rounded-xl transition-all text-xs flex items-center gap-2">
              <Download size={16} /> Download Statement
            </button>
          </div>

          {/* Balance Cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 h-32 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              <BalanceCard
                label="Available Balance"
                amount={walletBalance.available}
                icon={<Wallet className="text-green-600" />}
                trend="+12.5%"
                trendUp={true}
                actionLabel="Withdraw"
                onAction={() => setShowWithdrawModal(true)}
              />
              <BalanceCard
                label="Pending Balance"
                amount={walletBalance.pending}
                icon={<Clock className="text-yellow-600" />}
                description="Will be available after delivery"
              />
              <BalanceCard
                label="Total Withdrawn"
                amount={walletBalance.withdrawn}
                icon={<ArrowUpRight className="text-blue-600" />}
                description="Lifetime withdrawals"
              />
              <BalanceCard
                label="Total Earnings"
                amount={walletBalance.totalEarnings}
                icon={<TrendingUp className="text-purple-600" />}
                trend="+24.3%"
                trendUp={true}
              />
            </div>
          )}

          {/* Wallet Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8 flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="text-gray-900" size={20} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-blue-900 mb-1">Payment Processing Information</h4>
              <p className="text-xs text-blue-700 leading-relaxed">
                Payments are released to your available balance 2 days after order delivery. 
                Platform commission (8%) is automatically deducted. Withdrawals are processed daily at 6:00 PM.
              </p>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="text"
                  placeholder="Search by Order ID or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2">
                <FilterButton label="All" active={activeFilter === 'all'} onClick={() => setActiveFilter('all')} />
                <FilterButton label="Credits" active={activeFilter === 'credit'} onClick={() => setActiveFilter('credit')} />
                <FilterButton label="Debits" active={activeFilter === 'debit'} onClick={() => setActiveFilter('debit')} />
                <FilterButton label="Pending" active={activeFilter === 'pending'} onClick={() => setActiveFilter('pending')} />
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          {error ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={24} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Transactions</h3>
              <p className="text-gray-600 text-sm">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-gray-900 font-semibold px-6 py-2 rounded-lg transition-all"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-600 uppercase tracking-widest">Date & Time</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-600 uppercase tracking-widest">Transaction</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-600 uppercase tracking-widest">Order ID</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-600 uppercase tracking-widest">Amount</th>
                      <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-600 uppercase tracking-widest">Status</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-600 uppercase tracking-widest">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center">
                          <Loader2 size={24} className="text-gray-500 animate-spin mx-auto" />
                        </td>
                      </tr>
                    ) : filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                              <Wallet size={24} className="text-gray-500" />
                            </div>
                            <p className="text-gray-600 font-semibold">No transactions found</p>
                            <p className="text-gray-500 text-sm mt-1">Try adjusting your filters</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((txn) => (
                        <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                                {getTransactionIcon(txn.type)}
                              </div>
                              <p className="text-xs font-semibold text-gray-700">{txn.date}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-bold text-gray-900">{txn.description}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mt-0.5">
                              {txn.type.replace('-', ' ')}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs font-mono font-bold text-blue-600">{txn.orderId}</p>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <p className={`text-sm font-bold ${
                              txn.amount > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {txn.amount > 0 ? '+' : ''}{formatPrice(txn.amount)}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {getStatusBadge(txn.status)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <p className="text-sm font-bold text-gray-900">{formatPrice(txn.balance)}</p>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {filteredTransactions.length > 0 && (
            <div className="flex justify-center mt-8">
              <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold px-8 py-3 rounded-xl transition-all text-xs">
                Load More Transactions
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Withdraw Funds</h3>
              <button 
                onClick={() => setShowWithdrawModal(false)}
                disabled={withdrawing}
                className="text-gray-500 hover:text-gray-600 disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            {/* Available Balance Display */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 mb-6 text-gray-900">
              <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Available Balance</p>
              <p className="text-2xl font-bold">{formatPrice(walletBalance.available)}</p>
            </div>

            {/* Withdrawal Amount */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Withdrawal Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">£</span>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  disabled={withdrawing}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-4 text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  placeholder="0.00"
                  max={walletBalance.available}
                />
              </div>
              <div className="flex justify-between mt-3">
                <button 
                  onClick={() => setWithdrawAmount((walletBalance.available / 4).toString())}
                  disabled={withdrawing}
                  className="text-xs font-semibold text-blue-600 hover:underline disabled:opacity-50"
                >
                  25%
                </button>
                <button 
                  onClick={() => setWithdrawAmount((walletBalance.available / 2).toString())}
                  disabled={withdrawing}
                  className="text-xs font-semibold text-blue-600 hover:underline disabled:opacity-50"
                >
                  50%
                </button>
                <button 
                  onClick={() => setWithdrawAmount((walletBalance.available * 0.75).toString())}
                  disabled={withdrawing}
                  className="text-xs font-semibold text-blue-600 hover:underline disabled:opacity-50"
                >
                  75%
                </button>
                <button 
                  onClick={() => setWithdrawAmount(walletBalance.available.toString())}
                  disabled={withdrawing}
                  className="text-xs font-semibold text-blue-600 hover:underline disabled:opacity-50"
                >
                  Max
                </button>
              </div>
            </div>

            {/* Bank Account Selection */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">Withdraw To</label>
              <div className="space-y-3">
                <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  selectedAccount === 'primary' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input 
                    type="radio" 
                    name="account" 
                    value="primary"
                    checked={selectedAccount === 'primary'}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    disabled={withdrawing}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">Primary Account</p>
                    <p className="text-xs text-gray-600">••••  ••••  ••••  4589</p>
                  </div>
                  {selectedAccount === 'primary' && <CheckCircle size={20} className="text-blue-600" />}
                </label>
              </div>
            </div>

            {/* Processing Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <div className="flex gap-3">
                <Clock className="text-yellow-600 flex-shrink-0" size={18} />
                <p className="text-xs text-yellow-800 leading-relaxed">
                  Withdrawals are processed once daily at 6:00 PM. Funds typically reach your account within 1-2 business days.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={() => setShowWithdrawModal(false)}
                disabled={withdrawing}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold px-6 py-3 rounded-xl transition-all text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleWithdraw}
                disabled={
                  withdrawing ||
                  !withdrawAmount || 
                  parseFloat(withdrawAmount) > walletBalance.available ||
                  parseFloat(withdrawAmount) <= 0
                }
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-gray-900 font-semibold px-6 py-3 rounded-xl transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {withdrawing && <Loader2 size={16} className="animate-spin" />}
                Request Withdrawal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
      active 
        ? 'bg-blue-600 text-gray-900 shadow-lg shadow-blue-600/20' 
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`}
  >
    {React.cloneElement(icon, { size: 18 })} {label}
  </button>
);

const BalanceCard = ({ label, amount, icon, trend, trendUp, description, actionLabel, onAction }: any) => (
  <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 transition-all">
    <div className="flex items-center justify-between mb-4">
      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
        {icon}
      </div>
      {trend && (
        <span className={`flex items-center gap-1 text-xs font-bold ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
          {trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {trend}
        </span>
      )}
    </div>
    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">{label}</p>
    <p className="text-2xl font-bold text-gray-900 mb-2">{formatPrice(amount)}</p>
    {description && <p className="text-xs text-gray-600">{description}</p>}
    {actionLabel && (
      <button 
        onClick={onAction}
        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-gray-900 font-semibold py-2.5 rounded-xl transition-all text-xs"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

const FilterButton = ({ label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
      active 
        ? 'bg-blue-600 text-gray-900 shadow-lg shadow-blue-600/20' 
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    {label}
  </button>
);

export default SellerWallet;
