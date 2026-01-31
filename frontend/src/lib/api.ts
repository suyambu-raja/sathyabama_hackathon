/**
 * API client for Lost&Found AI Platform
 */
import axios, { AxiosInstance, AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-hot-toast';

import type {
  User,
  AuthResponse,
  LoginForm,
  RegisterForm,
  Item,
  ItemCreate,
  MatchResponse,
  ClaimRequest,
  ClaimResponse,
  OTPVerifyRequest,
  DashboardData,
  UploadResponse,
  ApiError
} from '@/types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = Cookies.get('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (!error.response) {
          const apiError: ApiError = {
            message:
              error.message?.toLowerCase().includes('network') ||
              error.message?.toLowerCase().includes('cors')
                ? 'Network/CORS error: backend not reachable or blocked. Ensure backend is running and CORS is enabled.'
                : error.message || 'Network error',
            status: 0,
            details: error.message,
          };
          toast.error(apiError.message);
          return Promise.reject(apiError);
        }

        const statusCode = error.response.status;
        const data = error.response.data as any;

        let message: string = data?.detail || error.message || 'An error occurred';

        if (statusCode === 422 && Array.isArray(data?.detail)) {
          message = data.detail
            .map((e: any) => {
              const loc = Array.isArray(e?.loc) ? e.loc.join('.') : '';
              const msg = e?.msg || 'Invalid input';
              return loc ? `${loc}: ${msg}` : msg;
            })
            .join(', ');
        }

        const apiError: ApiError = {
          message,
          status: statusCode || 500,
          details: data,
        };

        if (statusCode === 401) {
          Cookies.remove('access_token');
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
          return Promise.reject(apiError);
        }

        toast.error(apiError.message);
        return Promise.reject(apiError);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginForm): Promise<AuthResponse> {
    const response = await this.client.post<{access_token: string; token_type: string}>('/login', credentials);
    
    // Store token in cookies
    if (response.data.access_token) {
      Cookies.set('access_token', response.data.access_token, {
        expires: 7, // 7 days
        secure: import.meta.env.PROD,
        sameSite: 'strict',
      });
    }
    
    // Return in expected AuthResponse format
    return {
      access_token: response.data.access_token,
      token_type: response.data.token_type,
      expires_in: 7 * 24 * 60 * 60 // 7 days in seconds
    };
  }

  async register(userData: RegisterForm): Promise<AuthResponse> {
    // Remove confirmPassword before sending to backend
    const { confirmPassword, ...dataToSend } = userData;
    const response = await this.client.post<{access_token: string; token_type: string}>('/register', dataToSend);
    
    // Store token in cookies
    if (response.data.access_token) {
      Cookies.set('access_token', response.data.access_token, {
        expires: 7, // 7 days
        secure: import.meta.env.PROD,
        sameSite: 'strict',
      });
    }
    
    // Return in expected AuthResponse format
    return {
      access_token: response.data.access_token,
      token_type: response.data.token_type,
      expires_in: 7 * 24 * 60 * 60 // 7 days in seconds
    };
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>('/users/me');
    return response.data;
  }

  logout(): void {
    Cookies.remove('access_token');
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }

  // Item endpoints
  async createLostItem(item: ItemCreate): Promise<{ item_id: string; message: string }> {
    const payload = {
      type: 'lost',
      product: item.product,
      brand: item.brand,
      color: item.color,
      description: item.description,
      image_url: (item as any).image_url || null,
      lat: item.gps.lat,
      lng: item.gps.lng,
      address: item.gps.address,
    };
    const created = await this.client.post<Item>('/items', payload);
    return { item_id: String(created.data.id), message: 'Lost item created' };
  }

  async createFoundItem(item: ItemCreate): Promise<{
    item_id: string;
    message: string;
    matches_found: number;
    top_matches: MatchResponse[];
  }> {
    const payload = {
      type: 'found',
      product: item.product,
      brand: item.brand,
      color: item.color,
      description: item.description,
      image_url: (item as any).image_url || null,
      lat: item.gps.lat,
      lng: item.gps.lng,
      address: item.gps.address,
    };
    const created = await this.client.post<Item>('/items', payload);
    return {
      item_id: String(created.data.id),
      message: 'Found item created',
      matches_found: 0,
      top_matches: [],
    };
  }

  async getItem(itemId: string): Promise<{
    item: Item;
    can_claim: boolean;
    can_modify: boolean;
  }> {
    const response = await this.client.get<Item>(`/items/${itemId}`);
    return { item: response.data, can_claim: true, can_modify: false };
  }

  async getUserItems(type?: 'lost' | 'found', status?: string, limit = 50): Promise<Item[]> {
    const params = new URLSearchParams();
    if (type) params.append('item_type', type);
    if (status) params.append('status_filter', status);
    params.append('limit', limit.toString());

    const response = await this.client.get(`/items?${params.toString()}`);
    return response.data;
  }

  async updateItem(itemId: string, updates: Partial<Item>): Promise<void> {
    await this.client.put(`/items/${itemId}`, updates);
  }

  async deleteItem(itemId: string): Promise<void> {
    await this.client.delete(`/items/${itemId}`);
  }

  // AI matching endpoints
  async getMatches(itemId: string): Promise<MatchResponse[]> {
    const response = await this.client.post<MatchResponse[]>(`/ai/match/${itemId}`);
    return response.data;
  }

  // Dashboard endpoint
  async getDashboard(type?: 'lost' | 'found'): Promise<DashboardData> {
    const params = type ? `?item_type=${type}` : '';
    const response = await this.client.get<DashboardData>(`/dashboard${params}`);
    return response.data;
  }

  // Claim endpoints
  async createClaim(claimData: ClaimRequest): Promise<ClaimResponse> {
    const response = await this.client.post<ClaimResponse>('/claims', claimData);
    return response.data;
  }

  async verifyOTP(otpData: OTPVerifyRequest): Promise<{
    message: string;
    status: string;
    next_step: string;
  }> {
    const response = await this.client.post('/claims/verify-otp', otpData);
    return response.data;
  }

  // File upload endpoint
  async uploadImage(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<UploadResponse>('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }

  // Admin endpoints
  async getEscalations(): Promise<Item[]> {
    const response = await this.client.get<Item[]>('/admin/escalations');
    return response.data;
  }

  async triggerEscalation(): Promise<{ message: string }> {
    const response = await this.client.post('/admin/escalate');
    return response.data;
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!Cookies.get('access_token');
  }

  getToken(): string | null {
    return Cookies.get('access_token') || null;
  }
}

// Create singleton instance
export const api = new ApiClient();

// Export commonly used methods
export const {
  login,
  register,
  getCurrentUser,
  logout,
  createLostItem,
  createFoundItem,
  getItem,
  getUserItems,
  updateItem,
  deleteItem,
  getMatches,
  getDashboard,
  createClaim,
  verifyOTP,
  uploadImage,
  getEscalations,
  triggerEscalation,
  isAuthenticated,
  getToken,
} = api;