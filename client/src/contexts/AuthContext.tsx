import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { API_BASE } from '../config';

// Safe JSON helpers to avoid crashes when API returns empty body or HTML
const isJsonResponse = (res: Response) => (res.headers.get('content-type') || '').includes('application/json');
const parseJsonSafe = async (res: Response) => {
  try {
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
};

interface User {
  id: string;
  userId?: string; // Add this for backward compatibility
  name: string;
  email: string;
  phone?: string;
  userType: 'customer' | 'technician';
  isAvailable?: boolean;
  vehicleInfo?: {
    make: string;
    model: string;
    licensePlate: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE || ''}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok && isJsonResponse(response)) {
        const userData = await parseJsonSafe(response);
        if (userData) {
          setUser(userData);
          return;
        }
      }
      // Not OK or not JSON or empty body -> treat as auth failure
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      // Verify token and get user profile
      fetchUserProfile();
    } else {
      setIsLoading(false);
    }
  }, [token, fetchUserProfile]);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE || ''}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = isJsonResponse(response) ? await parseJsonSafe(response) : null;

      if (response.ok && data && data.token) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
      } else {
        const message = (data && data.message) || (API_BASE ? 'Login failed' : 'API not configured. Set REACT_APP_API_URL in Vercel to your backend URL.');
        throw new Error(message);
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await fetch(`${API_BASE || ''}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = isJsonResponse(response) ? await parseJsonSafe(response) : null;

      if (response.ok && data && data.token) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
      } else {
        const message = (data && data.message) || (API_BASE ? 'Registration failed' : 'API not configured. Set REACT_APP_API_URL in Vercel to your backend URL.');
        throw new Error(message);
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
