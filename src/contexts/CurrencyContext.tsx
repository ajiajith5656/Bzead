import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import logger from '../utils/logger';
import { fetchExchangeRates, convertAmount, formatCurrency } from '../utils/currency';
import { supabase } from '../lib/supabase';

interface CurrencyContextType {
  /** The user's active display currency (ISO 4217, e.g. "INR") */
  currency: string;
  /** Manually change the display currency */
  setCurrency: (currency: string) => void;
  /** Convert a price from its source currency to the display currency */
  convertPrice: (amount: number, fromCurrency?: string) => number;
  /** Convert + format in one call → ready-to-render string like "₹1,234.00" */
  formatPrice: (amount: number, fromCurrency?: string) => string;
  loading: boolean;
  rates: { [key: string]: number };
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<string>('INR'); // Default INR for guests
  const [rates, setRates] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);

  // ── 1. Detect user's currency from profile → country → currency_code ──
  useEffect(() => {
    let cancelled = false;

    const detectCurrency = async () => {
      // Check localStorage first (user's manual choice persists)
      const manualChoice = localStorage.getItem('beauzead_currency');
      if (manualChoice) {
        setCurrencyState(manualChoice);
        return;
      }

      // Check if logged in — resolve currency from profile country
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Try profile → country_id → countries.currency_code
          const { data: profile } = await supabase
            .from('profiles')
            .select('country_id, countries(currency_code)')
            .eq('id', session.user.id)
            .single();

          if (!cancelled && profile) {
            const countryData = profile.countries as any;
            const resolvedCurrency = countryData?.currency_code
              || session.user.user_metadata?.currency
              || 'INR';
            setCurrencyState(resolvedCurrency);
            return;
          }

          // Fallback: user_metadata from signup
          const metaCurrency = session.user.user_metadata?.currency;
          if (!cancelled && metaCurrency) {
            setCurrencyState(metaCurrency);
            return;
          }
        }
      } catch (err) {
        // Non-critical — just keep INR default
        logger.log('Currency auto-detect skipped', err);
      }

      // Guest user → INR
      if (!cancelled) setCurrencyState('INR');
    };

    detectCurrency();

    // Re-detect when auth state changes (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        // Logged out → revert to INR unless manually chosen
        const manualChoice = localStorage.getItem('beauzead_currency');
        if (!manualChoice) setCurrencyState('INR');
        return;
      }
      // Logged in → re-run detection
      detectCurrency();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // ── 2. Fetch exchange rates on mount + hourly refresh ─────────────────
  useEffect(() => {
    const loadRates = async () => {
      setLoading(true);
      try {
        const fetchedRates = await fetchExchangeRates();
        setRates(fetchedRates);
      } catch (error) {
        logger.error(error as Error, { context: 'Failed to load exchange rates' });
      } finally {
        setLoading(false);
      }
    };

    loadRates();
    const interval = setInterval(loadRates, 3600000);
    return () => clearInterval(interval);
  }, []);

  // ── 3. Manual currency change (persists to localStorage) ──────────────
  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('beauzead_currency', newCurrency);
  };

  // ── 4. Conversion helper ──────────────────────────────────────────────
  const convertPrice = useCallback(
    (amount: number, fromCurrency: string = 'INR'): number => {
      if (!amount) return 0;
      if (fromCurrency === currency) return amount;
      if (loading || !rates[currency] || !rates[fromCurrency]) return amount;
      return convertAmount(amount, fromCurrency, currency, rates);
    },
    [currency, rates, loading],
  );

  // ── 5. Convert + format helper ────────────────────────────────────────
  const formatPriceFn = useCallback(
    (amount: number, fromCurrency: string = 'INR'): string => {
      const converted = convertPrice(amount, fromCurrency);
      return formatCurrency(converted, currency);
    },
    [convertPrice, currency],
  );

  const value = {
    currency,
    setCurrency,
    convertPrice,
    formatPrice: formatPriceFn,
    loading,
    rates,
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
