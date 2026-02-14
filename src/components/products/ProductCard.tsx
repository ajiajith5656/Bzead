import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import type { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { formatCurrency } from '../../utils/currency';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { currency, convertPrice } = useCurrency();
  const inWishlist = isInWishlist(product.id);

  const convertedPrice = convertPrice(product.price, product.currency);
  const originalPrice = product.discount 
    ? convertPrice(product.price / (1 - product.discount / 100), product.currency)
    : convertedPrice;

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className="relative bg-white border border-gray-100 rounded-xl overflow-hidden group cursor-pointer block hover:shadow-md transition-shadow duration-300"
    >
      {/* Badges */}
      <div className="absolute top-2 left-2 z-10 flex flex-col space-y-1">
        {product.discount && product.discount > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
            -{product.discount}%
          </span>
        )}
        {product.isNew && (
          <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-md">
            NEW
          </span>
        )}
      </div>

      {/* Wishlist Button */}
      <button
        onClick={handleWishlistToggle}
        className="absolute top-2 right-2 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white shadow-sm transition-all"
      >
        <Heart
          className={`h-5 w-5 ${
            inWishlist ? 'fill-red-500 text-red-500' : 'text-gray-500'
          }`}
        />
      </button>

      {/* Product Image */}
      <div className="relative aspect-[4/5] md:aspect-square overflow-hidden bg-white">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 md:group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = 'https://via.placeholder.com/400x400/f3f4f6/f59e0b?text=Product';
          }}
        />
      </div>

      {/* Product Details */}
      <div className="p-3 md:p-4">
        {/* Rating & Brand */}
        <div className="flex items-center justify-between mb-2">
          {product.rating && (
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 fill-amber-500 text-amber-600" />
              <span className="text-sm text-black font-medium">{product.rating}</span>
            </div>
          )}
          {product.brand && (
            <span className="text-xs text-gray-500 uppercase">{product.brand}</span>
          )}
        </div>

        {/* Product Title */}
        <h3 className="text-black font-medium text-sm mb-1 line-clamp-2 h-9 md:h-10">
          {product.name}
        </h3>

        {/* Category */}
        <p className="text-[11px] md:text-xs text-gray-500 mb-2">{product.category}</p>

        {/* Price */}
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-black font-bold text-base md:text-lg">
            {formatCurrency(convertedPrice, currency)}
          </span>
          {product.discount && product.discount > 0 && (
            <span className="text-gray-500 text-xs md:text-sm line-through">
              {formatCurrency(originalPrice, currency)}
            </span>
          )}
        </div>

        {/* Add to Cart Button - Slides up on hover */}
        <div className="transition-all duration-300 md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
          <button
            onClick={handleAddToCart}
            className="w-full btn-primary flex items-center justify-center space-x-2 py-1.5 text-xs md:text-sm"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </Link>
  );
};
