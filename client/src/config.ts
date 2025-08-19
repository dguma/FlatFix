// Global client-side configuration for API base URL
// Priority:
// 1) REACT_APP_API_URL if provided
// 2) In development, default to local backend at http://localhost:5000
// 3) Otherwise, same-origin (empty string) for production behind rewrites
const fromEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env?.REACT_APP_API_URL
	|| (process.env.REACT_APP_API_URL || '')).replace(/\/$/, '');
const isDev = (typeof import.meta !== 'undefined' && (import.meta as any).env?.MODE === 'development')
	|| process.env.NODE_ENV === 'development';
export const API_BASE = fromEnv || (isDev ? 'http://localhost:5000' : '');
