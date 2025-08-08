// Global client-side configuration for API base URL
// If REACT_APP_API_URL is set (e.g., your Heroku backend URL), requests will be sent there.
// Otherwise, it will default to same-origin (useful for local proxy or rewrites).
export const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
