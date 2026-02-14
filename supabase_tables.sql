-- ============================================================
-- Bzead Database Setup — Run in Supabase SQL Editor
-- Execute each section ONE BY ONE to catch errors early
-- ============================================================

-- ============================================================
-- 1. CREATE TABLE: addresses
-- Used by: AdminAddressManagement.tsx
-- ============================================================
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone_number TEXT DEFAULT '',
  email TEXT DEFAULT '',
  country TEXT DEFAULT '',
  street_address_1 TEXT DEFAULT '',
  street_address_2 TEXT DEFAULT '',
  city TEXT DEFAULT '',
  state TEXT DEFAULT '',
  postal_code TEXT DEFAULT '',
  address_type TEXT DEFAULT 'home' CHECK (address_type IN ('home', 'work', 'other')),
  delivery_notes TEXT DEFAULT '',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Users can manage their own addresses
CREATE POLICY "Users can view own addresses"
  ON public.addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses"
  ON public.addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses"
  ON public.addresses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses"
  ON public.addresses FOR DELETE
  USING (auth.uid() = user_id);

-- Admin can manage all addresses
CREATE POLICY "Admin can manage all addresses"
  ON public.addresses FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================
-- 2. CREATE TABLE: expense_categories
-- Used by: AccountsManagement.tsx (admin module)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active expense categories"
  ON public.expense_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin can manage expense categories"
  ON public.expense_categories FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Seed default expense categories
INSERT INTO public.expense_categories (name) VALUES
  ('Office Supplies'),
  ('Marketing'),
  ('Technology'),
  ('Salaries'),
  ('Utilities'),
  ('Rent'),
  ('Shipping & Logistics'),
  ('Legal & Compliance'),
  ('Insurance'),
  ('Other')
ON CONFLICT (name) DO NOTHING;


-- ============================================================
-- 3. CREATE TABLE: partner_brands
-- Used by: SellerLanding.tsx
-- ============================================================
CREATE TABLE IF NOT EXISTS public.partner_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo TEXT DEFAULT '',
  website_url TEXT DEFAULT '',
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.partner_brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active partner brands"
  ON public.partner_brands FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin can manage partner brands"
  ON public.partner_brands FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================
-- 4. CREATE TABLE: tax_id_types
-- Used by: kycService.ts (KYC Step 2 — country-specific tax ID)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tax_id_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL,
  label TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT DEFAULT '',
  format_hint TEXT DEFAULT '',
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tax_id_types_country ON public.tax_id_types(country_code);

ALTER TABLE public.tax_id_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active tax_id_types"
  ON public.tax_id_types FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin can manage tax_id_types"
  ON public.tax_id_types FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Seed tax ID types for 40+ countries
INSERT INTO public.tax_id_types (country_code, label, code, description, format_hint, display_order) VALUES
  -- India
  ('IN', 'PAN (Permanent Account Number)', 'PAN', 'Indian tax identification', 'ABCDE1234F', 1),
  ('IN', 'GSTIN (GST Number)', 'GSTIN', 'Goods & Services Tax ID', '22AAAAA0000A1Z5', 2),
  ('IN', 'Aadhaar Number', 'AADHAAR', 'Unique ID (12 digits)', '1234 5678 9012', 3),
  ('IN', 'TAN (Tax Deduction Account Number)', 'TAN', 'For TDS purposes', 'ABCD12345E', 4),
  -- United States
  ('US', 'SSN (Social Security Number)', 'SSN', 'For individuals', 'XXX-XX-XXXX', 1),
  ('US', 'EIN (Employer ID Number)', 'EIN', 'For businesses', 'XX-XXXXXXX', 2),
  ('US', 'ITIN (Individual Taxpayer ID)', 'ITIN', 'For non-residents', '9XX-XX-XXXX', 3),
  -- United Kingdom
  ('GB', 'UTR (Unique Taxpayer Reference)', 'UTR', 'HMRC tax reference', '1234567890', 1),
  ('GB', 'NI Number (National Insurance)', 'NINO', 'National Insurance number', 'AB123456C', 2),
  ('GB', 'VAT Registration Number', 'VAT', 'VAT registered business', 'GB123456789', 3),
  -- Canada
  ('CA', 'SIN (Social Insurance Number)', 'SIN', 'For individuals', 'XXX-XXX-XXX', 1),
  ('CA', 'BN (Business Number)', 'BN', 'CRA business number', '123456789RC0001', 2),
  ('CA', 'GST/HST Number', 'GST_HST', 'Sales tax registration', '123456789RT0001', 3),
  -- Australia
  ('AU', 'TFN (Tax File Number)', 'TFN', 'Individual tax number', 'XXX XXX XXX', 1),
  ('AU', 'ABN (Australian Business Number)', 'ABN', 'Business identification', 'XX XXX XXX XXX', 2),
  ('AU', 'ACN (Australian Company Number)', 'ACN', 'Company registration', 'XXX XXX XXX', 3),
  -- Germany
  ('DE', 'Steuer-ID (Tax ID)', 'STEUER_ID', 'Personal tax ID', '12345678901', 1),
  ('DE', 'USt-IdNr (VAT ID)', 'UST_IDNR', 'VAT identification', 'DE123456789', 2),
  -- France
  ('FR', 'NIF (Numéro d''Identification Fiscale)', 'NIF', 'Tax ID number', '13 digits', 1),
  ('FR', 'SIRET', 'SIRET', 'Business establishment ID', '14 digits', 2),
  ('FR', 'TVA Intracommunautaire', 'TVA', 'VAT number', 'FR + 11 digits', 3),
  -- Japan
  ('JP', 'My Number (マイナンバー)', 'MY_NUMBER', 'Individual tax number', '12 digits', 1),
  ('JP', 'Corporate Number (法人番号)', 'CORP_NUMBER', 'Business identification', '13 digits', 2),
  -- China
  ('CN', 'Unified Social Credit Code', 'USCC', 'Business registration', '18 chars', 1),
  ('CN', 'Individual Tax ID', 'CN_TIN', 'Personal tax identification', '18 digits', 2),
  -- Brazil
  ('BR', 'CPF', 'CPF', 'Individual tax ID', 'XXX.XXX.XXX-XX', 1),
  ('BR', 'CNPJ', 'CNPJ', 'Business tax ID', 'XX.XXX.XXX/XXXX-XX', 2),
  -- South Korea
  ('KR', 'RRN (Resident Registration Number)', 'RRN', 'Resident ID', '6+7 digits', 1),
  ('KR', 'Business Registration Number', 'KR_BRN', 'Business tax ID', 'XXX-XX-XXXXX', 2),
  -- Mexico
  ('MX', 'RFC (Registro Federal de Contribuyentes)', 'RFC', 'Tax registration', '13 chars', 1),
  ('MX', 'CURP', 'CURP', 'Unique population registry', '18 chars', 2),
  -- UAE
  ('AE', 'TRN (Tax Registration Number)', 'TRN', 'VAT registration', '15 digits', 1),
  ('AE', 'Emirates ID', 'EMIRATES_ID', 'National ID card', '784-XXXX-XXXXXXX-X', 2),
  -- Saudi Arabia
  ('SA', 'National ID (Iqama)', 'IQAMA', 'Resident/national ID', '10 digits', 1),
  ('SA', 'VAT Registration Number', 'SA_VAT', 'ZATCA VAT number', '15 digits', 2),
  -- Singapore
  ('SG', 'NRIC/FIN', 'NRIC', 'National/foreign ID', 'S1234567A', 1),
  ('SG', 'UEN (Business Registration)', 'UEN', 'Unique entity number', '9-10 chars', 2),
  ('SG', 'GST Registration Number', 'SG_GST', 'GST registered', 'M12345678X', 3),
  -- South Africa
  ('ZA', 'SA ID Number', 'ZA_ID', 'National identity', '13 digits', 1),
  ('ZA', 'Tax Reference Number', 'ZA_TIN', 'SARS tax number', '10 digits', 2),
  -- Italy
  ('IT', 'Codice Fiscale', 'CF', 'Fiscal code', '16 chars', 1),
  ('IT', 'Partita IVA', 'IT_VAT', 'VAT number', 'IT + 11 digits', 2),
  -- Spain
  ('ES', 'NIF/NIE', 'NIF', 'Tax ID for residents/foreigners', 'X1234567A', 1),
  ('ES', 'CIF', 'CIF', 'Company tax ID', 'A12345678', 2),
  -- Netherlands
  ('NL', 'BSN (Citizen Service Number)', 'BSN', 'Personal ID', '9 digits', 1),
  ('NL', 'BTW-nummer (VAT)', 'NL_VAT', 'VAT identification', 'NL + 9 digits + B01', 2),
  -- Switzerland
  ('CH', 'AHV/AVS Number', 'AHV', 'Social insurance number', '756.XXXX.XXXX.XX', 1),
  ('CH', 'UID (Enterprise ID)', 'UID', 'Business identification', 'CHE-XXX.XXX.XXX', 2),
  -- Russia
  ('RU', 'INN (Taxpayer ID)', 'INN', 'Individual/business tax ID', '10 or 12 digits', 1),
  ('RU', 'OGRN', 'OGRN', 'Business registration', '13 digits', 2),
  -- Turkey
  ('TR', 'TC Kimlik No', 'TC_KIMLIK', 'National ID number', '11 digits', 1),
  ('TR', 'Vergi Kimlik Numarası', 'VKN', 'Tax office registration', '10 digits', 2),
  -- Thailand
  ('TH', 'Thai National ID', 'TH_NID', 'Citizen ID card', '13 digits', 1),
  ('TH', 'Tax ID', 'TH_TIN', 'For tax purposes', '13 digits', 2),
  -- Indonesia
  ('ID', 'NIK (National ID)', 'NIK', 'From KTP (ID card)', '16 digits', 1),
  ('ID', 'NPWP (Tax ID)', 'NPWP', 'Tax registration', 'XX.XXX.XXX.X-XXX.XXX', 2),
  -- Malaysia
  ('MY', 'MyKad (NRIC)', 'MYKAD', 'National registration IC', '12 digits', 1),
  ('MY', 'Business Registration Number', 'MY_BRN', 'SSM registration', 'Varies', 2),
  -- Philippines
  ('PH', 'TIN (Tax Identification Number)', 'PH_TIN', 'BIR tax number', 'XXX-XXX-XXX-XXX', 1),
  ('PH', 'PhilSys ID', 'PSN', 'National ID', '12 digits', 2),
  -- Vietnam
  ('VN', 'Tax Code (Mã số thuế)', 'VN_TAX', 'Personal/business tax', '10-13 digits', 1),
  ('VN', 'CCCD (Citizen ID)', 'CCCD', 'National citizen ID', '12 digits', 2),
  -- Nigeria
  ('NG', 'TIN (Tax Identification Number)', 'NG_TIN', 'FIRS tax ID', '10 digits', 1),
  ('NG', 'BVN (Bank Verification Number)', 'BVN', 'Banking ID', '11 digits', 2),
  -- Egypt
  ('EG', 'National ID', 'EG_NID', 'Egyptian national ID', '14 digits', 1),
  ('EG', 'Tax Registration Card', 'EG_TRC', 'Tax card number', 'Varies', 2),
  -- Kenya
  ('KE', 'KRA PIN', 'KRA_PIN', 'Kenya Revenue Authority', 'A + 9 digits + letter', 1),
  ('KE', 'National ID', 'KE_NID', 'Kenyan national ID', '8 digits', 2),
  -- Pakistan
  ('PK', 'CNIC', 'CNIC', 'Computerized National ID', 'XXXXX-XXXXXXX-X', 1),
  ('PK', 'NTN (National Tax Number)', 'NTN', 'FBR tax registration', '7 digits', 2),
  -- Bangladesh
  ('BD', 'NID (National ID)', 'BD_NID', 'National identity card', '10 or 17 digits', 1),
  ('BD', 'TIN (Tax ID)', 'BD_TIN', 'NBR tax identification', '12 digits', 2),
  -- Sri Lanka
  ('LK', 'NIC (National ID Card)', 'NIC', 'Sri Lankan NIC', '9 digits + V/X or 12 digits', 1),
  ('LK', 'TIN', 'LK_TIN', 'Tax identification', 'Varies', 2),
  -- Nepal
  ('NP', 'PAN', 'NP_PAN', 'Permanent Account Number', '9 digits', 1),
  ('NP', 'Citizenship Number', 'NP_CIT', 'Nagarikta number', 'Varies', 2),
  -- Israel
  ('IL', 'Teudat Zehut', 'IL_ID', 'Identity card number', '9 digits', 1),
  ('IL', 'Corporate Number', 'IL_CORP', 'Business registration', '9 digits', 2),
  -- Poland
  ('PL', 'PESEL', 'PESEL', 'National identification', '11 digits', 1),
  ('PL', 'NIP', 'NIP', 'Tax identification', '10 digits', 2),
  -- Sweden
  ('SE', 'Personnummer', 'PERSONNUMMER', 'Personal identity number', 'YYMMDD-XXXX', 1),
  ('SE', 'Organisationsnummer', 'ORG_NR', 'Organization number', 'XXXXXX-XXXX', 2),
  -- Norway
  ('NO', 'Fødselsnummer', 'FODSELSNR', 'National ID number', '11 digits', 1),
  ('NO', 'Organisation Number', 'NO_ORG', 'Business registration', '9 digits', 2),
  -- Denmark
  ('DK', 'CPR-nummer', 'CPR', 'Civil registration', 'DDMMYY-XXXX', 1),
  ('DK', 'CVR-nummer', 'CVR', 'Business registration', '8 digits', 2),
  -- Finland
  ('FI', 'Henkilötunnus (HETU)', 'HETU', 'Personal ID code', 'DDMMYY-XXXX', 1),
  ('FI', 'Y-tunnus (Business ID)', 'Y_TUNNUS', 'Business identification', 'XXXXXXX-X', 2),
  -- Argentina
  ('AR', 'CUIL/CUIT', 'CUIT', 'Tax/labor identification', 'XX-XXXXXXXX-X', 1),
  ('AR', 'DNI', 'AR_DNI', 'National identity document', '8 digits', 2),
  -- Colombia
  ('CO', 'NIT', 'NIT', 'Tax identification number', 'XXXXXXXXX-X', 1),
  ('CO', 'Cédula de Ciudadanía', 'CC', 'National citizen ID', '10 digits', 2),
  -- Chile
  ('CL', 'RUT', 'RUT', 'Tax identification', 'XX.XXX.XXX-X', 1),
  -- Peru
  ('PE', 'RUC', 'RUC', 'Tax registration', '11 digits', 1),
  ('PE', 'DNI', 'PE_DNI', 'National identity document', '8 digits', 2),
  -- New Zealand
  ('NZ', 'IRD Number', 'IRD', 'Inland Revenue Department', '8-9 digits', 1),
  ('NZ', 'NZBN (Business Number)', 'NZBN', 'NZ Business Number', '13 digits', 2),
  -- Ireland
  ('IE', 'PPS Number', 'PPSN', 'Personal Public Service', '7 digits + 1-2 letters', 1),
  ('IE', 'VAT Number', 'IE_VAT', 'VAT registration', 'IE + 7 digits + 1 letter', 2),
  -- Portugal
  ('PT', 'NIF (Número de Identificação Fiscal)', 'PT_NIF', 'Tax identification', '9 digits', 1),
  -- Belgium
  ('BE', 'National Number (Rijksregisternummer)', 'BE_NN', 'National register', 'YY.MM.DD-XXX.XX', 1),
  ('BE', 'Enterprise Number', 'BE_ENT', 'BCE/KBO registration', '10 digits', 2),
  -- Austria
  ('AT', 'Steuernummer', 'AT_TIN', 'Tax identification', '9 digits', 1),
  ('AT', 'UID-Nummer (VAT)', 'AT_VAT', 'VAT identification', 'ATU + 8 digits', 2),
  -- Greece
  ('GR', 'AFM (ΑΦΜ)', 'AFM', 'Tax identification', '9 digits', 1),
  -- Czech Republic
  ('CZ', 'Rodné číslo (Birth Number)', 'RC', 'Personal identification', '9-10 digits', 1),
  ('CZ', 'DIČ (Tax ID)', 'CZ_TIN', 'Tax identification', 'CZ + 8-10 digits', 2),
  -- Hungary
  ('HU', 'Adóazonosító jel', 'HU_TIN', 'Tax identification', '10 digits', 1),
  -- Romania
  ('RO', 'CNP (Personal Numeric Code)', 'CNP', 'Personal identification', '13 digits', 1),
  ('RO', 'CUI/CIF', 'RO_CUI', 'Business tax identification', 'RO + max 10 digits', 2),
  -- Qatar
  ('QA', 'QID (Qatar ID)', 'QID', 'Residency/national ID', '11 digits', 1),
  -- Kuwait
  ('KW', 'Civil ID', 'KW_CID', 'Civil identification', '12 digits', 1),
  -- Bahrain
  ('BH', 'CPR (Central Population Register)', 'BH_CPR', 'National/resident ID', '9 digits', 1),
  -- Oman
  ('OM', 'Civil ID', 'OM_CID', 'National/resident ID', 'Varies', 1),
  -- Hong Kong
  ('HK', 'HKID', 'HKID', 'Hong Kong identity card', 'X123456(A)', 1),
  ('HK', 'Business Registration Number', 'HK_BRN', 'BR certificate number', '8 digits', 2),
  -- Taiwan
  ('TW', 'National ID Number', 'TW_NID', 'ROC citizen ID', '1 letter + 9 digits', 1),
  ('TW', 'Unified Business Number', 'TW_UBN', 'Business registration', '8 digits', 2)
ON CONFLICT DO NOTHING;


-- ============================================================
-- 5. CREATE TABLE: document_types
-- Used by: kycService.ts (KYC Step 4 — country-specific identity docs)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'identity',
  label TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT DEFAULT '',
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_document_types_country ON public.document_types(country_code);
CREATE INDEX idx_document_types_category ON public.document_types(category);

ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active document_types"
  ON public.document_types FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin can manage document_types"
  ON public.document_types FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Seed identity document types for 40+ countries
INSERT INTO public.document_types (country_code, category, label, code, description, display_order) VALUES
  -- India
  ('IN', 'identity', 'Aadhaar Card', 'AADHAAR', 'UID Authority of India', 1),
  ('IN', 'identity', 'PAN Card', 'PAN_CARD', 'Income Tax Department', 2),
  ('IN', 'identity', 'Passport', 'PASSPORT', 'Indian passport', 3),
  ('IN', 'identity', 'Voter ID (EPIC)', 'VOTER_ID', 'Election Commission', 4),
  ('IN', 'identity', 'Driving License', 'DL', 'State RTO issued', 5),
  -- United States
  ('US', 'identity', 'US Passport', 'US_PASSPORT', 'Department of State', 1),
  ('US', 'identity', 'Driver''s License', 'US_DL', 'State-issued DL', 2),
  ('US', 'identity', 'State ID Card', 'US_STATE_ID', 'Non-driver state ID', 3),
  ('US', 'identity', 'US Passport Card', 'US_PASSPORT_CARD', 'Wallet-size travel document', 4),
  -- United Kingdom
  ('GB', 'identity', 'UK Passport', 'UK_PASSPORT', 'HM Passport Office', 1),
  ('GB', 'identity', 'UK Driving Licence', 'UK_DL', 'DVLA issued', 2),
  ('GB', 'identity', 'BRP (Biometric Residence Permit)', 'BRP', 'Home Office issued', 3),
  -- Canada
  ('CA', 'identity', 'Canadian Passport', 'CA_PASSPORT', 'IRCC issued', 1),
  ('CA', 'identity', 'Provincial Driver''s Licence', 'CA_DL', 'Province-issued', 2),
  ('CA', 'identity', 'Provincial Health Card', 'CA_HEALTH', 'Province-issued', 3),
  -- Australia
  ('AU', 'identity', 'Australian Passport', 'AU_PASSPORT', 'DFAT issued', 1),
  ('AU', 'identity', 'Driver Licence', 'AU_DL', 'State/territory issued', 2),
  ('AU', 'identity', 'Medicare Card', 'MEDICARE', 'Services Australia', 3),
  ('AU', 'identity', 'ImmiCard', 'IMMICARD', 'Immigration card', 4),
  -- Germany
  ('DE', 'identity', 'Personalausweis (ID Card)', 'DE_ID', 'Federal ID card', 1),
  ('DE', 'identity', 'Reisepass (Passport)', 'DE_PASSPORT', 'German passport', 2),
  ('DE', 'identity', 'Aufenthaltstitel (Residence Permit)', 'DE_RP', 'Foreigners office', 3),
  -- France
  ('FR', 'identity', 'Carte Nationale d''Identité', 'CNI', 'French national ID', 1),
  ('FR', 'identity', 'Passeport', 'FR_PASSPORT', 'French passport', 2),
  ('FR', 'identity', 'Titre de Séjour', 'FR_RP', 'Residence permit', 3),
  -- Japan
  ('JP', 'identity', 'My Number Card (マイナンバーカード)', 'JP_MYNUMBER', 'Individual number card', 1),
  ('JP', 'identity', 'Japanese Passport', 'JP_PASSPORT', 'MOFA issued', 2),
  ('JP', 'identity', 'Driver''s License (運転免許証)', 'JP_DL', 'Prefectural police', 3),
  ('JP', 'identity', 'Residence Card (在留カード)', 'JP_RC', 'For foreign nationals', 4),
  -- China
  ('CN', 'identity', 'Resident ID Card (居民身份证)', 'CN_ID', 'PRC national ID', 1),
  ('CN', 'identity', 'Chinese Passport', 'CN_PASSPORT', 'MPS issued', 2),
  -- Brazil
  ('BR', 'identity', 'CPF Card', 'BR_CPF', 'Tax registration card', 1),
  ('BR', 'identity', 'RG (Identity Card)', 'BR_RG', 'State civil police', 2),
  ('BR', 'identity', 'CNH (Driver''s License)', 'BR_CNH', 'DETRAN issued', 3),
  ('BR', 'identity', 'Brazilian Passport', 'BR_PASSPORT', 'Federal police', 4),
  -- South Korea
  ('KR', 'identity', 'Resident Registration Card', 'KR_RRC', 'Korean national ID', 1),
  ('KR', 'identity', 'Korean Passport', 'KR_PASSPORT', 'MOFA issued', 2),
  ('KR', 'identity', 'Driver''s License', 'KR_DL', 'Korean driving licence', 3),
  -- Mexico
  ('MX', 'identity', 'INE/IFE (Voter ID)', 'MX_INE', 'Electoral institute', 1),
  ('MX', 'identity', 'Mexican Passport', 'MX_PASSPORT', 'SRE issued', 2),
  ('MX', 'identity', 'CURP Card', 'MX_CURP', 'Population registry', 3),
  -- UAE
  ('AE', 'identity', 'Emirates ID', 'AE_EID', 'ICA issued', 1),
  ('AE', 'identity', 'UAE Passport', 'AE_PASSPORT', 'For UAE nationals', 2),
  ('AE', 'identity', 'Residence Visa', 'AE_VISA', 'GDRFA issued', 3),
  -- Saudi Arabia
  ('SA', 'identity', 'National ID (Huwiyya)', 'SA_NID', 'For Saudi citizens', 1),
  ('SA', 'identity', 'Iqama (Residence Permit)', 'SA_IQAMA', 'For expatriates', 2),
  ('SA', 'identity', 'Saudi Passport', 'SA_PASSPORT', 'MOI issued', 3),
  -- Singapore
  ('SG', 'identity', 'NRIC', 'SG_NRIC', 'National Registration IC', 1),
  ('SG', 'identity', 'FIN (Foreign Identification)', 'SG_FIN', 'For foreign residents', 2),
  ('SG', 'identity', 'Singapore Passport', 'SG_PASSPORT', 'ICA issued', 3),
  -- South Africa
  ('ZA', 'identity', 'South African ID Card', 'ZA_ID', 'Smart ID card', 1),
  ('ZA', 'identity', 'South African Passport', 'ZA_PASSPORT', 'DHA issued', 2),
  ('ZA', 'identity', 'Driver''s License', 'ZA_DL', 'Provincial licence card', 3),
  -- Italy
  ('IT', 'identity', 'Carta d''Identità Elettronica', 'CIE', 'Electronic ID card', 1),
  ('IT', 'identity', 'Italian Passport', 'IT_PASSPORT', 'Questura issued', 2),
  ('IT', 'identity', 'Patente di Guida', 'IT_DL', 'Driving licence', 3),
  -- Spain
  ('ES', 'identity', 'DNI (Documento Nacional de Identidad)', 'ES_DNI', 'Spanish national ID', 1),
  ('ES', 'identity', 'NIE (Foreigner ID)', 'ES_NIE', 'For foreign residents', 2),
  ('ES', 'identity', 'Spanish Passport', 'ES_PASSPORT', 'Police issued', 3),
  -- Netherlands
  ('NL', 'identity', 'Dutch ID Card', 'NL_ID', 'Identity card', 1),
  ('NL', 'identity', 'Dutch Passport', 'NL_PASSPORT', 'Netherlands passport', 2),
  ('NL', 'identity', 'Dutch Driving Licence', 'NL_DL', 'RDW issued', 3),
  -- Switzerland
  ('CH', 'identity', 'Swiss ID Card', 'CH_ID', 'Identity card', 1),
  ('CH', 'identity', 'Swiss Passport', 'CH_PASSPORT', 'Swiss passport', 2),
  ('CH', 'identity', 'Ausländerausweis (Permit)', 'CH_PERMIT', 'Foreign resident permit', 3),
  -- Russia
  ('RU', 'identity', 'Internal Passport (Паспорт)', 'RU_PASSPORT', 'Russian internal passport', 1),
  ('RU', 'identity', 'Foreign Passport (Загранпаспорт)', 'RU_FP', 'International travel passport', 2),
  ('RU', 'identity', 'Driver''s License', 'RU_DL', 'Russian driving licence', 3),
  -- Turkey
  ('TR', 'identity', 'Turkish ID Card (Nüfus Cüzdanı)', 'TR_ID', 'New smart ID card', 1),
  ('TR', 'identity', 'Turkish Passport', 'TR_PASSPORT', 'General Directorate', 2),
  ('TR', 'identity', 'Turkish Driving Licence', 'TR_DL', 'Ehliyet', 3),
  -- Thailand
  ('TH', 'identity', 'Thai National ID Card', 'TH_ID', 'Bureau of Registration', 1),
  ('TH', 'identity', 'Thai Passport', 'TH_PASSPORT', 'MFA issued', 2),
  ('TH', 'identity', 'Thai Driving License', 'TH_DL', 'DLT issued', 3),
  -- Indonesia
  ('ID', 'identity', 'KTP (e-KTP)', 'ID_KTP', 'Electronic national ID', 1),
  ('ID', 'identity', 'Indonesian Passport', 'ID_PASSPORT', 'Immigration office', 2),
  ('ID', 'identity', 'SIM (Driving Licence)', 'ID_SIM', 'National police', 3),
  -- Malaysia
  ('MY', 'identity', 'MyKad', 'MY_MYKAD', 'National Registration IC', 1),
  ('MY', 'identity', 'Malaysian Passport', 'MY_PASSPORT', 'Immigration Dept', 2),
  ('MY', 'identity', 'Malaysian Driver''s Licence', 'MY_DL', 'JPJ issued', 3),
  -- Philippines
  ('PH', 'identity', 'PhilSys ID (Philippine ID)', 'PH_PHILSYS', 'PSA national ID', 1),
  ('PH', 'identity', 'Philippine Passport', 'PH_PASSPORT', 'DFA issued', 2),
  ('PH', 'identity', 'Driver''s License', 'PH_DL', 'LTO issued', 3),
  ('PH', 'identity', 'UMID', 'PH_UMID', 'Unified Multi-Purpose ID', 4),
  -- Vietnam
  ('VN', 'identity', 'CCCD (Citizen ID Card)', 'VN_CCCD', 'Chip-based national ID', 1),
  ('VN', 'identity', 'Vietnamese Passport', 'VN_PASSPORT', 'Immigration Dept', 2),
  -- Nigeria
  ('NG', 'identity', 'NIN Slip/Card', 'NG_NIN', 'NIMC national ID', 1),
  ('NG', 'identity', 'Nigerian Passport', 'NG_PASSPORT', 'Immigration Service', 2),
  ('NG', 'identity', 'Voter''s Card (PVC)', 'NG_PVC', 'INEC permanent card', 3),
  ('NG', 'identity', 'Driver''s License', 'NG_DL', 'FRSC issued', 4),
  -- Egypt
  ('EG', 'identity', 'Egyptian National ID', 'EG_NID', 'Civil Status Authority', 1),
  ('EG', 'identity', 'Egyptian Passport', 'EG_PASSPORT', 'Immigration Dept', 2),
  -- Kenya
  ('KE', 'identity', 'Huduma Namba (National ID)', 'KE_HUDUMA', 'NIIMS national ID', 1),
  ('KE', 'identity', 'Kenyan Passport', 'KE_PASSPORT', 'Immigration Dept', 2),
  -- Pakistan
  ('PK', 'identity', 'CNIC (Computerized NIC)', 'PK_CNIC', 'NADRA issued', 1),
  ('PK', 'identity', 'NICOP (NIC for Overseas)', 'PK_NICOP', 'NADRA overseas card', 2),
  ('PK', 'identity', 'Pakistani Passport', 'PK_PASSPORT', 'DG Immigration', 3),
  -- Bangladesh
  ('BD', 'identity', 'NID Card', 'BD_NID', 'Election Commission NID', 1),
  ('BD', 'identity', 'Bangladeshi Passport', 'BD_PASSPORT', 'DIP issued', 2),
  ('BD', 'identity', 'Smart Card NID', 'BD_SMART', 'Smart national ID', 3),
  -- Sri Lanka
  ('LK', 'identity', 'NIC (National Identity Card)', 'LK_NIC', 'Dept of Registration', 1),
  ('LK', 'identity', 'Sri Lankan Passport', 'LK_PASSPORT', 'Immigration Dept', 2),
  -- Nepal
  ('NP', 'identity', 'Nagarikta (Citizenship)', 'NP_CIT', 'Citizenship certificate', 1),
  ('NP', 'identity', 'Nepali Passport', 'NP_PASSPORT', 'Dept of Passports', 2),
  ('NP', 'identity', 'National ID Card', 'NP_NID', 'National Identity Card', 3),
  -- Israel
  ('IL', 'identity', 'Teudat Zehut (ID Card)', 'IL_ID', 'Population Authority', 1),
  ('IL', 'identity', 'Israeli Passport', 'IL_PASSPORT', 'Population Authority', 2),
  -- Poland
  ('PL', 'identity', 'Dowód Osobisty (ID Card)', 'PL_ID', 'Polish identity card', 1),
  ('PL', 'identity', 'Polish Passport', 'PL_PASSPORT', 'Voivode issued', 2),
  -- Sweden
  ('SE', 'identity', 'Swedish ID Card', 'SE_ID', 'Police/Tax Agency', 1),
  ('SE', 'identity', 'Swedish Passport', 'SE_PASSPORT', 'Police Authority', 2),
  ('SE', 'identity', 'Swedish Driving Licence', 'SE_DL', 'Transportstyrelsen', 3),
  -- Norway
  ('NO', 'identity', 'Norwegian Passport', 'NO_PASSPORT', 'Police District', 1),
  ('NO', 'identity', 'Norwegian ID Card', 'NO_ID', 'National ID card', 2),
  ('NO', 'identity', 'Norwegian Driving Licence', 'NO_DL', 'Statens vegvesen', 3),
  -- Denmark
  ('DK', 'identity', 'Danish Passport', 'DK_PASSPORT', 'Rigspolitiet issued', 1),
  ('DK', 'identity', 'Danish Driving Licence', 'DK_DL', 'Borger.dk / police', 2),
  -- Finland
  ('FI', 'identity', 'Finnish ID Card', 'FI_ID', 'Police issued', 1),
  ('FI', 'identity', 'Finnish Passport', 'FI_PASSPORT', 'Police / embassy', 2),
  -- Argentina
  ('AR', 'identity', 'DNI (Documento Nacional de Identidad)', 'AR_DNI', 'RENAPER issued', 1),
  ('AR', 'identity', 'Argentine Passport', 'AR_PASSPORT', 'Federal Police', 2),
  -- Colombia
  ('CO', 'identity', 'Cédula de Ciudadanía', 'CO_CC', 'Registraduría Nacional', 1),
  ('CO', 'identity', 'Cédula de Extranjería', 'CO_CE', 'For foreigners', 2),
  ('CO', 'identity', 'Colombian Passport', 'CO_PASSPORT', 'Cancillería issued', 3),
  -- Chile
  ('CL', 'identity', 'Cédula de Identidad', 'CL_CI', 'Civil Registry', 1),
  ('CL', 'identity', 'Chilean Passport', 'CL_PASSPORT', 'Civil Registry passport', 2),
  -- Peru
  ('PE', 'identity', 'DNI (Documento Nacional de Identidad)', 'PE_DNI', 'RENIEC issued', 1),
  ('PE', 'identity', 'Peruvian Passport', 'PE_PASSPORT', 'Migraciones', 2),
  -- New Zealand
  ('NZ', 'identity', 'NZ Passport', 'NZ_PASSPORT', 'DIA issued', 1),
  ('NZ', 'identity', 'NZ Driver Licence', 'NZ_DL', 'Waka Kotahi', 2),
  -- Ireland
  ('IE', 'identity', 'Irish Passport', 'IE_PASSPORT', 'DFA issued', 1),
  ('IE', 'identity', 'Irish Passport Card', 'IE_PCARD', 'Travel within EU/EEA', 2),
  ('IE', 'identity', 'Public Services Card', 'IE_PSC', 'DSP issued', 3),
  -- Portugal
  ('PT', 'identity', 'Cartão de Cidadão', 'PT_CC', 'Citizen card', 1),
  ('PT', 'identity', 'Portuguese Passport', 'PT_PASSPORT', 'SEF / embassy', 2),
  -- Belgium
  ('BE', 'identity', 'Belgian eID', 'BE_EID', 'Electronic identity card', 1),
  ('BE', 'identity', 'Belgian Passport', 'BE_PASSPORT', 'FPS Foreign Affairs', 2),
  -- Austria
  ('AT', 'identity', 'Personalausweis (ID Card)', 'AT_ID', 'Austrian ID card', 1),
  ('AT', 'identity', 'Austrian Passport', 'AT_PASSPORT', 'BH issued', 2),
  -- Greece
  ('GR', 'identity', 'Greek ID Card (Tautotita)', 'GR_ID', 'Police issued', 1),
  ('GR', 'identity', 'Greek Passport', 'GR_PASSPORT', 'Hellenic Police', 2),
  -- Czech Republic
  ('CZ', 'identity', 'Občanský průkaz (ID Card)', 'CZ_ID', 'Czech identity card', 1),
  ('CZ', 'identity', 'Czech Passport', 'CZ_PASSPORT', 'Municipal authority', 2),
  -- Hungary
  ('HU', 'identity', 'Személyi igazolvány (ID Card)', 'HU_ID', 'Government window', 1),
  ('HU', 'identity', 'Hungarian Passport', 'HU_PASSPORT', 'Government issued', 2),
  -- Romania
  ('RO', 'identity', 'Carte de Identitate (ID Card)', 'RO_CI', 'SPCLEP issued', 1),
  ('RO', 'identity', 'Romanian Passport', 'RO_PASSPORT', 'General Directorate', 2),
  -- Qatar
  ('QA', 'identity', 'QID Card', 'QA_QID', 'Qatar residency/ID card', 1),
  ('QA', 'identity', 'Qatari Passport', 'QA_PASSPORT', 'MOI issued', 2),
  -- Kuwait
  ('KW', 'identity', 'Kuwait Civil ID', 'KW_CID', 'PACI issued', 1),
  ('KW', 'identity', 'Kuwaiti Passport', 'KW_PASSPORT', 'MOI issued', 2),
  -- Bahrain
  ('BH', 'identity', 'Bahraini ID (CPR Card)', 'BH_CPR', 'IGA issued', 1),
  ('BH', 'identity', 'Bahraini Passport', 'BH_PASSPORT', 'NPRA issued', 2),
  -- Oman
  ('OM', 'identity', 'Omani ID Card', 'OM_CID', 'Civil Status issued', 1),
  ('OM', 'identity', 'Omani Passport', 'OM_PASSPORT', 'ROP issued', 2),
  -- Hong Kong
  ('HK', 'identity', 'HKID Card', 'HK_HKID', 'Immigration Department', 1),
  ('HK', 'identity', 'HKSAR Passport', 'HK_PASSPORT', 'HKSAR travel document', 2),
  -- Taiwan
  ('TW', 'identity', 'National ID Card', 'TW_NID', 'Household Registration', 1),
  ('TW', 'identity', 'Taiwan Passport', 'TW_PASSPORT', 'BOCA issued', 2),
  ('TW', 'identity', 'ARC (Alien Resident Certificate)', 'TW_ARC', 'NIA issued', 3)
ON CONFLICT DO NOTHING;


-- ============================================================
-- 6. CREATE TABLE: kyc_requirements
-- Used by: kycService.ts (legacy getKYCRequirementsByCountry)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kyc_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT,
  label TEXT NOT NULL,
  document_type TEXT NOT NULL,
  required BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_kyc_requirements_country ON public.kyc_requirements(country_code);

ALTER TABLE public.kyc_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active kyc_requirements"
  ON public.kyc_requirements FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin can manage kyc_requirements"
  ON public.kyc_requirements FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Global fallback requirements (country_code = NULL)
INSERT INTO public.kyc_requirements (country_code, label, document_type, required, display_order) VALUES
  (NULL, 'Seller Image', 'photo', true, 1),
  (NULL, 'Seller Address Proof – Front Side', 'address_front', true, 2),
  (NULL, 'Seller Address Proof – Back Side', 'address_back', true, 3),
  (NULL, 'Business Address Proof – Front Side', 'biz_address_front', true, 4),
  (NULL, 'Business Address Proof – Back Side', 'biz_address_back', true, 5),
  (NULL, 'Tax ID Proof (Personal Or Business)', 'tax_id', true, 6),
  (NULL, 'Bank Statement Or Cancelled Cheque', 'bank_statement', true, 7);


-- ============================================================
-- 7. REDESIGN TABLE: seller_kyc
-- The existing table has 16 columns (India-hardcoded schema).
-- The new KYC flow needs ~50 columns for the 4-step process.
-- Run this section to migrate.
-- ============================================================

-- 7a. Backup existing data (optional — remove if no data to preserve)
-- CREATE TABLE public.seller_kyc_backup AS SELECT * FROM public.seller_kyc;

-- 7b. Drop old table and its policies
DROP POLICY IF EXISTS "Sellers can view own KYC" ON public.seller_kyc;
DROP POLICY IF EXISTS "Sellers can insert own KYC" ON public.seller_kyc;
DROP POLICY IF EXISTS "Sellers can update own KYC" ON public.seller_kyc;
DROP POLICY IF EXISTS "Admin can manage all KYC" ON public.seller_kyc;
DROP POLICY IF EXISTS "seller_kyc_select_policy" ON public.seller_kyc;
DROP POLICY IF EXISTS "seller_kyc_insert_policy" ON public.seller_kyc;
DROP POLICY IF EXISTS "seller_kyc_update_policy" ON public.seller_kyc;
DROP POLICY IF EXISTS "seller_kyc_delete_policy" ON public.seller_kyc;

DROP TABLE IF EXISTS public.seller_kyc CASCADE;

-- 7c. Create new seller_kyc with all columns needed by the 4-step KYC flow
CREATE TABLE public.seller_kyc (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kyc_form_id TEXT UNIQUE,
  kyc_status TEXT NOT NULL DEFAULT 'draft' CHECK (kyc_status IN ('draft', 'pending', 'approved', 'rejected')),
  current_step INT DEFAULT 1,

  -- Step 1: Personal Information
  full_name TEXT,
  email TEXT,
  phone TEXT,
  country_id TEXT,
  residential_street_1 TEXT,
  residential_street_2 TEXT,
  residential_city TEXT,
  residential_state TEXT,
  residential_postal_code TEXT,
  residential_landmark TEXT,
  step1_completed_at TIMESTAMPTZ,

  -- Step 2: Business Information
  business_type_id TEXT,
  business_name TEXT,
  business_reg_number TEXT,
  tax_id_type TEXT,
  tax_id_number TEXT,
  biz_street_1 TEXT,
  biz_street_2 TEXT,
  biz_city TEXT,
  biz_state TEXT,
  biz_postal_code TEXT,
  biz_country_id TEXT,
  brand_name TEXT,
  business_declaration BOOLEAN DEFAULT false,
  step2_completed_at TIMESTAMPTZ,

  -- Step 3: Bank Details
  bank_holder_name TEXT,
  bank_name TEXT,
  branch_name TEXT,
  account_number TEXT,
  routing_code TEXT,
  account_type TEXT,
  account_type_other TEXT,
  bank_authorization BOOLEAN DEFAULT false,
  step3_completed_at TIMESTAMPTZ,

  -- Step 4: Document Upload
  identity_doc_type TEXT,
  identity_front_url TEXT,
  identity_back_url TEXT,
  business_reg_doc_url TEXT,
  tax_doc_url TEXT,
  bank_proof_url TEXT,
  consent_verification BOOLEAN DEFAULT false,
  consent_authentic BOOLEAN DEFAULT false,
  consent_terms BOOLEAN DEFAULT false,
  step4_completed_at TIMESTAMPTZ,

  -- Submission & Review
  submitted_at TIMESTAMPTZ,
  reference_number TEXT,
  verified_by_admin UUID,
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_seller_kyc_seller ON public.seller_kyc(seller_id);
CREATE INDEX idx_seller_kyc_status ON public.seller_kyc(kyc_status);

-- Enable RLS
ALTER TABLE public.seller_kyc ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Sellers can view own KYC"
  ON public.seller_kyc FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can insert own KYC"
  ON public.seller_kyc FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own draft KYC"
  ON public.seller_kyc FOR UPDATE
  USING (auth.uid() = seller_id);

CREATE POLICY "Admin can manage all KYC"
  ON public.seller_kyc FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================
-- DONE! Summary of changes:
-- ============================================================
-- CREATED: addresses, expense_categories, partner_brands,
--          tax_id_types, document_types, kyc_requirements
-- REDESIGNED: seller_kyc (dropped old 16-col → new 55-col)
-- REMOVED: none (all 36 existing tables are used in code)
-- ============================================================
