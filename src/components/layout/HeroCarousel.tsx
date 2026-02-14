import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const banners = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  image: `/images/banners/banner${i + 1}.png`,
  alt: `Banner ${i + 1}`,
}));

export const HeroCarousel: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000); // Auto-play every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  return (
    <div className="relative w-full bg-white my-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-xl w-full shadow-sm" style={{ aspectRatio: '16/3', minHeight: '120px' }}>
          {/* Banners */}
          <div
            className="flex transition-transform duration-500 ease-in-out w-full h-full"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {banners.map((banner) => (
              <div key={banner.id} className="w-full flex-shrink-0 h-full">
                <img
                  src={banner.image}
                  alt={banner.alt}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to placeholder
                    e.currentTarget.src = `https://via.placeholder.com/1500x150/f3f4f6/f59e0b?text=Banner+${banner.id}`;
                  }}
                />
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm text-gray-700 rounded-full hover:bg-white shadow-sm transition-all z-10"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm text-gray-700 rounded-full hover:bg-white shadow-sm transition-all z-10"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentSlide ? 'bg-amber-500 w-6' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
