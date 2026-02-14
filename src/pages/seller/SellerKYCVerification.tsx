import React, { useState, useEffect } from 'react';
import { logger } from '../../utils/logger';
import { supabase } from '../../lib/supabase';
import {
  ChevronRight,
  ChevronLeft,
  Upload,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText,
  Landmark,
  Shield,
  Home,
} from 'lucide-react';
import type { SellerKYC, UserAddress } from '../../types';
import { submitCompleteKYC } from '../../lib/kycService';

interface KYCStep {
  number: 1 | 2 | 3 | 4 | 5;
  title: string;
  description: string;
}

const KYC_STEPS: KYCStep[] = [
  {
    number: 1,
    title: 'Tax Information',
    description: 'Provide your PAN and GST details',
  },
  {
    number: 2,
    title: 'Identity Verification',
    description: 'Upload your identity proof document',
  },
  {
    number: 3,
    title: 'Business Address',
    description: 'Confirm your business address and upload proof',
  },
  {
    number: 4,
    title: 'Bank Details',
    description: 'Provide banking information for payouts',
  },
  {
    number: 5,
    title: 'Compliance',
    description: 'Review and accept terms',
  },
];

interface KYCFormData {
  // Tax Info
  pan: string;
  gstin: string;

  // Identity
  id_type: 'aadhar' | 'passport' | 'voter' | 'driver_license';
  id_number: string;
  id_document_file: File | null;

  // Address
  business_address: UserAddress;
  address_proof_file: File | null;

  // Bank
  bank_holder_name: string;
  account_number: string;
  account_type: 'checking' | 'savings' | 'current';
  ifsc_code: string;
  bank_statement_file: File | null;

  // Compliance
  pep_declaration: boolean;
  sanctions_check: boolean;
  aml_compliance: boolean;
  tax_compliance: boolean;
  terms_accepted: boolean;
}

interface FormErrors {
  [key: string]: string;
}

interface SellerKYCVerificationProps {
  sellerEmail: string;
  sellerPhone: string;
  sellerFullName: string;
  sellerCountry: string;
  sellerId?: string;
  onSubmit?: (data: SellerKYC) => void;
  onCancel?: () => void;
}

const SellerKYCVerification: React.FC<SellerKYCVerificationProps> = ({
  sellerEmail,
  sellerPhone,
  sellerFullName,
  sellerCountry,
  sellerId,
  onSubmit,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [documentTypes, setDocumentTypes] = useState<{ value: string; label: string }[]>([
    { value: 'aadhar', label: 'Aadhar Card' },
    { value: 'passport', label: 'Passport' },
    { value: 'voter', label: 'Voter ID' },
    { value: 'driver_license', label: "Driver's License" },
  ]);

  useEffect(() => {
    const fetchDocTypes = async () => {
      const { data } = await supabase
        .from('document_types')
        .select('value, label')
        .eq('is_active', true)
        .order('display_order');
      if (data && data.length > 0) {
        setDocumentTypes(data.map((d: any) => ({ value: d.value, label: d.label })));
      }
    };
    fetchDocTypes();
  }, []);
  const [formData, setFormData] = useState<KYCFormData>({
    pan: '',
    gstin: '',
    id_type: 'aadhar',
    id_number: '',
    id_document_file: null,
    business_address: {
      id: `addr_${Date.now()}`,
      user_id: '',
      full_name: sellerFullName,
      phone_number: sellerPhone,
      email: sellerEmail,
      country: sellerCountry,
      street_address_1: '',
      street_address_2: '',
      city: '',
      state: '',
      postal_code: '',
      address_type: 'work',
      delivery_notes: '',
      is_default: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    address_proof_file: null,
    bank_holder_name: '',
    account_number: '',
    account_type: 'current',
    ifsc_code: '',
    bank_statement_file: null,
    pep_declaration: false,
    sanctions_check: false,
    aml_compliance: false,
    tax_compliance: false,
    terms_accepted: false,
  });

  // Validation helpers
  const validatePAN = (pan: string): boolean => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan.toUpperCase());
  };

  const validateGSTIN = (gstin: string): boolean => {
    if (!gstin) return true; // Optional field
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
  };

  const validateIFSC = (ifsc: string): boolean => {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return ifscRegex.test(ifsc);
  };

  const validateAccountNumber = (account: string): boolean => {
    return account.length >= 9 && account.length <= 18 && /^\d+$/.test(account);
  };

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.pan.trim()) {
      newErrors.pan = 'PAN is required';
    } else if (!validatePAN(formData.pan)) {
      newErrors.pan = 'Invalid PAN format (e.g., AAAPL5055K)';
    }

    if (formData.gstin.trim() && !validateGSTIN(formData.gstin)) {
      newErrors.gstin = 'Invalid GSTIN format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.id_number.trim()) {
      newErrors.id_number = `${formData.id_type} number is required`;
    }

    if (!formData.id_document_file) {
      newErrors.id_document_file = 'ID document upload is required';
    } else if (formData.id_document_file.size > 5 * 1024 * 1024) {
      newErrors.id_document_file = 'File size must be less than 5MB';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.business_address.street_address_1.trim()) {
      newErrors.street_address_1 = 'Street address is required';
    }

    if (!formData.business_address.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.business_address.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.business_address.postal_code.trim()) {
      newErrors.postal_code = 'Postal code is required';
    }

    if (!formData.address_proof_file) {
      newErrors.address_proof_file = 'Address proof upload is required';
    } else if (formData.address_proof_file.size > 5 * 1024 * 1024) {
      newErrors.address_proof_file = 'File size must be less than 5MB';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.bank_holder_name.trim()) {
      newErrors.bank_holder_name = 'Bank account holder name is required';
    }

    if (!formData.account_number.trim()) {
      newErrors.account_number = 'Account number is required';
    } else if (!validateAccountNumber(formData.account_number)) {
      newErrors.account_number = 'Invalid account number (9-18 digits)';
    }

    if (!formData.ifsc_code.trim()) {
      newErrors.ifsc_code = 'IFSC code is required';
    } else if (!validateIFSC(formData.ifsc_code)) {
      newErrors.ifsc_code = 'Invalid IFSC code format';
    }

    if (!formData.bank_statement_file) {
      newErrors.bank_statement_file = 'Bank statement upload is required';
    } else if (formData.bank_statement_file.size > 10 * 1024 * 1024) {
      newErrors.bank_statement_file = 'File size must be less than 10MB';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep5 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.pep_declaration) {
      newErrors.pep_declaration = 'You must declare PEP status';
    }

    if (!formData.sanctions_check) {
      newErrors.sanctions_check = 'You must confirm sanctions check';
    }

    if (!formData.aml_compliance) {
      newErrors.aml_compliance = 'You must accept AML compliance';
    }

    if (!formData.tax_compliance) {
      newErrors.tax_compliance = 'You must confirm tax compliance';
    }

    if (!formData.terms_accepted) {
      newErrors.terms_accepted = 'You must accept terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStepValidation = (): boolean => {
    switch (currentStep) {
      case 1:
        return validateStep1();
      case 2:
        return validateStep2();
      case 3:
        return validateStep3();
      case 4:
        return validateStep4();
      case 5:
        return validateStep5();
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (handleStepValidation()) {
      setCurrentStep(currentStep + 1);
      setErrors({});
      window.scrollTo(0, 0);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
    setErrors({});
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (!handleStepValidation()) {
      return;
    }

    setIsLoading(true);

    try {
      const kycData: SellerKYC = {
        id: `kyc_${Date.now()}`,
        seller_id: sellerId || '',
        email: sellerEmail,
        phone: sellerPhone,
        full_name: sellerFullName,
        country: sellerCountry,
        pan: formData.pan,
        gstin: formData.gstin || undefined,
        id_type: formData.id_type,
        id_number: formData.id_number,
        id_document_url: '',
        id_document_file: formData.id_document_file || undefined,
        business_address: formData.business_address,
        address_proof_url: '',
        address_proof_file: formData.address_proof_file || undefined,
        bank_holder_name: formData.bank_holder_name,
        account_number: formData.account_number,
        account_type: formData.account_type,
        ifsc_code: formData.ifsc_code,
        bank_statement_url: '',
        bank_statement_file: formData.bank_statement_file || undefined,
        pep_declaration: formData.pep_declaration,
        sanctions_check: formData.sanctions_check,
        aml_compliance: formData.aml_compliance,
        tax_compliance: formData.tax_compliance,
        terms_accepted: formData.terms_accepted,
        kyc_status: 'pending',
        kyc_tier: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        submitted_at: new Date().toISOString(),
      };

      // Submit to Supabase via KYC service
      const result = await submitCompleteKYC(kycData, sellerId || '');

      if (result.success) {
        // Call onSubmit callback if provided
        if (onSubmit) {
          onSubmit(kycData);
        }
        // Set success state (component will show success screen)
        setErrors({ submit: '' });
      } else {
        setErrors({ submit: result.error || 'Failed to submit KYC form. Please try again.' });
      }
    } catch (error) {
      logger.error(error as Error, { context: 'Error submitting KYC' });
      setErrors({
        submit: `Failed to submit KYC form: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFormData({
      ...formData,
      [field]: file,
    });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleInputChange = (
    field: string,
    value: string | boolean | File | null
  ) => {
    setFormData({
      ...formData,
      [field]: value,
    });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      business_address: {
        ...formData.business_address,
        [field]: value,
      },
    });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const progressPercentage = (currentStep / 5) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            KYC Verification - Tier 2
          </h2>
          <span className="text-sm font-semibold text-gray-500">
            Step {currentStep} of 5
          </span>
        </div>
        <div className="w-full bg-gray-50 rounded-full h-2 overflow-hidden border border-gray-200">
          <div
            className="bg-yellow-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-5 gap-3 mb-12">
        {KYC_STEPS.map((step) => (
          <div
            key={step.number}
            className={`text-center cursor-pointer transition-all p-3 rounded-lg border ${
              currentStep >= step.number
                ? 'border-yellow-500 bg-yellow-500/10'
                : 'border-gray-200 bg-gray-50/30'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 font-bold text-sm ${
                currentStep >= step.number
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {currentStep > step.number ? (
                <CheckCircle2 size={16} />
              ) : (
                step.number
              )}
            </div>
            <p className="text-xs font-semibold text-gray-600 hidden sm:block">
              {step.title}
            </p>
          </div>
        ))}
      </div>

      {/* Form Sections */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 mb-8">
        {/* Error Display */}
        {errors.submit && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-6 flex items-start gap-3">
            <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-400">{errors.submit}</span>
          </div>
        )}

        {/* Step 1: Tax Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <FileText size={20} className="text-yellow-500" />
                Tax Information
              </h3>
              <p className="text-gray-500 text-sm">
                Provide your tax identification details
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  PAN (Permanent Account Number) *
                </label>
                <input
                  type="text"
                  placeholder="e.g., AAAPL5055K"
                  value={formData.pan}
                  onChange={(e) =>
                    handleInputChange('pan', e.target.value.toUpperCase())
                  }
                  className={`w-full bg-white border-2 rounded-lg px-4 py-3 text-gray-900 font-mono ${
                    errors.pan
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:border-yellow-500'
                  } focus:outline-none transition-colors`}
                />
                {errors.pan && (
                  <p className="text-red-400 text-xs font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.pan}
                  </p>
                )}
                <p className="text-gray-500 text-xs mt-2">
                  Format: 5 letters, 4 digits, 1 letter (e.g., AAAPL5055K)
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  GSTIN (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., 27AABCT1234H1Z0"
                  value={formData.gstin}
                  onChange={(e) =>
                    handleInputChange('gstin', e.target.value.toUpperCase())
                  }
                  className={`w-full bg-white border-2 rounded-lg px-4 py-3 text-gray-900 font-mono ${
                    errors.gstin
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:border-yellow-500'
                  } focus:outline-none transition-colors`}
                />
                {errors.gstin && (
                  <p className="text-red-400 text-xs font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.gstin}
                  </p>
                )}
                <p className="text-gray-500 text-xs mt-2">
                  Required only if annual turnover exceeds ₹40 lakhs
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Identity Verification */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Shield size={20} className="text-yellow-500" />
                Identity Verification
              </h3>
              <p className="text-gray-500 text-sm">
                Upload your government-issued identity document
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Document Type *
                </label>
                <select
                  value={formData.id_type}
                  onChange={(e) =>
                    handleInputChange(
                      'id_type',
                      e.target.value as SellerKYC['id_type']
                    )
                  }
                  className="w-full bg-white border-2 border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:border-yellow-500 focus:outline-none transition-colors"
                >
                  {documentTypes.map((dt) => (
                    <option key={dt.value} value={dt.value}>{dt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Document Number *
                </label>
                <input
                  type="text"
                  placeholder="Enter document number"
                  value={formData.id_number}
                  onChange={(e) =>
                    handleInputChange('id_number', e.target.value)
                  }
                  className={`w-full bg-white border-2 rounded-lg px-4 py-3 text-gray-900 font-mono ${
                    errors.id_number
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:border-yellow-500'
                  } focus:outline-none transition-colors`}
                />
                {errors.id_number && (
                  <p className="text-red-400 text-xs font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.id_number}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Upload Document *
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    errors.id_document_file
                      ? 'border-red-500 bg-red-500/5'
                      : 'border-gray-200 hover:border-yellow-500/50 bg-gray-100/20'
                  }`}
                >
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      handleFileChange('id_document_file', e.target.files?.[0] || null)
                    }
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload size={24} className="mx-auto mb-2 text-gray-500" />
                  <p className="text-sm font-semibold text-gray-900">
                    {formData.id_document_file
                      ? formData.id_document_file.name
                      : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, JPG, PNG (Max 5MB)
                  </p>
                </div>
                {errors.id_document_file && (
                  <p className="text-red-400 text-xs font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.id_document_file}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Business Address */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Home size={20} className="text-yellow-500" />
                Business Address
              </h3>
              <p className="text-gray-500 text-sm">
                Confirm your business location and upload address proof
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Pre-filled Information
                </p>
                <p className="text-gray-900 font-semibold">{sellerFullName}</p>
                <p className="text-gray-500 text-sm">{sellerEmail}</p>
                <p className="text-gray-500 text-sm">{sellerPhone}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Street Address Line 1 *
                </label>
                <input
                  type="text"
                  placeholder="e.g., 123 Business Street"
                  value={formData.business_address.street_address_1}
                  onChange={(e) =>
                    handleAddressChange('street_address_1', e.target.value)
                  }
                  className={`w-full bg-white border-2 rounded-lg px-4 py-3 text-gray-900 ${
                    errors.street_address_1
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:border-yellow-500'
                  } focus:outline-none transition-colors`}
                />
                {errors.street_address_1 && (
                  <p className="text-red-400 text-xs font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.street_address_1}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Street Address Line 2 (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Suite 500"
                  value={formData.business_address.street_address_2}
                  onChange={(e) =>
                    handleAddressChange('street_address_2', e.target.value)
                  }
                  className="w-full bg-white border-2 border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:border-yellow-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    City / Town *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Delhi"
                    value={formData.business_address.city}
                    onChange={(e) =>
                      handleAddressChange('city', e.target.value)
                    }
                    className={`w-full bg-white border-2 rounded-lg px-4 py-3 text-gray-900 ${
                      errors.city
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-200 focus:border-yellow-500'
                    } focus:outline-none transition-colors`}
                  />
                  {errors.city && (
                    <p className="text-red-400 text-xs font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle size={14} /> {errors.city}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    State / Province *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Delhi"
                    value={formData.business_address.state}
                    onChange={(e) =>
                      handleAddressChange('state', e.target.value)
                    }
                    className={`w-full bg-white border-2 rounded-lg px-4 py-3 text-gray-900 ${
                      errors.state
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-200 focus:border-yellow-500'
                    } focus:outline-none transition-colors`}
                  />
                  {errors.state && (
                    <p className="text-red-400 text-xs font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle size={14} /> {errors.state}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Postal / ZIP Code *
                </label>
                <input
                  type="text"
                  placeholder="e.g., 110001"
                  value={formData.business_address.postal_code}
                  onChange={(e) =>
                    handleAddressChange('postal_code', e.target.value)
                  }
                  className={`w-full bg-white border-2 rounded-lg px-4 py-3 text-gray-900 font-mono ${
                    errors.postal_code
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:border-yellow-500'
                  } focus:outline-none transition-colors`}
                />
                {errors.postal_code && (
                  <p className="text-red-400 text-xs font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.postal_code}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Upload Address Proof *
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    errors.address_proof_file
                      ? 'border-red-500 bg-red-500/5'
                      : 'border-gray-200 hover:border-yellow-500/50 bg-gray-100/20'
                  }`}
                >
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      handleFileChange(
                        'address_proof_file',
                        e.target.files?.[0] || null
                      )
                    }
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload size={24} className="mx-auto mb-2 text-gray-500" />
                  <p className="text-sm font-semibold text-gray-900">
                    {formData.address_proof_file
                      ? formData.address_proof_file.name
                      : 'Upload utility bill, lease, or rental agreement'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, JPG, PNG (Max 5MB)
                  </p>
                </div>
                {errors.address_proof_file && (
                  <p className="text-red-400 text-xs font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.address_proof_file}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Bank Details */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Landmark size={20} className="text-yellow-500" />
                Bank Details
              </h3>
              <p className="text-gray-500 text-sm">
                Provide banking information for payout processing
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  placeholder="Name as per bank account"
                  value={formData.bank_holder_name}
                  onChange={(e) =>
                    handleInputChange('bank_holder_name', e.target.value)
                  }
                  className={`w-full bg-white border-2 rounded-lg px-4 py-3 text-gray-900 ${
                    errors.bank_holder_name
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:border-yellow-500'
                  } focus:outline-none transition-colors`}
                />
                {errors.bank_holder_name && (
                  <p className="text-red-400 text-xs font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.bank_holder_name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Account Number *
                </label>
                <input
                  type="text"
                  placeholder="9-18 digits"
                  value={formData.account_number}
                  onChange={(e) =>
                    handleInputChange('account_number', e.target.value)
                  }
                  className={`w-full bg-white border-2 rounded-lg px-4 py-3 text-gray-900 font-mono ${
                    errors.account_number
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:border-yellow-500'
                  } focus:outline-none transition-colors`}
                />
                {errors.account_number && (
                  <p className="text-red-400 text-xs font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.account_number}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  IFSC Code *
                </label>
                <input
                  type="text"
                  placeholder="e.g., SBIN0001234"
                  value={formData.ifsc_code}
                  onChange={(e) =>
                    handleInputChange('ifsc_code', e.target.value.toUpperCase())
                  }
                  className={`w-full bg-white border-2 rounded-lg px-4 py-3 text-gray-900 font-mono ${
                    errors.ifsc_code
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:border-yellow-500'
                  } focus:outline-none transition-colors`}
                />
                {errors.ifsc_code && (
                  <p className="text-red-400 text-xs font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.ifsc_code}
                  </p>
                )}
                <p className="text-gray-500 text-xs mt-2">
                  Format: 4 letters, digit 0, then 6 alphanumeric characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Account Type *
                </label>
                <select
                  value={formData.account_type}
                  onChange={(e) =>
                    handleInputChange(
                      'account_type',
                      e.target.value as SellerKYC['account_type']
                    )
                  }
                  className="w-full bg-white border-2 border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:border-yellow-500 focus:outline-none transition-colors"
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="current">Current</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Bank Statement *
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    errors.bank_statement_file
                      ? 'border-red-500 bg-red-500/5'
                      : 'border-gray-200 hover:border-yellow-500/50 bg-gray-100/20'
                  }`}
                >
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) =>
                      handleFileChange(
                        'bank_statement_file',
                        e.target.files?.[0] || null
                      )
                    }
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload size={24} className="mx-auto mb-2 text-gray-500" />
                  <p className="text-sm font-semibold text-gray-900">
                    {formData.bank_statement_file
                      ? formData.bank_statement_file.name
                      : 'Last 3 months bank statement'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PDF (Max 10MB)</p>
                </div>
                {errors.bank_statement_file && (
                  <p className="text-red-400 text-xs font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.bank_statement_file}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Compliance & Acceptance */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Shield size={20} className="text-yellow-500" />
                Compliance & Legal Acceptance
              </h3>
              <p className="text-gray-500 text-sm">
                Review and accept all compliance requirements
              </p>
            </div>

            <div className="space-y-4 bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="pep"
                  checked={formData.pep_declaration}
                  onChange={(e) =>
                    handleInputChange('pep_declaration', e.target.checked)
                  }
                  className="mt-1 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="pep" className="cursor-pointer flex-1">
                  <p className="font-semibold text-gray-900 text-sm">
                    PEP Declaration
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    I confirm that neither I nor my family members are Politically Exposed Persons
                    (PEPs)
                  </p>
                </label>
              </div>
              {errors.pep_declaration && (
                <p className="text-red-400 text-xs font-semibold flex items-center gap-1 ml-7">
                  <AlertCircle size={14} /> {errors.pep_declaration}
                </p>
              )}

              <hr className="border-gray-200" />

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="sanctions"
                  checked={formData.sanctions_check}
                  onChange={(e) =>
                    handleInputChange('sanctions_check', e.target.checked)
                  }
                  className="mt-1 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="sanctions" className="cursor-pointer flex-1">
                  <p className="font-semibold text-gray-900 text-sm">
                    Sanctions Check
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    I confirm that I have not been sanctioned or listed in any government or
                    international sanctions lists
                  </p>
                </label>
              </div>
              {errors.sanctions_check && (
                <p className="text-red-400 text-xs font-semibold flex items-center gap-1 ml-7">
                  <AlertCircle size={14} /> {errors.sanctions_check}
                </p>
              )}

              <hr className="border-gray-200" />

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="aml"
                  checked={formData.aml_compliance}
                  onChange={(e) =>
                    handleInputChange('aml_compliance', e.target.checked)
                  }
                  className="mt-1 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="aml" className="cursor-pointer flex-1">
                  <p className="font-semibold text-gray-900 text-sm">
                    AML Compliance
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    I agree to comply with Anti-Money Laundering (AML) regulations and reporting
                    requirements
                  </p>
                </label>
              </div>
              {errors.aml_compliance && (
                <p className="text-red-400 text-xs font-semibold flex items-center gap-1 ml-7">
                  <AlertCircle size={14} /> {errors.aml_compliance}
                </p>
              )}

              <hr className="border-gray-200" />

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="tax"
                  checked={formData.tax_compliance}
                  onChange={(e) =>
                    handleInputChange('tax_compliance', e.target.checked)
                  }
                  className="mt-1 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="tax" className="cursor-pointer flex-1">
                  <p className="font-semibold text-gray-900 text-sm">
                    Tax Compliance
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    I confirm that all information provided is accurate and I will comply with all
                    applicable tax regulations
                  </p>
                </label>
              </div>
              {errors.tax_compliance && (
                <p className="text-red-400 text-xs font-semibold flex items-center gap-1 ml-7">
                  <AlertCircle size={14} /> {errors.tax_compliance}
                </p>
              )}

              <hr className="border-gray-200" />

              <div className="flex items-start gap-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
                <input
                  type="checkbox"
                  id="terms"
                  checked={formData.terms_accepted}
                  onChange={(e) =>
                    handleInputChange('terms_accepted', e.target.checked)
                  }
                  className="mt-1 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="terms" className="cursor-pointer flex-1">
                  <p className="font-semibold text-gray-900 text-sm">
                    I accept Terms & Conditions
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    I have read and agree to the Beauzead Seller Terms & Conditions, KYC Policy,
                    and Privacy Policy
                  </p>
                </label>
              </div>
              {errors.terms_accepted && (
                <p className="text-red-400 text-xs font-semibold flex items-center gap-1 ml-7">
                  <AlertCircle size={14} /> {errors.terms_accepted}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-lg text-gray-900 font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={18} />
          Previous
        </button>

        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="px-8 py-3 border border-gray-200 rounded-lg text-gray-900 font-semibold hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>

          {currentStep < 5 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg font-semibold transition-colors"
            >
              Next
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-500 text-gray-900 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Submit for Review
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerKYCVerification;
