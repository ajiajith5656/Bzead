import type { Product } from '../types';

// Mock product data for homepage sections
const createProduct = (
  id: string,
  name: string,
  price: number,
  category: string,
  image: string,
  opts: Partial<Product> = {}
): Product => ({
  id,
  name,
  description: opts.description || name,
  price,
  currency: opts.currency || 'INR',
  image_url: image,
  seller_id: opts.seller_id || 'mock-seller',
  category,
  stock: opts.stock ?? 10,
  rating: opts.rating ?? 4.5,
  review_count: opts.review_count ?? 0,
  brand: opts.brand,
  created_at: opts.created_at || new Date().toISOString(),
  ...opts,
});

export const mockProducts: Product[] = [
  createProduct('mp-1', 'Premium Wireless Headphones', 4999, 'Electronics', 'https://via.placeholder.com/400x500/f3f4f6/f59e0b?text=Headphones', { brand: 'SoundMax', rating: 4.7, stock: 25 }),
  createProduct('mp-2', 'Elegant Silk Saree', 7999, 'Fashion', 'https://via.placeholder.com/400x500/f3f4f6/f59e0b?text=Saree', { brand: 'Fabric House', rating: 4.8, stock: 15 }),
  createProduct('mp-3', 'Smart Fitness Band', 2499, 'Electronics', 'https://via.placeholder.com/400x500/f3f4f6/f59e0b?text=Fitness+Band', { brand: 'FitTech', rating: 4.3, stock: 50 }),
  createProduct('mp-4', 'Organic Face Cream', 1299, 'Beauty', 'https://via.placeholder.com/400x500/f3f4f6/f59e0b?text=Face+Cream', { brand: 'NaturGlow', rating: 4.6, stock: 40 }),
  createProduct('mp-5', 'Running Shoes Pro', 5499, 'Sports', 'https://via.placeholder.com/400x500/f3f4f6/f59e0b?text=Running+Shoes', { brand: 'StarRun', rating: 4.5, stock: 30 }),
  createProduct('mp-6', 'Stainless Steel Water Bottle', 899, 'Home & Kitchen', 'https://via.placeholder.com/400x500/f3f4f6/f59e0b?text=Water+Bottle', { brand: 'AquaPure', rating: 4.4, stock: 100 }),
  createProduct('mp-7', 'Bluetooth Speaker', 3499, 'Electronics', 'https://via.placeholder.com/400x500/f3f4f6/f59e0b?text=Speaker', { brand: 'BassBox', rating: 4.2, stock: 20 }),
  createProduct('mp-8', 'Cotton Kurta Set', 2999, 'Fashion', 'https://via.placeholder.com/400x500/f3f4f6/f59e0b?text=Kurta', { brand: 'EthnoCraft', rating: 4.6, stock: 35 }),
];

export const hotDeals: Product[] = [
  createProduct('hd-1', 'Noise Cancelling Earbuds', 1999, 'Electronics', 'https://via.placeholder.com/400x500/f3f4f6/f59e0b?text=Earbuds', { brand: 'SoundMax', rating: 4.5, discount: 40, stock: 18 }),
  createProduct('hd-2', 'Designer Sunglasses', 1499, 'Fashion', 'https://via.placeholder.com/400x500/f3f4f6/f59e0b?text=Sunglasses', { brand: 'ShadesPro', rating: 4.3, discount: 35, stock: 22 }),
  createProduct('hd-3', 'Yoga Mat Premium', 1299, 'Sports', 'https://via.placeholder.com/400x500/f3f4f6/f59e0b?text=Yoga+Mat', { brand: 'FlexFit', rating: 4.7, discount: 30, stock: 45 }),
  createProduct('hd-4', 'Hair Dryer Professional', 2499, 'Beauty', 'https://via.placeholder.com/400x500/f3f4f6/f59e0b?text=Hair+Dryer', { brand: 'StylePro', rating: 4.4, discount: 25, stock: 14 }),
  createProduct('hd-5', 'Wall Clock Modern', 999, 'Home & Kitchen', 'https://via.placeholder.com/400x500/f3f4f6/f59e0b?text=Wall+Clock', { brand: 'TickTock', rating: 4.1, discount: 50, stock: 60 }),
  createProduct('hd-6', 'Laptop Backpack', 1799, 'Accessories', 'https://via.placeholder.com/400x500/f3f4f6/f59e0b?text=Backpack', { brand: 'UrbanPack', rating: 4.6, discount: 20, stock: 28 }),
  createProduct('hd-7', 'Smart Watch Lite', 3999, 'Electronics', 'https://via.placeholder.com/400x500/f3f4f6/f59e0b?text=Smart+Watch', { brand: 'TimeTech', rating: 4.5, discount: 45, stock: 10 }),
  createProduct('hd-8', 'Ceramic Tea Set', 1599, 'Home & Kitchen', 'https://via.placeholder.com/400x500/f3f4f6/f59e0b?text=Tea+Set', { brand: 'ClayWorks', rating: 4.8, discount: 15, stock: 32 }),
];

export const trendingDeals: Product[] = [
  createProduct('td-1', 'Wireless Charging Pad', 1499, 'Electronics', 'https://via.placeholder.com/400x500/f3f4f6/f59e0b?text=Charging+Pad', { brand: 'PowerUp', rating: 4.3, stock: 55 }),
  createProduct('td-2', 'Leather Wallet Premium', 1999, 'Accessories', 'https://via.placeholder.com/400x500/f3f4f6/f59e0b?text=Wallet', { brand: 'LeatherCraft', rating: 4.7, stock: 40 }),
  createProduct('td-3', 'Aromatherapy Diffuser', 2299, 'Home & Kitchen', 'https://via.placeholder.com/400x500/f3f4f6/f59e0b?text=Diffuser', { brand: 'AromaZen', rating: 4.5, stock: 20 }),
  createProduct('td-4', 'Gold Plated Necklace', 3499, 'Jewellery', 'https://via.placeholder.com/400x500/f3f4f6/f59e0b?text=Necklace', { brand: 'GoldShine', rating: 4.8, stock: 12 }),
  createProduct('td-5', 'Men\'s Casual Shirt', 1799, 'Fashion', 'https://via.placeholder.com/400x500/f3f4f6/f59e0b?text=Casual+Shirt', { brand: 'StyleHub', rating: 4.4, stock: 65 }),
  createProduct('td-6', 'Portable Power Bank', 1299, 'Electronics', 'https://via.placeholder.com/400x500/f3f4f6/f59e0b?text=Power+Bank', { brand: 'ChargeMax', rating: 4.2, stock: 70 }),
  createProduct('td-7', 'Kitchen Knife Set', 2999, 'Home & Kitchen', 'https://via.placeholder.com/400x500/f3f4f6/f59e0b?text=Knife+Set', { brand: 'SharpEdge', rating: 4.6, stock: 25 }),
  createProduct('td-8', 'Moisturizing Body Lotion', 799, 'Beauty', 'https://via.placeholder.com/400x500/f3f4f6/f59e0b?text=Body+Lotion', { brand: 'SkinCare+', rating: 4.5, stock: 90 }),
];

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

export const getProductsBySection = (section: ProductSection): Product[] => {
  switch (section) {
    case 'featured':
      return mockProducts;
    case 'hot-deals':
      return hotDeals;
    case 'trending':
      return trendingDeals;
    default:
      return [];
  }
};
