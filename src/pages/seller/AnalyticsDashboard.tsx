import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { TrendingUp, BarChart3, PieChart, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { fetchOrdersBySeller } from '../../lib/orderService';

export const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  
  const [dateRange, setDateRange] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  
  const sellerId = user?.id;

  // Fetch orders on component mount
  useEffect(() => {
    if (sellerId) {
      fetchAnalytics();
    }
  }, [sellerId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await fetchOrdersBySeller(sellerId!, { limit: 100 });

      if (fetchError) {
        setError('Failed to load analytics');
      } else {
        setOrders(data);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics from real order data
  const calculateMetrics = () => {
    let totalSales = 0;
    let totalOrderCount = 0;
    const deliveredOrders: any[] = [];
    const processingOrders: any[] = [];
    const productStats: Record<string, any> = {};
    const categoryStats: Record<string, any> = {};

    orders.forEach(order => {
      if (order.status === 'delivered') {
        deliveredOrders.push(order);
        totalSales += order.total_amount || 0;
      } else if (['processing', 'shipped', 'new'].includes(order.status)) {
        processingOrders.push(order);
        totalSales += order.total_amount || 0;
      }
      totalOrderCount++;

      // Track product statistics
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const productName = item.product_name || item.name || 'Unknown';
          const productId = item.product_id;
          if (!productStats[productId]) {
            productStats[productId] = {
              name: productName,
              sales: 0,
              revenue: 0
            };
          }
          productStats[productId].sales += item.quantity || 1;
          productStats[productId].revenue += (item.price || 0) * (item.quantity || 1);

          // Track category
          const category = item.category || 'Other';
          if (!categoryStats[category]) {
            categoryStats[category] = { amount: 0, count: 0 };
          }
          categoryStats[category].amount += (item.price || 0) * (item.quantity || 1);
          categoryStats[category].count += 1;
        });
      }
    });

    const avgOrderValue = totalOrderCount > 0 ? Math.round(totalSales / totalOrderCount) : 0;
    const conversionRate = totalOrderCount > 0 ? ((deliveredOrders.length / totalOrderCount) * 100).toFixed(1) : '0';

    return {
      totalSales,
      totalOrderCount,
      avgOrderValue,
      conversionRate: parseFloat(conversionRate as string),
      deliveredCount: deliveredOrders.length,
      productStats,
      categoryStats
    };
  };

  const metrics = calculateMetrics();

  // Get top 5 products
  const topProducts = Object.values(metrics.productStats)
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 5);

  // Get sales by category
  const totalCategoryAmount = Object.values(metrics.categoryStats).reduce(
    (sum: number, cat: any) => sum + cat.amount, 
    0
  );
  const salesByCategory = Object.entries(metrics.categoryStats)
    .map(([category, stats]: [string, any]) => ({
      category,
      amount: stats.amount,
      percentage: totalCategoryAmount > 0 ? Math.round((stats.amount / totalCategoryAmount) * 100) : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  // Get recent orders
  const recentOrders = orders
    .filter((order: any) => order.status === 'delivered')
    .slice(0, 5);

  const metricCards = [
    {
      label: 'Total Sales',
      value: metrics.totalSales,
      change: 0,
      icon: <TrendingUp className="w-6 h-6" />
    },
    {
      label: 'Orders',
      value: metrics.totalOrderCount,
      change: 0,
      icon: <BarChart3 className="w-6 h-6" />
    },
    {
      label: 'Avg Order Value',
      value: metrics.avgOrderValue,
      change: 0,
      icon: <PieChart className="w-6 h-6" />
    },
    {
      label: 'Conversion Rate',
      value: metrics.conversionRate,
      change: 0,
      icon: <TrendingUp className="w-6 h-6" />
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Sales Analytics</h1>
          <p className="text-gray-600 mt-2">Track your sales performance and metrics</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-md p-12 flex items-center justify-center gap-4">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading analytics...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-red-500">
            <div className="flex items-center gap-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-800">{error}</h3>
                <button
                  onClick={fetchAnalytics}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Date Range Filter */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex items-center gap-4">
              <Calendar className="w-5 h-5 text-gray-500" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="weekly">This Week</option>
                <option value="monthly">This Month</option>
                <option value="quarterly">This Quarter</option>
                <option value="yearly">This Year</option>
              </select>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {metricCards.map((metric, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-600 text-sm font-medium">{metric.label}</span>
                    <div className="text-blue-600">{metric.icon}</div>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {metric.label === 'Total Sales'
                          ? `₹${(metric.value || 0).toLocaleString()}`
                          : metric.label === 'Conversion Rate'
                          ? `${(metric.value || 0).toFixed(1)}%`
                          : (metric.value || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className={`text-sm font-semibold ${metric.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metric.change >= 0 ? '↑' : '↓'} {Math.abs(metric.change)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Top Products & Sales by Category */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Products */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Top Products</h2>
                {topProducts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Product Name</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Sales</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topProducts.map((product: any, index: number) => (
                          <tr key={index} className="border-b hover:bg-gray-50 transition">
                            <td className="py-4 px-4 text-sm text-gray-900">{product.name}</td>
                            <td className="text-right py-4 px-4 text-sm text-gray-600">{product.sales.toLocaleString()}</td>
                            <td className="text-right py-4 px-4 text-sm font-semibold text-gray-900">
                              ₹{product.revenue.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No product sales data available</p>
                )}
              </div>

              {/* Sales by Category */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Sales by Category</h2>
                {salesByCategory.length > 0 ? (
                  <div className="space-y-4">
                    {salesByCategory.map((item, index) => (
                      <div key={index}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">{item.category}</span>
                          <span className="text-sm font-semibold text-gray-900">{item.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">₹{item.amount.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No category data available</p>
                )}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Recent Deliveries</h2>
              {recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition">
                      <div>
                        <p className="font-semibold text-gray-900">Order #{order.order_number}</p>
                        <p className="text-sm text-gray-600">
                          {order.items?.length || 0} items • {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₹{(order.total_amount || 0).toLocaleString()}</p>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          {order.status === 'delivered' ? 'Delivered' : order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No recent deliveries</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
