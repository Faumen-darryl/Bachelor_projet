import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Fonction utilitaire pour lire le token depuis Zustand persist
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    // D'abord essayer le token direct
    const direct = localStorage.getItem('evently_token');
    if (direct) return direct;
    // Sinon lire depuis le store Zustand persisté
    const stored = localStorage.getItem('evently_auth');
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed?.state?.token || null;
  } catch {
    return null;
  }
};

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('evently_token');
        localStorage.removeItem('evently_auth');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);