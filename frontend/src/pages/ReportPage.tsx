/**
 * Report item page (lost or found)
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDropzone } from 'react-dropzone';
import {
  PhotoIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LocationPicker } from '@/components/LocationPicker';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { validateImageFile } from '@/lib/utils';
import type { ItemCreate, ItemType, GPS } from '@/types';

const itemSchema = z.object({
  product: z.string().min(2, 'Product name must be at least 2 characters'),
  brand: z.string().optional(),
  color: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  image_url: z.string()
    .refine((val) => {
      if (!val || val === '') return true; // Allow empty
      try {
        const url = new URL(val);
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch {
        return false;
      }
    }, 'Please enter a valid image URL (must start with http:// or https://)')
    .optional(),
  hidden_details: z.string().optional(),
});

type ItemForm = z.infer<typeof itemSchema>;

export default function ReportPage() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [itemType, setItemType] = useState<ItemType>(
    (type as ItemType) || 'lost'
  );
  const [location, setLocation] = useState<GPS | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [urlPreview, setUrlPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
  });

  // Watch image_url field for preview
  const watchedImageUrl = watch('image_url');

  // Update URL preview when image_url changes
  useEffect(() => {
    if (watchedImageUrl && watchedImageUrl !== '') {
      try {
        new URL(watchedImageUrl); // Validate URL
        setUrlPreview(watchedImageUrl);
      } catch {
        setUrlPreview(null);
      }
    } else {
      setUrlPreview(null);
    }
  }, [watchedImageUrl]);

  // File drop zone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        const validation = validateImageFile(file);
        if (!validation.valid) {
          alert(validation.error);
          return;
        }

        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
  });

  const onSubmit = async (data: ItemForm) => {
    console.log('🚀 Form submitted with data:', data);
    
    if (!location) {
      alert('Please select a location');
      return;
    }

    try {
      setIsSubmitting(true);

      // Upload image if selected
      let imageUrl = '';
      if (selectedFile) {
        const uploadResponse = await api.uploadImage(selectedFile);
        imageUrl = uploadResponse.image_url;
      }

      // Create item data
      const itemData: ItemCreate = {
        type: itemType,
        product: data.product,
        brand: data.brand || undefined,
        color: data.color || undefined,
        description: data.description,
        gps: location,
        hidden_details: data.hidden_details || undefined,
      };

      // Add image URL (prioritize form input, then uploaded file)
      if (data.image_url) {
        console.log('📸 Using image URL from form:', data.image_url);
        (itemData as any).image_url = data.image_url;
      } else if (imageUrl) {
        console.log('📸 Using uploaded image URL:', imageUrl);
        (itemData as any).image_url = imageUrl;
      }
      
      console.log('📋 Final itemData:', itemData);

      // Submit item
      let response;
      if (itemType === 'lost') {
        response = await api.createLostItem(itemData);
      } else {
        response = await api.createFoundItem(itemData);
      }

      // Reset form
      reset();
      setLocation(null);
      setSelectedFile(null);
      setImagePreview(null);

      // Navigate to success page or dashboard
      navigate('/dashboard', {
        state: {
          message: `${itemType === 'lost' ? 'Lost' : 'Found'} item reported successfully!`,
          itemId: response.item_id,
        },
      });
    } catch (error: any) {
      console.error('Failed to report item:', error);
      alert(error.message || 'Failed to report item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Report {itemType === 'lost' ? 'Lost' : 'Found'} Item
          </h1>
          <p className="text-gray-600 mt-2">
            Help reunite people with their belongings
          </p>
        </div>

        {/* Item Type Toggle */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex justify-center">
              <div className="bg-gray-100 rounded-lg p-1 flex">
                <button
                  type="button"
                  onClick={() => setItemType('lost')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${itemType === 'lost'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <ExclamationTriangleIcon className="h-4 w-4 mr-2 inline" />
                  Lost Item
                </button>
                <button
                  type="button"
                  onClick={() => setItemType('found')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${itemType === 'found'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <PlusIcon className="h-4 w-4 mr-2 inline" />
                  Found Item
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Form */}
        <Card>
          <CardHeader>
            <CardTitle>
              {itemType === 'lost' ? 'Lost' : 'Found'} Item Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Details */}
              <Input
                label="Product Name"
                {...register('product')}
                error={errors.product?.message}
                placeholder="e.g., iPhone 14, Wallet, Keys"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Brand (Optional)"
                  {...register('brand')}
                  error={errors.brand?.message}
                  placeholder="e.g., Apple, Samsung"
                />

                <Input
                  label="Color (Optional)"
                  {...register('color')}
                  error={errors.color?.message}
                  placeholder="e.g., Black, Blue, Red"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Provide a detailed description of the item..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* Hidden Details for Lost Items */}
              {itemType === 'lost' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hidden Verification Details (Optional)
                  </label>
                  <textarea
                    {...register('hidden_details')}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Private details only you know (e.g., scratches, serial number)"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    These details will be used to verify ownership when someone claims your item
                  </p>
                </div>
              )}

              {/* Image URL Input */}
              <div>
                <Input
                  label="Image URL (Optional)"
                  {...register('image_url')}
                  error={errors.image_url?.message}
                  placeholder="https://picsum.photos/400/300"
                />
                
                {/* URL Preview */}
                {urlPreview && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">Preview:</p>
                    <div className="relative w-full max-w-sm">
                      <img
                        src={urlPreview}
                        alt="URL Preview"
                        className="w-full h-32 object-cover rounded-lg border"
                        onLoad={() => console.log('✅ Image URL preview loaded successfully')}
                        onError={() => console.log('❌ Image URL preview failed to load')}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or Upload Photo {itemType === 'found' ? '(Recommended)' : '(Optional)'}
                </label>

                {!imagePreview ? (
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                      }`}
                  >
                    <input {...getInputProps()} />
                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      {isDragActive
                        ? 'Drop the image here...'
                        : 'Drag and drop an image, or click to select'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, JPEG up to 5MB
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              {/* Location */}
              <LocationPicker
                value={location}
                onChange={setLocation}
                required
              />

              {/* Submit Button */}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  loadingText="Reporting..."
                  disabled={!location}
                >
                  Report {itemType === 'lost' ? 'Lost' : 'Found'} Item
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}