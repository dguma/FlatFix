// Global client-side configuration for API base URL
// Priority:
// 1) VITE_API_BASE or REACT_APP_API_URL if provided
// 2) In development, default to local backend at http://localhost:5000
// 3) Otherwise, production defaults to the Render backend

// Safely read env from import.meta (Vite) and fall back to process.env only if it exists (SSR/build tools)
const viteEnv = (typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined) || undefined;
const maybeProcessEnv = (typeof process !== 'undefined' && (process as any).env) ? (process as any).env as Record<string, string | undefined> : undefined;

const envApiBase = (viteEnv?.VITE_API_BASE || viteEnv?.REACT_APP_API_URL || maybeProcessEnv?.VITE_API_BASE || maybeProcessEnv?.REACT_APP_API_URL || '').replace(/\/$/, '');

const isDev = (typeof import.meta !== 'undefined' && viteEnv?.MODE === 'development')
	|| (typeof process !== 'undefined' && (process as any).env?.NODE_ENV === 'development');

// In production default to the Render backend if no env provided
export const API_BASE = envApiBase || (isDev ? 'http://localhost:5000' : 'https://flatfix.onrender.com');
