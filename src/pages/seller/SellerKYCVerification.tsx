/**
 * Seller KYC Verification — 4-Step Form
 *
 * Step 1: Personal Information (auto-populated from profile)
 * Step 2: Business Information (country-specific tax IDs)
 * Step 3: Bank Details
 * Step 4: KYC Document Upload (country-specific identity docs)
 *
 * Features:
 * - Auto-generated KYC Form ID (BZ-KYC-XXXXXXXX)
 * - Draft save & resume on each step
 * - One active KYC per seller
 * - Country-specific dynamic data (zero hardcoding)
 * - Mobile responsive, clean minimal design
 */

import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, CheckCircle2, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  saveKYCStep1,
  saveKYCStep2,
  saveKYCStep3,
  submitKYCStep4,
  fetchCountriesForKYC,
  fetchBusinessTypesForKYC,
  fetchTaxIdTypes,
  fetchIdentityDocTypes,
  getSellerKYCDraft,
} from '../../lib/kycService';
import type {
  CountryOption,
  BusinessTypeOption,
  TaxIdType,
  IdentityDocType,
} from '../../lib/kycService';

// ─── Props ───────────────────────────────────────────────────────

interface SellerKYCVerificationProps {
  sellerId: string;
  onSubmit?: (referenceNumber: string) => void;
  onCancel?: () => void;
}

// ─── Step Config ─────────────────────────────────────────────────

const STEPS = [
  { num: 1, title: 'Personal Information' },
  { num: 2, title: 'Business Information' },
  { num: 3, title: 'Bank Details' },
  { num: 4, title: 'Document Upload' },
];

// ─── Reusable Field Components ───────────────────────────────────

const InputField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  type?: string;
}> = ({ label, value, onChange, error, required, disabled, placeholder, type = 'text' }) => (
  <div>
    <label className="block text-sm font-medium text-gray-900 mb-1">
      {label} {required && <span className="text-red-600">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      className={`w-full bg-white border ${
        error ? 'border-red-500' : 'border-gray-900'
      } rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-900 disabled:bg-gray-50 disabled:text-gray-500`}
    />
    {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
  </div>
);

const SelectField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  error?: string;
  required?: boolean;
  disabled?: boolean;
}> = ({ label, value, onChange, options, error, required, disabled }) => (
  <div>
    <label className="block text-sm font-medium text-gray-900 mb-1">
      {label} {required && <span className="text-red-600">*</span>}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full bg-white border ${
        error ? 'border-red-500' : 'border-gray-900'
      } rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-900 disabled:bg-gray-50`}
    >
      <option value="">Select...</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
    {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
  </div>
);

const FileUploadField: React.FC<{
  label: string;
  fileName?: string;
  onChange: (f: File | null) => void;
  error?: string;
  required?: boolean;
  accept?: string;
  maxSizeMB?: number;
}> = ({ label, fileName, onChange, error, required, accept = 'image/*', maxSizeMB = 15 }) => (
  <div>
    <label className="block text-sm font-medium text-gray-900 mb-1">
      {label} {required && <span className="text-red-600">*</span>}
    </label>
    <div
      className={`relative border ${
        error ? 'border-red-500' : 'border-gray-900'
      } border-dashed rounded-md p-4 text-center bg-white hover:bg-gray-50 transition-colors cursor-pointer`}
    >
      <input
        type="file"
        accept={accept}
        onChange={(e) => {
          const f = e.target.files?.[0] || null;
          if (f && f.size > maxSizeMB * 1024 * 1024) {
            onChange(null);
            return;
          }
          onChange(f);
        }}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
      <Upload size={18} className="mx-auto mb-1 text-gray-400" />
      <p className="text-xs text-gray-600">
        {fileName || `Click to upload (Max ${maxSizeMB}MB)`}
      </p>
    </div>
    {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
  </div>
);

const CheckboxField: React.FC<{
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  error?: string;
}> = ({ label, description, checked, onChange, error }) => (
  <div>
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 border-gray-900 rounded"
      />
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
    </label>
    {error && (
      <p className="text-xs text-red-600 mt-1 ml-7">{error}</p>
    )}
  </div>
);

// ─── Main Component ──────────────────────────────────────────────

const SellerKYCVerification: React.FC<SellerKYCVerificationProps> = ({
  sellerId,
  onSubmit,
  onCancel,
}) => {
  // ── State ────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(1);
  const [kycFormId, setKycFormId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');

  // Dropdown data
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [businessTypes, setBusinessTypes] = useState<BusinessTypeOption[]>([]);
  const [taxIdTypes, setTaxIdTypes] = useState<TaxIdType[]>([]);
  const [identityDocTypes, setIdentityDocTypes] = useState<IdentityDocType[]>([]);

  // Step 1: Personal Information
  const [step1, setStep1] = useState({
    full_name: '',
    email: '',
    phone: '',
    country_id: '',
    residential_street_1: '',
    residential_street_2: '',
    residential_city: '',
    residential_state: '',
    residential_postal_code: '',
    residential_landmark: '',
  });

  // Step 2: Business Information
  const [step2, setStep2] = useState({
    business_type_id: '',
    business_name: '',
    business_reg_number: '',
    tax_id_type: '',
    tax_id_number: '',
    biz_street_1: '',
    biz_street_2: '',
    biz_city: '',
    biz_state: '',
    biz_postal_code: '',
    biz_country_id: '',
    brand_name: '',
    business_declaration: false,
  });

  // Step 3: Bank Details
  const [step3, setStep3] = useState({
    bank_holder_name: '',
    bank_name: '',
    branch_name: '',
    account_number: '',
    routing_code: '',
    account_type: 'savings' as 'savings' | 'current' | 'other',
    account_type_other: '',
    bank_authorization: false,
  });

  // Step 4: Document Upload
  const [step4, setStep4] = useState({
    identity_doc_type: '',
    identity_front_file: null as File | null,
    identity_back_file: null as File | null,
    business_reg_doc_file: null as File | null,
    tax_doc_file: null as File | null,
    bank_proof_file: null as File | null,
    consent_verification: false,
    consent_authentic: false,
    consent_terms: false,
  });

  // ── Load Data ────────────────────────────────────────────────

  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerId]);

  // Load country-specific dropdowns when country changes
  useEffect(() => {
    if (step1.country_id && countries.length > 0) {
      const c = countries.find((x) => x.id === step1.country_id);
      if (c) loadCountryData(c.country_code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step1.country_id, countries]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [countriesData, btData, profileRes, draftRes] = await Promise.all([
        fetchCountriesForKYC(),
        fetchBusinessTypesForKYC(),
        supabase
          .from('profiles')
          .select('full_name, email, phone, country_id, business_type_id')
          .eq('id', sellerId)
          .single(),
        getSellerKYCDraft(sellerId),
      ]);

      setCountries(countriesData);
      setBusinessTypes(btData);

      const p = profileRes.data as Record<string, any> | null;
      const d = draftRes.data;

      if (d && d.kyc_status === 'draft') {
        // ── Resume from draft ──
        setKycFormId(d.kyc_form_id || '');
        setCurrentStep(d.current_step || 1);

        setStep1({
          full_name: d.full_name || p?.full_name || '',
          email: d.email || p?.email || '',
          phone: d.phone || p?.phone || '',
          country_id: d.country_id || p?.country_id || '',
          residential_street_1: d.residential_street_1 || '',
          residential_street_2: d.residential_street_2 || '',
          residential_city: d.residential_city || '',
          residential_state: d.residential_state || '',
          residential_postal_code: d.residential_postal_code || '',
          residential_landmark: d.residential_landmark || '',
        });

        if (d.current_step >= 3) {
          setStep2({
            business_type_id: d.business_type_id || p?.business_type_id || '',
            business_name: d.business_name || '',
            business_reg_number: d.business_reg_number || '',
            tax_id_type: d.tax_id_type || '',
            tax_id_number: d.tax_id_number || '',
            biz_street_1: d.biz_street_1 || '',
            biz_street_2: d.biz_street_2 || '',
            biz_city: d.biz_city || '',
            biz_state: d.biz_state || '',
            biz_postal_code: d.biz_postal_code || '',
            biz_country_id: d.biz_country_id || d.country_id || '',
            brand_name: d.brand_name || '',
            business_declaration: d.business_declaration || false,
          });
        }

        if (d.current_step >= 4) {
          setStep3({
            bank_holder_name: d.bank_holder_name || '',
            bank_name: d.bank_name || '',
            branch_name: d.branch_name || '',
            account_number: d.account_number || '',
            routing_code: d.routing_code || '',
            account_type: d.account_type || 'savings',
            account_type_other: d.account_type_other || '',
            bank_authorization: d.bank_authorization || false,
          });
        }
      } else {
        // ── Fresh start — populate from profile ──
        setStep1({
          full_name: p?.full_name || '',
          email: p?.email || '',
          phone: p?.phone || '',
          country_id: p?.country_id || '',
          residential_street_1: '',
          residential_street_2: '',
          residential_city: '',
          residential_state: '',
          residential_postal_code: '',
          residential_landmark: '',
        });

        setStep2((prev) => ({
          ...prev,
          business_type_id: p?.business_type_id || '',
          biz_country_id: p?.country_id || '',
        }));
      }
    } catch {
      setGlobalError('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCountryData = async (countryCode: string) => {
    try {
      const [taxTypes, docTypes] = await Promise.all([
        fetchTaxIdTypes(countryCode),
        fetchIdentityDocTypes(countryCode),
      ]);
      setTaxIdTypes(taxTypes);
      setIdentityDocTypes(docTypes);
    } catch {
      // Silently fail — dropdowns will be empty
    }
  };

  // ── Validation ───────────────────────────────────────────────

  const validateStep1 = (): boolean => {
    const e: Record<string, string> = {};
    if (!step1.full_name.trim()) e.full_name = 'Full name is required';
    if (!step1.phone.trim()) e.phone = 'Mobile number is required';
    if (!step1.country_id) e.country_id = 'Country is required';
    if (!step1.residential_street_1.trim())
      e.residential_street_1 = 'Street address is required';
    if (!step1.residential_city.trim())
      e.residential_city = 'City is required';
    if (!step1.residential_state.trim())
      e.residential_state = 'State / Province is required';
    if (!step1.residential_postal_code.trim())
      e.residential_postal_code = 'Postal / ZIP code is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = (): boolean => {
    const e: Record<string, string> = {};
    if (!step2.business_name.trim())
      e.business_name = 'Business name is required';
    if (!step2.tax_id_type) e.tax_id_type = 'Select a tax ID type';
    if (!step2.tax_id_number.trim())
      e.tax_id_number = 'Tax ID number is required';
    if (!step2.biz_street_1.trim())
      e.biz_street_1 = 'Street address is required';
    if (!step2.biz_city.trim()) e.biz_city = 'City is required';
    if (!step2.biz_state.trim())
      e.biz_state = 'State / Province is required';
    if (!step2.biz_postal_code.trim())
      e.biz_postal_code = 'Postal / ZIP code is required';
    if (!step2.business_declaration)
      e.business_declaration = 'You must accept the declaration';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = (): boolean => {
    const e: Record<string, string> = {};
    if (!step3.bank_holder_name.trim())
      e.bank_holder_name = 'Account holder name is required';
    if (!step3.bank_name.trim()) e.bank_name = 'Bank name is required';
    if (!step3.account_number.trim())
      e.account_number = 'Account number is required';
    if (!step3.routing_code.trim())
      e.routing_code = 'SWIFT / IFSC / Routing code is required';
    if (step3.account_type === 'other' && !step3.account_type_other.trim()) {
      e.account_type_other = 'Specify account type';
    }
    if (!step3.bank_authorization)
      e.bank_authorization = 'You must accept the authorization';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep4 = (): boolean => {
    const e: Record<string, string> = {};
    if (!step4.identity_doc_type)
      e.identity_doc_type = 'Select a document type';
    if (!step4.identity_front_file)
      e.identity_front_file = 'Front side image is required';
    if (!step4.identity_back_file)
      e.identity_back_file = 'Back side image is required';
    if (!step4.tax_doc_file)
      e.tax_doc_file = 'Tax document is required';
    if (!step4.bank_proof_file)
      e.bank_proof_file = 'Bank proof is required';
    if (!step4.consent_verification)
      e.consent_verification = 'Required';
    if (!step4.consent_authentic)
      e.consent_authentic = 'Required';
    if (!step4.consent_terms) e.consent_terms = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Save / Submit Handler ────────────────────────────────────

  const handleSave = async () => {
    setGlobalError('');
    setErrors({});

    let valid = false;
    switch (currentStep) {
      case 1:
        valid = validateStep1();
        break;
      case 2:
        valid = validateStep2();
        break;
      case 3:
        valid = validateStep3();
        break;
      case 4:
        valid = validateStep4();
        break;
    }
    if (!valid) return;

    setIsSaving(true);
    try {
      if (currentStep === 1) {
        const res = await saveKYCStep1(sellerId, step1);
        if (!res.success) {
          setGlobalError(res.error || 'Save failed.');
          return;
        }
        setKycFormId(res.kycFormId || '');
        setStep2((prev) => ({
          ...prev,
          biz_country_id: prev.biz_country_id || step1.country_id,
        }));
        setCurrentStep(2);
      } else if (currentStep === 2) {
        const res = await saveKYCStep2(sellerId, step2);
        if (!res.success) {
          setGlobalError(res.error || 'Save failed.');
          return;
        }
        setCurrentStep(3);
      } else if (currentStep === 3) {
        const res = await saveKYCStep3(sellerId, step3);
        if (!res.success) {
          setGlobalError(res.error || 'Save failed.');
          return;
        }
        setCurrentStep(4);
      } else if (currentStep === 4) {
        const res = await submitKYCStep4(
          sellerId,
          {
            identity_doc_type: step4.identity_doc_type,
            consent_verification: step4.consent_verification,
            consent_authentic: step4.consent_authentic,
            consent_terms: step4.consent_terms,
          },
          {
            identity_front: step4.identity_front_file || undefined,
            identity_back: step4.identity_back_file || undefined,
            business_reg_doc: step4.business_reg_doc_file || undefined,
            tax_doc: step4.tax_doc_file || undefined,
            bank_proof: step4.bank_proof_file || undefined,
          }
        );
        if (!res.success) {
          setGlobalError(res.error || 'Submission failed.');
          return;
        }
        setReferenceNumber(res.referenceNumber || kycFormId);
        setSubmitted(true);
        onSubmit?.(res.referenceNumber || kycFormId);
        return;
      }
      window.scrollTo(0, 0);
    } catch {
      setGlobalError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Country name lookup ──────────────────────────────────────
  const getCountryName = (id: string) =>
    countries.find((c) => c.id === id)?.country_name || '';

  // ── Render: Loading ──────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-900" size={28} />
        <span className="ml-3 text-sm text-gray-500">
          Loading KYC form...
        </span>
      </div>
    );
  }

  // ── Render: Success ──────────────────────────────────────────

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 text-center py-16">
        <CheckCircle2 size={48} className="mx-auto text-green-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Successfully Submitted For KYC Verification
        </h2>
        <p className="text-sm text-gray-500 mb-1">Reference Number</p>
        <p className="text-lg font-mono font-semibold text-blue-900 mb-6">
          {referenceNumber}
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Your application is under review. You will be notified once
          verified.
        </p>
        <button
          onClick={() => onCancel?.()}
          className="px-4 py-2 bg-blue-900 text-white text-sm font-medium rounded-md hover:bg-blue-800"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // ── Render: Form ─────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">
          KYC Verification
        </h1>
        {kycFormId && (
          <p className="text-xs text-gray-500 mt-1">
            Form ID: {kycFormId}
          </p>
        )}
      </div>

      {/* Step Progress */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.num}>
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  currentStep === s.num
                    ? 'bg-blue-900 text-white'
                    : currentStep > s.num
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {currentStep > s.num ? (
                  <CheckCircle2 size={14} />
                ) : (
                  s.num
                )}
              </div>
              <span className="text-[10px] text-gray-500 mt-1 hidden sm:block text-center leading-tight max-w-[80px]">
                {s.title}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 sm:mx-2 ${
                  currentStep > s.num ? 'bg-green-600' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Global Error */}
      {globalError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-md p-3 mb-6">
          <AlertCircle
            size={16}
            className="text-red-600 flex-shrink-0 mt-0.5"
          />
          <p className="text-sm text-red-700">{globalError}</p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          STEP 1 — Personal Information
          ═══════════════════════════════════════════════════════ */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Personal Information
            </h2>
            <p className="text-xs text-gray-500">
              Provide your personal details and current residential address
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Full Name"
              value={step1.full_name}
              onChange={(v) => setStep1({ ...step1, full_name: v })}
              error={errors.full_name}
              required
              placeholder="Your full name"
            />
            <InputField
              label="Email Address"
              value={step1.email}
              onChange={() => {}}
              disabled
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Mobile Number"
              value={step1.phone}
              onChange={(v) => setStep1({ ...step1, phone: v })}
              error={errors.phone}
              required
              placeholder="Your mobile number"
            />
            <SelectField
              label="Country of Residence"
              value={step1.country_id}
              onChange={(v) => setStep1({ ...step1, country_id: v })}
              options={countries.map((c) => ({
                value: c.id,
                label: c.country_name,
              }))}
              error={errors.country_id}
              required
            />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 mt-2">
              Current Residential Address
            </h3>
            <div className="space-y-4">
              <InputField
                label="Street Address Line 1"
                value={step1.residential_street_1}
                onChange={(v) =>
                  setStep1({ ...step1, residential_street_1: v })
                }
                error={errors.residential_street_1}
                required
              />
              <InputField
                label="Street Address Line 2"
                value={step1.residential_street_2}
                onChange={(v) =>
                  setStep1({ ...step1, residential_street_2: v })
                }
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="City / Town"
                  value={step1.residential_city}
                  onChange={(v) =>
                    setStep1({ ...step1, residential_city: v })
                  }
                  error={errors.residential_city}
                  required
                />
                <InputField
                  label="State / Province"
                  value={step1.residential_state}
                  onChange={(v) =>
                    setStep1({ ...step1, residential_state: v })
                  }
                  error={errors.residential_state}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Postal / ZIP Code"
                  value={step1.residential_postal_code}
                  onChange={(v) =>
                    setStep1({ ...step1, residential_postal_code: v })
                  }
                  error={errors.residential_postal_code}
                  required
                />
                <InputField
                  label="Landmark (if any)"
                  value={step1.residential_landmark}
                  onChange={(v) =>
                    setStep1({ ...step1, residential_landmark: v })
                  }
                  placeholder="Near..."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          STEP 2 — Business Information
          ═══════════════════════════════════════════════════════ */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Business Information
            </h2>
            <p className="text-xs text-gray-500">
              Provide your business details and registration information
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Business Type"
              value={step2.business_type_id}
              onChange={(v) =>
                setStep2({ ...step2, business_type_id: v })
              }
              options={businessTypes.map((b) => ({
                value: b.id,
                label: b.type_name,
              }))}
            />
            <InputField
              label="Business Name"
              value={step2.business_name}
              onChange={(v) =>
                setStep2({ ...step2, business_name: v })
              }
              error={errors.business_name}
              required
              placeholder="Shop / Registered / Freelance name"
            />
          </div>

          <InputField
            label="Business Registration Number"
            value={step2.business_reg_number}
            onChange={(v) =>
              setStep2({ ...step2, business_reg_number: v })
            }
            placeholder="Optional"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Tax ID Type"
              value={step2.tax_id_type}
              onChange={(v) => setStep2({ ...step2, tax_id_type: v })}
              options={taxIdTypes.map((t) => ({
                value: t.code,
                label: t.label,
              }))}
              error={errors.tax_id_type}
              required
            />
            <InputField
              label="Tax ID Number"
              value={step2.tax_id_number}
              onChange={(v) =>
                setStep2({ ...step2, tax_id_number: v })
              }
              error={errors.tax_id_number}
              required
              placeholder={
                taxIdTypes.find((t) => t.code === step2.tax_id_type)
                  ?.placeholder || 'Enter tax ID'
              }
            />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 mt-2">
              Registered Business Address
              <span className="text-xs text-gray-500 font-normal ml-2">
                (Individuals / Freelancers can use personal address)
              </span>
            </h3>
            <div className="space-y-4">
              <InputField
                label="Street Address Line 1"
                value={step2.biz_street_1}
                onChange={(v) =>
                  setStep2({ ...step2, biz_street_1: v })
                }
                error={errors.biz_street_1}
                required
              />
              <InputField
                label="Street Address Line 2"
                value={step2.biz_street_2}
                onChange={(v) =>
                  setStep2({ ...step2, biz_street_2: v })
                }
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="City / Town"
                  value={step2.biz_city}
                  onChange={(v) =>
                    setStep2({ ...step2, biz_city: v })
                  }
                  error={errors.biz_city}
                  required
                />
                <InputField
                  label="State / Province"
                  value={step2.biz_state}
                  onChange={(v) =>
                    setStep2({ ...step2, biz_state: v })
                  }
                  error={errors.biz_state}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Postal / ZIP Code"
                  value={step2.biz_postal_code}
                  onChange={(v) =>
                    setStep2({ ...step2, biz_postal_code: v })
                  }
                  error={errors.biz_postal_code}
                  required
                />
                <InputField
                  label="Country"
                  value={getCountryName(step2.biz_country_id)}
                  onChange={() => {}}
                  disabled
                />
              </div>
            </div>
          </div>

          <InputField
            label="Brand Name"
            value={step2.brand_name}
            onChange={(v) => setStep2({ ...step2, brand_name: v })}
            placeholder="Your brand name"
          />

          <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              Declaration
            </h4>
            <CheckboxField
              label="I hereby declare that the information provided is true, accurate, and complete to the best of my knowledge."
              description="I understand that providing false or misleading information may result in rejection of onboarding or suspension of seller privileges."
              checked={step2.business_declaration}
              onChange={(v) =>
                setStep2({ ...step2, business_declaration: v })
              }
              error={errors.business_declaration}
            />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          STEP 3 — Bank Details
          ═══════════════════════════════════════════════════════ */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Bank Details
            </h2>
            <p className="text-xs text-gray-500">
              Enter your banking information for payment settlements
            </p>
          </div>

          <InputField
            label="Account Holder Name"
            value={step3.bank_holder_name}
            onChange={(v) =>
              setStep3({ ...step3, bank_holder_name: v })
            }
            error={errors.bank_holder_name}
            required
            placeholder="As registered with the bank"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Bank Name"
              value={step3.bank_name}
              onChange={(v) => setStep3({ ...step3, bank_name: v })}
              error={errors.bank_name}
              required
            />
            <InputField
              label="Branch Name"
              value={step3.branch_name}
              onChange={(v) =>
                setStep3({ ...step3, branch_name: v })
              }
              placeholder="If applicable"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Account Number"
              value={step3.account_number}
              onChange={(v) =>
                setStep3({ ...step3, account_number: v })
              }
              error={errors.account_number}
              required
            />
            <InputField
              label="SWIFT / IFSC / Routing Code"
              value={step3.routing_code}
              onChange={(v) =>
                setStep3({ ...step3, routing_code: v })
              }
              error={errors.routing_code}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Account Type *
            </label>
            <div className="flex flex-wrap gap-4">
              {(['savings', 'current', 'other'] as const).map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="account_type"
                    checked={step3.account_type === type}
                    onChange={() =>
                      setStep3({ ...step3, account_type: type })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-900">
                    {type === 'current'
                      ? 'Current / Business'
                      : type === 'other'
                        ? 'Other'
                        : 'Savings'}
                  </span>
                </label>
              ))}
            </div>
            {step3.account_type === 'other' && (
              <div className="mt-3">
                <InputField
                  label="Specify Account Type"
                  value={step3.account_type_other}
                  onChange={(v) =>
                    setStep3({ ...step3, account_type_other: v })
                  }
                  error={errors.account_type_other}
                  required
                />
              </div>
            )}
          </div>

          <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              Authorization & Declaration
            </h4>
            <CheckboxField
              label="I confirm that the above bank account is held in the name of the registered seller/business."
              description="I authorize the platform to use this account for settlement of payments and acknowledge that incorrect banking information may delay or prevent transactions."
              checked={step3.bank_authorization}
              onChange={(v) =>
                setStep3({ ...step3, bank_authorization: v })
              }
              error={errors.bank_authorization}
            />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          STEP 4 — KYC Document Upload
          ═══════════════════════════════════════════════════════ */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              KYC Document Upload
            </h2>
            <p className="text-xs text-gray-500">
              Upload clear and valid copies of the following documents.
              All documents must be government-issued, unexpired, and
              legible.
            </p>
          </div>

          {/* Identity Verification Document */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Identity Verification Document
            </h3>
            <SelectField
              label="Document Type"
              value={step4.identity_doc_type}
              onChange={(v) =>
                setStep4({ ...step4, identity_doc_type: v })
              }
              options={identityDocTypes.map((d) => ({
                value: d.value,
                label: d.label,
              }))}
              error={errors.identity_doc_type}
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FileUploadField
                label="Upload Front Side"
                fileName={step4.identity_front_file?.name}
                onChange={(f) =>
                  setStep4({ ...step4, identity_front_file: f })
                }
                error={errors.identity_front_file}
                required
                accept="image/*"
                maxSizeMB={15}
              />
              <FileUploadField
                label="Upload Back Side"
                fileName={step4.identity_back_file?.name}
                onChange={(f) =>
                  setStep4({ ...step4, identity_back_file: f })
                }
                error={errors.identity_back_file}
                required
                accept="image/*"
                maxSizeMB={15}
              />
            </div>
          </div>

          {/* Business Registration Document */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Business Registration Document
              <span className="text-xs text-gray-500 font-normal ml-2">
                (if applicable)
              </span>
            </h3>
            <p className="text-xs text-gray-500">
              Certificate of incorporation / registration or equivalent
              proof of legal business existence.
            </p>
            <FileUploadField
              label="Upload Document"
              fileName={step4.business_reg_doc_file?.name}
              onChange={(f) =>
                setStep4({ ...step4, business_reg_doc_file: f })
              }
              accept="image/*,.pdf"
              maxSizeMB={15}
            />
          </div>

          {/* Tax Document */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Tax Document
            </h3>
            <p className="text-xs text-gray-500">
              Individuals can upload personal tax document.
            </p>
            <FileUploadField
              label="Upload Document"
              fileName={step4.tax_doc_file?.name}
              onChange={(f) =>
                setStep4({ ...step4, tax_doc_file: f })
              }
              error={errors.tax_doc_file}
              required
              accept="image/*,.pdf"
              maxSizeMB={15}
            />
          </div>

          {/* Bank Account Proof */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Bank Account Proof
            </h3>
            <p className="text-xs text-gray-500">
              Cancelled cheque, bank statement, or official bank letter
              confirming ownership.
            </p>
            <FileUploadField
              label="Upload Document"
              fileName={step4.bank_proof_file?.name}
              onChange={(f) =>
                setStep4({ ...step4, bank_proof_file: f })
              }
              error={errors.bank_proof_file}
              required
              accept="image/*,.pdf"
              maxSizeMB={15}
            />
          </div>

          {/* Consent & Compliance */}
          <div className="border border-gray-200 rounded-md p-4 bg-gray-50 space-y-4">
            <h4 className="text-sm font-semibold text-gray-900">
              Consent & Compliance Declaration
            </h4>
            <CheckboxField
              label="I consent to the collection, storage, and verification of my documents for KYC and regulatory compliance purposes."
              description="I understand that verification may require additional documentation and review."
              checked={step4.consent_verification}
              onChange={(v) =>
                setStep4({ ...step4, consent_verification: v })
              }
              error={errors.consent_verification}
            />
            <CheckboxField
              label="I certify that all submitted documents are authentic, valid, and belong to me or my registered business entity."
              checked={step4.consent_authentic}
              onChange={(v) =>
                setStep4({ ...step4, consent_authentic: v })
              }
              error={errors.consent_authentic}
            />
            <CheckboxField
              label="I agree to the Terms & Policies and Seller Agreements."
              checked={step4.consent_terms}
              onChange={(v) =>
                setStep4({ ...step4, consent_terms: v })
              }
              error={errors.consent_terms}
            />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          Buttons
          ═══════════════════════════════════════════════════════ */}
      <div className="flex justify-end gap-3 mt-8 mb-8">
        <button
          onClick={() => onCancel?.()}
          disabled={isSaving}
          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-500 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-900 text-white text-sm font-medium rounded-md hover:bg-blue-800 disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving && <Loader2 size={14} className="animate-spin" />}
          {currentStep === 4
            ? isSaving
              ? 'Submitting...'
              : 'Submit'
            : isSaving
              ? 'Saving...'
              : 'Save & Next'}
        </button>
      </div>
    </div>
  );
};

export default SellerKYCVerification;
