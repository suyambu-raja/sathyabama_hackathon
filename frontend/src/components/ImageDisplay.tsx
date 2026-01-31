/**
 * Reusable image display component for showing images with fallbacks
 */
import { useState } from 'react';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface ImageDisplayProps {
  src?: string | null;
  alt?: string;
  className?: string;
  containerClassName?: string;
  fallbackText?: string;
  showFallbackIcon?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-24 w-24',
  md: 'h-48 w-48',
  lg: 'h-64 w-full',
  xl: 'h-80 w-full',
};

const iconSizes = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8', 
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

export function ImageDisplay({
  src,
  alt = 'Item image',
  className,
  containerClassName,
  fallbackText = 'No image available',
  showFallbackIcon = true,
  size = 'lg',
}: ImageDisplayProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const shouldShowFallback = !src || imageError;

  if (shouldShowFallback) {
    return (
      <div
        className={cn(
          'bg-gray-100 flex items-center justify-center text-gray-500',
          sizeClasses[size],
          'rounded-lg',
          containerClassName
        )}
      >
        <div className="text-center">
          {showFallbackIcon && (
            <PhotoIcon className={cn('mx-auto text-gray-400 mb-2', iconSizes[size])} />
          )}
          <p className="text-sm">{fallbackText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden rounded-lg', containerClassName)}>
      {isLoading && (
        <div
          className={cn(
            'absolute inset-0 bg-gray-100 flex items-center justify-center',
            sizeClasses[size]
          )}
        >
          <div className="animate-pulse">
            <PhotoIcon className={cn('mx-auto text-gray-400', iconSizes[size])} />
          </div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={cn(
          'object-cover transition-opacity',
          sizeClasses[size],
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImageError(true);
          setIsLoading(false);
        }}
        loading="lazy"
      />
    </div>
  );
}

// Gallery component for multiple images
interface ImageGalleryProps {
  images: (string | null)[];
  alt?: string;
  className?: string;
  maxImages?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function ImageGallery({
  images,
  alt = 'Item image',
  className,
  maxImages = 4,
  size = 'md',
}: ImageGalleryProps) {
  const validImages = images.filter(Boolean).slice(0, maxImages);
  
  if (validImages.length === 0) {
    return (
      <ImageDisplay 
        src={null} 
        alt={alt} 
        size={size} 
        containerClassName={className}
        fallbackText="No images available"
      />
    );
  }

  if (validImages.length === 1) {
    return (
      <ImageDisplay 
        src={validImages[0]} 
        alt={alt} 
        size={size} 
        containerClassName={className}
      />
    );
  }

  return (
    <div className={cn('grid gap-2', className)}>
      <div className="grid grid-cols-2 gap-2">
        {validImages.map((image, index) => (
          <ImageDisplay
            key={index}
            src={image}
            alt={`${alt} ${index + 1}`}
            size="sm"
            containerClassName="aspect-square"
          />
        ))}
      </div>
      {images.length > maxImages && (
        <p className="text-xs text-gray-500 text-center">
          +{images.length - maxImages} more images
        </p>
      )}
    </div>
  );
}