import React, { useEffect, useState } from 'react';
import { Loading, ErrorMessage } from '../components/StatusIndicators';
import { Flag, Trash2 } from 'lucide-react';
import type { Review } from '../../../types';
import { logger } from '../../../utils/logger';
import * as adminApiService from '../../../lib/adminService';

interface PaginationState {
  page: number;
  limit: number;
  total: number;
}

export const ReviewManagement: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [pagination.page]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const result = await adminApiService.getAllReviews({
        limit: pagination.limit,
        offset: (pagination.page - 1) * pagination.limit,
      });
      if (result) {
        setReviews(result.reviews);
        setPagination((prev) => ({ ...prev, total: result.total }));
        setError(null);
      }
    } catch (err) {
      setError('Failed to load reviews');
      logger.error(err as Error, { context: 'Review management error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFlagReview = async (reviewId: string) => {
    try {
      setActionLoading(reviewId);
      const success = await adminApiService.flagReview(reviewId);
      if (success) {
        fetchReviews();
      }
    } catch (err) {
      setError('Failed to flag review');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      setActionLoading(reviewId);
      const success = await adminApiService.deleteReview(reviewId);
      if (success) {
        fetchReviews();
      }
    } catch (err) {
      setError('Failed to delete review');
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  if (loading) return <Loading message="Loading reviews..." />;

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex gap-2">
          <ErrorMessage message={error} />
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <h2 className="text-xl font-bold text-gray-900">Reviews & Ratings</h2>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Product</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">User</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Rating</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Comment</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Verified</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{review.product_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{review.user_id}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {review.rating} ⭐
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{review.comment}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        review.is_verified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {review.is_verified ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleFlagReview(review.id)}
                          disabled={actionLoading === review.id}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg disabled:opacity-50"
                        >
                          <Flag size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          disabled={actionLoading === review.id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No reviews found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow p-4">
          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={pagination.page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {totalPages}
          </span>
          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
            disabled={pagination.page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewManagement;
