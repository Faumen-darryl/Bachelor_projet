'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

import { useAuthStore } from '@/store/auth.store';

import {
  LayoutDashboard,
  MessageSquare,
  Bell,
  User,
  LogOut,
  Home,
  ChevronRight,
  Calendar,
} from 'lucide-react';

// Définit les entrées disponibles dans la navigation de l'espace client.
const navItems = [
  {
    href: '/dashboard',
    label: 'Mes réservations',
    icon: <LayoutDashboard size={18} />,
  },
  {
    href: '/dashboard/messages',
    label: 'Messages',
    icon: <MessageSquare size={18} />,
  },
  {
    href: '/dashboard/notifications',
    label: 'Notifications',
    icon: <Bell size={18} />,
  },
  {
    href: '/dashboard/profile',
    label: 'Mon profil',
    icon: <User size={18} />,
  },
];

// Définit la structure principale de l'espace client.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuthStore();

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Vérifie la session et redirige l'utilisateur vers l'espace correspondant à son rôle.
  useEffect(() => {
    setMounted(true);

    try {
      const stored = localStorage.getItem('evently_auth');

      if (!stored) {
        router.push('/auth/login');
        return;
      }

      const parsed = JSON.parse(stored);
      const u = parsed?.state?.user;
      const token = parsed?.state?.token;

      if (!u || !token) {
        router.push('/auth/login');
        return;
      }

      if (u.role === 'ADMIN') {
        router.push('/admin');
        return;
      }

      if (u.role === 'PRESTATAIRE') {
        router.push('/provider');
        return;
      }

      setUser(u);
    } catch {
      router.push('/auth/login');
    }
  }, []);

  if (!mounted || !user) {
    return null;
  }

  // Déconnecte l'utilisateur puis le redirige vers l'accueil.
  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--background)',
        display: 'flex',
      }}
    >
      <aside
        style={{
          width: 260,
          flexShrink: 0,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 40,
        }}
      >
        <div
          style={{
            padding: '24px 20px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <Link
            href="/"
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--primary)',
              textDecoration: 'none',
            }}
          >
            Evently
          </Link>

          <p
            style={{
              fontSize: 11,
              color: 'var(--muted)',
              marginTop: 2,
            }}
          >
            Espace client
          </p>
        </div>

        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'rgba(96,165,250,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 15,
                fontWeight: 700,
                color: '#60a5fa',
                fontFamily: 'Playfair Display, serif',
              }}
            >
              {user?.firstName?.[0]?.toUpperCase()}
            </div>

            <div>
              <p
                style={{
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                {user?.firstName} {user?.lastName}
              </p>

              <p
                style={{
                  fontSize: 11,
                  color: '#60a5fa',
                }}
              >
                Client
              </p>
            </div>
          </div>
        </div>

        <nav
          style={{
            flex: 1,
            padding: '12px 10px',
          }}
        >
          {navItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  marginBottom: 2,
                  textDecoration: 'none',
                  background: active
                    ? 'rgba(96,165,250,0.1)'
                    : 'none',
                  color: active
                    ? '#60a5fa'
                    : 'var(--muted)',
                  fontSize: 14,
                  fontWeight: active ? 600 : 400,
                  transition: 'all 0.2s',
                  border: active
                    ? '1px solid rgba(96,165,250,0.2)'
                    : '1px solid transparent',
                }}
              >
                {item.icon}
                {item.label}

                {active && (
                  <ChevronRight
                    size={14}
                    style={{
                      marginLeft: 'auto',
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div
          style={{
            padding: '12px 10px',
            borderTop: '1px solid var(--border)',
          }}
        >
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 10,
              marginBottom: 4,
              textDecoration: 'none',
              color: 'var(--muted)',
              fontSize: 14,
              transition: 'color 0.2s',
            }}
          >
            <Home size={18} />
            Accueil
          </Link>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 10,
              width: '100%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#f87171',
              fontSize: 14,
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </aside>

      <main
        style={{
          flex: 1,
          marginLeft: 260,
          padding: '40px',
        }}
      >
        {children}
      </main>
    </div>
  );
}