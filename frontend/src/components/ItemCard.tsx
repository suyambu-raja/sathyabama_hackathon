/**
 * Item card component for displaying lost/found items
 */
import { useState } from 'react';
import {
  MapPinIcon,
  CalendarIcon,
  EyeIcon,
  HandRaisedIcon,
  TagIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { ImageDisplay } from '@/components/ImageDisplay';
import {
  formatRelativeTime,
  truncateText,
  getStatusColor,
  getTypeColor,
  cn
} from '@/lib/utils';
import type { ItemCardProps } from '@/types';

export function ItemCard({
  item,
  showActions = true,
  onClaim,
  onViewDetails,
  className
}: ItemCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleViewDetails = () => {
    setIsExpanded(!isExpanded);
    onViewDetails?.(item);
  };

  const handleClaim = () => {
    onClaim?.(item);
  };

  return (
    <Card className={cn('overflow-hidden hover:shadow-lg transition-shadow', className)}>
      <div className="relative">
        {/* Item Image */}
        <ImageDisplay
          src={item.image_url}
          alt={item.product}
          size="lg"
          containerClassName="h-48 w-full"
          fallbackText="No image available"
        />
        
        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          <span className={cn(
            'px-2 py-1 text-xs font-medium rounded-full',
            getStatusColor(item.status)
          )}>
            {item.status}
          </span>
        </div>
        
        {/* Type Badge */}
        <div className="absolute top-2 right-2">
          <span className={cn(
            'px-2 py-1 text-xs font-medium rounded-full',
            getTypeColor(item.type)
          )}>
            {item.type}
          </span>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Item Title */}
        <h3 className="font-semibold text-lg text-gray-900 mb-2">
          {item.product}
        </h3>

        {/* Brand and Color */}
        {(item.brand || item.color) && (
          <div className="flex flex-wrap gap-2 mb-2">
            {item.brand && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {item.brand}
              </span>
            )}
            {item.color && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                {item.color}
              </span>
            )}
          </div>
        )}

        {/* Description */}
        <div className="mb-3">
          <p className="text-gray-600 text-sm">
            {isExpanded ? item.description : truncateText(item.description, 120)}
          </p>
        </div>

        {/* Location */}
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <MapPinIcon className="h-4 w-4 mr-1" />
          <span>
            {(() => {
              // Handle both nested gps object and flat properties from backend
              const address = (item as any).gps?.address || (item as any).address;
              const lat = (item as any).gps?.lat ?? (item as any).lat;
              const lng = (item as any).gps?.lng ?? (item as any).lng;

              if (address) return address;
              if (lat !== undefined && lng !== undefined) {
                return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
              }
              return 'Location not available';
            })()}
          </span>
        </div>

        {/* Date */}
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <CalendarIcon className="h-4 w-4 mr-1" />
          <span>{formatRelativeTime(item.created_at)}</span>
        </div>

        {/* Expandable Details */}
        {isExpanded && (
          <div className="border-t pt-4 mt-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
            {/* Additional Details */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 text-sm">Additional Information:</h4>
              
              {/* Owner Info */}
              {item.owner_id && (
                <div className="flex items-center text-xs text-gray-500">
                  <span className="font-medium">Reported by:</span>
                  <span className="ml-1">User #{item.owner_id}</span>
                </div>
              )}
              
              {/* Item ID */}
              <div className="flex items-center text-xs text-gray-500">
                <span className="font-medium">Item ID:</span>
                <span className="ml-1">#{item.id}</span>
              </div>
              
              {/* Full Location */}
              <div className="text-xs text-gray-500">
                <span className="font-medium">Full Location:</span>
                <div className="mt-1 pl-2 border-l-2 border-gray-200">
                  {(() => {
                    const address = (item as any).gps?.address || (item as any).address;
                    const lat = (item as any).gps?.lat ?? (item as any).lat;
                    const lng = (item as any).gps?.lng ?? (item as any).lng;
                    
                    return (
                      <div className="space-y-1">
                        {address && <div>📍 {address}</div>}
                        {lat !== undefined && lng !== undefined && (
                          <div>🗺️ Coordinates: {lat.toFixed(6)}, {lng.toFixed(6)}</div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
              
              {/* Status Details */}
              <div className="flex items-center text-xs text-gray-500">
                <span className="font-medium">Status:</span>
                <span className={cn(
                  'ml-1 px-2 py-0.5 rounded-full text-xs',
                  getStatusColor(item.status)
                )}>
                  {item.status}
                </span>
              </div>
              
              {/* Timestamps */}
              <div className="text-xs text-gray-500 space-y-1">
                <div>
                  <span className="font-medium">Created:</span>
                  <span className="ml-1">{new Date(item.created_at).toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-medium">Last Updated:</span>
                  <span className="ml-1">{new Date(item.updated_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewDetails}
              leftIcon={isExpanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
              className="flex-1"
            >
              {isExpanded ? 'Hide Details' : 'Show Details'}
            </Button>

            {onClaim && item.status === 'open' && (
              <Button
                variant="default"
                size="sm"
                onClick={handleClaim}
                leftIcon={<HandRaisedIcon className="h-4 w-4" />}
                className="flex-1"
              >
                Claim
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}