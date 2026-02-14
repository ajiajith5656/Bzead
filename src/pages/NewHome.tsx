import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Search } from '../components/layout/Search';
import { Categories } from '../components/layout/Categories';
import { HeroCarousel } from '../components/layout/HeroCarousel';
import { Footer } from '../components/layout/Footer';
import { MobileNav } from '../components/layout/MobileNav';
import { HomeProductCard } from '../components/products/HomeProductCard';
import { mockProducts, hotDeals, trendingDeals } from '../data/mockData';
import { getSellerDomainUrl } from '../utils/domain';

const AdBanner: React.FC<{ src: string; alt: string }> = ({ src, alt }) => (
  <div className="w-full my-6">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <img
        src={src}
        alt={alt}
        className="w-full rounded-xl shadow-sm"
        style={{ maxHeight: '150px', objectFit: 'cover' }}
        onError={(e) => {
          e.currentTarget.src = 'https://via.placeholder.com/1500x150/f3f4f6/f59e0b?text=Advertisement';
        }}
      />
    </div>
  </div>
);

const ProductSection: React.FC<{
  title: string;
  products: typeof mockProducts;
  seeMoreLink: string;
}> = ({ title, products, seeMoreLink }) => (
  <div className="py-6">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
        <Link
          to={seeMoreLink}
          className="flex items-center space-x-2 text-amber-600 hover:text-amber-700 transition-colors"
        >
          <span className="text-sm font-medium">See More</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {products.slice(0, 8).map((product) => (
          <HomeProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  </div>
);

export const NewHome: React.FC = () => {
  return (
    <div className="min-h-screen bg-white pb-16 md:pb-0">
      {/* Header */}
      <Header />

      {/* Search Bar */}
      <Search />

      {/* Categories */}
      <Categories />

      {/* Hero Carousel */}
      <HeroCarousel />

      {/* Featured Products */}
      <ProductSection title="Featured Products" products={mockProducts} seeMoreLink="/products/section/featured" />

      {/* Ad Banner 1 */}
      <AdBanner src="/images/banners/ad-banner-1.png" alt="Advertisement 1" />

      {/* Hot Deals */}
      <ProductSection title="Hot Deals 🔥" products={hotDeals} seeMoreLink="/products/section/hot-deals" />

      {/* Ad Banner 2 */}
      <AdBanner src="/images/banners/ad-banner-2.png" alt="Advertisement 2" />

      {/* Trending Deals */}
      <ProductSection title="Trending Now 📈" products={trendingDeals} seeMoreLink="/products/section/trending" />

      {/* Ad Banner 3 */}
      <AdBanner src="/images/banners/ad-banner-3.png" alt="Advertisement 3" />

      {/* Become a Seller CTA */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 py-16 my-8 rounded-none">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-black mb-4">
            Start Selling on Beauzead
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of successful sellers and grow your business globally
          </p>
          <a
            href={getSellerDomainUrl('/signup')}
            className="inline-flex items-center space-x-2 btn-primary text-lg px-5 py-3"
          >
            <span>Get Started Now</span>
            <ArrowRight className="h-5 w-5" />
          </a>
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
};
