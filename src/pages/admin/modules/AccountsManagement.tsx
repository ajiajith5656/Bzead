import React, { useEffect, useState, useCallback } from 'react';
import { logger } from '../../../utils/logger';
import { supabase } from '../../../lib/supabase';
import { SUPPORTED_CURRENCIES } from '../../../utils/currency';
import { Loading, ErrorMessage, SuccessMessage } from '../components/StatusIndicators';
import type {
  AccountSummary,
  DaybookEntry,
  BankBookEntry,
  AccountHead,
  ExpenseEntry,
  SellerPayout,
  MembershipPlan,
  TaxRule,
  PlatformCost,
} from '../../../types';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  Users,
  Percent,
  Settings,
  Plus,
  Edit,
  Trash2,
  Download,
  Filter,
  Calendar,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Building,
  FileText,
  PieChart,
  X,
} from 'lucide-react';
import * as adminApiService from '../../../lib/adminService';

type TabType = 'overview' | 'daybook' | 'bankbook' | 'expenses' | 'payouts' | 'settings';

interface PaginationState {
  page: number;
  limit: number;
  total: number;
}

interface DateFilter {
  startDate: string;
  endDate: string;
}

export const AccountsManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [daybook, setDaybook] = useState<DaybookEntry[]>([]);
  const [bankBook, setBankBook] = useState<BankBookEntry[]>([]);
  const [accountHeads, setAccountHeads] = useState<AccountHead[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [payouts, setPayouts] = useState<SellerPayout[]>([]);
  const [memberships, setMemberships] = useState<MembershipPlan[]>([]);
  const [taxRules, setTaxRules] = useState<TaxRule[]>([]);
  const [platformCosts, setPlatformCosts] = useState<PlatformCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [daybookPagination, setDaybookPagination] = useState<PaginationState>({ page: 1, limit: 10, total: 0 });
  const [bankPagination, setBankPagination] = useState<PaginationState>({ page: 1, limit: 10, total: 0 });
  const [expensePagination, setExpensePagination] = useState<PaginationState>({ page: 1, limit: 10, total: 0 });
  const [payoutPagination, setPayoutPagination] = useState<PaginationState>({ page: 1, limit: 10, total: 0 });
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // Modal states
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddAccountHead, setShowAddAccountHead] = useState(false);
  const [showAddTaxRule, setShowAddTaxRule] = useState(false);
  const [showAddMembership, setShowAddMembership] = useState(false);
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);

  // Form states
  const [newExpense, setNewExpense] = useState<Partial<ExpenseEntry>>({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    category: '',
    description: '',
    vendor: '',
    status: 'pending',
  });
  const [newAccountHead, setNewAccountHead] = useState<Partial<AccountHead>>({
    name: '',
    type: 'expense',
    is_active: true,
  });
  const [newTaxRule, setNewTaxRule] = useState<Partial<TaxRule>>({
    name: '',
    percentage: 0,
    country: '',
    is_active: true,
  });
  const [newMembership, setNewMembership] = useState<Partial<MembershipPlan>>({
    name: '',
    price: 0,
    currency: 'INR',
    duration_days: 30,
    is_active: true,
  });

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        summaryData,
        daybookData,
        bankBookData,
        headsData,
        expensesData,
        payoutsData,
        membershipsData,
        taxData,
        costData,
      ] = await Promise.all([
        adminApiService.getAccountSummary(),
        adminApiService.getDaybook({ limit: daybookPagination.limit, offset: (daybookPagination.page - 1) * daybookPagination.limit }),
        adminApiService.getBankBook({ limit: bankPagination.limit, offset: (bankPagination.page - 1) * bankPagination.limit }),
        adminApiService.getAccountHeads(),
        adminApiService.getExpenses({ limit: expensePagination.limit, offset: (expensePagination.page - 1) * expensePagination.limit }),
        adminApiService.getSellerPayouts({ limit: payoutPagination.limit, offset: (payoutPagination.page - 1) * payoutPagination.limit }),
        adminApiService.getMembershipPlans(),
        adminApiService.getTaxRules(),
        adminApiService.getPlatformCosts(),
      ]);

      setSummary(summaryData as unknown as AccountSummary);
      setDaybook((daybookData?.entries || []) as DaybookEntry[]);
      setDaybookPagination((prev) => ({ ...prev, total: daybookData?.total || 0 }));
      setBankBook((bankBookData?.entries || []) as BankBookEntry[]);
      setBankPagination((prev) => ({ ...prev, total: bankBookData?.total || 0 }));
      setAccountHeads((headsData?.data || []) as AccountHead[]);
      setExpenses((expensesData?.expenses || []) as ExpenseEntry[]);
      setExpensePagination((prev) => ({ ...prev, total: expensesData?.total || 0 }));
      setPayouts((payoutsData?.payouts || []) as SellerPayout[]);
      setPayoutPagination((prev) => ({ ...prev, total: payoutsData?.total || 0 }));
      setMemberships((membershipsData?.data || []) as MembershipPlan[]);
      setTaxRules((taxData?.data || []) as TaxRule[]);
      setPlatformCosts((costData?.data || []) as PlatformCost[]);
      
      // Fetch expense categories from DB
      const { data: catData } = await supabase
        .from('expense_categories')
        .select('name')
        .eq('is_active', true)
        .order('name');
      if (catData && catData.length > 0) {
        setExpenseCategories(catData.map((c: any) => c.name));
      } else {
        setExpenseCategories(['Office Supplies', 'Marketing', 'Technology', 'Salaries', 'Utilities', 'Rent', 'Other']);
      }

      setError(null);
    } catch (err) {
      setError('Failed to load account data');
      logger.error(err as Error, { context: 'Accounts management error' });
    } finally {
      setLoading(false);
    }
  }, [daybookPagination.page, bankPagination.page, expensePagination.page, payoutPagination.page, daybookPagination.limit, bankPagination.limit, expensePagination.limit, payoutPagination.limit]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleAddExpense = async () => {
    try {
      const expense: ExpenseEntry = {
        id: crypto.randomUUID(),
        date: newExpense.date || new Date().toISOString().split('T')[0],
        amount: newExpense.amount || 0,
        category: newExpense.category || '',
        description: newExpense.description,
        vendor: newExpense.vendor,
        status: newExpense.status || 'pending',
      };
      setExpenses([expense, ...expenses]);
      setShowAddExpense(false);
      setNewExpense({
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        category: '',
        description: '',
        vendor: '',
        status: 'pending',
      });
      setSuccess('Expense added successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to add expense');
    }
  };

  const handleAddAccountHead = async () => {
    try {
      const head: AccountHead = {
        id: crypto.randomUUID(),
        name: newAccountHead.name || '',
        type: newAccountHead.type as 'asset' | 'liability' | 'income' | 'expense',
        is_active: newAccountHead.is_active ?? true,
        created_at: new Date().toISOString(),
      };
      setAccountHeads([...accountHeads, head]);
      setShowAddAccountHead(false);
      setNewAccountHead({ name: '', type: 'expense', is_active: true });
      setSuccess('Account head added successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to add account head');
    }
  };

  const handleAddTaxRule = async () => {
    try {
      const tax: TaxRule = {
        id: crypto.randomUUID(),
        name: newTaxRule.name || '',
        percentage: newTaxRule.percentage || 0,
        country: newTaxRule.country,
        is_active: newTaxRule.is_active ?? true,
      };
      setTaxRules([...taxRules, tax]);
      setShowAddTaxRule(false);
      setNewTaxRule({ name: '', percentage: 0, country: '', is_active: true });
      setSuccess('Tax rule added successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to add tax rule');
    }
  };

  const handleAddMembership = async () => {
    try {
      const plan: MembershipPlan = {
        id: crypto.randomUUID(),
        name: newMembership.name || '',
        price: newMembership.price || 0,
        currency: newMembership.currency || 'INR',
        duration_days: newMembership.duration_days || 30,
        is_active: newMembership.is_active ?? true,
      };
      setMemberships([...memberships, plan]);
      setShowAddMembership(false);
      setNewMembership({ name: '', price: 0, currency: 'INR', duration_days: 30, is_active: true });
      setSuccess('Membership plan added successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to add membership plan');
    }
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
    setSuccess('Expense deleted successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleDeleteAccountHead = (id: string) => {
    setAccountHeads(accountHeads.filter(h => h.id !== id));
    setSuccess('Account head deleted successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleDeleteTaxRule = (id: string) => {
    setTaxRules(taxRules.filter(t => t.id !== id));
    setSuccess('Tax rule deleted successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleDeleteMembership = (id: string) => {
    setMemberships(memberships.filter(m => m.id !== id));
    setSuccess('Membership plan deleted successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <PieChart size={18} /> },
    { id: 'daybook', label: 'Daybook', icon: <FileText size={18} /> },
    { id: 'bankbook', label: 'Bank Book', icon: <Building size={18} /> },
    { id: 'expenses', label: 'Expenses', icon: <Receipt size={18} /> },
    { id: 'payouts', label: 'Seller Payouts', icon: <Users size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  if (loading) return <Loading message="Loading accounts..." />;

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex justify-between items-center">
          <ErrorMessage message={error} />
          <button onClick={() => setError(null)} className="text-gray-500 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>
      )}
      {success && (
        <div className="flex justify-between items-center">
          <SuccessMessage message={success} />
          <button onClick={() => setSuccess(null)} className="text-gray-500 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Accounts & Finance</h2>
          <p className="text-gray-600">Manage your business finances and accounting</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAllData}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-50">
            <Download size={18} />
            Export Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="text-green-600" size={24} />
                </div>
                <span className="flex items-center text-green-600 text-sm font-medium">
                  <ArrowUpRight size={16} />
                  12.5%
                </span>
              </div>
              <p className="text-xl font-bold text-gray-900 mt-3">
                {formatCurrency(summary?.total_revenue || 0, summary?.currency)}
              </p>
              <p className="text-gray-500 text-sm mt-1">Total Revenue</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrendingDown className="text-red-600" size={24} />
                </div>
                <span className="flex items-center text-red-600 text-sm font-medium">
                  <ArrowDownRight size={16} />
                  3.2%
                </span>
              </div>
              <p className="text-xl font-bold text-gray-900 mt-3">
                {formatCurrency(summary?.total_expenses || 0, summary?.currency)}
              </p>
              <p className="text-gray-500 text-sm mt-1">Total Expenses</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="text-blue-600" size={24} />
                </div>
              </div>
              <p className="text-xl font-bold text-gray-900 mt-3">
                {formatCurrency(summary?.net_profit || 0, summary?.currency)}
              </p>
              <p className="text-gray-500 text-sm mt-1">Net Profit</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Wallet className="text-purple-600" size={24} />
                </div>
              </div>
              <p className="text-xl font-bold text-gray-900 mt-3">
                {formatCurrency(summary?.total_payouts || 0, summary?.currency)}
              </p>
              <p className="text-gray-500 text-sm mt-1">Seller Payouts</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Percent className="text-amber-600" size={24} />
                </div>
              </div>
              <p className="text-xl font-bold text-gray-900 mt-3">
                {formatCurrency(summary?.total_taxes || 0, summary?.currency)}
              </p>
              <p className="text-gray-500 text-sm mt-1">Total Taxes</p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Transactions */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
                <button 
                  onClick={() => setActiveTab('daybook')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {daybook.length > 0 ? (
                  daybook.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${entry.credit > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                          {entry.credit > 0 ? (
                            <ArrowUpRight className="text-green-600" size={16} />
                          ) : (
                            <ArrowDownRight className="text-red-600" size={16} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{entry.description}</p>
                          <p className="text-xs text-gray-500">{entry.date}</p>
                        </div>
                      </div>
                      <span className={`font-semibold ${entry.credit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {entry.credit > 0 ? '+' : '-'}{formatCurrency(entry.credit || entry.debit)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No recent transactions</p>
                )}
              </div>
            </div>

            {/* Expense Categories */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Expense Categories</h3>
                <button
                  onClick={() => setShowAddExpense(true)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <Plus size={16} /> Add
                </button>
              </div>
              <div className="space-y-3">
                {expenses.length > 0 ? (
                  expenses.slice(0, 5).map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Receipt className="text-gray-600" size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{expense.category}</p>
                          <p className="text-xs text-gray-500">{expense.vendor || 'General'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(expense.amount)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          expense.status === 'paid' ? 'bg-green-100 text-green-700' :
                          expense.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {expense.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No expenses recorded</p>
                )}
              </div>
            </div>
          </div>

          {/* Account Heads & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Account Heads</h3>
                <button
                  onClick={() => setShowAddAccountHead(true)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Plus size={18} />
                </button>
              </div>
              <div className="space-y-2">
                {accountHeads.length > 0 ? (
                  accountHeads.map((head) => (
                    <div key={head.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          head.type === 'income' ? 'bg-green-500' :
                          head.type === 'expense' ? 'bg-red-500' :
                          head.type === 'asset' ? 'bg-blue-500' :
                          'bg-amber-500'
                        }`} />
                        <span className="text-sm text-gray-900">{head.name}</span>
                      </div>
                      <span className="text-xs text-gray-500 uppercase">{head.type}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No account heads</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Tax Rules</h3>
                <button
                  onClick={() => setShowAddTaxRule(true)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Plus size={18} />
                </button>
              </div>
              <div className="space-y-2">
                {taxRules.length > 0 ? (
                  taxRules.map((tax) => (
                    <div key={tax.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{tax.name}</p>
                        {tax.country && <p className="text-xs text-gray-500">{tax.country}</p>}
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{tax.percentage}%</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No tax rules</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Membership Plans</h3>
                <button
                  onClick={() => setShowAddMembership(true)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Plus size={18} />
                </button>
              </div>
              <div className="space-y-2">
                {memberships.length > 0 ? (
                  memberships.map((plan) => (
                    <div key={plan.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{plan.name}</p>
                        <p className="text-xs text-gray-500">{plan.duration_days} days</p>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(plan.price, plan.currency)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No membership plans</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'daybook' && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h3 className="text-lg font-semibold text-gray-900">Daybook Entries</h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-gray-500" />
                  <input
                    type="date"
                    value={dateFilter.startDate}
                    onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    value={dateFilter.endDate}
                    onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                  <Filter size={16} />
                  Filter
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Debit</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Credit</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {daybook.length > 0 ? (
                  daybook.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">{entry.date}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">{entry.reference || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{entry.description}</td>
                      <td className="px-4 py-3 text-sm text-red-600 text-right font-medium">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-green-600 text-right font-medium">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-semibold">
                        {formatCurrency(entry.balance)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No daybook entries found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {((daybookPagination.page - 1) * daybookPagination.limit) + 1} to{' '}
              {Math.min(daybookPagination.page * daybookPagination.limit, daybookPagination.total)} of{' '}
              {daybookPagination.total} entries
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDaybookPagination(p => ({ ...p, page: p.page - 1 }))}
                disabled={daybookPagination.page === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-3 py-1 text-sm">Page {daybookPagination.page}</span>
              <button
                onClick={() => setDaybookPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={daybookPagination.page * daybookPagination.limit >= daybookPagination.total}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'bankbook' && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h3 className="text-lg font-semibold text-gray-900">Bank Book</h3>
              <div className="flex items-center gap-3">
                <select className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
                  <option>All Accounts</option>
                  <option>Primary Account</option>
                  <option>Savings Account</option>
                </select>
                <button className="flex items-center gap-1 px-3 py-1.5 bg-white text-gray-900 rounded-lg text-sm hover:bg-gray-50">
                  <Download size={16} />
                  Export
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Withdrawal</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Deposit</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {bankBook.length > 0 ? (
                  bankBook.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">{entry.date}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">{entry.bank_reference || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{entry.description}</td>
                      <td className="px-4 py-3 text-sm text-red-600 text-right font-medium">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-green-600 text-right font-medium">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-semibold">
                        {formatCurrency(entry.balance)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No bank book entries found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {bankPagination.page} of {Math.ceil(bankPagination.total / bankPagination.limit) || 1}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBankPagination(p => ({ ...p, page: p.page - 1 }))}
                disabled={bankPagination.page === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setBankPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={bankPagination.page * bankPagination.limit >= bankPagination.total}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Expense Management</h3>
            <button
              onClick={() => setShowAddExpense(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-50"
            >
              <Plus size={18} />
              Add Expense
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {expenses.length > 0 ? (
                  expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">{expense.date}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{expense.category}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{expense.description || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{expense.vendor || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-semibold">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          expense.status === 'paid' ? 'bg-green-100 text-green-700' :
                          expense.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {expense.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600">
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No expenses found. Click "Add Expense" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'payouts' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Seller Payouts</h3>
            <div className="flex items-center gap-3">
              <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option>All Status</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Completed</option>
                <option>Failed</option>
              </select>
              <button className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-50">
                <Plus size={18} />
                Process Payout
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Seller ID</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Scheduled</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Processed</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payouts.length > 0 ? (
                  payouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-900">{payout.seller_id}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-semibold">
                        {formatCurrency(payout.amount, payout.currency)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          payout.status === 'completed' ? 'bg-green-100 text-green-700' :
                          payout.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                          payout.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {payout.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{payout.scheduled_at || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{payout.processed_at || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded">
                            View
                          </button>
                          {payout.status === 'pending' && (
                            <button className="px-3 py-1 text-xs font-medium text-green-600 hover:bg-green-50 rounded">
                              Approve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No seller payouts found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Account Heads */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Account Heads</h3>
              <button
                onClick={() => setShowAddAccountHead(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-white text-gray-900 rounded-lg text-sm hover:bg-gray-50"
              >
                <Plus size={16} /> Add
              </button>
            </div>
            <div className="space-y-2">
              {accountHeads.map((head) => (
                <div key={head.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${
                      head.type === 'income' ? 'bg-green-500' :
                      head.type === 'expense' ? 'bg-red-500' :
                      head.type === 'asset' ? 'bg-blue-500' :
                      'bg-amber-500'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900">{head.name}</p>
                      <p className="text-xs text-gray-500 uppercase">{head.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      head.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {head.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteAccountHead(head.id)}
                      className="p-1 hover:bg-gray-100 rounded text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {accountHeads.length === 0 && (
                <p className="text-gray-500 text-center py-8">No account heads configured</p>
              )}
            </div>
          </div>

          {/* Tax Rules */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tax Rules</h3>
              <button
                onClick={() => setShowAddTaxRule(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-white text-gray-900 rounded-lg text-sm hover:bg-gray-50"
              >
                <Plus size={16} /> Add
              </button>
            </div>
            <div className="space-y-2">
              {taxRules.map((tax) => (
                <div key={tax.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{tax.name}</p>
                    {tax.country && <p className="text-xs text-gray-500">{tax.country}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-gray-900">{tax.percentage}%</span>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteTaxRule(tax.id)}
                      className="p-1 hover:bg-gray-100 rounded text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {taxRules.length === 0 && (
                <p className="text-gray-500 text-center py-8">No tax rules configured</p>
              )}
            </div>
          </div>

          {/* Membership Plans */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Membership Plans</h3>
              <button
                onClick={() => setShowAddMembership(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-white text-gray-900 rounded-lg text-sm hover:bg-gray-50"
              >
                <Plus size={16} /> Add
              </button>
            </div>
            <div className="space-y-2">
              {memberships.map((plan) => (
                <div key={plan.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{plan.name}</p>
                    <p className="text-xs text-gray-500">{plan.duration_days} days</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-gray-900">
                      {formatCurrency(plan.price, plan.currency)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      plan.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteMembership(plan.id)}
                      className="p-1 hover:bg-gray-100 rounded text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {memberships.length === 0 && (
                <p className="text-gray-500 text-center py-8">No membership plans configured</p>
              )}
            </div>
          </div>

          {/* Platform Costs */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Platform Costs</h3>
              <button className="flex items-center gap-1 px-3 py-1.5 bg-white text-gray-900 rounded-lg text-sm hover:bg-gray-50">
                <Plus size={16} /> Add
              </button>
            </div>
            <div className="space-y-2">
              {platformCosts.map((cost) => (
                <div key={cost.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{cost.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{cost.billing_cycle}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-gray-900">
                      {formatCurrency(cost.amount, cost.currency)}
                    </span>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Edit size={14} />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {platformCosts.length === 0 && (
                <p className="text-gray-500 text-center py-8">No platform costs configured</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Expense</h3>
              <button onClick={() => setShowAddExpense(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="">Select Category</option>
                  {expenseCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  value={newExpense.amount || ''}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newExpense.description || ''}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  placeholder="Enter description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                <input
                  type="text"
                  value={newExpense.vendor || ''}
                  onChange={(e) => setNewExpense({ ...newExpense, vendor: e.target.value })}
                  placeholder="Enter vendor name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddExpense(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddExpense}
                className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-50"
              >
                Add Expense
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Account Head Modal */}
      {showAddAccountHead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Account Head</h3>
              <button onClick={() => setShowAddAccountHead(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newAccountHead.name || ''}
                  onChange={(e) => setNewAccountHead({ ...newAccountHead, name: e.target.value })}
                  placeholder="Enter account head name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newAccountHead.type}
                  onChange={(e) => setNewAccountHead({ ...newAccountHead, type: e.target.value as 'asset' | 'liability' | 'income' | 'expense' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="asset">Asset</option>
                  <option value="liability">Liability</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="accountHeadActive"
                  checked={newAccountHead.is_active}
                  onChange={(e) => setNewAccountHead({ ...newAccountHead, is_active: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="accountHeadActive" className="text-sm text-gray-700">Active</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddAccountHead(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAccountHead}
                className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-50"
              >
                Add Account Head
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Tax Rule Modal */}
      {showAddTaxRule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Tax Rule</h3>
              <button onClick={() => setShowAddTaxRule(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newTaxRule.name || ''}
                  onChange={(e) => setNewTaxRule({ ...newTaxRule, name: e.target.value })}
                  placeholder="e.g., GST, VAT"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Percentage</label>
                <input
                  type="number"
                  value={newTaxRule.percentage || ''}
                  onChange={(e) => setNewTaxRule({ ...newTaxRule, percentage: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country (Optional)</label>
                <input
                  type="text"
                  value={newTaxRule.country || ''}
                  onChange={(e) => setNewTaxRule({ ...newTaxRule, country: e.target.value })}
                  placeholder="e.g., India, USA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="taxRuleActive"
                  checked={newTaxRule.is_active}
                  onChange={(e) => setNewTaxRule({ ...newTaxRule, is_active: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="taxRuleActive" className="text-sm text-gray-700">Active</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddTaxRule(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTaxRule}
                className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-50"
              >
                Add Tax Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Membership Modal */}
      {showAddMembership && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Membership Plan</h3>
              <button onClick={() => setShowAddMembership(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                <input
                  type="text"
                  value={newMembership.name || ''}
                  onChange={(e) => setNewMembership({ ...newMembership, name: e.target.value })}
                  placeholder="e.g., Basic, Premium"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input
                    type="number"
                    value={newMembership.price || ''}
                    onChange={(e) => setNewMembership({ ...newMembership, price: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={newMembership.currency}
                    onChange={(e) => setNewMembership({ ...newMembership, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.code}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
                <input
                  type="number"
                  value={newMembership.duration_days || ''}
                  onChange={(e) => setNewMembership({ ...newMembership, duration_days: parseInt(e.target.value) || 0 })}
                  placeholder="30"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="membershipActive"
                  checked={newMembership.is_active}
                  onChange={(e) => setNewMembership({ ...newMembership, is_active: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="membershipActive" className="text-sm text-gray-700">Active</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddMembership(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMembership}
                className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-50"
              >
                Add Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsManagement;
