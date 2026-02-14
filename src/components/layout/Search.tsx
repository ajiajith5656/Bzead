import React, { useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/products/section/featured?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4">
        <form onSubmit={handleSearch} className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for products, brands..."
              className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base bg-white border-2 border-gray-200 text-gray-900 rounded-lg focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="btn-primary px-4 sm:px-8 py-2 sm:py-3 text-sm sm:text-base"
          >
            Go
          </button>
        </form>
      </div>
    </div>
  );
};
