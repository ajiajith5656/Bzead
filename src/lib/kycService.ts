/**
 * KYC Service — Supabase backend for seller KYC verification
 *
 * 4-Step Draft Flow:
 *  Step 1: Personal Information → saves + updates profile
 *  Step 2: Business Information → saves to seller_kyc
 *  Step 3: Bank Details → saves to seller_kyc
 *  Step 4: Document Upload → uploads files, finalizes submission
 *
 * Features:
 *  - Auto-generated KYC Form ID (BZ-KYC-XXXXXXXX)
 *  - Draft resume (seller can resume from last saved step)
 *  - One active KYC per seller (draft or pending)
 *  - Country-specific dropdown data (tax IDs, identity docs)
 */

import { supabase } from './supabase';
import { logger } from '../utils/logger';

// ─── Types ───────────────────────────────────────────────────────

export interface KYCResult {
  success: boolean;
  error: string | null;
  kycFormId?: string;
  referenceNumber?: string;
}

export interface TaxIdType {
  id: string;
  code: string;
  label: string;
  placeholder?: string;
}

export interface IdentityDocType {
  id: string;
  value: string;
  label: string;
}

export interface CountryOption {
  id: string;
  country_name: string;
  country_code: string;
}

export interface BusinessTypeOption {
  id: string;
  type_name: string;
  description?: string;
}

/** Legacy — kept for SellerVerifyUploads backward compat */
export interface KYCSubmitResult {
  success: boolean;
  error: string | null;
  kycId?: string;
}

export interface KYCDocumentUploadResult {
  success: boolean;
  url: string | null;
  error: string | null;
}

export interface KYCRequirement {
  id: string;
  label: string;
  documentType: string;
  required: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────

/** Generate a unique KYC Form ID: BZ-KYC-XXXXXXXX */
export function generateKYCFormId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'BZ-KYC-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ─── File Upload ─────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/webp',
  'image/tiff',
  'image/svg+xml',
  'image/heic',
  'image/heif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

/**
 * Upload a single file to the `kyc-documents` storage bucket.
 * Path: `<sellerId>/<docType>_<timestamp>.<ext>`
 */
export async function uploadKYCDocument(
  sellerId: string,
  file: File,
  docType: string
): Promise<KYCDocumentUploadResult> {
  try {
    if (!sellerId) return { success: false, url: null, error: 'Seller ID missing.' };
    if (!file || file.size === 0) return { success: false, url: null, error: 'No file selected.' };
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        url: null,
        error: `File size (${(file.size / 1024 / 1024).toFixed(1)} MB) exceeds the 15 MB limit.`,
      };
    }

    const mimeType = file.type || 'application/octet-stream';
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return { success: false, url: null, error: `File type "${mimeType}" not supported.` };
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) {
      return { success: false, url: null, error: 'Session expired — please log in again.' };
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = `${sellerId}/${docType}_${Date.now()}.${ext}`;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const uploadUrl = `${supabaseUrl}/storage/v1/object/kyc-documents/${filePath}`;

    const MAX_RETRIES = 2;
    let lastError = '';

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, attempt * 1000));
      try {
        const res = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: anonKey,
            'Content-Type': mimeType,
            'Cache-Control': '3600',
            'x-upsert': 'true',
          },
          body: file,
        });

        if (res.ok) {
          return { success: true, url: `kyc-documents/${filePath}`, error: null };
        }

        const errBody = await res.json().catch(() => ({ message: res.statusText }));
        lastError = errBody.message || `Upload failed (HTTP ${res.status})`;
      } catch (err) {
        lastError = (err as Error).message || 'Network error';
      }

      logger.error(new Error(lastError), {
        context: `KYC doc upload failed (attempt ${attempt + 1}): ${docType}`,
      });
    }

    return { success: false, url: null, error: lastError };
  } catch (err) {
    logger.error(err as Error, { context: 'uploadKYCDocument' });
    return { success: false, url: null, error: (err as Error).message };
  }
}

// ─── Dropdown Data Fetchers ──────────────────────────────────────

export async function fetchCountriesForKYC(): Promise<CountryOption[]> {
  const { data } = await supabase
    .from('countries')
    .select('id, country_name, country_code')
    .eq('is_active', true)
    .order('country_name');
  return (data || []) as CountryOption[];
}

export async function fetchBusinessTypesForKYC(): Promise<BusinessTypeOption[]> {
  const { data } = await supabase
    .from('business_types')
    .select('id, type_name, description')
    .eq('is_active', true)
    .order('type_name');
  return (data || []) as BusinessTypeOption[];
}

export async function fetchTaxIdTypes(countryCode: string): Promise<TaxIdType[]> {
  const { data } = await supabase
    .from('tax_id_types')
    .select('id, code, label, placeholder')
    .eq('country_code', countryCode)
    .eq('is_active', true)
    .order('display_order');

  if (data && data.length > 0) return data as TaxIdType[];

  // Fallback to universal types
  const { data: fallback } = await supabase
    .from('tax_id_types')
    .select('id, code, label, placeholder')
    .or('country_code.is.null,country_code.eq.ALL')
    .eq('is_active', true)
    .order('display_order');

  return (fallback || []) as TaxIdType[];
}

export async function fetchIdentityDocTypes(countryCode: string): Promise<IdentityDocType[]> {
  const { data } = await supabase
    .from('document_types')
    .select('id, value, label')
    .eq('country_code', countryCode)
    .eq('is_active', true)
    .order('display_order');

  if (data && data.length > 0) return data as IdentityDocType[];

  // Fallback to universal types
  const { data: fallback } = await supabase
    .from('document_types')
    .select('id, value, label')
    .or('country_code.is.null,country_code.eq.ALL')
    .eq('is_active', true)
    .order('display_order');

  return (fallback || []) as IdentityDocType[];
}

// ─── KYC Draft Management ────────────────────────────────────────

export async function getSellerKYCDraft(
  sellerId: string
): Promise<{ data: Record<string, any> | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('seller_kyc')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      return { data: null, error: error.message };
    }
    return { data: data || null, error: null };
  } catch (err) {
    return { data: null, error: (err as Error).message };
  }
}

/** Backward-compatible alias used by SellerVerificationPage / Wrapper */
export async function getSellerKYCStatus(
  sellerId: string
): Promise<{ kycData: Record<string, any> | null; error: string | null }> {
  const result = await getSellerKYCDraft(sellerId);
  return { kycData: result.data, error: result.error };
}

// ─── Step Save Functions ─────────────────────────────────────────

/**
 * Save Step 1: Personal Information
 * Creates or updates KYC draft + updates profile with editable fields.
 */
export async function saveKYCStep1(
  sellerId: string,
  data: {
    full_name: string;
    email: string;
    phone: string;
    country_id: string;
    residential_street_1: string;
    residential_street_2: string;
    residential_city: string;
    residential_state: string;
    residential_postal_code: string;
    residential_landmark: string;
  }
): Promise<KYCResult> {
  try {
    // 1. Check for existing KYC
    const { data: existing } = await supabase
      .from('seller_kyc')
      .select('id, kyc_form_id, kyc_status')
      .eq('seller_id', sellerId)
      .single();

    if (existing?.kyc_status === 'pending') {
      return { success: false, error: 'You already have a pending KYC submission.' };
    }
    if (existing?.kyc_status === 'approved') {
      return { success: false, error: 'Your KYC is already approved.' };
    }

    // 2. Update profile with editable fields
    await supabase
      .from('profiles')
      .update({
        full_name: data.full_name,
        phone: data.phone,
        country_id: data.country_id || undefined,
      })
      .eq('id', sellerId);

    // 3. Generate or reuse form ID
    const kycFormId = existing?.kyc_form_id || generateKYCFormId();
    const now = new Date().toISOString();

    const row: Record<string, any> = {
      seller_id: sellerId,
      kyc_form_id: kycFormId,
      current_step: 2,
      kyc_status: 'draft',
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      country_id: data.country_id,
      residential_street_1: data.residential_street_1,
      residential_street_2: data.residential_street_2,
      residential_city: data.residential_city,
      residential_state: data.residential_state,
      residential_postal_code: data.residential_postal_code,
      residential_landmark: data.residential_landmark,
      step1_completed_at: now,
      updated_at: now,
    };

    if (existing) {
      const { error } = await supabase
        .from('seller_kyc')
        .update(row)
        .eq('id', existing.id);
      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase.from('seller_kyc').insert(row);
      if (error) return { success: false, error: error.message };
    }

    return { success: true, error: null, kycFormId };
  } catch (err) {
    logger.error(err as Error, { context: 'saveKYCStep1' });
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Save Step 2: Business Information
 */
export async function saveKYCStep2(
  sellerId: string,
  data: {
    business_type_id: string;
    business_name: string;
    business_reg_number: string;
    tax_id_type: string;
    tax_id_number: string;
    biz_street_1: string;
    biz_street_2: string;
    biz_city: string;
    biz_state: string;
    biz_postal_code: string;
    biz_country_id: string;
    brand_name: string;
    business_declaration: boolean;
  }
): Promise<KYCResult> {
  try {
    // Update profile business_type if changed
    if (data.business_type_id) {
      await supabase
        .from('profiles')
        .update({ business_type_id: data.business_type_id })
        .eq('id', sellerId);
    }

    const { error } = await supabase
      .from('seller_kyc')
      .update({
        current_step: 3,
        business_type_id: data.business_type_id,
        business_name: data.business_name,
        business_reg_number: data.business_reg_number || null,
        tax_id_type: data.tax_id_type,
        tax_id_number: data.tax_id_number,
        biz_street_1: data.biz_street_1,
        biz_street_2: data.biz_street_2,
        biz_city: data.biz_city,
        biz_state: data.biz_state,
        biz_postal_code: data.biz_postal_code,
        biz_country_id: data.biz_country_id,
        brand_name: data.brand_name,
        business_declaration: data.business_declaration,
        step2_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('seller_id', sellerId)
      .eq('kyc_status', 'draft');

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err) {
    logger.error(err as Error, { context: 'saveKYCStep2' });
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Save Step 3: Bank Details
 */
export async function saveKYCStep3(
  sellerId: string,
  data: {
    bank_holder_name: string;
    bank_name: string;
    branch_name: string;
    account_number: string;
    routing_code: string;
    account_type: string;
    account_type_other: string;
    bank_authorization: boolean;
  }
): Promise<KYCResult> {
  try {
    const { error } = await supabase
      .from('seller_kyc')
      .update({
        current_step: 4,
        bank_holder_name: data.bank_holder_name,
        bank_name: data.bank_name,
        branch_name: data.branch_name || null,
        account_number: data.account_number,
        routing_code: data.routing_code,
        account_type: data.account_type,
        account_type_other: data.account_type === 'other' ? data.account_type_other : null,
        bank_authorization: data.bank_authorization,
        step3_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('seller_id', sellerId)
      .eq('kyc_status', 'draft');

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err) {
    logger.error(err as Error, { context: 'saveKYCStep3' });
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Submit Step 4: Upload documents and finalize submission.
 * Sets kyc_status to 'pending' and generates reference number.
 */
export async function submitKYCStep4(
  sellerId: string,
  data: {
    identity_doc_type: string;
    consent_verification: boolean;
    consent_authentic: boolean;
    consent_terms: boolean;
  },
  files: {
    identity_front?: File;
    identity_back?: File;
    business_reg_doc?: File;
    tax_doc?: File;
    bank_proof?: File;
  }
): Promise<KYCResult> {
  try {
    // Upload files
    const urls: Record<string, string> = {};
    const uploads = [
      { key: 'identity_front_url', file: files.identity_front, type: 'identity_front' },
      { key: 'identity_back_url', file: files.identity_back, type: 'identity_back' },
      { key: 'business_reg_doc_url', file: files.business_reg_doc, type: 'business_reg' },
      { key: 'tax_doc_url', file: files.tax_doc, type: 'tax_doc' },
      { key: 'bank_proof_url', file: files.bank_proof, type: 'bank_proof' },
    ];

    for (const u of uploads) {
      if (u.file) {
        const res = await uploadKYCDocument(sellerId, u.file, u.type);
        if (!res.success) {
          return { success: false, error: `${u.type} upload failed: ${res.error}` };
        }
        urls[u.key] = res.url || '';
      }
    }

    // Get form ID for reference
    const { data: kycRow } = await supabase
      .from('seller_kyc')
      .select('kyc_form_id')
      .eq('seller_id', sellerId)
      .eq('kyc_status', 'draft')
      .single();

    const referenceNumber = kycRow?.kyc_form_id || '';
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('seller_kyc')
      .update({
        current_step: 4,
        kyc_status: 'pending',
        identity_doc_type: data.identity_doc_type,
        ...urls,
        consent_verification: data.consent_verification,
        consent_authentic: data.consent_authentic,
        consent_terms: data.consent_terms,
        step4_completed_at: now,
        submitted_at: now,
        reference_number: referenceNumber,
        updated_at: now,
      })
      .eq('seller_id', sellerId)
      .eq('kyc_status', 'draft');

    if (error) return { success: false, error: error.message };

    // Mark profile as not-yet-verified (pending admin review)
    await supabase
      .from('profiles')
      .update({ is_verified: false })
      .eq('id', sellerId);

    return { success: true, error: null, referenceNumber };
  } catch (err) {
    logger.error(err as Error, { context: 'submitKYCStep4' });
    return { success: false, error: (err as Error).message };
  }
}

// ─── Legacy Functions (backward compat for SellerVerifyUploads) ──

/**
 * Fetch country-specific KYC document requirements.
 * @deprecated Use fetchIdentityDocTypes / fetchTaxIdTypes instead.
 */
export async function getKYCRequirementsByCountry(
  countryCode: string
): Promise<KYCRequirement[]> {
  try {
    const { data: countryReqs } = await supabase
      .from('kyc_requirements')
      .select('id, label, document_type, required')
      .eq('country_code', countryCode)
      .eq('is_active', true)
      .order('display_order');

    if (countryReqs && countryReqs.length > 0) {
      return countryReqs.map((r: any) => ({
        id: r.id,
        label: r.label,
        documentType: r.document_type,
        required: r.required,
      }));
    }

    const { data: globalReqs } = await supabase
      .from('kyc_requirements')
      .select('id, label, document_type, required')
      .or('country_code.is.null,country_code.eq.ALL')
      .eq('is_active', true)
      .order('display_order');

    if (globalReqs && globalReqs.length > 0) {
      return globalReqs.map((r: any) => ({
        id: r.id,
        label: r.label,
        documentType: r.document_type,
        required: r.required,
      }));
    }
  } catch {
    // Fallback silently
  }

  return [
    { id: 'seller-img', label: 'Seller Image', documentType: 'photo', required: true },
    { id: 'addr-f', label: 'Seller Address Proof – Front Side', documentType: 'address_front', required: true },
    { id: 'addr-b', label: 'Seller Address Proof – Back Side', documentType: 'address_back', required: true },
    { id: 'biz-addr-f', label: 'Business Address Proof – Front Side', documentType: 'biz_address_front', required: true },
    { id: 'biz-addr-b', label: 'Business Address Proof – Back Side', documentType: 'biz_address_back', required: true },
    { id: 'tax-id', label: 'Tax ID Proof (Personal Or Business)', documentType: 'tax_id', required: true },
    { id: 'bank-stmt', label: 'Bank Statement Or Cancelled Cheque', documentType: 'bank_statement', required: true },
  ];
}

/**
 * Upload a single verification document.
 * @deprecated Use uploadKYCDocument directly.
 */
export async function uploadVerificationDocument(
  sellerId: string,
  docId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<KYCDocumentUploadResult> {
  try {
    onProgress?.(10);

    const ext = file.name.split('.').pop() || 'pdf';
    const filePath = `${sellerId}/verify_${docId}_${Date.now()}.${ext}`;

    onProgress?.(30);

    const { error: uploadError } = await supabase.storage
      .from('kyc-documents')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (uploadError) {
      logger.error(uploadError as unknown as Error, { context: `Verify doc upload: ${docId}` });
      return { success: false, url: null, error: uploadError.message };
    }

    onProgress?.(80);

    const { data: urlData } = supabase.storage
      .from('kyc-documents')
      .getPublicUrl(filePath);

    onProgress?.(100);

    return { success: true, url: urlData?.publicUrl ?? filePath, error: null };
  } catch (err) {
    logger.error(err as Error, { context: `uploadVerificationDocument ${docId}` });
    return { success: false, url: null, error: (err as Error).message };
  }
}

/**
 * Finalize verification document submission.
 * @deprecated Use submitKYCStep4 instead.
 */
export async function finalizeVerificationSubmission(
  sellerId: string,
  documentUrls: Record<string, string>
): Promise<KYCSubmitResult> {
  try {
    const urlMapping: Record<string, string> = {};
    if (documentUrls['tax-id']) urlMapping.tax_doc_url = documentUrls['tax-id'];
    if (documentUrls['addr-f'] || documentUrls['addr-b']) {
      urlMapping.identity_front_url = documentUrls['addr-f'] || documentUrls['addr-b'];
    }
    if (documentUrls['bank-stmt']) urlMapping.bank_proof_url = documentUrls['bank-stmt'];

    const { data: existing } = await supabase
      .from('seller_kyc')
      .select('id')
      .eq('seller_id', sellerId)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('seller_kyc')
        .update({
          kyc_status: 'pending',
          submitted_at: new Date().toISOString(),
          ...urlMapping,
        })
        .eq('seller_id', sellerId);

      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase
        .from('seller_kyc')
        .insert({
          seller_id: sellerId,
          kyc_form_id: generateKYCFormId(),
          kyc_status: 'pending',
          submitted_at: new Date().toISOString(),
          ...urlMapping,
        });

      if (error) return { success: false, error: error.message };
    }

    await supabase
      .from('profiles')
      .update({ is_verified: false })
      .eq('id', sellerId);

    return { success: true, error: null };
  } catch (err) {
    logger.error(err as Error, { context: 'finalizeVerificationSubmission' });
    return { success: false, error: (err as Error).message };
  }
}

// ─── Admin KYC Functions ─────────────────────────────────────────

/** Fetch all KYC submissions (admin only — RLS enforced) */
export async function fetchAllKYCSubmissions(): Promise<{
  data: Record<string, unknown>[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from('seller_kyc')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: (data || []) as Record<string, unknown>[], error: null };
}

/** Admin approves a KYC submission */
export async function approveKYC(
  kycId: string,
  sellerId: string,
  adminId: string
): Promise<KYCResult> {
  const { error } = await supabase
    .from('seller_kyc')
    .update({
      kyc_status: 'approved',
      verified_by_admin: adminId,
      verified_at: new Date().toISOString(),
      rejection_reason: null,
    })
    .eq('id', kycId);

  if (error) return { success: false, error: error.message };

  await supabase
    .from('profiles')
    .update({ is_verified: true, approved: true })
    .eq('id', sellerId);

  return { success: true, error: null };
}

/** Admin rejects a KYC submission */
export async function rejectKYC(
  kycId: string,
  sellerId: string,
  reason: string
): Promise<KYCResult> {
  const { error } = await supabase
    .from('seller_kyc')
    .update({
      kyc_status: 'rejected',
      rejection_reason: reason,
      verified_at: new Date().toISOString(),
    })
    .eq('id', kycId);

  if (error) return { success: false, error: error.message };

  await supabase
    .from('profiles')
    .update({ is_verified: false, approved: false })
    .eq('id', sellerId);

  return { success: true, error: null };
}

/** Admin deletes a KYC submission */
export async function deleteKYC(kycId: string): Promise<KYCResult> {
  const { error } = await supabase
    .from('seller_kyc')
    .delete()
    .eq('id', kycId);

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}

/** Admin updates a KYC record */
export async function updateKYC(
  kycId: string,
  updates: Record<string, unknown>
): Promise<KYCResult> {
  const { error } = await supabase
    .from('seller_kyc')
    .update(updates)
    .eq('id', kycId);

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}
