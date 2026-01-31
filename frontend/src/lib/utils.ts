/**
 * Utility functions for Lost&Found AI Platform
 */
import { type ClassValue, clsx } from 'clsx';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import type { GPS, Item, MatchBreakdown } from '@/types';

/**
 * Combine class names with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Format date strings for display
 */
export function formatDate(dateString: string, formatStr = 'PPP'): string {
  try {
    const date = parseISO(dateString);
    return format(date, formatStr);
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'Unknown time';
  }
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 */
export function calculateDistance(coord1: GPS, coord2: GPS): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coord2.lat - coord1.lat);
  const dLng = toRadians(coord2.lng - coord1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.lat)) * Math.cos(toRadians(coord2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format distance for display
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
}

/**
 * Get current user location using browser geolocation API
 */
export function getCurrentLocation(): Promise<GPS> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000, // Cache for 1 minute
      }
    );
  });
}

/**
 * Reverse geocode GPS coordinates to address
 */
export async function reverseGeocode(coords: GPS): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'LostFoundAI/1.0',
        },
      }
    );
    
    if (!response.ok) throw new Error('Geocoding failed');
    
    const data = await response.json();
    return data.display_name || 'Unknown location';
  } catch {
    return 'Unknown location';
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone; // Return original if format is unclear
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Capitalize first letter of each word
 */
export function titleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

/**
 * Generate color based on item status
 */
export function getStatusColor(status: string): string {
  const colors = {
    open: 'text-blue-600 bg-blue-100',
    matched: 'text-yellow-600 bg-yellow-100',
    claimed: 'text-orange-600 bg-orange-100',
    released: 'text-green-600 bg-green-100',
    escalated: 'text-red-600 bg-red-100',
  };
  
  return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100';
}

/**
 * Generate color based on item type
 */
export function getTypeColor(type: string): string {
  return type === 'lost' 
    ? 'text-red-600 bg-red-100'
    : 'text-green-600 bg-green-100';
}

/**
 * Calculate match score percentage
 */
export function getMatchPercentage(score: number): number {
  return Math.round(score * 100);
}

/**
 * Get match score color based on percentage
 */
export function getMatchScoreColor(score: number): string {
  const percentage = getMatchPercentage(score);
  
  if (percentage >= 90) return 'text-green-600 bg-green-100';
  if (percentage >= 75) return 'text-yellow-600 bg-yellow-100';
  if (percentage >= 60) return 'text-orange-600 bg-orange-100';
  return 'text-red-600 bg-red-100';
}

/**
 * Format match breakdown for display
 */
export function formatMatchBreakdown(breakdown: MatchBreakdown): Array<{
  label: string;
  score: number;
  percentage: number;
}> {
  return [
    {
      label: 'Image Similarity',
      score: breakdown.image,
      percentage: getMatchPercentage(breakdown.image),
    },
    {
      label: 'Text Match',
      score: breakdown.text_image,
      percentage: getMatchPercentage(breakdown.text_image),
    },
    {
      label: 'Location',
      score: breakdown.location,
      percentage: getMatchPercentage(breakdown.location),
    },
    {
      label: 'Time',
      score: breakdown.time,
      percentage: getMatchPercentage(breakdown.time),
    },
  ];
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

/**
 * Download file from URL
 */
export function downloadFile(url: string, filename?: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'download';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Check if device supports PWA installation
 */
export function isPWASupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Get device type based on screen size
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Please upload a JPEG, PNG, or WebP image',
    };
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size must be less than ${formatFileSize(maxSize)}`,
    };
  }
  
  return { valid: true };
}