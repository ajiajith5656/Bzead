import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { MobileNav } from '../components/layout/MobileNav';
import { ProductCard } from '../components/products/ProductCard';
import { Menu, X, Star, DollarSign, Package, Loader2 } from 'lucide-react';
import { fetchCategoryById, fetchProducts } from '../lib/productService';

interface FilterOptions {
  priceRange: [number, number];
  rating: number | null;
  inStock: boolean;
  sortBy: 'featured' | 'price-low-high' | 'price-high-low' | 'rating' | 'newest';
}

export const CategoryProducts: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<{ id: string; name: string; image_url?: string } | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    priceRange: [0, 50000],
    rating: null,
    inStock: false,
    sortBy: 'featured',
  });

  useEffect(() => {
    if (!categoryId) return;
    const load = async () => {
      setLoading(true);
      // Fetch category details
      const { data: catData } = await fetchCategoryById(categoryId);
      if (catData) {
        setCategory({ id: catData.id, name: catData.name, image_url: catData.image_url });
      }
      // Fetch products for this category (using category name since products.category is text)
      const categoryName = catData?.name || '';
      const { data: prods } = await fetchProducts({ category: categoryName, limit: 200 });
      setProducts(prods || []);
      setLoading(false);
    };
    load();
  }, [categoryId]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-black mb-4">Category Not Found</h1>
            <button
              onClick={() => navigate('/')}
              className="bg-amber-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-amber-600 transition-all duration-300"
            >
              Back to Home
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      // Filter by price
      if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
        return false;
      }
      
      // Filter by rating
      if (filters.rating && (product.rating || 0) < filters.rating) {
        return false;
      }
      
      // Filter by stock
      if (filters.inStock && product.stock === 0) {
        return false;
      }
      
      return true;
    });

    // Sort products
    switch (filters.sortBy) {
      case 'price-low-high':
        return filtered.sort((a, b) => a.price - b.price);
      case 'price-high-low':
        return filtered.sort((a, b) => b.price - a.price);
      case 'rating':
        return filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'newest':
        return filtered.reverse();
      case 'featured':
      default:
        return filtered;
    }
  }, [filters, products]);

  const handlePriceChange = (type: 'min' | 'max', value: number) => {
    const [min, max] = filters.priceRange;
    if (type === 'min') {
      setFilters((prev) => ({ ...prev, priceRange: [Math.min(value, max), max] }));
    } else {
      setFilters((prev) => ({ ...prev, priceRange: [min, Math.max(value, min)] }));
    }
  };

  return (
    <div className="min-h-screen bg-white pb-16 md:pb-0">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-amber-600 mb-1.5">
              {category.name}
            </h1>
            <p className="text-sm text-gray-500">{filteredProducts.length} products</p>
          </div>
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="md:hidden p-1.5 bg-white text-amber-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {showSidebar ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <aside
            className={`${
              showSidebar ? 'block' : 'hidden'
            } md:block bg-white border border-gray-100 rounded-xl p-4 h-fit sticky top-24 md:col-span-1`}
          >
            <h2 className="text-lg font-bold text-black mb-4">Filters</h2>

            {/* Sort By */}
            <div className="mb-6">
              <h3 className="text-base font-semibold text-black mb-2 flex items-center gap-2">
                <Package className="h-4 w-4 text-amber-600" />
                Sort By
              </h3>
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    sortBy: e.target.value as FilterOptions['sortBy'],
                  }))
                }
                className="w-full bg-white border border-gray-100 text-black rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
              >
                <option value="featured">Featured</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest</option>
              </select>
            </div>

            {/* Price Range Filter */}
            <div className="mb-6 pb-6 border-b border-gray-100">
              <h3 className="text-base font-semibold text-black mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-amber-600" />
                Price Range
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500 mb-2 block">
                    Min: ₹{filters.priceRange[0].toLocaleString()}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50000"
                    value={filters.priceRange[0]}
                    onChange={(e) => handlePriceChange('min', Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-2 block">
                    Max: ₹{filters.priceRange[1].toLocaleString()}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50000"
                    value={filters.priceRange[1]}
                    onChange={(e) => handlePriceChange('max', Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Rating Filter */}
            <div className="mb-6 pb-6 border-b border-gray-100">
              <h3 className="text-base font-semibold text-black mb-3 flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-600" />
                Rating
              </h3>
              <div className="space-y-3">
                {[4, 3, 2, 1].map((rating) => (
                  <button
                    key={rating}
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        rating: prev.rating === rating ? null : rating,
                      }))
                    }
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
                      filters.rating === rating
                        ? 'bg-amber-500 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={filters.rating === rating}
                      readOnly
                      className="cursor-pointer"
                    />
                    <span>
                      {'⭐'.repeat(rating)} {rating}+ Stars
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stock Filter */}
            <div className="pb-8">
              <button
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    inStock: !prev.inStock,
                  }))
                }
                className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
                  filters.inStock
                    ? 'bg-amber-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={filters.inStock}
                  readOnly
                  className="cursor-pointer"
                />
                <span>In Stock Only</span>
              </button>
            </div>

            {/* Reset Filters Button */}
            <button
              onClick={() =>
                setFilters({
                  priceRange: [0, 50000],
                  rating: null,
                  inStock: false,
                  sortBy: 'featured',
                })
              }
              className="w-full bg-white hover:bg-gray-50 text-black px-4 py-2 rounded-lg font-medium transition-all duration-300"
            >
              Reset Filters
            </button>
          </aside>

          {/* Products Grid */}
          <div className="md:col-span-3">
            {filteredProducts.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
                <h2 className="text-xl font-semibold text-black mb-2">No Products Found</h2>
                <p className="text-gray-500 mb-6">
                  Try adjusting your filters to find what you're looking for.
                </p>
                <button
                  onClick={() =>
                    setFilters({
                      priceRange: [0, 50000],
                      rating: null,
                      inStock: false,
                      sortBy: 'featured',
                    })
                  }
                  className="bg-amber-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-amber-600 transition-all duration-300"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
};
