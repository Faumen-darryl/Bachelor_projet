import axios from 'axios';

export const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Lit le token d'authentification depuis le stockage local.
const getToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const directToken =
      localStorage.getItem('evently_token');

    if (directToken) {
      return directToken;
    }

    const storedAuth =
      localStorage.getItem('evently_auth');

    if (!storedAuth) {
      return null;
    }

    const parsed = JSON.parse(storedAuth);

    return parsed?.state?.token || null;
  } catch {
    return null;
  }
};

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization =
      `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(
          'evently_token'
        );
        localStorage.removeItem(
          'evently_auth'
        );

        window.location.href =
          '/auth/login';
      }
    }

    return Promise.reject(error);
  }
);