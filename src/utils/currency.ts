// ============================================================
// CURRENCY UTILITY — Exchange rates, conversion & formatting
// ============================================================

// ─── Country → Currency mapping (ISO 3166-1 alpha-2 → ISO 4217) ──────────
// Covers all countries seeded in the DB plus general coverage.
export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  IN: 'INR', US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD',
  DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR',
  BE: 'EUR', AT: 'EUR', PT: 'EUR', IE: 'EUR', FI: 'EUR',
  GR: 'EUR', LU: 'EUR', SK: 'EUR', SI: 'EUR', EE: 'EUR',
  LV: 'EUR', LT: 'EUR', CY: 'EUR', MT: 'EUR', HR: 'EUR',
  JP: 'JPY', SG: 'SGD', AE: 'AED', SA: 'SAR', QA: 'QAR',
  KW: 'KWD', BH: 'BHD', OM: 'OMR', MY: 'MYR', TH: 'THB',
  PH: 'PHP', ID: 'IDR', VN: 'VND', BD: 'BDT', PK: 'PKR',
  LK: 'LKR', NP: 'NPR', KR: 'KRW', CN: 'CNY', HK: 'HKD',
  TW: 'TWD', NZ: 'NZD', ZA: 'ZAR', NG: 'NGN', KE: 'KES',
  EG: 'EGP', BR: 'BRL', MX: 'MXN', AR: 'ARS', CL: 'CLP',
  CO: 'COP', PE: 'PEN', SE: 'SEK', NO: 'NOK', DK: 'DKK',
  PL: 'PLN', CZ: 'CZK', HU: 'HUF', RO: 'RON', BG: 'BGN',
  CH: 'CHF', RU: 'RUB', TR: 'TRY', IL: 'ILS', UA: 'UAH',
};

// Also accept alpha-3 short codes used in the DB
export const SHORT_CODE_TO_CURRENCY: Record<string, string> = {
  IND: 'INR', USA: 'USD', GBR: 'GBP', CAN: 'CAD', AUS: 'AUD',
  DEU: 'EUR', FRA: 'EUR', JPN: 'JPY', SGP: 'SGD', ARE: 'AED',
};

/** Resolve currency code from a country code (alpha-2 or alpha-3) or currency code directly */
export function currencyForCountry(countryOrCode: string): string {
  if (!countryOrCode) return 'INR';
  const upper = countryOrCode.toUpperCase().trim();
  // If already a known currency code, return it
  if (SUPPORTED_CURRENCIES.some(c => c.code === upper)) return upper;
  return COUNTRY_TO_CURRENCY[upper] || SHORT_CODE_TO_CURRENCY[upper] || 'INR';
}

// ─── Supported currencies shown in the selector ──────────────────────────
export const SUPPORTED_CURRENCIES = [
  { code: 'INR', symbol: '₹',  name: 'Indian Rupee' },
  { code: 'USD', symbol: '$',  name: 'US Dollar' },
  { code: 'EUR', symbol: '€',  name: 'Euro' },
  { code: 'GBP', symbol: '£',  name: 'British Pound' },
  { code: 'JPY', symbol: '¥',  name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'SAR', symbol: '﷼',  name: 'Saudi Riyal' },
];

// ─── Hardcoded fallback rates (USD-base) — used when API fails ───────────
// Updated to realistic 2025/2026 mid-market rates.
const FALLBACK_RATES: Record<string, number> = {
  USD: 1, INR: 83.5, EUR: 0.92, GBP: 0.79, JPY: 149.5,
  AUD: 1.53, CAD: 1.36, AED: 3.6725, SGD: 1.34, SAR: 3.75,
  QAR: 3.64, KWD: 0.31, BHD: 0.376, OMR: 0.385, MYR: 4.47,
  THB: 35.0, PHP: 56.0, IDR: 15700, VND: 24500, BDT: 110,
  PKR: 278, LKR: 320, NPR: 133.5, KRW: 1320, CNY: 7.24,
  HKD: 7.82, TWD: 31.5, NZD: 1.63, ZAR: 18.5, NGN: 1550,
  KES: 153, EGP: 30.9, BRL: 4.97, MXN: 17.2, ARS: 870,
  CLP: 920, COP: 3950, PEN: 3.72, SEK: 10.5, NOK: 10.6,
  DKK: 6.88, PLN: 4.02, CZK: 22.9, HUF: 360, RON: 4.58,
  BGN: 1.80, CHF: 0.88, RUB: 92, TRY: 30.5, ILS: 3.65,
  UAH: 37.5,
};

// ─── Exchange Rate Fetching ──────────────────────────────────────────────

interface ExchangeRates { [key: string]: number; }

let cachedRates: ExchangeRates = { ...FALLBACK_RATES };
let lastFetch: number = 0;
const CACHE_DURATION = 3600000; // 1 hour

// Primary & fallback API URLs
const API_KEY = import.meta.env.VITE_EXCHANGE_RATE_API_KEY || '';
const PRIMARY_URL = API_KEY
  ? `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`
  : '';
const FALLBACK_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

export const fetchExchangeRates = async (): Promise<ExchangeRates> => {
  const now = Date.now();
  if (cachedRates && (now - lastFetch) < CACHE_DURATION) return cachedRates;

  // Try primary API (keyed)
  if (PRIMARY_URL) {
    try {
      const res = await fetch(PRIMARY_URL, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const json = await res.json();
        const rates = json.conversion_rates || json.rates;
        if (rates && typeof rates === 'object' && rates.USD) {
          cachedRates = rates;
          lastFetch = now;
          return cachedRates;
        }
      }
    } catch { /* fall through */ }
  }

  // Try free fallback API
  try {
    const res = await fetch(FALLBACK_URL, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const json = await res.json();
      const rates = json.conversion_rates || json.rates;
      if (rates && typeof rates === 'object' && rates.USD) {
        cachedRates = rates;
        lastFetch = now;
        return cachedRates;
      }
    }
  } catch { /* fall through */ }

  // Ultimate fallback — hardcoded rates (never fails)
  console.warn('Exchange rate APIs unreachable — using hardcoded fallback rates');
  cachedRates = { ...FALLBACK_RATES };
  lastFetch = now;
  return cachedRates;
};

// ─── Synchronous conversion (uses cached rates from context) ─────────────

/** Convert an amount between currencies using pre-fetched rates.
 *  Returns the original amount if conversion is impossible (no silent errors). */
export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRates,
): number {
  if (!amount || fromCurrency === toCurrency) return amount;
  const from = rates[fromCurrency];
  const to = rates[toCurrency];
  if (!from || !to || from <= 0 || to <= 0) return amount;
  const inUSD = fromCurrency === 'USD' ? amount : amount / from;
  const result = toCurrency === 'USD' ? inUSD : inUSD * to;
  return Math.round(result * 100) / 100;
}

// ─── Async conversion (fetches rates if needed) ──────────────────────────

export const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
): Promise<number> => {
  if (fromCurrency === toCurrency) return amount;
  const rates = await fetchExchangeRates();
  return convertAmount(amount, fromCurrency, toCurrency, rates);
};

// ─── Formatting ──────────────────────────────────────────────────────────

/** Format a price with the correct currency symbol & locale formatting.
 *  Uses Intl.NumberFormat for accurate symbol placement & decimal handling. */
export const formatCurrency = (amount: number, currencyCode: string): string => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: currencyCode === 'JPY' || currencyCode === 'KRW' ? 0 : 2,
      maximumFractionDigits: currencyCode === 'JPY' || currencyCode === 'KRW' ? 0 : 2,
    }).format(amount);
  } catch {
    // If the currency code is invalid, fall back to plain number + code
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
};

/** Convenience: convert + format in one call */
export function formatPrice(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRates,
): string {
  const converted = convertAmount(amount, fromCurrency, toCurrency, rates);
  return formatCurrency(converted, toCurrency);
}
