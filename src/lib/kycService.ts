/**
 * KYC Service — Supabase backend for seller KYC verification
 *
 * Handles:
 *  - Submitting / updating KYC form data to `seller_kyc` table
 *  - Uploading documents to `kyc-documents` storage bucket
 *  - Fetching existing KYC status
 *  - Fetching KYC requirements by country (from `countries` table)
 */

import { supabase } from './supabase';
import { logger } from '../utils/logger';
import type { SellerKYC } from '../types';

// ─── Types ───────────────────────────────────────────────────────

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

// ─── File Upload ─────────────────────────────────────────────────

/** Allowed MIME types for KYC document uploads */
const ALLOWED_KYC_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_KYC_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Upload a single file to the `kyc-documents` storage bucket.
 * Path: `<sellerId>/<docType>_<timestamp>.<ext>`
 *
 * Includes:
 *  - Pre-upload auth-session refresh (prevents stale-token aborts)
 *  - File validation (size + MIME type)
 *  - Automatic retry (up to 2 retries with back-off)
 */
export async function uploadKYCDocument(
  sellerId: string,
  file: File,
  docType: string
): Promise<KYCDocumentUploadResult> {
  try {
    // ── 1. Validate inputs ──────────────────────────────────────
    if (!sellerId) {
      return { success: false, url: null, error: 'Seller ID is missing — please log in again.' };
    }

    if (!file || file.size === 0) {
      return { success: false, url: null, error: 'No file selected or file is empty.' };
    }

    if (file.size > MAX_KYC_FILE_SIZE) {
      return {
        success: false,
        url: null,
        error: `File size (${(file.size / 1024 / 1024).toFixed(1)} MB) exceeds the 10 MB limit.`,
      };
    }

    const mimeType = file.type || 'application/octet-stream';
    if (!ALLOWED_KYC_MIME_TYPES.includes(mimeType)) {
      return {
        success: false,
        url: null,
        error: `File type "${mimeType}" is not supported. Please upload JPEG, PNG, PDF, or DOC/DOCX.`,
      };
    }

    // ── 2. Get the current access token ─────────────────────────
    // Use getSession() to grab the JWT. If the session is dead, fail fast.
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) {
      return { success: false, url: null, error: 'Your session has expired — please log in again.' };
    }

    // ── 3. Build file path ──────────────────────────────────────
    const ext = file.name.split('.').pop() || 'pdf';
    const filePath = `${sellerId}/${docType}_${Date.now()}.${ext}`;

    // ── 4. Upload via direct fetch (bypasses Supabase SDK abort signals) ──
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const uploadUrl = `${supabaseUrl}/storage/v1/object/kyc-documents/${filePath}`;

    const MAX_RETRIES = 2;
    let lastError = '';

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, attempt * 1000));
      }

      try {
        const res = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'apikey': anonKey,
            'Content-Type': mimeType,
            'Cache-Control': '3600',
            'x-upsert': 'true',
          },
          body: file,
        });

        if (res.ok) {
          // Success — build the stored path URL (private bucket, use path reference)
          const storedPath = `kyc-documents/${filePath}`;
          return { success: true, url: storedPath, error: null };
        }

        const errBody = await res.json().catch(() => ({ message: res.statusText }));
        lastError = errBody.message || errBody.error || `Upload failed (HTTP ${res.status})`;
      } catch (fetchErr) {
        lastError = (fetchErr as Error).message || 'Network error during upload';
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

// ─── Submit Complete KYC ─────────────────────────────────────────

/**
 * Upload all attached files, then upsert the KYC record in Supabase.
 */
export async function submitCompleteKYC(
  kycData: SellerKYC,
  sellerId: string
): Promise<KYCSubmitResult> {
  try {
    // Ensure sellerId falls back to auth.uid() if not provided
    let resolvedSellerId = sellerId;
    if (!resolvedSellerId) {
      const { data: { user } } = await supabase.auth.getUser();
      resolvedSellerId = user?.id || '';
      if (!resolvedSellerId) {
        return { success: false, error: 'Not authenticated — please log in again.' };
      }
    }

    // 1. Upload documents if present
    let idDocUrl = kycData.id_document_url || '';
    let addressProofUrl = kycData.address_proof_url || '';
    let bankStatementUrl = kycData.bank_statement_url || '';

    if (kycData.id_document_file) {
      const res = await uploadKYCDocument(resolvedSellerId, kycData.id_document_file, 'id_document');
      if (!res.success) return { success: false, error: `ID document upload failed: ${res.error}` };
      idDocUrl = res.url || '';
    }

    if (kycData.address_proof_file) {
      const res = await uploadKYCDocument(resolvedSellerId, kycData.address_proof_file, 'address_proof');
      if (!res.success) return { success: false, error: `Address proof upload failed: ${res.error}` };
      addressProofUrl = res.url || '';
    }

    if (kycData.bank_statement_file) {
      const res = await uploadKYCDocument(resolvedSellerId, kycData.bank_statement_file, 'bank_statement');
      if (!res.success) return { success: false, error: `Bank statement upload failed: ${res.error}` };
      bankStatementUrl = res.url || '';
    }

    // 2. Prepare the row (strip File objects, they don't go into the DB)
    // Flatten business_address object into individual DB columns
    const addr = kycData.business_address || {} as Record<string, string>;
    const row = {
      seller_id: resolvedSellerId,
      email: kycData.email,
      phone: kycData.phone,
      full_name: kycData.full_name,
      country: kycData.country,
      pan: kycData.pan,
      gstin: kycData.gstin || null,
      id_type: kycData.id_type,
      id_number: kycData.id_number,
      id_document_url: idDocUrl,
      business_street_address_1: (addr as any).street_address_1 || (addr as any).streetAddress1 || '',
      business_street_address_2: (addr as any).street_address_2 || (addr as any).streetAddress2 || '',
      business_city: (addr as any).city || '',
      business_state: (addr as any).state || '',
      business_postal_code: (addr as any).postal_code || (addr as any).postalCode || '',
      business_country: (addr as any).country || kycData.country || '',
      address_proof_url: addressProofUrl,
      bank_holder_name: kycData.bank_holder_name,
      account_number: kycData.account_number,
      account_type: kycData.account_type,
      ifsc_code: kycData.ifsc_code,
      bank_statement_url: bankStatementUrl,
      pep_declaration: kycData.pep_declaration,
      sanctions_check: kycData.sanctions_check,
      aml_compliance: kycData.aml_compliance,
      tax_compliance: kycData.tax_compliance,
      terms_accepted: kycData.terms_accepted,
      kyc_status: 'pending' as const,
      kyc_tier: kycData.kyc_tier,
      submitted_at: new Date().toISOString(),
    };

    // 3. Upsert — if a row already exists for this seller, update it
    const { data, error } = await supabase
      .from('seller_kyc')
      .upsert(row, { onConflict: 'seller_id' })
      .select('id')
      .single();

    if (error) {
      logger.error(error as unknown as Error, { context: 'submitCompleteKYC upsert' });
      return { success: false, error: error.message };
    }

    return { success: true, error: null, kycId: data?.id };
  } catch (err) {
    logger.error(err as Error, { context: 'submitCompleteKYC' });
    return { success: false, error: (err as Error).message };
  }
}

// ─── Upload Verification Documents (Bulk) ────────────────────────

export interface BulkUploadItem {
  id: string;
  label: string;
  file: File;
}

export interface BulkUploadProgress {
  id: string;
  progress: number;
  status: 'uploading' | 'completed' | 'failed';
  url?: string;
  error?: string;
}

/**
 * Upload a single verification document and return the public URL.
 * Called from SellerVerifyUploads for each document slot.
 */
export async function uploadVerificationDocument(
  sellerId: string,
  docId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<KYCDocumentUploadResult> {
  try {
    // Simulate a small progress tick (Supabase JS SDK doesn't expose upload progress)
    onProgress?.(10);

    const ext = file.name.split('.').pop() || 'pdf';
    const filePath = `${sellerId}/verify_${docId}_${Date.now()}.${ext}`;

    onProgress?.(30);

    const { error: uploadError } = await supabase.storage
      .from('kyc-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      logger.error(uploadError as unknown as Error, { context: `Verify doc upload: ${docId}` });
      return { success: false, url: null, error: uploadError.message };
    }

    onProgress?.(80);

    const { data: urlData } = supabase.storage
      .from('kyc-documents')
      .getPublicUrl(filePath);

    onProgress?.(100);

    return {
      success: true,
      url: urlData?.publicUrl ?? filePath,
      error: null,
    };
  } catch (err) {
    logger.error(err as Error, { context: `uploadVerificationDocument ${docId}` });
    return { success: false, url: null, error: (err as Error).message };
  }
}

/**
 * After all verification docs are uploaded, update the KYC record
 * with the document URLs and mark submitted.
 */
export async function finalizeVerificationSubmission(
  sellerId: string,
  documentUrls: Record<string, string>
): Promise<KYCSubmitResult> {
  try {
    // Map uploaded doc IDs to the correct DB columns
    const urlMapping: Record<string, string> = {};
    if (documentUrls['tax-id']) urlMapping.id_document_url = documentUrls['tax-id'];
    if (documentUrls['addr-f'] || documentUrls['addr-b']) {
      urlMapping.address_proof_url = documentUrls['addr-f'] || documentUrls['addr-b'];
    }
    if (documentUrls['bank-stmt']) urlMapping.bank_statement_url = documentUrls['bank-stmt'];

    // Store all document URLs together in a JSONB-friendly object
    const verificationDocs = { ...documentUrls };

    // Check if KYC record exists; if not, create a minimal one
    const { data: existing } = await supabase
      .from('seller_kyc')
      .select('id, business_address')
      .eq('seller_id', sellerId)
      .single();

    if (existing) {
      // Merge verification doc URLs into business_address JSONB
      const currentAddress = (existing.business_address as Record<string, unknown>) || {};
      const updatedAddress = { ...currentAddress, verification_documents: verificationDocs };

      const { error } = await supabase
        .from('seller_kyc')
        .update({
          kyc_status: 'pending',
          submitted_at: new Date().toISOString(),
          business_address: updatedAddress,
          ...urlMapping,
        })
        .eq('seller_id', sellerId);

      if (error) {
        return { success: false, error: error.message };
      }
    } else {
      // Create a new record with document URLs
      const { error } = await supabase
        .from('seller_kyc')
        .insert({
          seller_id: sellerId,
          email: '',
          kyc_status: 'pending',
          submitted_at: new Date().toISOString(),
          business_address: { verification_documents: verificationDocs },
          ...urlMapping,
        });

      if (error) {
        return { success: false, error: error.message };
      }
    }

    // Also update profile verification status
    await supabase
      .from('profiles')
      .update({ is_verified: false }) // Will become true after admin approval
      .eq('id', sellerId);

    return { success: true, error: null };
  } catch (err) {
    logger.error(err as Error, { context: 'finalizeVerificationSubmission' });
    return { success: false, error: (err as Error).message };
  }
}

// ─── Fetch KYC Status ────────────────────────────────────────────

export async function getSellerKYCStatus(
  sellerId: string
): Promise<{ kycData: Partial<SellerKYC> | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('seller_kyc')
      .select('*')
      .eq('seller_id', sellerId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows — not really an error for first-time sellers
      return { kycData: null, error: error.message };
    }

    return { kycData: data as Partial<SellerKYC> | null, error: null };
  } catch (err) {
    return { kycData: null, error: (err as Error).message };
  }
}

// ─── KYC Requirements by Country ─────────────────────────────────

/**
 * Fetch country-specific KYC document requirements from the
 * `kyc_requirements` table. Falls back to a standard set if
 * no DB rows are found.
 */
export async function getKYCRequirementsByCountry(
  countryCode: string
): Promise<KYCRequirement[]> {
  try {
    // Try country-specific requirements first
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

    // Try global/default requirements (country_code = 'ALL' or NULL)
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
    // Fallback silently to default set
  }

  // Hardcoded fallback only if DB has no rows at all
  return [
    { id: 'seller-img',  label: 'Seller Image',                          documentType: 'photo',            required: true },
    { id: 'addr-f',      label: 'Seller Address Proof – Front Side',     documentType: 'address_front',    required: true },
    { id: 'addr-b',      label: 'Seller Address Proof – Back Side',      documentType: 'address_back',     required: true },
    { id: 'biz-addr-f',  label: 'Business Address Proof – Front Side',   documentType: 'biz_address_front',required: true },
    { id: 'biz-addr-b',  label: 'Business Address Proof – Back Side',    documentType: 'biz_address_back', required: true },
    { id: 'tax-id',      label: 'Tax ID Proof (Personal Or Business)',    documentType: 'tax_id',           required: true },
    { id: 'bank-stmt',   label: 'Bank Statement Or Cancelled Cheque',    documentType: 'bank_statement',   required: true },
  ];
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
): Promise<KYCSubmitResult> {
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

  // Mark profile as verified + approved
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
): Promise<KYCSubmitResult> {
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
export async function deleteKYC(kycId: string): Promise<KYCSubmitResult> {
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
): Promise<KYCSubmitResult> {
  const { error } = await supabase
    .from('seller_kyc')
    .update(updates)
    .eq('id', kycId);

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}
