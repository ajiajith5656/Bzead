import { formatCurrency } from './utils/currency';

/**
 * Format a price for display. Defaults to INR (the platform's base currency).
 * For currency-converted display, prefer useCurrency().formatPrice() in components.
 */
export const formatPrice = (price: number, currency: string = 'INR'): string => {
  return formatCurrency(price, currency);
};
