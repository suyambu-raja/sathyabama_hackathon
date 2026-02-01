import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import type { UseAuthReturn } from '@/types';

/**
 * Authentication hook for Lost&Found AI Platform
 * Re-exports useAuth from the centralized AuthContext
 */
export function useAuth(): UseAuthReturn {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
