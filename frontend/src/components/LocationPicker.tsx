/**
 * Location picker component with map and GPS integration
 */
import { useState, useEffect } from 'react';
import { MapPinIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useGeolocation } from '@/hooks/useGeolocation';
import { reverseGeocode, cn } from '@/lib/utils';
import type { GPS } from '@/types';

interface LocationPickerProps {
  value?: GPS;
  onChange: (location: GPS) => void;
  className?: string;
  showMap?: boolean;
  required?: boolean;
}

export function LocationPicker({
  value,
  onChange,
  className,
  showMap = false,
  required = true,
}: LocationPickerProps) {
  const [manualCoords, setManualCoords] = useState('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  
  const { 
    location: currentLocation, 
    isLoading: isGettingLocation, 
    error: locationError,
    getCurrentLocation 
  } = useGeolocation();

  // Handle GPS location selection
  const handleUseCurrentLocation = async () => {
    try {
      const location = await getCurrentLocation();
      onChange(location);
    } catch (error) {
      console.error('Failed to get current location:', error);
    }
  };

  // Handle manual coordinates input
  const handleManualCoords = async () => {
    try {
      const [latStr, lngStr] = manualCoords.split(',').map(s => s.trim());
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);

      if (isNaN(lat) || isNaN(lng)) {
        throw new Error('Invalid coordinates');
      }

      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new Error('Coordinates out of valid range');
      }

      setIsLoadingAddress(true);
      
      const coords: GPS = { lat, lng };
      
      // Try to get address
      try {
        coords.address = await reverseGeocode(coords);
      } catch (err) {
        console.warn('Failed to get address:', err);
      }

      onChange(coords);
      setManualCoords('');
    } catch (error) {
      console.error('Invalid coordinates:', error);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  // Format display location
  const getLocationDisplay = (location: GPS): string => {
    if (location.address) return location.address;
    return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location {required && <span className="text-red-500">*</span>}
        </label>
        
        {/* Current Location Button */}
        <div className="flex gap-2 mb-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleUseCurrentLocation}
            isLoading={isGettingLocation}
            loadingText="Getting location..."
            leftIcon={<MapPinIcon className="h-4 w-4" />}
            className="flex-1 sm:flex-initial"
          >
            Use Current Location
          </Button>
          
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onChange(value)}
              title="Refresh address"
              disabled={isLoadingAddress}
            >
              <ArrowPathIcon className={cn(
                'h-4 w-4',
                isLoadingAddress && 'animate-spin'
              )} />
            </Button>
          )}
        </div>

        {/* Location Error */}
        {locationError && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{locationError}</p>
          </div>
        )}

        {/* Manual Coordinates Input */}
        <div className="flex gap-2 mb-3">
          <Input
            type="text"
            placeholder="Enter coordinates (lat, lng)"
            value={manualCoords}
            onChange={(e) => setManualCoords(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleManualCoords();
              }
            }}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleManualCoords}
            disabled={!manualCoords.trim() || isLoadingAddress}
            isLoading={isLoadingAddress}
          >
            Set
          </Button>
        </div>

        {/* Selected Location Display */}
        {value && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-start gap-2">
              <MapPinIcon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  Selected Location
                </p>
                <p className="text-sm text-green-700">
                  {getLocationDisplay(value)}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
                  {value.accuracy && (
                    <span className="ml-2">
                      (±{Math.round(value.accuracy)}m)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Map Placeholder */}
        {showMap && value && (
          <div className="mt-4 h-64 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MapPinIcon className="h-12 w-12 mx-auto mb-2" />
              <p className="text-sm">Map view</p>
              <p className="text-xs">
                {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
              </p>
            </div>
          </div>
        )}

        {/* Help Text */}
        <p className="mt-2 text-xs text-gray-500">
          Use your current location or enter coordinates manually. 
          This helps us show nearby items and improve matching accuracy.
        </p>
      </div>
    </div>
  );
}