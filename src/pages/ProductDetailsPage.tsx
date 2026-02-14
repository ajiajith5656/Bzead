import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Star, Heart, ShoppingCart, ShieldCheck,
  Truck, CreditCard, ChevronRight,
  Info, MapPin, Mail, X,
  Lock, ArrowLeft, Loader2
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { MobileNav } from '../components/layout/MobileNav';
import { fetchProductById, fetchProductReviews, fetchSimilarProducts, submitReview } from '../lib/productService';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/currency';

interface ReviewItem {
  id: string;
  reviewerName: string;
  rating: number;
  heading: string;
  text: string;
  date: string;
  images: string[];
}

interface SimilarProduct {
  id: string;
  name: string;
  image_url: string;
  brand: string;
  price: number;
  currency: string;
  rating: number;
  discount_price: number | null;
}

const ProductDetailsPage: React.FC = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { currency, convertPrice } = useCurrency();
  const { user } = useAuth();

  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [similarProducts, setSimilarProducts] = useState<SimilarProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('Free Size');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewFormData, setReviewFormData] = useState({ rating: 0, heading: '', text: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    
    fetchProductById(productId).then(async ({ data }) => {
      if (data) {
        setProduct(data);
        // Fetch reviews
        const { data: revData } = await fetchProductReviews(productId);
        setReviews((revData || []).map((r: any) => ({
          id: r.id,
          reviewerName: r.profiles?.full_name || 'Anonymous',
          rating: r.rating,
          heading: r.heading || '',
          text: r.comment || '',
          date: new Date(r.created_at).toLocaleDateString(),
          images: r.images || [],
        })));
        // Fetch similar
        const { data: simData } = await fetchSimilarProducts(data.category, productId);
        setSimilarProducts(simData as SimilarProduct[]);
      }
      setLoading(false);
    });
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 pb-16 md:pb-0">
        <Header />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="animate-spin text-amber-500" size={32} />
        </div>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white text-gray-900 pb-16 md:pb-0">
        <Header />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-amber-600 hover:text-amber-600-light transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <div className="mt-10 bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
            <h1 className="text-2xl font-semibold mb-3">Product not found</h1>
            <p className="text-gray-500 text-sm">Please return to the catalog and try another item.</p>
          </div>
        </div>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const inStock = product.stock > 0;
  const convertedPrice = convertPrice(product.price, product.currency || 'INR');
  const originalPrice = product.mrp && product.mrp > product.price
    ? convertPrice(product.mrp, product.currency || 'INR')
    : convertedPrice;
  const discountPercent = product.mrp && product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !productId) return;
    setSubmittingReview(true);
    const { error } = await submitReview({
      product_id: productId,
      user_id: user.id,
      rating: reviewFormData.rating,
      heading: reviewFormData.heading,
      comment: reviewFormData.text,
    });
    setSubmittingReview(false);
    if (error) {
      alert('Failed to submit review: ' + error);
    } else {
      alert('Review submitted successfully!');
      setIsReviewModalOpen(false);
      setReviewFormData({ rating: 0, heading: '', text: '' });
      // Refresh reviews
      const { data: revData } = await fetchProductReviews(productId);
      setReviews((revData || []).map((r: any) => ({
        id: r.id,
        reviewerName: r.profiles?.full_name || 'Anonymous',
        rating: r.rating,
        heading: r.heading || '',
        text: r.comment || '',
        date: new Date(r.created_at).toLocaleDateString(),
        images: r.images || [],
      })));
    }
  };

  const getStockStatus = () => {
    if (!inStock) return { label: 'Out Of Stock', color: 'text-red-500' };
    if (product.stock < 10) return { label: 'Limited Stock', color: 'text-blue-500' };
    return { label: 'In Stock', color: 'text-green-500' };
  };

  const stockStatus = getStockStatus();

  // Use real images array, fallback to single image repeated
  const galleryImages = product.images && product.images.length > 0
    ? product.images.slice(0, 5)
    : [product.image_url, product.image_url, product.image_url, product.image_url, product.image_url];

  // Get size variants from product data
  const sizeVariants = (product.product_variants || [])
    .filter((v: any) => v.variant_type === 'size')
    .map((v: any) => v.size);
  const availableSizes = sizeVariants.length > 0 ? sizeVariants : ['Free Size'];

  const handleWishlistToggle = () => {
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 pb-24 md:pb-0 font-sans selection:bg-yellow-500 selection:text-black">
      <Header />

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 md:pt-8">
        {/* Category Breadcrumb */}
        <nav className="flex items-center gap-2 text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-8 md:mb-10 overflow-x-auto no-scrollbar whitespace-nowrap">
          <button onClick={() => navigate(-1)} className="hover:text-gray-900 transition-colors flex-shrink-0">
            Home
          </button>
          <ChevronRight size={10} className="shrink-0" />
          <span className="hover:text-gray-900 transition-colors cursor-pointer flex-shrink-0">{product.category}</span>
          <ChevronRight size={10} className="shrink-0" />
          <span className="text-yellow-500 flex-shrink-0">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-start">
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-6 space-y-4 md:space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="aspect-square bg-[#0a0a0a] rounded-3xl overflow-hidden border border-gray-900 relative group">
              <img
                src={galleryImages[activeImage]}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/600x600/1f2937/f59e0b?text=Product';
                }}
              />
              <button
                onClick={handleWishlistToggle}
                className={`absolute top-6 right-6 p-4 bg-white/40 backdrop-blur-md rounded-full transition-all border border-white/10 ${
                  inWishlist ? 'text-red-500' : 'text-gray-900 hover:text-red-500'
                }`}
              >
                <Heart size={20} className={inWishlist ? 'fill-red-500' : ''} />
              </button>
            </div>

            {/* Gallery Thumbnails */}
            <div className="grid grid-cols-5 gap-3 md:gap-4">
              {galleryImages.slice(0, 5).map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all p-1 bg-[#0a0a0a] ${
                    activeImage === i ? 'border-yellow-500' : 'border-gray-900 opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={img} className="w-full h-full object-cover rounded-xl" alt={`Gallery ${i}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Product Info */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="border-b border-gray-900 pb-6 md:pb-8 mb-6 md:mb-8">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 md:mb-4">{product.brand || 'Premium Brand'}</p>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-4 md:mb-6 leading-tight uppercase">{product.name}</h1>

              <div className="flex flex-wrap items-center gap-4 md:gap-8 mb-6 md:mb-8">
                <div className="flex items-center gap-2 bg-yellow-500/10 px-3 py-1.5 rounded-lg border border-yellow-500/20">
                  <Star size={16} className="fill-yellow-500 text-yellow-500" />
                  <span className="text-sm font-bold text-yellow-500">{product.rating || 4.5}</span>
                </div>
                <span className="text-xs font-semibold text-gray-500 tracking-wider underline underline-offset-4 cursor-pointer hover:text-gray-900 transition-colors">
                  {product.review_count || reviews.length} Reviews
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${stockStatus.color}`}>
                  {stockStatus.label}
                </span>
              </div>

              {!inStock && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-xs font-bold">
                  <Info size={16} /> This Product Is Currently Out Of Stock.
                </div>
              )}

              <div className="flex items-end gap-5 flex-wrap">
                <span className="text-4xl md:text-5xl font-semibold text-gray-900 tracking-tight">
                  {formatCurrency(convertedPrice, currency)}
                </span>
                <div className="flex flex-col mb-1">
                  <span className="text-base md:text-lg text-gray-600 line-through font-medium leading-none mb-1">
                    {formatCurrency(originalPrice, currency)}
                  </span>
                  <div className="flex items-center gap-3 flex-wrap">
                    {discountPercent > 0 && (
                      <span className="bg-red-600 text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        Save {discountPercent}%
                      </span>
                    )}
                    <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Inclusive Of All Taxes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8 md:mb-10">
              <TrustItem icon={<ShieldCheck size={20} />} label="Top Brand" />
              <TrustItem icon={<CreditCard size={20} />} label="Secure Payment" />
              <TrustItem icon={<Truck size={20} />} label="Easy Returns" />
            </div>

            {/* Selection Area */}
            <div className="space-y-6 md:space-y-8 mb-10 md:mb-12">
              {/* Size Selection */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-semibold">Select Size</h3>
                  <button className="text-[9px] font-bold text-yellow-500 uppercase hover:underline">Size Guide</button>
                </div>
                <div className="flex flex-wrap gap-2 md:gap-3">
                  {availableSizes.map((size: string) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs font-bold transition-all border ${
                        selectedSize === size
                          ? 'bg-white text-black border-white shadow-lg'
                          : 'bg-[#0a0a0a] text-gray-500 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5 mb-10 md:mb-12">
              <button
                onClick={() => {
                  if (!user) {
                    navigate('/login');
                    return;
                  }
                  addToCart(product);
                }}
                className="w-full bg-white text-black font-semibold py-4 md:py-5 rounded-2xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs hover:bg-gray-100 active:scale-[0.98]"
              >
                <ShoppingCart size={18} /> Add To Cart
              </button>
              <button
                disabled={!inStock}
                onClick={() => {
                  if (!user) {
                    navigate('/login');
                    return;
                  }
                  addToCart(product);
                  navigate('/cart');
                }}
                className="w-full bg-yellow-500 disabled:opacity-30 text-black font-semibold py-4 md:py-5 rounded-2xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs hover:bg-yellow-400 active:scale-[0.98] shadow-lg shadow-yellow-500/20"
              >
                <CreditCard size={18} /> Buy Now
              </button>
            </div>

            {/* Product Details Section */}
            <div className="bg-[#0a0a0a] border border-gray-900 rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 mb-8 md:mb-10">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 md:mb-6 font-semibold">Product Details</h3>
              <ul className="space-y-3 md:space-y-4">
                {product.highlights && product.highlights.length > 0 ? (
                  product.highlights.map((h: string, i: number) => (
                    <li key={i} className="flex items-start gap-4 text-sm text-gray-600 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 shrink-0" />
                      {h}
                    </li>
                  ))
                ) : product.description ? (
                  <li className="flex items-start gap-4 text-sm text-gray-600 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 shrink-0" />
                    {product.description}
                  </li>
                ) : (
                  <li className="flex items-start gap-4 text-sm text-gray-600 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 shrink-0" />
                    Premium quality product
                  </li>
                )}
              </ul>
            </div>

            {/* Additional Information */}
            <div className="bg-[#0a0a0a] border border-gray-900 rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 mb-8 md:mb-10">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 md:mb-6 font-semibold">Additional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 md:gap-y-6">
                <InfoRow label="Brand Name" value={product.brand || 'N/A'} />
                <InfoRow label="Category" value={product.category} />
                <InfoRow label="In Stock" value={inStock ? 'Yes' : 'No'} />
                <InfoRow label="Manufacturer" value={product.manufacturer_name || 'N/A'} />
              </div>
            </div>

            {/* Seller Details Section */}
            <div className="bg-[#0a0a0a] border border-gray-900 rounded-2xl md:rounded-[2.5rem] p-6 md:p-10">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 md:mb-6 font-semibold">Seller Details</h3>
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin size={18} className="text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-1">Sold by {product.brand || 'BeauZead Store'}</p>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">{product.manufacturer_address || 'Address not available'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center shrink-0">
                    <Mail size={18} className="text-yellow-500" />
                  </div>
                  <p className="text-xs text-gray-500 font-medium underline cursor-pointer hover:text-gray-900 transition-colors">
                    Contact Seller
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <section className="mt-16 md:mt-32 pt-12 md:pt-20 border-t border-gray-900">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8 mb-12 md:mb-16">
            <div>
              <h2 className="text-2xl md:text-4xl font-semibold mb-2 md:mb-2 uppercase">Reviews & Ratings</h2>
              <div className="flex items-center gap-4 mt-4 md:mt-0">
                <div className="flex items-center text-yellow-500">
                  <Star className="fill-yellow-500" size={20} />
                  <span className="text-2xl md:text-3xl font-semibold ml-2">{product.rating || 4.5}</span>
                </div>
                <div className="h-8 md:h-10 w-px bg-gray-50" />
                <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest font-semibold">
                  {product.review_count || reviews.length} Total Reviews
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="bg-white text-black font-bold px-8 md:px-10 py-3 md:py-4 rounded-full text-[10px] uppercase tracking-widest hover:bg-yellow-500 transition-all active:scale-95 shadow-lg font-semibold w-full sm:w-auto"
            >
              Write A Review
            </button>
          </div>

          <div className="space-y-8 md:space-y-12 mb-12 md:mb-20">
            {reviews.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No reviews yet. Be the first to review!</div>
            ) : reviews.map((review) => (
              <div key={review.id} className="bg-[#0a0a0a] border border-gray-900 rounded-3xl md:rounded-[3rem] p-6 md:p-10 lg:p-12 relative group overflow-hidden">
                <div className="flex flex-col md:flex-row gap-8 md:gap-12 relative z-10">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4 md:mb-6">
                      <div className="w-12 h-12 bg-gray-50 rounded-full border border-gray-200 flex items-center justify-center text-yellow-500 font-bold text-sm flex-shrink-0">
                        {review.reviewerName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{review.reviewerName}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex gap-0.5 text-yellow-500">
                            {[...Array(5)].map((_, j) => (
                              <Star
                                key={j}
                                size={10}
                                className={j < review.rating ? 'fill-yellow-500' : 'text-gray-800'}
                              />
                            ))}
                          </div>
                          <span className="text-[9px] font-bold text-gray-600 uppercase font-semibold">{review.date}</span>
                        </div>
                      </div>
                    </div>
                    <h5 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 uppercase">{review.heading}</h5>
                    <p className="text-gray-500 text-sm leading-relaxed mb-6 md:mb-8 font-medium">{review.text}</p>
                    <button className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest hover:underline font-semibold">
                      Helpful?
                    </button>
                  </div>
                  {review.images.length > 0 && (
                    <div className="w-full md:w-48 lg:w-64 shrink-0">
                      <div className="relative group/carousel">
                        <img
                          src={review.images[0]}
                          className="w-full aspect-square rounded-2xl md:rounded-[2rem] object-cover border border-gray-200"
                          alt="Review"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/300x300/1f2937/f59e0b?text=Review';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button className="bg-transparent border border-gray-200 hover:border-white text-gray-500 hover:text-gray-900 px-8 md:px-12 py-3 md:py-4 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all font-semibold">
              See More Reviews
            </button>
          </div>
        </section>

        {/* Similar Products Section */}
        <section className="mt-16 md:mt-32 pb-12 md:pb-20">
          <h2 className="text-xl md:text-2xl font-semibold mb-8 md:mb-12 uppercase tracking-widest border-l-4 border-yellow-500 pl-4 md:pl-6">
            Similar Products
          </h2>
          {similarProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No similar products found.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {similarProducts.map((item) => (
                <div
                  key={item.id}
                  onClick={() => { navigate(`/products/${item.id}`); window.scrollTo(0, 0); }}
                  className="group bg-[#0a0a0a] border border-gray-900 rounded-2xl md:rounded-[2rem] overflow-hidden hover:border-yellow-500/40 transition-all cursor-pointer"
                >
                  <div className="aspect-square bg-gray-50 overflow-hidden">
                    <img
                      src={item.image_url || `https://via.placeholder.com/300x300/1f2937/f59e0b?text=Product`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                      alt={item.name}
                      onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/300x300/1f2937/f59e0b?text=Product'; }}
                    />
                  </div>
                  <div className="p-3 md:p-6">
                    <p className="text-[9px] font-bold text-yellow-500 uppercase mb-1 md:mb-2 font-semibold">{item.brand || 'Brand'}</p>
                    <h4 className="text-xs font-semibold text-gray-900 line-clamp-1 group-hover:text-yellow-500 transition-colors uppercase">
                      {item.name}
                    </h4>
                    <p className="text-sm font-bold text-gray-900 mt-2 md:mt-3 font-semibold">
                      {formatCurrency(convertPrice(item.price, item.currency || 'INR'), currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Review Modal Dialog */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-[10002] bg-white/95 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d0d0d] border border-gray-200 w-full max-w-lg rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 relative animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute top-6 md:top-8 right-6 md:right-8 text-gray-500 hover:text-gray-900 transition-colors"
            >
              <X size={24} />
            </button>

            {!user ? (
              <div className="text-center py-6 md:py-8">
                <div className="w-16 md:w-20 h-16 md:h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8">
                  <Lock size={24} className="text-yellow-500" />
                </div>
                <h3 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4 uppercase">Authentication Required</h3>
                <p className="text-gray-500 text-xs md:text-sm font-medium mb-8 md:mb-10">
                  Please Log In To Your Account To Share Your Experience With This Product.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-white text-black font-bold py-3 md:py-4 rounded-xl text-xs uppercase tracking-widest shadow-lg font-semibold hover:bg-gray-100 transition-all"
                >
                  Log In To Continue
                </button>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-6 md:space-y-8">
                <div className="text-center">
                  <h3 className="text-xl md:text-2xl font-semibold mb-2 uppercase">Write A Product Review</h3>
                  <p className="text-gray-500 text-xs md:text-sm font-medium">Share Your Expert Opinion With The Community.</p>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block ml-1 font-semibold">
                    Star Rating
                  </label>
                  <div className="flex gap-2 justify-center py-3 md:py-4 bg-white/40 rounded-2xl border border-gray-900">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewFormData({ ...reviewFormData, rating: star })}
                        className={`transition-all ${
                          reviewFormData.rating >= star
                            ? 'text-yellow-500 scale-110'
                            : 'text-gray-800 hover:text-gray-600'
                        }`}
                      >
                        <Star
                          size={22}
                          className={reviewFormData.rating >= star ? 'fill-yellow-500' : ''}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block ml-1 font-semibold">
                    Review Heading
                  </label>
                  <input
                    maxLength={120}
                    required
                    placeholder="Briefly Summarize Your Experience"
                    value={reviewFormData.heading}
                    onChange={(e) => setReviewFormData({ ...reviewFormData, heading: e.target.value })}
                    className="w-full bg-white border border-gray-900 rounded-xl px-4 py-3 text-sm text-gray-900 focus:border-yellow-500 outline-none transition-all"
                  />
                  <p className="text-right text-[8px] font-bold text-gray-700 uppercase font-semibold">
                    {reviewFormData.heading.length}/120
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block ml-1 font-semibold">
                    Your Perspective
                  </label>
                  <textarea
                    maxLength={500}
                    required
                    rows={4}
                    placeholder="Tell Us What You Liked Or Disliked About This Product"
                    value={reviewFormData.text}
                    onChange={(e) => setReviewFormData({ ...reviewFormData, text: e.target.value })}
                    className="w-full bg-white border border-gray-900 rounded-xl px-4 py-3 text-sm text-gray-900 focus:border-yellow-500 outline-none transition-all resize-none"
                  />
                  <p className="text-right text-[8px] font-bold text-gray-700 uppercase font-semibold">
                    {reviewFormData.text.length}/500
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submittingReview || reviewFormData.rating === 0}
                  className="w-full bg-yellow-500 text-black font-bold py-4 md:py-5 rounded-2xl text-xs uppercase tracking-widest shadow-lg active:scale-[0.98] font-semibold hover:bg-yellow-400 transition-all disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Official Review'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
      <MobileNav />
    </div>
  );
};

const TrustItem = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="flex flex-col items-center justify-center p-4 md:p-6 bg-[#0a0a0a] border border-gray-900 rounded-2xl md:rounded-3xl group hover:border-yellow-500/30 transition-all">
    <div className="text-yellow-500 mb-2 md:mb-3 group-hover:scale-110 transition-transform">{icon}</div>
    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest text-center font-semibold">
      {label}
    </span>
  </div>
);

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-1 font-semibold">{label}</p>
    <p className="text-xs font-semibold text-gray-600">{value}</p>
  </div>
);

export default ProductDetailsPage;
