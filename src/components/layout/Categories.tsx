import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchCategories } from '../../lib/productService';

interface CategoryItem {
  id: string;
  name: string;
  image_url?: string;
}

export const Categories: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  useEffect(() => {
    fetchCategories().then(({ data }) => {
      setCategories(data.map((c: any) => ({ id: c.id, name: c.name, image_url: c.image_url })));
    });
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="bg-white py-3 sm:py-6 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h2 className="text-base sm:text-lg font-bold text-black">Shop by Category</h2>
          <div className="flex space-x-1.5">
            <button
              onClick={() => scroll('left')}
              className="p-1.5 bg-white border border-gray-100 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-1.5 bg-white border border-gray-100 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex space-x-4 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/category/${category.id}`}
              className="flex-shrink-0 cursor-pointer group"
            >
              <div className="bg-white border border-gray-100 rounded-full px-4 py-2 hover:border-amber-400 transition-all duration-200 group-hover:scale-105 shadow-sm whitespace-nowrap">
                <span className="text-xs sm:text-sm text-black font-medium">
                  {category.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
