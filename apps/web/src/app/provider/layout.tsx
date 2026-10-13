'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

import { useAuthStore } from '@/store/auth.store';

import {
  LayoutDashboard,
  MapPin,
  Calendar,
  MessageSquare,
  BarChart2,
  LogOut,
  Home,
  ChevronRight,
  Plus,
  User,
  Briefcase,
} from 'lucide-react';

// Définit la structure et la navigation de l'espace prestataire.
export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const [ready, setReady] = useState(false);

  const navItems = [
    {
      href: '/provider',
      label: "Vue d'ensemble",
      icon: <LayoutDashboard size={18} />,
    },
    {
      href: '/provider/venues',
      label: 'Mes lieux',
      icon: <MapPin size={18} />,
    },
    {
      href: '/provider/services',
      label: 'Mes services',
      icon: <Briefcase size={18} />,
    },
    {
      href: '/provider/reservations',
      label: 'Réservations',
      icon: <Calendar size={18} />,
    },
    {
      href: '/provider/messages',
      label: 'Messages',
      icon: <MessageSquare size={18} />,
    },
    {
      href: '/provider/stats',
      label: 'Statistiques',
      icon: <BarChart2 size={18} />,
    },
    {
      href: '/provider/profile',
      label: 'Mon profil',
      icon: <User size={18} />,
    },
  ];

  // Vérifie la session et autorise uniquement les rôles concernés.
  useEffect(() => {
    const stored = localStorage.getItem('evently_auth');

    if (!stored) {
      router.push('/auth/login');
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      const role = parsed?.state?.user?.role;

      if (!role) {
        router.push('/auth/login');
        return;
      }

      if (
        role !== 'PRESTATAIRE' &&
        role !== 'ADMIN'
      ) {
        router.push('/dashboard');
        return;
      }
    } catch {
      router.push('/auth/login');
      return;
    }

    setReady(true);
  }, []);

  // Déconnecte l'utilisateur puis le redirige vers l'accueil.
  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!ready) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--background)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            color: 'var(--primary)',
            fontSize: 14,
          }}
        >
          Chargement...
        </div>
      </div>
    );
  }

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
            padding: '28px 24px',
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
              marginTop: 4,
              letterSpacing: 0.5,
            }}
          >
            ESPACE PRESTATAIRE
          </p>
        </div>

        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'rgba(201,169,110,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--primary)',
                fontFamily: 'Playfair Display, serif',
              }}
            >
              {user?.firstName?.[0]}
            </div>

            <div>
              <p
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                {user?.firstName} {user?.lastName}
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  marginTop: 2,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#4ade80',
                  }}
                />

                <span
                  style={{
                    fontSize: 11,
                    color: '#4ade80',
                  }}
                >
                  En ligne
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '12px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <Link
            href="/provider/venues/new"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: 'var(--primary)',
              color: '#0a0a0f',
              textDecoration: 'none',
              borderRadius: 10,
              padding: '9px',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Plus size={14} />
            Ajouter un lieu
          </Link>

          <Link
            href="/provider/services/new"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: 'rgba(201,169,110,0.15)',
              border: '1px solid rgba(201,169,110,0.3)',
              color: 'var(--primary)',
              textDecoration: 'none',
              borderRadius: 10,
              padding: '9px',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Plus size={14} />
            Ajouter un service
          </Link>
        </div>

        <nav
          style={{
            flex: 1,
            padding: '16px 12px',
            overflowY: 'auto',
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
                  marginBottom: 4,
                  textDecoration: 'none',
                  background: active
                    ? 'rgba(201,169,110,0.1)'
                    : 'none',
                  color: active
                    ? 'var(--primary)'
                    : 'var(--muted)',
                  fontSize: 14,
                  fontWeight: active ? 600 : 400,
                  transition: 'all 0.2s',
                  border: active
                    ? '1px solid rgba(201,169,110,0.2)'
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
            padding: '16px 12px',
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
          padding: '40px 40px',
        }}
      >
        {children}
      </main>
    </div>
  );
}