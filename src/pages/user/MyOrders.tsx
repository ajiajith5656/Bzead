import React, { useState, useEffect } from 'react';
import logger from '../../utils/logger';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useNavigate } from 'react-router-dom';
import { Package, ChevronRight, Loader2 } from 'lucide-react';
import { fetchOrdersByUser } from '../../lib/orderService';

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: number;
  trackingId?: string;
}

export const MyOrders: React.FC = () => {
  const { user, currentAuthUser } = useAuth();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'shipped' | 'delivered' | 'cancelled'>('all');

  useEffect(() => {
    // Check if user is logged in
    const userId = user?.id || currentAuthUser?.username;
    if (!userId) {
      navigate('/login');
      return;
    }

    // Fetch orders from backend
    const loadOrders = async () => {
      try {
        setLoading(true);
        
        // Query orders for current user from Supabase
        const result = await fetchOrdersByUser(userId);

        if (result?.data) {
          const fetchedOrders = result.data.map((order: any) => {
            let itemsCount = 0;
            try {
              const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.order_items || order.items);
              itemsCount = Array.isArray(items) ? items.length : 0;
            } catch (e) {
              itemsCount = 0;
            }

            return {
              id: order.id,
              orderNumber: order.order_number,
              date: new Date(order.created_at).toLocaleDateString('en-IN'),
              total: order.total_amount,
              status: order.status as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
              items: itemsCount,
              trackingId: order.tracking_number,
            };
          });

          setOrders(fetchedOrders);
        }
      } catch (error) {
        logger.error(error as Error, { context: 'Failed to load orders from GraphQL' });
        // Fallback: show empty state
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [user, currentAuthUser, navigate]);

  const filteredOrders = selectedFilter === 'all' 
    ? orders 
    : orders.filter((order) => order.status === selectedFilter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-900 text-green-200';
      case 'shipped':
        return 'bg-blue-900 text-blue-200';
      case 'processing':
        return 'bg-yellow-900 text-yellow-200';
      case 'pending':
        return 'bg-gray-200 text-gray-200';
      case 'cancelled':
        return 'bg-red-900 text-red-200';
      default:
        return 'bg-gray-200 text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return '✓';
      case 'shipped':
        return '🚚';
      case 'processing':
        return '⏳';
      case 'cancelled':
        return '✕';
      default:
        return '•';
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-amber-600 mb-2">My Orders</h1>
          <p className="text-gray-500">Track and manage your orders</p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          {(['all', 'pending', 'shipped', 'delivered', 'cancelled'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                selectedFilter === filter
                  ? 'bg-amber-500 text-black'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-100'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
              {filter !== 'all' && ` (${orders.filter((o) => o.status === filter).length})`}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 text-amber-600 animate-spin mr-3" />
            <span className="text-gray-900 text-lg">Loading your orders...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-12 text-center">
            <Package className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Orders Found</h2>
            <p className="text-gray-500 mb-6">
              You don't have any {selectedFilter !== 'all' ? selectedFilter : ''} orders yet.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-amber-500 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition-all duration-300"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-amber-500 transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-amber-600 transition-all duration-300">
                      {order.orderNumber}
                    </h3>
                    <p className="text-sm text-gray-500">{order.date}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-full font-semibold flex items-center gap-2 ${getStatusColor(order.status)}`}>
                    <span>{getStatusIcon(order.status)}</span>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Items</p>
                    <p className="text-lg font-bold text-amber-600">{order.items}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Total</p>
                    <p className="text-lg font-bold text-gray-900">{formatPrice(order.total)}</p>
                  </div>
                  {order.trackingId && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Tracking</p>
                      <p className="text-lg font-bold text-amber-600">{order.trackingId}</p>
                    </div>
                  )}
                  <div className="flex items-end justify-end">
                    <ChevronRight className="h-5 w-5 text-amber-600 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>

                {order.status === 'delivered' && (
                  <button className="text-amber-600 hover:text-yellow-400 text-sm font-medium transition-all duration-300">
                    Write a Review
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
