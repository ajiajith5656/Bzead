import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Upload, Send, Loader2, Package, AlertCircle } from 'lucide-react';
import logger from '../../utils/logger';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { fetchProductById } from '../../lib/productService';
import { createReview } from '../../lib/adminService';
import { supabase } from '../../lib/supabase';

interface Product {
  id: string;
  name: string;
  image_url?: string;
  price: number;
  currency?: string;
  images?: string[];
}

export const WriteReview: React.FC = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user, currentAuthUser } = useAuth();
  const { formatPrice } = useCurrency();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [review, setReview] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [benefits, setBenefits] = useState<string[]>([]);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // Fetch product data on mount
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setError('Product ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await fetchProductById(productId);
        const productData = result.data;

        if (productData) {
          setProduct(productData as Product);
        } else {
          setError('Product not found');
        }
      } catch (error) {
        logger.error(error as Error, { context: 'Failed to fetch product for review' });
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      // Limit to 5 images
      if (files.length + images.length > 5) {
        alert('Maximum 5 images allowed');
        return;
      }
      // Check file size (max 5MB each)
      const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        alert('Some images exceed 5MB. Please choose smaller files.');
        return;
      }
      setImages([...images, ...files]);
    }
  };

  const handleBenefitToggle = (benefit: string) => {
    setBenefits(prev => 
      prev.includes(benefit) 
        ? prev.filter(b => b !== benefit)
        : [...prev, benefit]
    );
  };

  const uploadReviewImages = async (): Promise<string[]> => {
    if (images.length === 0) return [];

    try {
      const uploadPromises = images.map(async (file, index) => {
        const timestamp = Date.now();
        const fileName = `${productId}-${timestamp}-${index}-${file.name}`;
        const path = `reviews/${fileName}`;

        const { error } = await supabase.storage
          .from('product-images')
          .upload(path, file, { contentType: file.type });
        
        if (error) throw error;

        const { data } = supabase.storage.from('product-images').getPublicUrl(path);
        return data.publicUrl;
      });

      return await Promise.all(uploadPromises);
    } catch (error) {
      logger.error(error as Error, { context: 'Failed to upload review images' });
      throw new Error('Failed to upload images');
    }
  };

  const handleSubmitReview = async () => {
    // Validation
    if (!rating || !title.trim() || !review.trim()) {
      alert('Please fill all required fields: Rating, Title, and Review');
      return;
    }

    if (!agreeToTerms) {
      alert('Please agree to the terms before submitting');
      return;
    }

    const userId = user?.id || currentAuthUser?.username;
    if (!userId) {
      alert('You must be logged in to submit a review');
      navigate('/login');
      return;
    }

    if (!productId) {
      alert('Product ID is missing');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Upload images first (if any)
      const uploadedImageUrls = await uploadReviewImages();

      // Submit review to Supabase
      const reviewInput = {
        product_id: productId,
        user_id: userId,
        rating: rating,
        title: title.trim(),
        comment: review.trim(),
        images: uploadedImageUrls,
      };

      const result = await createReview(reviewInput);

      if (result.data) {
        logger.log('Review submitted successfully', {
          reviewId: result.data.id,
          productId,
          rating,
        });
        alert('Review submitted successfully! Thank you for your feedback.');
        navigate(`/products/${productId}`);
      } else {
        throw new Error(result.error || 'Failed to create review');
      }
    } catch (error) {
      logger.error(error as Error, { context: 'Error submitting review' });
      setError('Failed to submit review. Please try again.');
      alert('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <span className="text-lg text-gray-700">Loading product details...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Product</h2>
            <p className="text-gray-600 mb-6">{error || 'Product not found'}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 text-gray-900 px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Write a Review</h1>
          <p className="text-gray-600 mt-2">Share your experience with this product</p>
        </div>

        {/* Product Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex gap-6">
            {product.image_url || (product.images && product.images.length > 0) ? (
              <img
                src={product.image_url || product.images![0]}
                alt={product.name}
                className="w-32 h-32 object-cover rounded-lg"
              />
            ) : (
              <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                <Package className="h-12 w-12 text-gray-500" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
              <p className="text-gray-600 mt-2">Product ID: {product.id}</p>
              <p className="text-lg font-semibold text-gray-900 mt-4">{formatPrice(product.price, product.currency)}</p>
            </div>
          </div>
        </div>

        {/* Review Form */}
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-4">
              Rating *
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-12 h-12 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="mt-2 text-gray-600">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Review Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your review in a few words"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={100}
            />
            <p className="text-gray-500 text-sm mt-1">{title.length}/100 characters</p>
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your Review *
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your detailed experience with this product..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={6}
              maxLength={5000}
            />
            <p className="text-gray-500 text-sm mt-1">{review.length}/5000 characters</p>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Add Photos (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <p className="text-gray-600 mb-2">
                Drag and drop your images here or click to select
              </p>
              <p className="text-gray-500 text-sm mb-4">
                Supported formats: JPG, PNG | Max 5 images | Max 5MB each
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="inline-block bg-blue-600 text-gray-900 px-6 py-2 rounded-lg hover:bg-blue-700 transition cursor-pointer"
              >
                Select Images
              </label>
            </div>

            {/* Preview Images */}
            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => setImages(images.filter((_, i) => i !== index))}
                      className="absolute top-2 right-2 bg-red-600 text-gray-900 w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Benefits Checkboxes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              What are the benefits? (Optional)
            </label>
            <div className="space-y-2">
              {['Value for Money', 'Quality', 'Durability', 'Design', 'Performance'].map((benefit) => (
                <label key={benefit} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={benefits.includes(benefit)}
                    onChange={() => handleBenefitToggle(benefit)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-gray-700">{benefit}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Terms */}
          <div className="bg-gray-50 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="w-4 h-4 mt-1"
                required
              />
              <span className="text-sm text-gray-600">
                I confirm that this review is based on my own experience and is my genuine opinion.
                I understand that false or misleading reviews may result in account suspension.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              onClick={() => navigate(`/products/${productId}`)}
              disabled={isSubmitting}
              className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitReview}
              disabled={isSubmitting || !agreeToTerms}
              className="flex-1 bg-blue-600 text-gray-900 py-3 rounded-lg hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Review
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WriteReview;
