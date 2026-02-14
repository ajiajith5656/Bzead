import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

// ============ TYPES ============

export interface SizeVariant {
  id: string;
  size: string;
  quantity: number;
  stock: number;
  price: number;
}

export interface ColorVariant {
  id: string;
  color: string;
  sku: string;
  price: number;
  stock: number;
}

export interface DeliveryCountry {
  id: string;
  countryCode: string;
  countryName: string;
  deliveryCharge: number;
  minOrderQty: number;
}

export interface OfferRule {
  id: string;
  type: 'buy_x_get_y' | 'special_day' | 'hourly' | 'bundle';
  buyQuantity?: number;
  getQuantity?: number;
  specialDayName?: string;
  discountPercent?: number;
  startTime?: string;
  endTime?: string;
  bundleMinQty?: number;
  bundleDiscount?: number;
  isActive: boolean;
}

export interface Specification {
  id: string;
  key: string;
  value: string;
}

// ============ STEP DATA INTERFACES ============

export interface Step1Data {
  categoryId: string;
  subCategoryId: string;
  productTypeId: string;
  productTitle: string;
  brandName: string;
  modelNumber: string;
  shortDescription: string;
  stock: number;
  sizeApplicable: boolean;
  colorApplicable: boolean;
  sizeVariants: SizeVariant[];
  colorVariants: ColorVariant[];
}

export interface Step2Data {
  images: File[];
  imageUrls: string[];
  videos: File[];
  videoUrls: string[];
}

export interface Step3Data {
  highlights: string[];
  fullDescription: string;
  specifications: Specification[];
  sellerNotes: string[];
}

export interface Step4Data {
  countryCode: string;
  mrp: number;
  sellingPrice: number;
  stockQuantity: number;
  gstRate: number;
  platformFee: number; // 7.5% auto
  commission: number; // 0.5% auto
  deliveryCountries: DeliveryCountry[];
}

export interface Step5Data {
  packageWeight: number;
  packageLength: number;
  packageWidth: number;
  packageHeight: number;
  shippingType: 'self' | 'platform';
  manufacturerName: string;
  manufacturerAddress: string;
  packingDetails: string;
  courierPartner: string;
  cancellationPolicyDays: number;
  returnPolicyDays: number;
}

export interface Step6Data {
  offerRules: OfferRule[];
}

export interface ProductListingData {
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
  step4: Step4Data;
  step5: Step5Data;
  step6: Step6Data;
}

// ============ CONTEXT INTERFACE ============

interface ProductListingContextType {
  currentStep: number;
  productData: ProductListingData;
  setCurrentStep: (step: number) => void;
  updateStep1: (data: Partial<Step1Data>) => void;
  updateStep2: (data: Partial<Step2Data>) => void;
  updateStep3: (data: Partial<Step3Data>) => void;
  updateStep4: (data: Partial<Step4Data>) => void;
  updateStep5: (data: Partial<Step5Data>) => void;
  updateStep6: (data: Partial<Step6Data>) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  resetForm: () => void;
  isStepValid: (step: number) => boolean;
  getSubmitData: () => object;
}

// ============ INITIAL STATE ============

const initialStep1: Step1Data = {
  categoryId: '',
  subCategoryId: '',
  productTypeId: '',
  productTitle: '',
  brandName: '',
  modelNumber: '',
  shortDescription: '',
  stock: 0,
  sizeApplicable: false,
  colorApplicable: false,
  sizeVariants: [],
  colorVariants: [],
};

const initialStep2: Step2Data = {
  images: [],
  imageUrls: [],
  videos: [],
  videoUrls: [],
};

const initialStep3: Step3Data = {
  highlights: [],
  fullDescription: '',
  specifications: [],
  sellerNotes: [],
};

const initialStep4: Step4Data = {
  countryCode: '',
  mrp: 0,
  sellingPrice: 0,
  stockQuantity: 0,
  gstRate: 0,
  platformFee: 7.5,
  commission: 0.5,
  deliveryCountries: [],
};

const initialStep5: Step5Data = {
  packageWeight: 0,
  packageLength: 0,
  packageWidth: 0,
  packageHeight: 0,
  shippingType: 'self',
  manufacturerName: '',
  manufacturerAddress: '',
  packingDetails: '',
  courierPartner: '',
  cancellationPolicyDays: 7,
  returnPolicyDays: 7,
};

const initialStep6: Step6Data = {
  offerRules: [],
};

const initialProductData: ProductListingData = {
  step1: initialStep1,
  step2: initialStep2,
  step3: initialStep3,
  step4: initialStep4,
  step5: initialStep5,
  step6: initialStep6,
};

// ============ CONTEXT ============

const ProductListingContext = createContext<ProductListingContextType | undefined>(undefined);

export const ProductListingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [productData, setProductData] = useState<ProductListingData>(initialProductData);

  const updateStep1 = useCallback((data: Partial<Step1Data>) => {
    setProductData(prev => ({
      ...prev,
      step1: { ...prev.step1, ...data },
    }));
  }, []);

  const updateStep2 = useCallback((data: Partial<Step2Data>) => {
    setProductData(prev => ({
      ...prev,
      step2: { ...prev.step2, ...data },
    }));
  }, []);

  const updateStep3 = useCallback((data: Partial<Step3Data>) => {
    setProductData(prev => ({
      ...prev,
      step3: { ...prev.step3, ...data },
    }));
  }, []);

  const updateStep4 = useCallback((data: Partial<Step4Data>) => {
    setProductData(prev => ({
      ...prev,
      step4: { ...prev.step4, ...data },
    }));
  }, []);

  const updateStep5 = useCallback((data: Partial<Step5Data>) => {
    setProductData(prev => ({
      ...prev,
      step5: { ...prev.step5, ...data },
    }));
  }, []);

  const updateStep6 = useCallback((data: Partial<Step6Data>) => {
    setProductData(prev => ({
      ...prev,
      step6: { ...prev.step6, ...data },
    }));
  }, []);

  const goToNextStep = useCallback(() => {
    if (currentStep < 6) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const resetForm = useCallback(() => {
    setCurrentStep(1);
    setProductData(initialProductData);
  }, []);

  const isStepValid = useCallback((step: number): boolean => {
    switch (step) {
      case 1: {
        const { categoryId, productTitle, brandName, shortDescription } = productData.step1;
        return !!(categoryId && productTitle.length >= 3 && brandName && shortDescription);
      }
      case 2: {
        return productData.step2.imageUrls.length >= 5 || productData.step2.images.length >= 5;
      }
      case 3: {
        return productData.step3.fullDescription.length > 0;
      }
      case 4: {
        const { mrp, sellingPrice, countryCode } = productData.step4;
        return mrp > 0 && sellingPrice > 0 && sellingPrice <= mrp && !!countryCode;
      }
      case 5: {
        const { packageWeight, shippingType } = productData.step5;
        return packageWeight > 0 && !!shippingType;
      }
      case 6:
        return true; // Optional step
      default:
        return false;
    }
  }, [productData]);

  const getSubmitData = useCallback(() => {
    return {
      // Basic Info
      categoryId: productData.step1.categoryId,
      subCategoryId: productData.step1.subCategoryId,
      productTypeId: productData.step1.productTypeId,
      name: productData.step1.productTitle,
      brandName: productData.step1.brandName,
      modelNumber: productData.step1.modelNumber,
      shortDescription: productData.step1.shortDescription,
      stock: productData.step1.stock,
      sizeVariants: productData.step1.sizeVariants,
      colorVariants: productData.step1.colorVariants,
      
      // Media
      images: productData.step2.imageUrls,
      videos: productData.step2.videoUrls,
      
      // Details
      highlights: productData.step3.highlights,
      description: productData.step3.fullDescription,
      specifications: productData.step3.specifications,
      sellerNotes: productData.step3.sellerNotes,
      
      // Pricing
      countryCode: productData.step4.countryCode,
      mrp: productData.step4.mrp,
      price: productData.step4.sellingPrice,
      stockQuantity: productData.step4.stockQuantity,
      gstRate: productData.step4.gstRate,
      platformFee: productData.step4.platformFee,
      commission: productData.step4.commission,
      deliveryCountries: productData.step4.deliveryCountries,
      
      // Shipping
      packageWeight: productData.step5.packageWeight,
      packageDimensions: {
        length: productData.step5.packageLength,
        width: productData.step5.packageWidth,
        height: productData.step5.packageHeight,
      },
      shippingType: productData.step5.shippingType,
      manufacturerName: productData.step5.manufacturerName,
      manufacturerAddress: productData.step5.manufacturerAddress,
      packingDetails: productData.step5.packingDetails,
      courierPartner: productData.step5.courierPartner,
      cancellationPolicyDays: productData.step5.cancellationPolicyDays,
      returnPolicyDays: productData.step5.returnPolicyDays,
      
      // Offers
      offerRules: productData.step6.offerRules,
      
      // Meta
      createdAt: new Date().toISOString(),
      approvalStatus: 'pending',
      isActive: false,
    };
  }, [productData]);

  return (
    <ProductListingContext.Provider
      value={{
        currentStep,
        productData,
        setCurrentStep,
        updateStep1,
        updateStep2,
        updateStep3,
        updateStep4,
        updateStep5,
        updateStep6,
        goToNextStep,
        goToPreviousStep,
        resetForm,
        isStepValid,
        getSubmitData,
      }}
    >
      {children}
    </ProductListingContext.Provider>
  );
};

export const useProductListing = () => {
  const context = useContext(ProductListingContext);
  if (!context) {
    throw new Error('useProductListing must be used within a ProductListingProvider');
  }
  return context;
};

export default ProductListingContext;
