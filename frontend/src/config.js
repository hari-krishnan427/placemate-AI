// Central API Configuration for Local Development and Production Deployments
// In production (Vercel, Netlify), set VITE_API_BASE_URL in your environment variables
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
export const API = API_BASE_URL;

export default API;
