import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductListing } from '../../../contexts/ProductListingContext';
import { ErrorMessage } from '../components/StatusIndicators';
import { 
  Upload, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Image as ImageIcon, 
  Video,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface FileWithPreview {
  file: File;
  preview: string;
  progress: number;
  uploaded: boolean;
  error?: string;
}

const MAX_IMAGE_SIZE = 25 * 1024 * 1024; // 25MB
const MAX_VIDEO_SIZE = 40 * 1024 * 1024; // 40MB
const MIN_IMAGES = 5;
const MAX_IMAGES = 10;
const MAX_VIDEOS = 2;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export const AdminListings2: React.FC = () => {
  const navigate = useNavigate();
  const { updateStep2, goToNextStep, goToPreviousStep } = useProductListing();

  const [images, setImages] = useState<FileWithPreview[]>([]);
  const [videos, setVideos] = useState<FileWithPreview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Simulate upload progress
  const simulateUpload = useCallback((file: FileWithPreview, setFiles: React.Dispatch<React.SetStateAction<FileWithPreview[]>>) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setFiles(prev => prev.map(f => 
          f.file === file.file ? { ...f, progress: 100, uploaded: true } : f
        ));
      } else {
        setFiles(prev => prev.map(f => 
          f.file === file.file ? { ...f, progress } : f
        ));
      }
    }, 200);
  }, []);

  const validateImageFile = (file: File): string | null => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return 'Only JPG, JPEG, and PNG files are allowed';
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return 'Image size must be less than 25MB';
    }
    return null;
  };

  const validateVideoFile = (file: File): string | null => {
    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      return 'Only MP4, WebM, and MOV files are allowed';
    }
    if (file.size > MAX_VIDEO_SIZE) {
      return 'Video size must be less than 40MB';
    }
    return null;
  };

  const handleImageSelect = (files: FileList | null) => {
    if (!files) return;
    setError(null);

    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) {
      setError(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    const newImages: FileWithPreview[] = [];
    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
      const file = files[i];
      const validationError = validateImageFile(file);
      
      if (validationError) {
        setError(validationError);
        continue;
      }

      const preview = URL.createObjectURL(file);
      const newFile: FileWithPreview = {
        file,
        preview,
        progress: 0,
        uploaded: false,
      };
      newImages.push(newFile);
    }

    setImages(prev => {
      const updated = [...prev, ...newImages];
      // Update context with URLs
      updateStep2({ 
        images: updated.map(i => i.file),
        imageUrls: updated.map(i => i.preview) 
      });
      return updated;
    });

    // Simulate upload for each new image
    newImages.forEach(img => simulateUpload(img, setImages));
  };

  const handleVideoSelect = (files: FileList | null) => {
    if (!files) return;
    setError(null);

    const remainingSlots = MAX_VIDEOS - videos.length;
    if (remainingSlots <= 0) {
      setError(`Maximum ${MAX_VIDEOS} videos allowed`);
      return;
    }

    const newVideos: FileWithPreview[] = [];
    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
      const file = files[i];
      const validationError = validateVideoFile(file);
      
      if (validationError) {
        setError(validationError);
        continue;
      }

      const preview = URL.createObjectURL(file);
      const newFile: FileWithPreview = {
        file,
        preview,
        progress: 0,
        uploaded: false,
      };
      newVideos.push(newFile);
    }

    setVideos(prev => {
      const updated = [...prev, ...newVideos];
      updateStep2({ 
        videos: updated.map(v => v.file),
        videoUrls: updated.map(v => v.preview) 
      });
      return updated;
    });

    // Simulate upload
    newVideos.forEach(vid => simulateUpload(vid, setVideos));
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const updated = prev.filter((_, i) => i !== index);
      URL.revokeObjectURL(prev[index].preview);
      updateStep2({ 
        images: updated.map(i => i.file),
        imageUrls: updated.map(i => i.preview) 
      });
      return updated;
    });
  };

  const removeVideo = (index: number) => {
    setVideos(prev => {
      const updated = prev.filter((_, i) => i !== index);
      URL.revokeObjectURL(prev[index].preview);
      updateStep2({ 
        videos: updated.map(v => v.file),
        videoUrls: updated.map(v => v.preview) 
      });
      return updated;
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = e.dataTransfer.files;
      // Check if it's image or video
      if (ACCEPTED_IMAGE_TYPES.includes(files[0].type)) {
        handleImageSelect(files);
      } else if (ACCEPTED_VIDEO_TYPES.includes(files[0].type)) {
        handleVideoSelect(files);
      }
    }
  };

  const handleBack = () => {
    goToPreviousStep();
    navigate('/admin/products/new/step1');
  };

  const handleNext = () => {
    if (images.length < MIN_IMAGES) {
      setError(`Please upload at least ${MIN_IMAGES} images`);
      return;
    }
    goToNextStep();
    navigate('/admin/products/new/step3');
  };

  return (
    <div className="space-y-6">
      {error && <ErrorMessage message={error} />}

      {/* Requirements Info */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
        <AlertCircle className="text-blue-600 mt-0.5" size={20} />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Image Requirements:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Minimum {MIN_IMAGES} images required, maximum {MAX_IMAGES}</li>
            <li>Accepted formats: JPG, JPEG, PNG</li>
            <li>Maximum file size: 25MB per image</li>
            <li>Recommended resolution: 1050 x 1050 pixels</li>
          </ul>
        </div>
      </div>

      {/* Image Upload Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ImageIcon size={20} className="text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">Product Images</h3>
          </div>
          <span className="text-sm text-gray-500">
            {images.length}/{MAX_IMAGES} images
          </span>
        </div>

        {/* Upload Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-black bg-gray-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <Upload className="mx-auto mb-4 text-gray-500" size={36} />
          <p className="text-gray-600 mb-2">Drag and drop images here, or</p>
          <button
            onClick={() => imageInputRef.current?.click()}
            disabled={images.length >= MAX_IMAGES}
            className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-50 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Browse Files
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            multiple
            onChange={(e) => handleImageSelect(e.target.files)}
            className="hidden"
          />
          <p className="text-xs text-gray-500 mt-2">
            JPG, JPEG, PNG up to 25MB
          </p>
        </div>

        {/* Image Previews */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
            {images.map((img, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-white border">
                  <img
                    src={img.preview}
                    alt={`Product ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {/* Progress overlay */}
                  {!img.uploaded && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-3/4">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-white transition-all duration-300"
                            style={{ width: `${img.progress}%` }}
                          />
                        </div>
                        <p className="text-gray-900 text-xs text-center mt-2">
                          {Math.round(img.progress)}%
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Uploaded indicator */}
                  {img.uploaded && (
                    <div className="absolute top-2 left-2 bg-green-500 text-gray-900 p-1 rounded-full">
                      <CheckCircle size={14} />
                    </div>
                  )}
                </div>
                {/* Remove button */}
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-gray-900 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X size={14} />
                </button>
                {/* Primary badge for first image */}
                {index === 0 && (
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-white text-gray-900 text-xs rounded">
                    Primary
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Status indicator */}
        <div className={`mt-4 flex items-center gap-2 ${images.length >= MIN_IMAGES ? 'text-green-600' : 'text-amber-600'}`}>
          {images.length >= MIN_IMAGES ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span className="text-sm">
            {images.length >= MIN_IMAGES 
              ? `${images.length} images uploaded` 
              : `${MIN_IMAGES - images.length} more image(s) required`}
          </span>
        </div>
      </div>

      {/* Video Upload Section */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Video size={20} className="text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">Product Videos</h3>
            <span className="text-xs text-gray-500 ml-2">(Optional)</span>
          </div>
          <span className="text-sm text-gray-500">
            {videos.length}/{MAX_VIDEOS} videos
          </span>
        </div>

        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg mb-4">
          <AlertCircle className="text-gray-600 mt-0.5" size={18} />
          <div className="text-sm text-gray-600">
            <p>Maximum {MAX_VIDEOS} videos allowed. Accepted formats: MP4, WebM, MOV. Max size: 40MB</p>
          </div>
        </div>

        <button
          onClick={() => videoInputRef.current?.click()}
          disabled={videos.length >= MAX_VIDEOS}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <Upload size={18} />
          Upload Video
        </button>
        <input
          ref={videoInputRef}
          type="file"
          accept={ACCEPTED_VIDEO_TYPES.join(',')}
          onChange={(e) => handleVideoSelect(e.target.files)}
          className="hidden"
        />

        {/* Video Previews */}
        {videos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {videos.map((vid, index) => (
              <div key={index} className="relative group">
                <div className="aspect-video rounded-lg overflow-hidden bg-white border">
                  <video
                    src={vid.preview}
                    className="w-full h-full object-cover"
                    controls
                  />
                  {/* Progress overlay */}
                  {!vid.uploaded && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
                      <div className="w-3/4">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-white transition-all duration-300"
                            style={{ width: `${vid.progress}%` }}
                          />
                        </div>
                        <p className="text-gray-900 text-xs text-center mt-2">
                          Uploading... {Math.round(vid.progress)}%
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeVideo(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-gray-900 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft size={20} />
          Back to Basic Info
        </button>
        <button
          onClick={handleNext}
          disabled={images.length < MIN_IMAGES}
          className="flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-50 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Continue to Details
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default AdminListings2;
