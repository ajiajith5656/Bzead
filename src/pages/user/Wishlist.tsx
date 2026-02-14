import React, { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { useAuth } from '../../contexts/AuthContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCart } from '../../contexts/CartContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useNavigate } from 'react-router-dom';
import { Heart, Trash2, ShoppingCart, Loader2 } from 'lucide-react';

export const WishlistPage: React.FC = () => {
  const { user, currentAuthUser } = useAuth();
  const { items: wishlistItems, removeFromWishlist, loadFromBackend } = useWishlist();
  const { addToCart } = useCart();
  const { formatPrice, convertPrice } = useCurrency();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in
    if (!user && !currentAuthUser) {
      navigate('/login');
      return;
    }

    // Load wishlist from backend
    const loadWishlist = async () => {
      try {
        const userId = user?.id || currentAuthUser?.username;
        if (userId) {
          await loadFromBackend(userId);
        }
      } catch (error) {
        console.error('Failed to load wishlist from backend:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWishlist();
  }, [user, currentAuthUser, navigate, loadFromBackend]);

  const handleRemoveItem = async (id: string) => {
    try {
      setRemovingId(id);
      // Simulate removal delay
      await new Promise((resolve) => setTimeout(resolve, 300));
      removeFromWishlist(id);
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddToCart = (product: any) => {
    // Add the product to cart
    addToCart(product, 1);
    // Show feedback
    alert('Added to cart!');
  };

  const totalValue = wishlistItems.reduce((sum, item) => sum + convertPrice(item.price, item.currency), 0);
  const totalSavings = wishlistItems.reduce(
    (sum, item) => sum + (convertPrice(item.price, item.currency) * (item.discount || 0)) / 100,
    0
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-amber-600 mb-2">My Wishlist</h1>
          <p className="text-gray-500">{wishlistItems.length} items saved</p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 text-amber-600 animate-spin mr-3" />
            <span className="text-gray-900 text-lg">Loading your wishlist...</span>
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-12 text-center">
            <Heart className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Wishlist Empty</h2>
            <p className="text-gray-500 mb-6">
              Start adding items to your wishlist to save them for later.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-amber-500 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition-all duration-300"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div>
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-500 text-sm mb-1">Total Value</p>
                <p className="text-2xl font-bold text-amber-600">{formatPrice(totalValue)}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-500 text-sm mb-1">Total Savings</p>
                <p className="text-2xl font-bold text-green-400">{formatPrice(Math.round(totalSavings))}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-500 text-sm mb-1">Items</p>
                <p className="text-2xl font-bold text-gray-900">{wishlistItems.length}</p>
              </div>
            </div>

            {/* Wishlist Items */}
            <div className="space-y-4">
              {wishlistItems.map((product) => (
                <div
                  key={product.id}
                  className={`bg-gray-50 border border-gray-200 rounded-lg overflow-hidden hover:border-amber-500 transition-all duration-300 flex flex-col sm:flex-row gap-4 p-4 group ${
                    removingId === product.id ? 'opacity-50' : ''
                  }`}
                >
                  {/* Image */}
                  <div className="flex-shrink-0 w-full sm:w-40 h-40 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{product.name}</h3>
                    <p className="text-sm text-gray-500 mb-3">{product.brand || 'Brand'}</p>

                    {/* Price */}
                    <div className="mb-3 flex items-center gap-3">
                      <span className="text-2xl font-bold text-amber-600">
                        {formatPrice(product.price, product.currency)}
                      </span>
                      {product.discount && (
                        <>
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(Math.round(product.price / (1 - product.discount / 100)), product.currency)}
                          </span>
                          <span className="bg-red-900 text-red-200 px-2 py-1 rounded text-xs font-bold">
                            -{product.discount}%
                          </span>
                        </>
                      )}
                    </div>

                    {/* Stock Status */}
                    <p className="text-sm font-medium mb-4 text-green-400">
                      ✓ In Stock
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 justify-end sm:w-40">
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={removingId === product.id}
                      className="bg-amber-500 text-black px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => handleRemoveItem(product.id)}
                      disabled={removingId === product.id}
                      className="bg-gray-100 hover:bg-red-900 text-gray-900 px-4 py-2 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
