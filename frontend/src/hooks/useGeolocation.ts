/**
 * Geolocation hook for Lost&Found AI Platform
 */
import { useState, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { reverseGeocode } from '@/lib/utils';
import type { GPS, UseGeolocationReturn } from '@/types';

export function useGeolocation(): UseGeolocationReturn {
  const [location, setLocation] = useState<GPS | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const getCurrentLocation = useCallback((): Promise<GPS> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const errorMsg = 'Geolocation is not supported by this browser';
        setError(errorMsg);
        reject(new Error(errorMsg));
        return;
      }

      setIsLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const coords: GPS = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
            };

            // Try to get address
            try {
              coords.address = await reverseGeocode(coords);
            } catch (err) {
              console.warn('Reverse geocoding failed:', err);
            }

            setLocation(coords);
            setIsLoading(false);
            resolve(coords);
          } catch (err) {
            const errorMsg = 'Failed to process location data';
            setError(errorMsg);
            setIsLoading(false);
            reject(new Error(errorMsg));
          }
        },
        (err) => {
          let errorMsg = 'Failed to get your location';
          
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMsg = 'Location access denied. Please enable location permissions.';
              break;
            case err.POSITION_UNAVAILABLE:
              errorMsg = 'Location information is unavailable.';
              break;
            case err.TIMEOUT:
              errorMsg = 'Location request timed out. Please try again.';
              break;
            default:
              errorMsg = 'An unknown error occurred while getting location.';
              break;
          }

          setError(errorMsg);
          setIsLoading(false);
          toast.error(errorMsg);
          reject(new Error(errorMsg));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000, // Cache for 1 minute
        }
      );
    });
  }, []);

  const watchLocation = useCallback((): number | null => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported');
      return null;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          const coords: GPS = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };

          // Try to get address
          try {
            coords.address = await reverseGeocode(coords);
          } catch (err) {
            console.warn('Reverse geocoding failed:', err);
          }

          setLocation(coords);
          setError(null);
        } catch (err) {
          setError('Failed to process location data');
        }
      },
      (err) => {
        let errorMsg = 'Failed to watch location';
        
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMsg = 'Location access denied';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMsg = 'Location unavailable';
            break;
          case err.TIMEOUT:
            errorMsg = 'Location request timed out';
            break;
        }

        setError(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );

    watchIdRef.current = watchId;
    return watchId;
  }, []);

  const clearWatch = useCallback((watchId: number) => {
    if (navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
      if (watchIdRef.current === watchId) {
        watchIdRef.current = null;
      }
    }
  }, []);

  // Cleanup on unmount
  useCallback(() => {
    return () => {
      if (watchIdRef.current) {
        clearWatch(watchIdRef.current);
      }
    };
  }, [clearWatch]);

  return {
    location,
    error,
    isLoading,
    getCurrentLocation,
    watchLocation,
    clearWatch,
  };
}