import { supabase } from '../lib/supabase';
import type { Product } from '../types';

// Section types and helpers for SectionProducts page
export type ProductSection = 'featured' | 'hot-deals' | 'trending';

export const sectionInfo: Record<ProductSection, { title: string; subtitle: string; icon: string }> = {
  featured: {
    title: 'Featured Products',
    subtitle: 'Handpicked products just for you',
    icon: '⭐',
  },
  'hot-deals': {
    title: 'Hot Deals',
    subtitle: 'Limited time offers you don\'t want to miss',
    icon: '🔥',
  },
  trending: {
    title: 'Trending Now',
    subtitle: 'What everyone is buying right now',
    icon: '📈',
  },
};

/** Fetch live products for a homepage section from the DB */
export async function fetchSectionProducts(
  section: ProductSection,
  limit = 8
): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select('*')
    .eq('approval_status', 'approved')
    .eq('is_active', true)
    .gt('stock', 0)
    .limit(limit);

  switch (section) {
    case 'featured':
      query = query.eq('is_featured', true).order('created_at', { ascending: false });
      break;
    case 'hot-deals':
      // Products with a discount > 0, sorted by highest discount
      query = query.gt('discount', 0).order('discount', { ascending: false });
      break;
    case 'trending':
      // Highest rated / most reviewed products
      query = query.order('review_count', { ascending: false });
      break;
  }

  const { data } = await query;

  // If no results for the specific section, fall back to latest approved products
  if (!data || data.length === 0) {
    const { data: fallback } = await supabase
      .from('products')
      .select('*')
      .eq('approval_status', 'approved')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    return (fallback || []) as Product[];
  }

  return data as Product[];
}

/** Convenience: fetch all three homepage sections at once */
export async function fetchHomepageProducts(): Promise<{
  featured: Product[];
  hotDeals: Product[];
  trending: Product[];
}> {
  const [featured, hotDeals, trending] = await Promise.all([
    fetchSectionProducts('featured', 8),
    fetchSectionProducts('hot-deals', 8),
    fetchSectionProducts('trending', 8),
  ]);
  return { featured, hotDeals, trending };
}
