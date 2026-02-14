import React from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../types';
import { useCurrency } from '../../contexts/CurrencyContext';
import { formatCurrency } from '../../utils/currency';

interface HomeProductCardProps {
  product: Product;
}

export const HomeProductCard: React.FC<HomeProductCardProps> = ({ product }) => {
  const { currency, convertPrice } = useCurrency();
  const convertedPrice = convertPrice(product.price, product.currency);

  return (
    <Link
      to={`/products/${product.id}`}
      className="block bg-white rounded-xl overflow-hidden group cursor-pointer border border-gray-100 hover:shadow-md transition-shadow duration-300"
    >
      {/* Product Image */}
      <div className="relative aspect-[4/5] overflow-hidden bg-white">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = 'https://via.placeholder.com/400x500/f3f4f6/f59e0b?text=Product';
          }}
        />
      </div>

      {/* Product Info */}
      <div className="px-3 pt-3 pb-4">
        {/* Brand */}
        <p className="text-amber-600 text-[11px] md:text-xs font-semibold uppercase tracking-wider mb-1">
          {product.brand || 'Premium Brand'}
        </p>

        {/* Product Name */}
        <h3 className="text-black font-semibold text-sm md:text-base uppercase leading-tight line-clamp-1 mb-1.5">
          {product.name}
        </h3>

        {/* Price */}
        <p className="text-black font-bold text-base md:text-lg">
          {formatCurrency(convertedPrice, currency)}
        </p>
      </div>
    </Link>
  );
};
