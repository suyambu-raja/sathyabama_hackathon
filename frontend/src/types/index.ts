/**
 * TypeScript type definitions for Lost&Found AI Platform
 */

// User types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role: 'USER' | 'ADMIN' | 'POLICE' | 'MANAGEMENT';
  created_at: string;
  last_login?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user?: User;
}

// GPS and Location types
export interface GPS {
  lat: number;
  lng: number;
  address?: string;
  accuracy?: number;
}

// Item types
export type ItemType = 'lost' | 'found';
export type ItemStatus = 'open' | 'matched' | 'claimed' | 'released' | 'escalated';

export interface Item {
  id: string;
  type: ItemType;
  owner_id: string;
  product: string;
  brand?: string;
  color?: string;
  description: string;
  image_url?: string | null;  // Single image URL from database
  image_urls?: string[] | null; // Multiple images support
  gps: GPS;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
  escalation_date?: string;
}

export interface ItemCreate {
  type: ItemType;
  product: string;
  brand?: string;
  color?: string;
  description: string;
  gps: GPS;
  hidden_details?: string;
}

// Match types
export interface MatchBreakdown {
  image: number;
  text_image: number;
  location: number;
  time: number;
}

export interface MatchResponse {
  item: Item;
  score: number;
  breakdown: MatchBreakdown;
}

// Claim types
export interface ClaimRequest {
  item_id: string;
  verification_responses: Record<string, string>;
  phone_number?: string;
}

export interface ClaimResponse {
  claim_id: string;
  verification_score: number;
  otp_sent: boolean;
  message: string;
}

export interface OTPVerifyRequest {
  claim_id: string;
  otp_code: string;
}

// Dashboard types
export interface UserStats {
  total_items: number;
  lost_items: number;
  found_items: number;
  open_items: number;
  resolved_items: number;
}

export interface DashboardData {
  user_stats?: UserStats;
  recent_items?: Item[];
  public_items?: Item[];
  total_count?: number;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  status: 'success' | 'error';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  full_name?: string;
  phone?: string;
}

export interface ReportItemForm {
  type: ItemType;
  product: string;
  brand?: string;
  color?: string;
  description: string;
  hidden_details?: string;
  image?: File;
}

// Escrow types
export type EscrowState = 'PENDING' | 'LOCKED' | 'AWAITING_HANDOVER' | 'RELEASED' | 'CANCELLED';

export interface EscrowTransaction {
  id: string;
  claim_id: string;
  payer_id: string;
  recipient_id: string;
  amount: number;
  currency: string;
  state: EscrowState;
  razorpay_payment_id?: string;
  created_at: string;
  locked_at?: string;
  released_at?: string;
}

// Notification types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// File upload types
export interface UploadResponse {
  image_url: string;
}

// Geolocation types
export interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude?: number;
    altitudeAccuracy?: number;
    heading?: number;
    speed?: number;
  };
  timestamp: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

// Component props types
export interface ItemCardProps {
  item: Item;
  showActions?: boolean;
  onClaim?: (item: Item) => void;
  onViewDetails?: (item: Item) => void;
  className?: string;
}

export interface MatchCardProps {
  match: MatchResponse;
  onSelect?: (match: MatchResponse) => void;
  className?: string;
}

export interface MapProps {
  center?: GPS;
  items?: Item[];
  selectedItem?: Item;
  onLocationSelect?: (gps: GPS) => void;
  height?: string;
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

// Hook types
export interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginForm) => Promise<void>;
  register: (userData: RegisterForm) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export interface UseGeolocationReturn {
  location: GPS | null;
  error: string | null;
  isLoading: boolean;
  getCurrentLocation: () => Promise<GPS>;
  watchLocation: () => number | null;
  clearWatch: (watchId: number) => void;
}

export interface UseItemsReturn {
  items: Item[];
  isLoading: boolean;
  error: string | null;
  createItem: (item: ItemCreate, image?: File) => Promise<string>;
  updateItem: (id: string, updates: Partial<Item>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  refreshItems: () => Promise<void>;
}

// Error types
export interface ApiError {
  message: string;
  status: number;
  details?: unknown;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Search and filter types
export interface SearchFilters {
  type?: ItemType;
  status?: ItemStatus;
  location?: GPS;
  radius?: number; // in kilometers
  dateRange?: {
    start: string;
    end: string;
  };
  keywords?: string;
}

export interface SortOptions {
  field: 'created_at' | 'updated_at' | 'score';
  direction: 'asc' | 'desc';
}

// Analytics types
export interface AnalyticsEvent {
  event: string;
  category: string;
  data?: Record<string, any>;
  timestamp: string;
}

// PWA types
export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  mode: ThemeMode;
  primaryColor: string;
  accentColor: string;
}

// Language types
export type SupportedLanguage = 'en' | 'hi' | 'ta' | 'te';

export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}