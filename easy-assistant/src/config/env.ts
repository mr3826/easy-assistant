/// <reference types="vite/client" />
export const env = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api',
  APP_TITLE: import.meta.env.VITE_APP_TITLE ?? 'BookingAI Admin Dashboard',
  ENV: import.meta.env.VITE_ENV ?? 'development',
} as const;

export default env;
