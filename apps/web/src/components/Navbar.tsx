'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import {
  Menu, X, LogOut, User, LayoutDashboard,
  Briefcase, Shield, Bell, ChevronDown
} from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  // Lire directement depuis localStorage pour éviter les problèmes d'hydratation
  const [authState, setAuthState] = useState<{
    user: any; token: string | null;
  }>({ user: null, token: null });

  const { logout } = useAuthStore();

  useEffect(() => {
    setMounted(true);

    // Lire le store Zustand depuis localStorage
    try {
      const stored = localStorage.getItem('evently_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        setAuthState({
          user: parsed?.state?.user || null,
          token: parsed?.state?.token || null,
        });
      }
    } catch { }
  }, [pathname]); // Se met à jour à chaque changement de page

  const isAuth = !!(authState.token && authState.user);
  const user = authState.user;
  const role = user?.role;

  // Lien "Mon espace" selon le rôle — PAS de redirection automatique
  const getDashboardLink = () => {
    if (role === 'ADMIN') return '/admin';
    if (role === 'PRESTATAIRE') return '/provider';
    return '/dashboard';
  };

  const getDashboardLabel = () => {
    if (role === 'ADMIN') return 'Back-office';
    if (role === 'PRESTATAIRE') return 'Mon espace';
    return 'Mon espace';
  };

  const getDashboardIcon = () => {
    if (role === 'ADMIN') return <Shield size={16} />;
    if (role === 'PRESTATAIRE') return <Briefcase size={16} />;
    return <LayoutDashboard size={16} />;
  };

  const handleLogout = () => {
    logout();
    setAuthState({ user: null, token: null });
    setUserMenuOpen(false);
    setMenuOpen(false);
    router.push('/');
  };

  // Fermer les menus au clic extérieur
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-navbar-menu]')) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const roleConfig: Record<string, { label: string; color: string; bg: string }> = {
    CLIENT: { label: 'Client', color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
    PRESTATAIRE: { label: 'Prestataire', color: '#c9a96e', bg: 'rgba(201,169,110,0.15)' },
    ADMIN: { label: 'Admin', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    SUPPORT: { label: 'Support', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
  };

  const currentRole = role ? (roleConfig[role] || roleConfig.CLIENT) : null;

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(10,10,15,0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      height: 64,
      display: 'flex', alignItems: 'center',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '0 24px',
        width: '100%', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
      }}>

        {/* Logo — toujours vers la page d'accueil */}
        <Link href="/" style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 24, fontWeight: 700,
          color: 'var(--primary)', textDecoration: 'none',
          letterSpacing: -0.5,
        }}>
          Evently
        </Link>

        {/* Liens centraux */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {[
            { href: '/', label: 'Accueil' },
            { href: '/venues', label: 'Lieux' },
            { href: '/services', label: 'Services' },
          ].map(link => {
            const active = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} style={{
                padding: '7px 14px', borderRadius: 8,
                textDecoration: 'none', fontSize: 14,
                color: active ? 'var(--primary)' : 'var(--muted)',
                fontWeight: active ? 600 : 400,
                background: active ? 'rgba(201,169,110,0.08)' : 'none',
                transition: 'color 0.2s, background 0.2s',
              }}
                onMouseEnter={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.color = 'var(--foreground)';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.color = 'var(--muted)';
                  }
                }}>
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Partie droite */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {!mounted ? (
            // Placeholder pour éviter le flash
            <div style={{ width: 180 }} />
          ) : isAuth ? (
            <>
              {/* Lien Mon espace */}
              <Link href={getDashboardLink()} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '7px 14px', borderRadius: 10,
                textDecoration: 'none',
                background: 'rgba(201,169,110,0.08)',
                border: '1px solid rgba(201,169,110,0.2)',
                color: 'var(--primary)', fontSize: 13, fontWeight: 600,
                transition: 'background 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(201,169,110,0.15)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(201,169,110,0.08)')}>
                {getDashboardIcon()}
                {getDashboardLabel()}
              </Link>

              {/* Menu utilisateur */}
              <div
                data-navbar-menu
                style={{ position: 'relative' }}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 12px 6px 8px', borderRadius: 10,
                    background: userMenuOpen
                      ? 'rgba(255,255,255,0.08)' : 'var(--surface)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer', transition: 'background 0.2s',
                  }}>
                  {/* Avatar */}
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: currentRole?.bg || 'rgba(201,169,110,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700,
                    color: currentRole?.color || 'var(--primary)',
                    fontFamily: 'Playfair Display, serif',
                    flexShrink: 0,
                  }}>
                    {user?.firstName?.[0]?.toUpperCase() || '?'}
                  </div>

                  <div style={{ textAlign: 'left' }}>
                    <p style={{
                      fontSize: 13, fontWeight: 600, color: 'var(--foreground)',
                      lineHeight: 1.2,
                    }}>
                      {user?.firstName}
                    </p>
                    {currentRole && (
                      <p style={{ fontSize: 10, color: currentRole.color, lineHeight: 1 }}>
                        {currentRole.label}
                      </p>
                    )}
                  </div>

                  <ChevronDown size={14} color="var(--muted)" style={{
                    transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }} />
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 14, padding: 8,
                    minWidth: 200,
                    boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
                    zIndex: 200,
                  }}>
                    {/* Infos utilisateur */}
                    <div style={{
                      padding: '10px 12px 12px',
                      borderBottom: '1px solid var(--border)',
                      marginBottom: 6,
                    }}>
                      <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
                        {user?.email}
                      </p>
                      {currentRole && (
                        <span style={{
                          background: currentRole.bg, color: currentRole.color,
                          padding: '2px 8px', borderRadius: 100,
                          fontSize: 10, fontWeight: 600,
                        }}>
                          {currentRole.label}
                        </span>
                      )}
                    </div>

                    {/* Liens du menu */}
                    <Link
                      href={getDashboardLink()}
                      onClick={() => setUserMenuOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 12px', borderRadius: 8,
                        textDecoration: 'none', color: 'var(--foreground)',
                        fontSize: 13, transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                      {getDashboardIcon()}
                      {getDashboardLabel()}
                    </Link>

                    <Link
                      href={role === 'PRESTATAIRE' ? '/provider/profile'
                        : role === 'ADMIN' ? '/admin/users'
                        : '/dashboard/profile'}
                      onClick={() => setUserMenuOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 12px', borderRadius: 8,
                        textDecoration: 'none', color: 'var(--foreground)',
                        fontSize: 13, transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                      <User size={16} color="var(--muted)" />
                      Mon profil
                    </Link>

                    {/* Séparateur */}
                    <div style={{
                      height: 1, background: 'var(--border)',
                      margin: '6px 0',
                    }} />

                    {/* Déconnexion */}
                    <button
                      onClick={handleLogout}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 12px', borderRadius: 8,
                        background: 'none', border: 'none',
                        width: '100%', cursor: 'pointer',
                        color: '#f87171', fontSize: 13,
                        fontFamily: 'DM Sans, sans-serif',
                        transition: 'background 0.15s',
                        textAlign: 'left',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.08)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                      <LogOut size={16} />
                      Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            // Non connecté
            <>
              <Link href="/auth/login" style={{
                padding: '8px 16px', borderRadius: 10,
                textDecoration: 'none', fontSize: 14,
                color: 'var(--muted)', fontWeight: 500,
                transition: 'color 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--foreground)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}>
                Connexion
              </Link>
              <Link href="/auth/register" style={{
                padding: '8px 18px', borderRadius: 10,
                textDecoration: 'none', fontSize: 14,
                background: 'var(--primary)', color: '#0a0a0f',
                fontWeight: 600, transition: 'opacity 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                S'inscrire
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}