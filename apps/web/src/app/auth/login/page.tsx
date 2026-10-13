'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

import {
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';

// Affiche le formulaire de connexion à la plateforme.
export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Authentifie l'utilisateur puis le redirige selon son rôle.
  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/auth/login', form);

      setAuth(data.user, data.token);

      const role = data.user.role;

      if (role === 'ADMIN') {
        router.push('/admin');
      } else if (role === 'PRESTATAIRE') {
        router.push('/provider');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Une erreur est survenue.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Définit le style commun des champs du formulaire.
  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    color: 'var(--foreground)',
    fontSize: 14,
    outline: 'none',
    fontFamily: 'DM Sans, sans-serif',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box' as const,
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'var(--background)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--primary)',
            textDecoration: 'none',
            display: 'block',
            textAlign: 'center',
            marginBottom: 40,
          }}
        >
          Evently
        </Link>

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: 40,
          }}
        >
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            Bon retour
          </h1>

          <p
            style={{
              color: 'var(--muted)',
              textAlign: 'center',
              marginBottom: 32,
              fontSize: 14,
            }}
          >
            Connectez-vous à votre compte Evently
          </p>

          {error && (
            <div
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 10,
                padding: '12px 16px',
                marginBottom: 20,
                color: '#f87171',
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <input
              style={inputStyle}
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value,
                })
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit();
                }
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--primary)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
              }}
            />

            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <label
                  htmlFor="password"
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--foreground)',
                  }}
                >
                  Mot de passe
                </label>

                <Link
                  href="/auth/forgot-password"
                  style={{
                    fontSize: 12,
                    color: 'var(--primary)',
                    textDecoration: 'none',
                  }}
                >
                  Mot de passe oublié ?
                </Link>
              </div>

              <div
                style={{
                  position: 'relative',
                }}
              >
                <input
                  id="password"
                  style={{
                    ...inputStyle,
                    paddingRight: 46,
                  }}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Mot de passe"
                  value={form.password}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      password: e.target.value,
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSubmit();
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--primary)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border)';
                  }}
                />

                <button
                  type="button"
                  aria-label={
                    showPass
                      ? 'Masquer le mot de passe'
                      : 'Afficher le mot de passe'
                  }
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    padding: 4,
                    cursor: 'pointer',
                    color: 'var(--muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {showPass ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              style={{
                background: 'var(--primary)',
                color: '#0a0a0f',
                border: 'none',
                borderRadius: 12,
                padding: '14px',
                fontSize: 15,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontFamily: 'DM Sans, sans-serif',
                marginTop: 8,
              }}
            >
              {loading ? (
                'Connexion...'
              ) : (
                <>
                  Se connecter
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>

          <p
            style={{
              textAlign: 'center',
              marginTop: 24,
              fontSize: 14,
              color: 'var(--muted)',
            }}
          >
            Pas encore de compte ?{' '}
            <Link
              href="/auth/register"
              style={{
                color: 'var(--primary)',
                textDecoration: 'none',
              }}
            >
              S&apos;inscrire
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}