import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      setAuth: (user, token) => {
        localStorage.setItem('evently_token', token);
        set({ user, token });
      },

      logout: () => {
        localStorage.removeItem('evently_token');
        set({
          user: null,
          token: null,
        });
      },

      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'evently_auth',
    }
  )
);