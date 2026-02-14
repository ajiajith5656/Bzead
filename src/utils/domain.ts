/**
 * Domain / subdomain detection utilities.
 *
 * Production layout:
 *   Main store          → metricfluxsolutions.shop  (or www.)
 *   Seller portal       → sellers.metricfluxsolutions.shop
 *   Admin panel         → admin.metricfluxsolutions.shop
 *
 * In local dev (localhost / 127.0.0.1) we fall back to path-based detection
 * so the app works without configuring real subdomains locally.
 */

export type AppDomain = 'main' | 'seller' | 'admin';

const MAIN_DOMAIN = import.meta.env.VITE_DOMAIN || 'https://metricfluxsolutions.shop';
const SELLER_DOMAIN = import.meta.env.VITE_SELLER_DOMAIN || 'https://sellers.metricfluxsolutions.shop';
const ADMIN_DOMAIN = import.meta.env.VITE_ADMIN_DOMAIN || 'https://admin.metricfluxsolutions.shop';

/**
 * Detect which app domain we're currently on based on hostname.
 */
export function detectDomain(): AppDomain {
  const hostname = window.location.hostname;

  // Production / preview subdomains
  if (hostname.startsWith('admin.')) return 'admin';
  if (hostname.startsWith('sellers.')) return 'seller';

  // Local dev: fall back to path-based detection
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const path = window.location.pathname;
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/seller')) return 'seller';
  }

  return 'main';
}

/** Absolute URL for the main storefront */
export function getMainDomainUrl(path = '/'): string {
  if (isLocalDev()) return path;
  return `${MAIN_DOMAIN}${path}`;
}

/** Absolute URL for the seller portal */
export function getSellerDomainUrl(path = '/'): string {
  if (isLocalDev()) return `/seller${path === '/' ? '' : path}`;
  return `${SELLER_DOMAIN}${path}`;
}

/** Absolute URL for the admin panel */
export function getAdminDomainUrl(path = '/'): string {
  if (isLocalDev()) return `/admin${path === '/' ? '' : path}`;
  return `${ADMIN_DOMAIN}${path}`;
}

/** Whether running on localhost / dev server */
export function isLocalDev(): boolean {
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h.includes('codespace');
}

/** Build the correct redirect URL for Supabase auth callbacks */
export function getAuthRedirectUrl(path: string): string {
  return `${window.location.origin}${path}`;
}
