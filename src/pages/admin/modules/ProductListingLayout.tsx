import React from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { ProductListingProvider, useProductListing } from '../../../contexts/ProductListingContext';
import { ChevronLeft, Check } from 'lucide-react';

const stepLabels = [
  'Basic Info',
  'Photos & Videos',
  'Detailed Info',
  'Pricing Plan',
  'Shipping & Policies',
  'Offer Rules',
];

const StepIndicator: React.FC = () => {
  const { currentStep, setCurrentStep, isStepValid } = useProductListing();

  return (
    <div className="flex items-center justify-between mb-8">
      {stepLabels.map((label, index) => {
        const stepNumber = index + 1;
        const isActive = currentStep === stepNumber;
        const isCompleted = isStepValid(stepNumber) && currentStep > stepNumber;
        const isClickable = stepNumber < currentStep || isStepValid(currentStep);

        return (
          <React.Fragment key={stepNumber}>
            <button
              onClick={() => isClickable && setCurrentStep(stepNumber)}
              disabled={!isClickable}
              className={`flex flex-col items-center ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-gray-900'
                    : isCompleted
                    ? 'bg-green-500 text-gray-900'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {isCompleted ? <Check size={18} /> : stepNumber}
              </div>
              <span
                className={`mt-2 text-xs font-medium text-center ${
                  isActive ? 'text-black' : 'text-gray-500'
                }`}
              >
                {label}
              </span>
            </button>
            {index < stepLabels.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 rounded ${
                  currentStep > stepNumber ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const ProductListingLayoutContent: React.FC = () => {
  const navigate = useNavigate();
  const { currentStep, resetForm } = useProductListing();

  const handleBack = () => {
    if (currentStep === 1) {
      if (confirm('Are you sure you want to go back? Your progress will be lost.')) {
        resetForm();
        navigate('/admin/products');
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-600">Step {currentStep} of 6</p>
        </div>
      </div>

      {/* Step Indicator */}
      <StepIndicator />

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <Outlet />
      </div>
    </div>
  );
};

export const ProductListingLayout: React.FC = () => {
  return (
    <ProductListingProvider>
      <ProductListingLayoutContent />
    </ProductListingProvider>
  );
};

export default ProductListingLayout;
