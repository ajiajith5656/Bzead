import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  fetchProducts as fetchProductsFromDB,
  createProduct,
  fetchCategories,
  uploadProductImage,
  uploadProductVideo,
} from '../../lib/productService';
import { 
  LayoutDashboard, Package, ShoppingBag, DollarSign, 
  Settings, LogOut, Plus, Filter, Eye,
  Trash2, Edit3, CheckCircle2, AlertTriangle, Clock, TrendingUp,
  Star, Image as ImageIcon, Search, Loader2, AlertCircle, X, Save,
  Upload, Video
} from 'lucide-react';
import { formatPrice } from '../../constants';
import { supabase } from '../../lib/supabase';


// Colors and special days loaded from DB
interface ColorOption {
  name: string;
  hex: string;
}

interface SellerProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  stockCount: number;
  inStock: boolean;
  approved: boolean;
  revenue: number;
  orders: number;
  views: number;
  rating: number | string;
  image: string;
  brand?: string;
  reviewCount?: number;
  discount?: number;
}

interface SellerProductListingProps {
  onLogout: () => void;
  sellerEmail: string;
  onNavigate: (view: any) => void;
}

const SellerProductListing: React.FC<SellerProductListingProps> = ({ onLogout, onNavigate }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [_currentStep, setCurrentStep] = useState(1);
  const [_expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    media: false,
    details: false,
    pricing: false,
    shipping: false,
    offers: false
  });
  const [categoryList, setCategoryList] = useState<{ id: string; name: string }[]>([]);
  const [COLORS, setCOLORS] = useState<ColorOption[]>([]);
  const [SPECIAL_DAYS, setSPECIAL_DAYS] = useState<string[]>([]);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  const [newProduct, setNewProduct] = useState({
    // Basic Info
    name: '',
    category: '',
    subCategory: '',
    brand_name: '',
    modelNumber: '',
    shortDescription: '',
    stock: '',
    
    // Variants
    sizeApplicable: false,
    colorApplicable: false,
    sizeVariants: [] as Array<{id: string, size: string, quantity: number, stock: number, price: number}>,
    colorVariants: [] as Array<{id: string, color: string, sku: string, price: number, stock: number}>,
    
    // Media
    images: [] as File[],
    imageUrls: [] as string[],
    videos: [] as File[],
    videoUrls: [] as string[],
    image_url: '',
    
    // Details
    highlights: [] as string[],
    description: '',
    specifications: [] as Array<{id: string, key: string, value: string}>,
    
    // Pricing
    currency: 'INR',
    mrp: '',
    price: '',
    gstRate: 18,
    platformFee: 10,
    commission: 10,
    deliveryCountries: [] as Array<{id: string, country: string, deliveryCharge: number, minQuantity: number}>,
    
    // Shipping
    packageWeight: '',
    packageLength: '',
    packageWidth: '',
    packageHeight: '',
    shippingType: 'self' as 'self' | 'platform',
    manufacturerName: '',
    returnPolicyDays: 7,
    cancellationPolicyDays: 7,
    
    // Offers
    offerRules: [] as Array<{
      id: string,
      type: string,
      buyQuantity?: number,
      getQuantity?: number,
      specialDay?: string,
      discountPercent?: number,
      startTime?: string,
      endTime?: string,
      bundleQuantity?: number,
      active: boolean
    }>
  });
  
  // Form helpers
  const [newHighlight, setNewHighlight] = useState('');
  const [newSpecification, setNewSpecification] = useState({ key: '', value: '' });
  const [newSizeVariant, setNewSizeVariant] = useState({ size: '', quantity: 0, stock: 0, price: 0 });
  const [newColorVariant, setNewColorVariant] = useState({ color: '', sku: '', price: 0, stock: 0 });
  const [newDeliveryCountry, setNewDeliveryCountry] = useState({ country: '', deliveryCharge: 0, minQuantity: 1 });
  const [newOfferRule, setNewOfferRule] = useState({ 
    type: '',
    buyQuantity: 0, 
    getQuantity: 0, 
    discountPercent: 0,
    startTime: '',
    endTime: '',
    bundleQuantity: 0,
    specialDay: ''
  });

  // Fetch seller products from Supabase
  useEffect(() => {
    fetchCategories().then(({ data }) => setCategoryList(data as { id: string; name: string }[]));

    // Load colors and special days from DB
    const loadLookups = async () => {
      const [colorsResp, daysResp] = await Promise.all([
        supabase.from('colors').select('name, hex').eq('is_active', true).order('name'),
        supabase.from('special_days').select('name').eq('is_active', true).order('name'),
      ]);
      if (colorsResp.data) setCOLORS(colorsResp.data);
      if (daysResp.data) setSPECIAL_DAYS(daysResp.data.map((d: any) => d.name));
    };
    loadLookups();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const sellerId = user?.id || '';
        if (!sellerId) return;
        
        const { data, error: e } = await fetchProductsFromDB({ sellerId });
        
        if (e) {
          setError(e);
        } else if (data) {
          setProducts(data.map((p: any) => ({
            id: p.id,
            name: p.name || '',
            category: p.category || '',
            price: p.price || 0,
            stockCount: p.stock || 0,
            inStock: (p.stock || 0) > 0,
            approved: p.approval_status === 'approved',
            revenue: 0,
            orders: 0,
            views: 0,
            rating: p.rating || 0,
            image: p.image_url || '',
            brand: p.brand || '',
            reviewCount: p.review_count || 0,
            discount: p.mrp && p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0,
          })));
        }
      } catch (err: any) {
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProducts();
    }
  }, [user]);

  // Create new product
  const handleCreateProduct = async () => {
    try {
      setCreating(true);
      
      const sellerId = user?.id || '';
      
      // Validation
      if (!newProduct.name || !newProduct.category || !newProduct.mrp || !newProduct.price || !newProduct.stock) {
        alert('Please fill in all required fields (Name, Category, MRP, Price, Stock)');
        setCreating(false);
        return;
      }
      
      if (newProduct.specifications.length === 0) {
        alert('Please add at least one technical specification');
        setCreating(false);
        return;
      }
      
      if (!newProduct.packageWeight || !newProduct.packageLength || !newProduct.packageWidth || !newProduct.packageHeight) {
        alert('Please provide complete package dimensions (Weight, Length, Width, Height)');
        setCreating(false);
        return;
      }
      
      if (parseFloat(newProduct.price) > parseFloat(newProduct.mrp)) {
        alert('Selling price cannot exceed MRP');
        setCreating(false);
        return;
      }
      
      if (newProduct.images.length < 5) {
        alert('Please upload at least 5 product images (maximum 10)');
        setCreating(false);
        return;
      }

      // Upload images to Supabase Storage
      const uploadedImageUrls: string[] = [];
      for (const file of newProduct.images) {
        const url = await uploadProductImage(file, sellerId);
        uploadedImageUrls.push(url);
      }

      // Upload videos to Supabase Storage
      const uploadedVideoUrls: string[] = [];
      for (const file of newProduct.videos) {
        const url = await uploadProductVideo(file, sellerId);
        uploadedVideoUrls.push(url);
      }

      const productInput = {
        seller_id: sellerId,
        name: newProduct.name,
        category: newProduct.category,
        sub_category: newProduct.subCategory || undefined,
        brand: newProduct.brand_name || newProduct.name,
        model_number: newProduct.modelNumber || undefined,
        description: newProduct.description || newProduct.name,
        short_description: newProduct.shortDescription || newProduct.description?.substring(0, 100) || newProduct.name,
        
        // Pricing
        price: parseFloat(newProduct.price),
        mrp: parseFloat(newProduct.mrp),
        stock: parseInt(newProduct.stock),
        currency: newProduct.currency,
        gst_rate: newProduct.gstRate,
        platform_fee: newProduct.platformFee,
        commission: newProduct.commission,
        
        // Media (real uploaded URLs)
        image_url: uploadedImageUrls[0] || '',
        images: uploadedImageUrls,
        videos: uploadedVideoUrls,
        
        // Details
        highlights: newProduct.highlights,
        specifications: newProduct.specifications,
        
        // Variants
        sizeVariants: newProduct.sizeVariants,
        colorVariants: newProduct.colorVariants,
        
        // Shipping
        package_weight: parseFloat(newProduct.packageWeight) || 0,
        package_length: parseFloat(newProduct.packageLength) || 0,
        package_width: parseFloat(newProduct.packageWidth) || 0,
        package_height: parseFloat(newProduct.packageHeight) || 0,
        shipping_type: newProduct.shippingType,
        manufacturer_name: newProduct.manufacturerName || undefined,
        cancellation_policy_days: newProduct.cancellationPolicyDays,
        return_policy_days: newProduct.returnPolicyDays,
        
        // Other
        deliveryCountries: newProduct.deliveryCountries,
        offerRules: newProduct.offerRules,
        
        approval_status: 'pending',
        is_active: false,
      };

      const { data, error: createError } = await createProduct(productInput);

      if (createError) {
        alert('Failed to create product: ' + createError);
      } else if (data) {
        alert('Product created successfully! It will be visible after admin approval.');
        
        // Reset form
        setNewProduct({
          name: '', category: '', subCategory: '',
          brand_name: '', modelNumber: '', shortDescription: '', stock: '',
          sizeApplicable: false, colorApplicable: false,
          sizeVariants: [], colorVariants: [],
          images: [], imageUrls: [], videos: [], videoUrls: [], image_url: '',
          highlights: [], description: '', specifications: [],
          currency: 'INR',
          mrp: '', price: '', gstRate: 18, platformFee: 10, commission: 10,
          deliveryCountries: [],
          packageWeight: '', packageLength: '', packageWidth: '', packageHeight: '',
          shippingType: 'self', manufacturerName: '',
          cancellationPolicyDays: 7, returnPolicyDays: 7,
          offerRules: []
        });
        setShowCreateModal(false);
        setCurrentStep(1);
        setExpandedSections({ basic: true, media: false, details: false, pricing: false, shipping: false, offers: false });
        
        // Refresh products list
        window.location.reload();
      }
    } catch (err: any) {
      alert('Failed to create product: ' + (err.message || 'Please try again.'));
    } finally {
      setCreating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setNewProduct(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };
  
  // Helper functions for dynamic arrays
  const addHighlight = () => {
    if (newHighlight.trim()) {
      setNewProduct(prev => ({ ...prev, highlights: [...prev.highlights, newHighlight.trim()] }));
      setNewHighlight('');
    }
  };
  
  const removeHighlight = (index: number) => {
    setNewProduct(prev => ({ ...prev, highlights: prev.highlights.filter((_, i) => i !== index) }));
  };
  
  const addSpecification = () => {
    if (newSpecification.key.trim() && newSpecification.value.trim()) {
      const spec = { id: Date.now().toString(), key: newSpecification.key.trim(), value: newSpecification.value.trim() };
      setNewProduct(prev => ({ ...prev, specifications: [...prev.specifications, spec] }));
      setNewSpecification({ key: '', value: '' });
    }
  };
  
  const removeSpecification = (id: string) => {
    setNewProduct(prev => ({ ...prev, specifications: prev.specifications.filter(s => s.id !== id) }));
  };
  
  const addSizeVariant = () => {
    if (newSizeVariant.size && newSizeVariant.stock > 0) {
      const variant = { id: Date.now().toString(), ...newSizeVariant };
      setNewProduct(prev => ({ ...prev, sizeVariants: [...prev.sizeVariants, variant] }));
      setNewSizeVariant({ size: '', quantity: 0, stock: 0, price: 0 });
    }
  };
  
  const removeSizeVariant = (id: string) => {
    setNewProduct(prev => ({ ...prev, sizeVariants: prev.sizeVariants.filter(v => v.id !== id) }));
  };
  
  const addColorVariant = () => {
    if (newColorVariant.color && newColorVariant.sku) {
      const variant = { id: Date.now().toString(), ...newColorVariant };
      setNewProduct(prev => ({ ...prev, colorVariants: [...prev.colorVariants, variant] }));
      setNewColorVariant({ color: '', sku: '', price: 0, stock: 0 });
    }
  };
  
  const removeColorVariant = (id: string) => {
    setNewProduct(prev => ({ ...prev, colorVariants: prev.colorVariants.filter(v => v.id !== id) }));
  };
  
  const addDeliveryCountry = () => {
    if (newDeliveryCountry.country.trim()) {
      const delivery = { id: Date.now().toString(), ...newDeliveryCountry };
      setNewProduct(prev => ({ ...prev, deliveryCountries: [...prev.deliveryCountries, delivery] }));
      setNewDeliveryCountry({ country: '', deliveryCharge: 0, minQuantity: 1 });
    }
  };
  
  const removeDeliveryCountry = (id: string) => {
    setNewProduct(prev => ({ ...prev, deliveryCountries: prev.deliveryCountries.filter(d => d.id !== id) }));
  };
  
  const addOfferRule = () => {
    if (!newOfferRule.type) return;
    const offer = { id: Date.now().toString(), ...newOfferRule, active: true };
    setNewProduct(prev => ({ ...prev, offerRules: [...prev.offerRules, offer] }));
    setNewOfferRule({ 
      type: '', buyQuantity: 0, getQuantity: 0, discountPercent: 0,
      startTime: '', endTime: '', bundleQuantity: 0, specialDay: ''
    });
  };
  
  const removeOfferRule = (id: string) => {
    setNewProduct(prev => ({ ...prev, offerRules: prev.offerRules.filter(o => o.id !== id) }));
  };
  
  const toggleOfferStatus = (id: string) => {
    setNewProduct(prev => ({
      ...prev,
      offerRules: prev.offerRules.map(o => o.id === id ? { ...o, active: !o.active } : o)
    }));
  };
  
  // File upload handlers
  const handleImageSelect = (files: FileList | null) => {
    if (!files) return;
    const newImages = Array.from(files).slice(0, 10 - newProduct.images.length);
    const urls = newImages.map(file => URL.createObjectURL(file));
    setNewProduct(prev => ({
      ...prev,
      images: [...prev.images, ...newImages],
      imageUrls: [...prev.imageUrls, ...urls]
    }));
  };
  
  const removeImage = (index: number) => {
    URL.revokeObjectURL(newProduct.imageUrls[index]);
    setNewProduct(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      imageUrls: prev.imageUrls.filter((_, i) => i !== index)
    }));
  };
  
  const handleVideoSelect = (files: FileList | null) => {
    if (!files) return;
    const newVideos = Array.from(files).slice(0, 2 - newProduct.videos.length);
    const urls = newVideos.map(file => URL.createObjectURL(file));
    setNewProduct(prev => ({
      ...prev,
      videos: [...prev.videos, ...newVideos],
      videoUrls: [...prev.videoUrls, ...urls]
    }));
  };
  
  const removeVideo = (index: number) => {
    URL.revokeObjectURL(newProduct.videoUrls[index]);
    setNewProduct(prev => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index),
      videoUrls: prev.videoUrls.filter((_, i) => i !== index)
    }));
  };

  const filteredProducts = products.filter((product: SellerProduct) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.id.toString().toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && product.approved && product.inStock) ||
                         (filterStatus === 'pending' && !product.approved) ||
                         (filterStatus === 'outofstock' && !product.inStock);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    active: products.filter((p: SellerProduct) => p.approved && p.inStock).length,
    lowStock: products.filter((p: SellerProduct) => p.stockCount < 10).length,
    pending: products.filter((p: SellerProduct) => !p.approved).length,
    totalRevenue: products.reduce((sum: number, p: SellerProduct) => sum + p.revenue, 0),
    totalOrders: products.reduce((sum: number, p: SellerProduct) => sum + p.orders, 0),
    totalViews: products.reduce((sum: number, p: SellerProduct) => sum + p.views, 0)
  };

  const categories: string[] = Array.from(new Set(products.map((p: SellerProduct) => p.category)));

  return (
    <div className="min-h-screen bg-white text-gray-900 flex font-sans">
      {/* Sidebar */}
      <aside className="w-72 border-r border-gray-900 hidden lg:flex flex-col p-8 sticky top-0 h-screen">
        <div className="mb-12 cursor-pointer" onClick={() => onNavigate('seller-dashboard')}>
          <h1 className="text-2xl font-semibold text-gray-900">Seller Hub</h1>
          <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mt-1">Merchant Portal</p>
        </div>

        <nav className="space-y-3 flex-1">
          <NavItem icon={<LayoutDashboard />} label="Overview" onClick={() => onNavigate('seller-dashboard')} />
          <NavItem icon={<Package />} label="My Products" active />
          <NavItem icon={<ShoppingBag />} label="Order Tracking" />
          <NavItem icon={<TrendingUp />} label="Sales Velocity" />
          <NavItem icon={<DollarSign />} label="Payouts" />
          <NavItem icon={<Settings />} label="Store Config" />
        </nav>

        <div className="pt-8 border-t border-gray-900">
          <button onClick={onLogout} className="flex items-center gap-3 w-full p-4 text-red-500 hover:bg-red-500/5 rounded-xl font-semibold text-sm transition-all">
            <LogOut size={18} /> End Session
          </button>
        </div>
      </aside>

      <main className="flex-1 p-10 md:p-16 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
          <div>
            <h2 className="text-4xl font-semibold text-gray-900 tracking-tight uppercase">My Products</h2>
            <p className="text-gray-500 text-sm font-medium mt-1">Manage Your Premium Inventory Listings</p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
             <button className="flex-1 md:flex-none border border-gray-200 hover:bg-white/5 text-gray-500 font-semibold px-8 py-3 rounded-2xl transition-all text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
               <Filter size={14} /> Refine List
             </button>
             <button 
               onClick={() => setShowCreateModal(true)}
               className="flex-1 md:flex-none bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-10 py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-3 text-[10px] uppercase tracking-widest"
             >
               <Plus size={18} /> New Listing
             </button>
          </div>
        </header>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <PerformanceCard 
            label="Total Revenue" 
            value={formatPrice(stats.totalRevenue)} 
            icon={<DollarSign className="text-green-500" />}
            trend="+24.5%"
          />
          <PerformanceCard 
            label="Total Orders" 
            value={stats.totalOrders.toString()} 
            icon={<ShoppingBag className="text-blue-500" />}
            trend="+18.2%"
          />
          <PerformanceCard 
            label="Product Views" 
            value={stats.totalViews.toLocaleString()} 
            icon={<Eye className="text-purple-500" />}
            trend="+32.1%"
          />
        </div>

        {/* Inventory Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <StatCard label="Active Items" value={stats.active.toString()} icon={<CheckCircle2 className="text-green-500" />} />
          <StatCard label="Critical Stock" value={stats.lowStock.toString()} icon={<AlertTriangle className="text-red-500" />} />
          <StatCard label="Pending Approval" value={stats.pending.toString()} icon={<Clock className="text-blue-500" />} />
        </div>

        {/* Search and Filter Section */}
        <div className="bg-[#0a0a0a] border border-gray-900 rounded-3xl p-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
              <input
                type="text"
                placeholder="Search by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-4 py-4 text-sm text-gray-900 placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition-colors"
              />
            </div>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-4 text-sm text-gray-900 focus:outline-none focus:border-yellow-500 transition-colors cursor-pointer appearance-none"
            >
              <option value="all">All Categories</option>
              {categories.map((cat: string) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-4 text-sm text-gray-900 focus:outline-none focus:border-yellow-500 transition-colors cursor-pointer appearance-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active & In Stock</option>
              <option value="pending">Pending Approval</option>
              <option value="outofstock">Out of Stock</option>
            </select>
          </div>

          {/* Active Filters Display */}
          {(searchQuery || filterCategory !== 'all' || filterStatus !== 'all') && (
            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-900">
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Active Filters:</span>
              {searchQuery && (
                <span className="bg-yellow-500/10 text-yellow-500 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-yellow-500/20">
                  Search: {searchQuery}
                </span>
              )}
              {filterCategory !== 'all' && (
                <span className="bg-blue-500/10 text-blue-500 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-blue-500/20">
                  {filterCategory}
                </span>
              )}
              {filterStatus !== 'all' && (
                <span className="bg-purple-500/10 text-purple-500 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-purple-500/20">
                  {filterStatus.replace('outofstock', 'Out of Stock')}
                </span>
              )}
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setFilterCategory('all');
                  setFilterStatus('all');
                }}
                className="text-[10px] font-semibold text-red-500 hover:underline ml-auto"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-8">
          {loading ? (
            <p className="text-sm font-semibold text-gray-500">
              <Loader2 className="animate-spin inline mr-2" size={16} /> Loading products...
            </p>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-3">
              <AlertCircle size={18} />
              {error}
              <button onClick={() => window.location.reload()} className="ml-auto underline hover:no-underline">
                Retry
              </button>
            </div>
          ) : (
            <p className="text-sm font-semibold text-gray-500">
              Showing <span className="text-gray-900">{filteredProducts.length}</span> of <span className="text-gray-900">{products.length}</span> products
            </p>
          )}
        </div>

        {/* Listing Grid */}
        {error ? null : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-[#0a0a0a] border border-gray-900 rounded-[2.5rem] p-8 h-96 animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package size={24} className="text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Found</h3>
            <p className="text-gray-500 text-sm mb-8">Try adjusting your filters or search criteria</p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setFilterCategory('all');
                setFilterStatus('all');
              }}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-8 py-3 rounded-2xl transition-all text-[10px] uppercase tracking-widest"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredProducts.map((product: SellerProduct) => (
              <div key={product.id} className="bg-[#0a0a0a] border border-gray-900 rounded-[2.5rem] p-8 group hover:border-yellow-500/30 transition-all relative overflow-hidden">
                {/* Status Badge */}
                {!product.approved && (
                  <div className="absolute top-6 right-6 bg-blue-500/10 text-blue-500 text-[8px] font-semibold px-2 py-1 rounded border border-blue-500/20 uppercase">
                    Pending Approval
                  </div>
                )}
                {product.approved && !product.inStock && (
                  <div className="absolute top-6 right-6 bg-red-500/10 text-red-500 text-[8px] font-semibold px-2 py-1 rounded border border-red-500/20 uppercase">
                    Out of Stock
                  </div>
                )}
                {product.approved && product.inStock && product.stockCount < 10 && (
                  <div className="absolute top-6 right-6 bg-orange-500/10 text-orange-500 text-[8px] font-semibold px-2 py-1 rounded border border-orange-500/20 uppercase">
                    Low Stock
                  </div>
                )}

                <div className="flex gap-6 mb-8">
                  <div className="w-24 h-24 bg-white rounded-3xl overflow-hidden border border-gray-200 shrink-0 relative group/img">
                    <img 
                      src={product.image} 
                      className="w-full h-full object-cover opacity-80 group-hover/img:opacity-100 transition-all duration-700" 
                      alt={product.name}
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/300x300/1f2937/f59e0b?text=Product';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                      <ImageIcon size={20} className="text-gray-900" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-widest mb-1">SKU: {product.id}</p>
                    <h4 className="text-lg font-semibold text-gray-900 line-clamp-2 leading-tight group-hover:text-yellow-500 transition-colors mb-2 uppercase">{product.name}</h4>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{product.category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star size={12} className="fill-yellow-500 text-yellow-500" />
                      <span className="text-[10px] font-bold text-yellow-500">{product.rating}</span>
                      <span className="text-[10px] text-gray-600">({product.reviewCount})</span>
                    </div>
                  </div>
                </div>

                {/* Product Metrics */}
                <div className="grid grid-cols-3 gap-4 border-y border-gray-900/50 py-6 mb-6">
                  <div className="text-center">
                    <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-widest mb-1">Views</p>
                    <p className="text-base font-semibold text-gray-900">{product.views.toLocaleString()}</p>
                  </div>
                  <div className="text-center border-x border-gray-900/50">
                    <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-widest mb-1">Orders</p>
                    <p className="text-base font-semibold text-green-500">{product.orders}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-widest mb-1">Revenue</p>
                    <p className="text-base font-semibold text-yellow-500">{formatPrice(product.revenue)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-b border-gray-900/50 pb-6 mb-6">
                  <div>
                    <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-widest mb-1">Selling Price</p>
                    <p className="text-xl font-semibold text-gray-900 tracking-tight">{formatPrice(product.price)}</p>
                    {product.discount && (
                      <p className="text-[10px] text-green-500 font-bold mt-1">Save {product.discount}%</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-widest mb-1">Stock Level</p>
                    <p className={`text-xl font-semibold tracking-tight ${
                      product.inStock 
                        ? product.stockCount < 10 
                          ? 'text-orange-500' 
                          : 'text-green-500'
                        : 'text-red-500'
                    }`}>
                      {product.inStock ? `${product.stockCount} Units` : 'Sold Out'}
                    </p>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-600 font-semibold uppercase tracking-widest">Brand</span>
                    <span className="text-gray-500 font-medium">{product.brand}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-600 font-semibold uppercase tracking-widest">Listed Date</span>
                    <span className="text-gray-500 font-medium">Dec 15, 2025</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 bg-white/5 hover:bg-yellow-500 hover:text-black py-3 rounded-xl text-[9px] font-semibold uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                    <Edit3 size={14} /> Update
                  </button>
                  <button className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl text-[9px] font-semibold uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                    <Eye size={14} /> Preview
                  </button>
                  <button className="w-12 h-12 bg-white/5 hover:bg-red-500/10 hover:text-red-500 rounded-xl flex items-center justify-center transition-all border border-transparent hover:border-red-500/20">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredProducts.length > 0 && !loading && !error && (
          <div className="mt-20 text-center">
            <button className="bg-transparent border border-gray-200 text-gray-600 font-semibold px-12 py-4 rounded-full text-[10px] uppercase tracking-widest hover:text-gray-900 hover:border-white transition-all">
              Load More Products
            </button>
          </div>
        )}
      </main>

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-gray-200 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-semibold text-gray-900">Create New Product</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-900 transition-colors"
                disabled={creating}
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={newProduct.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Premium Wireless Headphones"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition-colors"
                  disabled={creating}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={newProduct.category}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-yellow-500 transition-colors appearance-none cursor-pointer"
                  disabled={creating}
                >
                  <option value="">Select Category</option>
                  {categoryList.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Sub-Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-2">
                  Sub-Category
                </label>
                <input
                  type="text"
                  name="subCategory"
                  value={newProduct.subCategory}
                  onChange={handleInputChange}
                  placeholder="e.g., Smartphones, Laptops, Accessories"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition-colors"
                  disabled={creating}
                />
              </div>

              {/* Brand Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-2">
                  Brand Name
                </label>
                <input
                  type="text"
                  name="brand_name"
                  value={newProduct.brand_name}
                  onChange={handleInputChange}
                  placeholder="e.g., Sony, Apple, Nike"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition-colors"
                  disabled={creating}
                />
              </div>

              {/* Model Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-2">
                  Model Number <span className="text-gray-500">(8-20 alphanumeric)</span>
                </label>
                <input
                  type="text"
                  name="modelNumber"
                  value={newProduct.modelNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., ABC123XYZ"
                  maxLength={20}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition-colors"
                  disabled={creating}
                />
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-2">
                  Short Description <span className="text-red-500">*</span> <span className="text-gray-500">(Max 350 chars)</span>
                </label>
                <textarea
                  name="shortDescription"
                  value={newProduct.shortDescription}
                  onChange={handleInputChange}
                  placeholder="Brief product summary for search results..."
                  maxLength={350}
                  rows={2}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition-colors resize-none"
                  disabled={creating}
                />
                <p className="text-xs text-gray-600 mt-1">{newProduct.shortDescription.length}/350 characters</p>
              </div>

              {/* Price and Stock */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-2">
                    MRP (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="mrp"
                    value={newProduct.mrp}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition-colors"
                    disabled={creating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-2">
                    Selling Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={newProduct.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition-colors"
                    disabled={creating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-2">
                    Stock <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={newProduct.stock}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition-colors"
                    disabled={creating}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={newProduct.description}
                  onChange={handleInputChange}
                  placeholder="Describe your product features, specifications, and benefits..."
                  rows={4}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition-colors resize-none"
                  disabled={creating}
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-2">
                  Product Images <span className="text-red-500">*</span> <span className="text-gray-500">(5-10 images required)</span>
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-yellow-500 transition-colors">
                  <Upload className="mx-auto mb-3 text-gray-600" size={32} />
                  <p className="text-gray-500 text-sm mb-2">Drag and drop images here, or</p>
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={creating || newProduct.imageUrls.length >= 10}
                    className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                  >
                    Browse Files
                  </button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    multiple
                    onChange={(e) => handleImageSelect(e.target.files)}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-600 mt-2">JPG, PNG up to 25MB each</p>
                </div>
                {newProduct.imageUrls.length > 0 && (
                  <div className="grid grid-cols-5 gap-2 mt-3">
                    {newProduct.imageUrls.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <img src={url} alt={`Product ${idx + 1}`} className="w-full h-20 object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-gray-900 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 bg-yellow-500 text-black text-[8px] px-1 rounded font-bold">
                            PRIMARY
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">{newProduct.imageUrls.length}/10 images uploaded</p>
              </div>

              {/* Video Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-2">
                  Product Videos <span className="text-gray-500">(Optional, max 2)</span>
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-yellow-500 transition-colors">
                  <Video className="mx-auto mb-2 text-gray-600" size={24} />
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={creating || newProduct.videoUrls.length >= 2}
                    className="px-4 py-2 border border-gray-200 text-gray-500 rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Upload Video
                  </button>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    onChange={(e) => handleVideoSelect(e.target.files)}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-600 mt-2">MP4, WebM up to 40MB</p>
                </div>
                {newProduct.videoUrls.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {newProduct.videoUrls.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <video src={url} className="w-full h-24 object-cover rounded-lg" controls />
                        <button
                          type="button"
                          onClick={() => removeVideo(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-gray-900 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-2">
                  Image URL <span className="text-gray-500">(Alternative to file upload)</span>
                </label>
                <input
                  type="text"
                  name="image_url"
                  value={newProduct.image_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com/product-image.jpg"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition-colors"
                  disabled={creating}
                />
              </div>

              {/* Size Variants */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-500">Size Variants</label>
                    <p className="text-xs text-gray-600">Does this product have size options?</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newProduct.sizeApplicable}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, sizeApplicable: e.target.checked }))}
                      className="sr-only peer"
                      disabled={creating}
                    />
                    <div className="w-11 h-6 bg-gray-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                  </label>
                </div>
                {newProduct.sizeApplicable && (
                  <div className="bg-gray-50/50 rounded-xl p-4">
                    {newProduct.sizeVariants.length > 0 && (
                      <table className="w-full text-sm mb-4">
                        <thead className="border-b border-gray-200">
                          <tr>
                            <th className="text-left py-2 text-gray-500 font-semibold">Size</th>
                            <th className="text-left py-2 text-gray-500 font-semibold">Qty</th>
                            <th className="text-left py-2 text-gray-500 font-semibold">Stock</th>
                            <th className="text-left py-2 text-gray-500 font-semibold">Price</th>
                            <th className="text-left py-2 text-gray-500 font-semibold">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {newProduct.sizeVariants.map((v) => (
                            <tr key={v.id} className="border-b border-gray-200">
                              <td className="py-2">{v.size}</td>
                              <td className="py-2">{v.quantity}</td>
                              <td className="py-2">{v.stock}</td>
                              <td className="py-2">₹{v.price}</td>
                              <td className="py-2">
                                <button type="button" onClick={() => removeSizeVariant(v.id)} className="text-red-500 hover:text-red-400">
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    <div className="grid grid-cols-5 gap-2">
                      <input
                        type="text"
                        placeholder="Size (S, M, L)"
                        value={newSizeVariant.size}
                        onChange={(e) => setNewSizeVariant({ ...newSizeVariant, size: e.target.value })}
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={newSizeVariant.quantity || ''}
                        onChange={(e) => setNewSizeVariant({ ...newSizeVariant, quantity: parseInt(e.target.value) || 0 })}
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                      />
                      <input
                        type="number"
                        placeholder="Stock"
                        value={newSizeVariant.stock || ''}
                        onChange={(e) => setNewSizeVariant({ ...newSizeVariant, stock: parseInt(e.target.value) || 0 })}
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={newSizeVariant.price || ''}
                        onChange={(e) => setNewSizeVariant({ ...newSizeVariant, price: parseFloat(e.target.value) || 0 })}
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                      />
                      <button
                        type="button"
                        onClick={addSizeVariant}
                        className="bg-yellow-500 text-black rounded-lg px-3 py-2 text-sm font-semibold hover:bg-yellow-400 flex items-center justify-center gap-1"
                      >
                        <Plus size={16} /> Add
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Color Variants */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-500">Color Variants</label>
                    <p className="text-xs text-gray-600">Does this product have color options?</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newProduct.colorApplicable}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, colorApplicable: e.target.checked }))}
                      className="sr-only peer"
                      disabled={creating}
                    />
                    <div className="w-11 h-6 bg-gray-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                  </label>
                </div>
                {newProduct.colorApplicable && (
                  <div className="bg-gray-50/50 rounded-xl p-4">
                    {newProduct.colorVariants.length > 0 && (
                      <table className="w-full text-sm mb-4">
                        <thead className="border-b border-gray-200">
                          <tr>
                            <th className="text-left py-2 text-gray-500 font-semibold">Color</th>
                            <th className="text-left py-2 text-gray-500 font-semibold">SKU</th>
                            <th className="text-left py-2 text-gray-500 font-semibold">Price</th>
                            <th className="text-left py-2 text-gray-500 font-semibold">Stock</th>
                            <th className="text-left py-2 text-gray-500 font-semibold">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {newProduct.colorVariants.map((v) => (
                            <tr key={v.id} className="border-b border-gray-200">
                              <td className="py-2 flex items-center gap-2">
                                <span
                                  className="w-4 h-4 rounded-full border border-gray-200"
                                  style={{ backgroundColor: COLORS.find(c => c.name === v.color)?.hex || '#ccc' }}
                                />
                                {v.color}
                              </td>
                              <td className="py-2 font-mono text-xs">{v.sku}</td>
                              <td className="py-2">₹{v.price}</td>
                              <td className="py-2">{v.stock}</td>
                              <td className="py-2">
                                <button type="button" onClick={() => removeColorVariant(v.id)} className="text-red-500 hover:text-red-400">
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    <div className="grid grid-cols-5 gap-2">
                      <select
                        value={newColorVariant.color}
                        onChange={(e) => setNewColorVariant({ ...newColorVariant, color: e.target.value })}
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                      >
                        <option value="">Select Color</option>
                        {COLORS.map((c) => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="SKU"
                        value={newColorVariant.sku}
                        onChange={(e) => setNewColorVariant({ ...newColorVariant, sku: e.target.value.toUpperCase() })}
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={newColorVariant.price || ''}
                        onChange={(e) => setNewColorVariant({ ...newColorVariant, price: parseFloat(e.target.value) || 0 })}
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                      />
                      <input
                        type="number"
                        placeholder="Stock"
                        value={newColorVariant.stock || ''}
                        onChange={(e) => setNewColorVariant({ ...newColorVariant, stock: parseInt(e.target.value) || 0 })}
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                      />
                      <button
                        type="button"
                        onClick={addColorVariant}
                        className="bg-yellow-500 text-black rounded-lg px-3 py-2 text-sm font-semibold hover:bg-yellow-400 flex items-center justify-center gap-1"
                      >
                        <Plus size={16} /> Add
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Highlights */}
              <div className="border-t border-gray-200 pt-6">
                <label className="block text-sm font-semibold text-gray-500 mb-2">
                  Product Highlights
                </label>
                <p className="text-xs text-gray-600 mb-3">Add key features and benefits (press Enter to add)</p>
                {newProduct.highlights.length > 0 && (
                  <ul className="mb-3 space-y-2">
                    {newProduct.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-gray-50/50 rounded-lg p-2">
                        <span className="text-yellow-500 mt-1">•</span>
                        <span className="flex-1 text-sm text-gray-900">{highlight}</span>
                        <button
                          type="button"
                          onClick={() => removeHighlight(idx)}
                          className="text-red-500 hover:text-red-400"
                        >
                          <X size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <input
                  type="text"
                  placeholder="e.g., High quality material, Fast charging support"
                  value={newHighlight}
                  onChange={(e) => setNewHighlight(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addHighlight();
                    }
                  }}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-yellow-500"
                  disabled={creating}
                />
              </div>

              {/* Specifications */}
              <div className="border-t border-gray-200 pt-6">
                <label className="block text-sm font-semibold text-gray-500 mb-2">
                  Technical Specifications <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-600 mb-3">Add product specifications (max 50)</p>
                {newProduct.specifications.length > 0 && (
                  <div className="mb-3 bg-gray-50/50 rounded-xl p-4">
                    <table className="w-full text-sm">
                      <thead className="border-b border-gray-200">
                        <tr>
                          <th className="text-left py-2 text-gray-500 font-semibold">Specification</th>
                          <th className="text-left py-2 text-gray-500 font-semibold">Value</th>
                          <th className="text-left py-2 text-gray-500 font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {newProduct.specifications.map((spec) => (
                          <tr key={spec.id} className="border-b border-gray-200 last:border-0">
                            <td className="py-2 text-gray-600">{spec.key}</td>
                            <td className="py-2 text-gray-900">{spec.value}</td>
                            <td className="py-2">
                              <button
                                type="button"
                                onClick={() => removeSpecification(spec.id)}
                                className="text-red-500 hover:text-red-400"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-xs text-gray-600 mt-2">{newProduct.specifications.length}/50 specifications</p>
                  </div>
                )}
                <div className="grid grid-cols-[1fr,1fr,auto] gap-2">
                  <input
                    type="text"
                    placeholder="e.g., Display Size"
                    value={newSpecification.key}
                    onChange={(e) => setNewSpecification({ ...newSpecification, key: e.target.value })}
                    className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                    disabled={creating || newProduct.specifications.length >= 50}
                  />
                  <input
                    type="text"
                    placeholder="e.g., 6.5 inches"
                    value={newSpecification.value}
                    onChange={(e) => setNewSpecification({ ...newSpecification, value: e.target.value })}
                    className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                    disabled={creating || newProduct.specifications.length >= 50}
                  />
                  <button
                    type="button"
                    onClick={addSpecification}
                    className="bg-yellow-500 text-black rounded-lg px-4 py-2 text-sm font-semibold hover:bg-yellow-400 flex items-center justify-center gap-1"
                    disabled={creating || newProduct.specifications.length >= 50}
                  >
                    <Plus size={16} /> Add
                  </button>
                </div>
              </div>

              {/* GST Rate */}
              <div className="border-t border-gray-200 pt-6">
                <label className="block text-sm font-semibold text-gray-500 mb-2">
                  GST Rate <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-600 mb-3">Customize GST rate as needed (default: 18%)</p>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={newProduct.gstRate}
                    onChange={(e) => setNewProduct({ ...newProduct, gstRate: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-yellow-500 pr-12"
                    disabled={creating}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                </div>
              </div>

              {/* Delivery Countries */}
              <div className="border-t border-gray-200 pt-6">
                <label className="block text-sm font-semibold text-gray-500 mb-2">
                  Delivery Countries
                </label>
                <p className="text-xs text-gray-600 mb-3">Add countries where you can deliver with charges</p>
                {newProduct.deliveryCountries.length > 0 && (
                  <div className="mb-3 bg-gray-50/50 rounded-xl p-4">
                    <table className="w-full text-sm">
                      <thead className="border-b border-gray-200">
                        <tr>
                          <th className="text-left py-2 text-gray-500 font-semibold">Country</th>
                          <th className="text-left py-2 text-gray-500 font-semibold">Charge</th>
                          <th className="text-left py-2 text-gray-500 font-semibold">Min Qty</th>
                          <th className="text-left py-2 text-gray-500 font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {newProduct.deliveryCountries.map((dc) => (
                          <tr key={dc.id} className="border-b border-gray-200 last:border-0">
                            <td className="py-2 text-gray-900">{dc.country}</td>
                            <td className="py-2 text-green-500">₹{dc.deliveryCharge}</td>
                            <td className="py-2 text-gray-600">{dc.minQuantity}</td>
                            <td className="py-2">
                              <button
                                type="button"
                                onClick={() => removeDeliveryCountry(dc.id)}
                                className="text-red-500 hover:text-red-400"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="grid grid-cols-[2fr,1fr,1fr,auto] gap-2">
                  <input
                    type="text"
                    placeholder="Country name"
                    value={newDeliveryCountry.country}
                    onChange={(e) => setNewDeliveryCountry({ ...newDeliveryCountry, country: e.target.value })}
                    className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                    disabled={creating}
                  />
                  <input
                    type="number"
                    placeholder="Charge"
                    value={newDeliveryCountry.deliveryCharge || ''}
                    onChange={(e) => setNewDeliveryCountry({ ...newDeliveryCountry, deliveryCharge: parseFloat(e.target.value) || 0 })}
                    className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                    disabled={creating}
                  />
                  <input
                    type="number"
                    placeholder="Min Qty"
                    value={newDeliveryCountry.minQuantity || ''}
                    onChange={(e) => setNewDeliveryCountry({ ...newDeliveryCountry, minQuantity: parseInt(e.target.value) || 1 })}
                    className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                    disabled={creating}
                  />
                  <button
                    type="button"
                    onClick={addDeliveryCountry}
                    className="bg-yellow-500 text-black rounded-lg px-4 py-2 text-sm font-semibold hover:bg-yellow-400 flex items-center justify-center gap-1"
                    disabled={creating}
                  >
                    <Plus size={16} /> Add
                  </button>
                </div>
              </div>

              {/* Package Dimensions */}
              <div className="border-t border-gray-200 pt-6">
                <label className="block text-sm font-semibold text-gray-500 mb-2">
                  Package Dimensions <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-600 mb-3">Enter weight and dimensions for shipping</p>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.5"
                      value={newProduct.packageWeight || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, packageWeight: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                      disabled={creating}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Length (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="20"
                      value={newProduct.packageLength || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, packageLength: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                      disabled={creating}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Width (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="15"
                      value={newProduct.packageWidth || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, packageWidth: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                      disabled={creating}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Height (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="10"
                      value={newProduct.packageHeight || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, packageHeight: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                      disabled={creating}
                    />
                  </div>
                </div>
                {parseFloat(newProduct.packageLength) > 0 && parseFloat(newProduct.packageWidth) > 0 && parseFloat(newProduct.packageHeight) > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Volumetric Weight: {((parseFloat(newProduct.packageLength) * parseFloat(newProduct.packageWidth) * parseFloat(newProduct.packageHeight)) / 5000).toFixed(2)} kg
                  </p>
                )}
              </div>

              {/* Shipping Type */}
              <div className="border-t border-gray-200 pt-6">
                <label className="block text-sm font-semibold text-gray-500 mb-2">
                  Shipping Type <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-600 mb-3">Who will handle the shipping?</p>
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="shippingType"
                      value="self"
                      checked={newProduct.shippingType === 'self'}
                      onChange={(e) => setNewProduct({ ...newProduct, shippingType: e.target.value as 'self' | 'platform' })}
                      className="w-4 h-4 text-yellow-500 border-gray-200 focus:ring-yellow-500"
                      disabled={creating}
                    />
                    <span className="text-gray-900 text-sm">Self Shipping</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="shippingType"
                      value="platform"
                      checked={newProduct.shippingType === 'platform'}
                      onChange={(e) => setNewProduct({ ...newProduct, shippingType: e.target.value as 'self' | 'platform' })}
                      className="w-4 h-4 text-yellow-500 border-gray-200 focus:ring-yellow-500"
                      disabled={creating}
                    />
                    <span className="text-gray-900 text-sm">Platform Shipping</span>
                  </label>
                </div>
              </div>

              {/* Manufacturer Details */}
              <div className="border-t border-gray-200 pt-6">
                <label className="block text-sm font-semibold text-gray-500 mb-2">
                  Manufacturer Details
                </label>
                <p className="text-xs text-gray-600 mb-3">Provide manufacturer information</p>
                <input
                  type="text"
                  placeholder="Manufacturer Name"
                  value={newProduct.manufacturerName}
                  onChange={(e) => setNewProduct({ ...newProduct, manufacturerName: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-yellow-500"
                  disabled={creating}
                />
              </div>

              {/* Return & Cancellation Policies */}
              <div className="border-t border-gray-200 pt-6">
                <label className="block text-sm font-semibold text-gray-500 mb-2">
                  Return & Cancellation Policies <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-600 mb-3">Set return and cancellation windows</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">Return Window (days)</label>
                    <input
                      type="number"
                      min="0"
                      max="90"
                      value={newProduct.returnPolicyDays}
                      onChange={(e) => setNewProduct({ ...newProduct, returnPolicyDays: parseInt(e.target.value) || 0 })}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-yellow-500 mb-2"
                      disabled={creating}
                    />
                    <div className="flex gap-2">
                      {[7, 15, 30].map((days) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => setNewProduct({ ...newProduct, returnPolicyDays: days })}
                          className="flex-1 bg-gray-100 hover:bg-gray-100 text-gray-900 text-xs rounded-lg px-2 py-1"
                          disabled={creating}
                        >
                          {days} days
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">Cancellation Window (days)</label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={newProduct.cancellationPolicyDays}
                      onChange={(e) => setNewProduct({ ...newProduct, cancellationPolicyDays: parseInt(e.target.value) || 0 })}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-yellow-500 mb-2"
                      disabled={creating}
                    />
                    <div className="flex gap-2">
                      {[1, 3, 7].map((days) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => setNewProduct({ ...newProduct, cancellationPolicyDays: days })}
                          className="flex-1 bg-gray-100 hover:bg-gray-100 text-gray-900 text-xs rounded-lg px-2 py-1"
                          disabled={creating}
                        >
                          {days} day{days > 1 ? 's' : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Offer Rules */}
              <div className="border-t border-gray-200 pt-6">
                <label className="block text-sm font-semibold text-gray-500 mb-2">
                  Promotional Offers
                </label>
                <p className="text-xs text-gray-600 mb-3">Create special offers and promotions</p>
                
                {/* Existing Offers */}
                {newProduct.offerRules.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {newProduct.offerRules.map((offer) => (
                      <div key={offer.id} className="bg-gray-50/50 rounded-lg p-3 flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              offer.type === 'buy_x_get_y' ? 'bg-blue-900/50 text-blue-400' :
                              offer.type === 'special_day' ? 'bg-purple-900/50 text-purple-400' :
                              offer.type === 'hourly' ? 'bg-orange-900/50 text-orange-400' :
                              'bg-green-900/50 text-green-400'
                            }`}>
                              {offer.type.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              offer.active ? 'bg-green-900/50 text-green-400' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {offer.active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900">
                            {offer.type === 'buy_x_get_y' && `Buy ${offer.buyQuantity} Get ${offer.getQuantity} (${offer.discountPercent}% off)`}
                            {offer.type === 'special_day' && `${offer.specialDay}: ${offer.discountPercent}% off`}
                            {offer.type === 'hourly' && `${offer.startTime}-${offer.endTime}: ${offer.discountPercent}% off`}
                            {offer.type === 'bundle' && `Bundle ${offer.bundleQuantity} items: ${offer.discountPercent}% off`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleOfferStatus(offer.id)}
                            className="text-yellow-500 hover:text-yellow-400 text-xs"
                          >
                            Toggle
                          </button>
                          <button
                            type="button"
                            onClick={() => removeOfferRule(offer.id)}
                            className="text-red-500 hover:text-red-400"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add New Offer */}
                <div className="bg-gray-50/50 rounded-xl p-4 space-y-3">
                  <select
                    value={newOfferRule.type}
                    onChange={(e) => setNewOfferRule({ ...newOfferRule, type: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                    disabled={creating}
                  >
                    <option value="">Select Offer Type</option>
                    <option value="buy_x_get_y">Buy X Get Y</option>
                    <option value="special_day">Special Day Offer</option>
                    <option value="hourly">Hourly Discount</option>
                    <option value="bundle">Bundle Offer</option>
                  </select>

                  {newOfferRule.type === 'buy_x_get_y' && (
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        placeholder="Buy Qty"
                        min="1"
                        value={newOfferRule.buyQuantity || ''}
                        onChange={(e) => setNewOfferRule({ ...newOfferRule, buyQuantity: parseInt(e.target.value) || 0 })}
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                      />
                      <input
                        type="number"
                        placeholder="Get Qty"
                        min="1"
                        value={newOfferRule.getQuantity || ''}
                        onChange={(e) => setNewOfferRule({ ...newOfferRule, getQuantity: parseInt(e.target.value) || 0 })}
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                      />
                      <input
                        type="number"
                        placeholder="Discount %"
                        min="0"
                        max="100"
                        value={newOfferRule.discountPercent || ''}
                        onChange={(e) => setNewOfferRule({ ...newOfferRule, discountPercent: parseInt(e.target.value) || 0 })}
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                      />
                    </div>
                  )}

                  {newOfferRule.type === 'special_day' && (
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={newOfferRule.specialDay || ''}
                        onChange={(e) => setNewOfferRule({ ...newOfferRule, specialDay: e.target.value })}
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                      >
                        <option value="">Select Day</option>
                        {SPECIAL_DAYS.map((day: string) => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="Discount %"
                        min="0"
                        max="100"
                        value={newOfferRule.discountPercent || ''}
                        onChange={(e) => setNewOfferRule({ ...newOfferRule, discountPercent: parseInt(e.target.value) || 0 })}
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                      />
                    </div>
                  )}

                  {newOfferRule.type === 'hourly' && (
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="time"
                        value={newOfferRule.startTime || ''}
                        onChange={(e) => setNewOfferRule({ ...newOfferRule, startTime: e.target.value })}
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                      />
                      <input
                        type="time"
                        value={newOfferRule.endTime || ''}
                        onChange={(e) => setNewOfferRule({ ...newOfferRule, endTime: e.target.value })}
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                      />
                      <input
                        type="number"
                        placeholder="Discount %"
                        min="0"
                        max="100"
                        value={newOfferRule.discountPercent || ''}
                        onChange={(e) => setNewOfferRule({ ...newOfferRule, discountPercent: parseInt(e.target.value) || 0 })}
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                      />
                    </div>
                  )}

                  {newOfferRule.type === 'bundle' && (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Bundle Qty"
                        min="2"
                        value={newOfferRule.bundleQuantity || ''}
                        onChange={(e) => setNewOfferRule({ ...newOfferRule, bundleQuantity: parseInt(e.target.value) || 0 })}
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                      />
                      <input
                        type="number"
                        placeholder="Discount %"
                        min="0"
                        max="100"
                        value={newOfferRule.discountPercent || ''}
                        onChange={(e) => setNewOfferRule({ ...newOfferRule, discountPercent: parseInt(e.target.value) || 0 })}
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                      />
                    </div>
                  )}

                  {newOfferRule.type && (
                    <button
                      type="button"
                      onClick={addOfferRule}
                      className="w-full bg-yellow-500 text-black rounded-lg px-4 py-2 text-sm font-semibold hover:bg-yellow-400 flex items-center justify-center gap-1"
                      disabled={creating}
                    >
                      <Plus size={16} /> Add Offer
                    </button>
                  )}
                </div>
              </div>

              {/* Info Message */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-sm text-blue-400">
                  <strong>Note:</strong> Your product will be submitted for admin approval before it appears in the marketplace. You'll be notified once it's approved.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleCreateProduct}
                  disabled={creating}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Create Product
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="flex-1 bg-transparent border border-gray-200 hover:bg-white/5 text-gray-500 hover:text-gray-900 font-semibold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 p-4 rounded-2xl font-semibold text-sm transition-all ${
      active ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/10' : 'text-gray-500 hover:bg-white/5 hover:text-gray-900'
    }`}
  >
    {React.cloneElement(icon, { size: 18 })} {label}
  </button>
);

const StatCard = ({ label, value, icon }: any) => (
  <div className="bg-[#0a0a0a] border border-gray-900 rounded-[2.5rem] p-10 flex items-center gap-8 group hover:border-gray-200 transition-all">
    <div className="w-16 h-16 bg-white border border-gray-200 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
      {React.cloneElement(icon, { size: 32 })}
    </div>
    <div>
      <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-xl font-semibold text-gray-900 tracking-tight">{value}</h3>
    </div>
  </div>
);

const PerformanceCard = ({ label, value, icon, trend }: any) => (
  <div className="bg-[#0a0a0a] border border-gray-900 rounded-[2.5rem] p-8 group hover:border-gray-200 transition-all">
    <div className="flex items-center justify-between mb-4">
      <div className="w-12 h-12 bg-white border border-gray-200 rounded-2xl flex items-center justify-center">
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">{trend}</span>
    </div>
    <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-2">{label}</p>
    <h3 className="text-2xl font-semibold text-gray-900 tracking-tight">{value}</h3>
  </div>
);

export default SellerProductListing;
