import React, { useState, useEffect } from 'react';
import { Search, Filter, Download } from 'lucide-react';
import { logger } from '../../../utils/logger';
import { adminGlobalSearch } from '../../../lib/adminService';
import { supabase } from '../../../lib/supabase';

interface SearchResult {
  type: 'user' | 'seller' | 'product' | 'order';
  id: string;
  title: string;
  description: string;
  metadata: string;
}

export const SearchManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [filters, setFilters] = useState([
    { id: 'users', label: 'Users', count: 0 },
    { id: 'sellers', label: 'Sellers', count: 0 },
    { id: 'products', label: 'Products', count: 0 },
    { id: 'orders', label: 'Orders', count: 0 }
  ]);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [usersRes, sellersRes, productsRes, ordersRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'user'),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'seller'),
          supabase.from('products').select('id', { count: 'exact', head: true }),
          supabase.from('orders').select('id', { count: 'exact', head: true }),
        ]);
        setFilters([
          { id: 'users', label: 'Users', count: usersRes.count || 0 },
          { id: 'sellers', label: 'Sellers', count: sellersRes.count || 0 },
          { id: 'products', label: 'Products', count: productsRes.count || 0 },
          { id: 'orders', label: 'Orders', count: ordersRes.count || 0 },
        ]);
      } catch (err) {
        logger.error(err as Error, { context: 'Failed to fetch search filter counts' });
      }
    };
    fetchCounts();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert('Please enter a search query');
      return;
    }

    setIsSearching(true);
    try {
      logger.log('Search initiated', { query: searchQuery, filters: selectedFilters });

      const searchResults = await adminGlobalSearch(searchQuery, selectedFilters);
      setResults(searchResults as SearchResult[]);
    } catch (error) {
      logger.error(error as Error, { context: 'Search failed' });
      alert('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  const getTypeColor = (type: SearchResult['type']) => {
    const colors = {
      'user': 'bg-blue-100 text-blue-800',
      'seller': 'bg-green-100 text-green-800',
      'product': 'bg-purple-100 text-purple-800',
      'order': 'bg-orange-100 text-orange-800'
    };
    return colors[type];
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    const labels = {
      'user': 'User',
      'seller': 'Seller',
      'product': 'Product',
      'order': 'Order'
    };
    return labels[type];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-xl font-bold text-gray-900">Advanced Search</h1>
          <p className="text-gray-600 mt-2">Search across all tables and resources</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search users, sellers, products, orders..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="bg-blue-600 text-gray-900 px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-gray-600 font-medium">Filter by:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {filters.map((filter) => (
              <label
                key={filter.id}
                className="flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition hover:border-blue-400"
                style={{
                  borderColor: selectedFilters.includes(filter.id) ? '#2563eb' : '#e5e7eb',
                  backgroundColor: selectedFilters.includes(filter.id) ? '#eff6ff' : '#fff'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedFilters.includes(filter.id)}
                  onChange={() => toggleFilter(filter.id)}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{filter.label}</p>
                  <p className="text-gray-600 text-xs">{filter.count} items</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="border-b p-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Search Results ({results.length})
              </h2>
              <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>

            <div className="divide-y">
              {results.map((result) => (
                <div key={result.id} className="p-6 hover:bg-gray-50 transition cursor-pointer">
                  <div className="flex items-start gap-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getTypeColor(result.type)}`}>
                      {getTypeLabel(result.type)}
                    </span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{result.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">{result.description}</p>
                      <p className="text-gray-500 text-xs">{result.metadata}</p>
                    </div>
                    <span className="text-gray-500 text-sm">ID: {result.id}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isSearching && results.length === 0 && searchQuery && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No results found for "{searchQuery}"</p>
            <p className="text-gray-500 text-sm mt-2">Try different keywords or adjust your filters</p>
          </div>
        )}

        {/* Help Text */}
        {!isSearching && results.length === 0 && !searchQuery && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Search Tips:</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Use the search box to find users, sellers, products, or orders</li>
              <li>• Apply filters to narrow down your search results</li>
              <li>• Search by ID, name, email, phone, or other identifiers</li>
              <li>• Export results for further analysis</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchManagement;
