import React, { useEffect, useState } from 'react';
import { Upload, Trash2, Eye, Loader2, GripVertical } from 'lucide-react';
import {
  getProductImages as fetchProductImages,
  uploadProductImageFile,
} from '../../../lib/adminService';
import { supabase } from '../../../lib/supabase';

interface ProductImage { id: string; product_id: string; image_url: string; imageUrl: string; is_main: boolean; isMainImage: boolean; display_order: number; displayOrder: number; }

export const ProductImageManagement: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const userId = 'admin';

  // Load products from Supabase
  useEffect(() => {
    const loadProducts = async () => {
      const { data } = await supabase.from('products').select('id, name').order('name').limit(50);
      setProducts(data || []);
      if (data && data.length > 0) setSelectedProductId(data[0].id);
    };
    loadProducts();
  }, []);

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

      // Upload file to Supabase storage
      const imageUrl = await uploadProductImageFile(selectedProductId, file, userId);

      if (imageUrl) {
        // Update the product's images array in the DB
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
      // Remove image URL from product's images array
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

    // Update display order by rewriting images array in order
    const reorderedUrls = newImages.map((img) => img.image_url);
    await supabase
      .from('products')
      .update({ images: reorderedUrls })
      .eq('id', selectedProductId);
    loadImages();
    setDraggedId(null);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-xl font-bold text-gray-900 mb-8">Product Image Management</h1>

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
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>

        {/* Upload Section */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow border-2 border-dashed border-blue-300">
          <h2 className="text-lg font-bold mb-4">Upload Images</h2>
          <label className="cursor-pointer">
            <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 rounded-lg hover:bg-blue-100">
              <Upload size={20} className="text-blue-600" />
              <span className="text-blue-600 font-semibold">
                Click to upload or drag and drop
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
          {uploading && (
            <div className="flex items-center gap-2 text-blue-600 mt-2">
              <Loader2 className="animate-spin" size={20} />
              <span>Uploading...</span>
            </div>
          )}
        </div>

        {/* Images Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-blue-600" size={24} />
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600">No images uploaded yet. Upload your first image above.</p>
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
                {/* Image */}
                <img
                  src={image.imageUrl}
                  alt="Product"
                  className="w-full h-48 object-cover"
                />

                {/* Overlay */}
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

                {/* Badge */}
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
