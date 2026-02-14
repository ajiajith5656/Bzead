import React, { useEffect, useState } from 'react';
import { Upload, Trash2, Eye, Loader2, GripVertical } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getProductImages as fetchProductImages,
  uploadProductImageFile,
} from '../../lib/adminService';
import { supabase } from '../../lib/supabase';

interface ProductImage { id: string; product_id: string; image_url: string; imageUrl: string; is_main: boolean; isMainImage: boolean; display_order: number; displayOrder: number; }

export const SellerProductImageManagement: React.FC = () => {
  const { user } = useAuth();
  const [sellerProducts, setSellerProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const sellerId = user?.id || 'seller1';

  // Load seller's products from Supabase
  useEffect(() => {
    const loadSellerProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name')
        .eq('seller_id', sellerId)
        .order('name')
        .limit(50);
      setSellerProducts(data || []);
      if (data && data.length > 0) setSelectedProductId(data[0].id);
    };
    loadSellerProducts();
  }, [sellerId]);

  useEffect(() => {
    if (selectedProductId) {
      loadImages();
    }
  }, [selectedProductId]);

  const loadImages = async () => {
    setLoading(true);
    const imageList = await fetchProductImages(selectedProductId);
    setImages(imageList.sort((a, b) => a.displayOrder - b.displayOrder));
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    setUploading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isMain = images.length === 0 && i === 0;

      const imageUrl = await uploadProductImageFile(selectedProductId, file, sellerId);

      if (imageUrl) {
        // Update product images array in DB
        const { data: prod } = await supabase
          .from('products')
          .select('images, image_url')
          .eq('id', selectedProductId)
          .single();
        
        const existingImages = (prod?.images || []) as string[];
        existingImages.push(imageUrl);

        const updates: Record<string, any> = { images: existingImages };
        if (isMain || !prod?.image_url) {
          updates.image_url = imageUrl;
        }

        await supabase
          .from('products')
          .update(updates)
          .eq('id', selectedProductId);
      }
    }

    loadImages();
    setUploading(false);
  };

  const handleDelete = async (imageId: string) => {
    if (window.confirm('Delete this image?')) {
      const img = images.find((i) => i.id === imageId);
      if (img) {
        const { data: prod } = await supabase
          .from('products')
          .select('images')
          .eq('id', selectedProductId)
          .single();
        const updatedImages = ((prod?.images || []) as string[]).filter((u: string) => u !== img.image_url);
        await supabase.from('products').update({ images: updatedImages }).eq('id', selectedProductId);
      }
      loadImages();
    }
  };

  const handleSetMain = async (imageId: string) => {
    const img = images.find((i) => i.id === imageId);
    if (img) {
      await supabase
        .from('products')
        .update({ image_url: img.image_url })
        .eq('id', selectedProductId);
      loadImages();
    }
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = images.findIndex((img) => img.id === draggedId);
    const targetIndex = images.findIndex((img) => img.id === targetId);

    const newImages = [...images];
    [newImages[draggedIndex], newImages[targetIndex]] = [
      newImages[targetIndex],
      newImages[draggedIndex],
    ];

    // Update display_order in the product's images JSONB array
    const reordered = newImages.map((img, idx) => ({
      ...img,
      display_order: idx + 1,
      displayOrder: idx + 1,
    }));
    const jsonImages = reordered.map((img) => ({
      url: img.image_url || img.imageUrl,
      is_main: img.is_main || img.isMainImage,
      display_order: img.display_order,
    }));
    await supabase
      .from('products')
      .update({ images: jsonImages })
      .eq('id', selectedProductId);
    loadImages();
    setDraggedId(null);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">My Product Images</h1>
        <p className="text-gray-600 mb-8">Upload and manage images for your products</p>

        {/* Product Selector */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Product
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
          >
            {sellerProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>

        {/* Upload Section */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow border-2 border-dashed border-green-300">
          <h2 className="text-lg font-bold mb-4">Upload Images</h2>
          <label className="cursor-pointer">
            <div className="flex items-center justify-center gap-2 p-4 bg-green-50 rounded-lg hover:bg-green-100">
              <Upload size={20} className="text-green-600" />
              <span className="text-green-600 font-semibold">
                Click to upload product images
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
            </div>
          </label>
          <p className="text-sm text-gray-600 mt-2">
            Maximum 10MB per file. Supports JPEG, PNG, WebP
          </p>
          {uploading && (
            <div className="flex items-center gap-2 text-green-600 mt-2">
              <Loader2 className="animate-spin" size={20} />
              <span>Uploading...</span>
            </div>
          )}
        </div>

        {/* Images Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-green-600" size={24} />
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600">No images yet. Upload images to showcase your product.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                draggable
                onDragStart={() => handleDragStart(image.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(image.id)}
                className={`relative group bg-white rounded-lg shadow-md overflow-hidden cursor-move ${
                  draggedId === image.id ? 'opacity-50' : ''
                }`}
              >
                <img
                  src={image.imageUrl}
                  alt="Product"
                  className="w-full h-48 object-cover"
                />

                <div className="absolute inset-0 bg-white bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleSetMain(image.id)}
                    className={`p-2 rounded-full ${
                      image.isMainImage
                        ? 'bg-yellow-500 text-gray-900'
                        : 'bg-gray-600 text-gray-900 opacity-0 group-hover:opacity-100'
                    }`}
                    title="Set as main image"
                  >
                    <Eye size={20} />
                  </button>
                  <button
                    onClick={() => handleDelete(image.id)}
                    className="p-2 rounded-full bg-red-600 text-gray-900 opacity-0 group-hover:opacity-100"
                    title="Delete image"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <div className="absolute top-2 left-2 flex items-center gap-1">
                  {image.isMainImage && (
                    <span className="bg-yellow-500 text-gray-900 text-xs px-2 py-1 rounded">
                      Main
                    </span>
                  )}
                  <div className="bg-gray-200 text-gray-900 text-xs px-2 py-1 rounded flex items-center gap-1">
                    <GripVertical size={12} />
                    {image.displayOrder}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
