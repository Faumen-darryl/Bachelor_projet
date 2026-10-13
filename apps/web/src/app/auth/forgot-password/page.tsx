'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Mail } from 'lucide-react';

import { api } from '@/lib/api';

// Affiche le formulaire de demande de réinitialisation du mot de passe.
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  // Envoie la demande de réinitialisation pour l'adresse email renseignée.
  const handleSubmit = async () => {
    if (!email) {
      setError('Veuillez saisir votre email.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--background)',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '40px 36px',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            marginBottom: 32,
          }}
        >
          <h1
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 32,
              color: 'var(--primary)',
              marginBottom: 8,
            }}
          >
            Evently
          </h1>

          <p
            style={{
              color: 'var(--muted)',
              fontSize: 14,
            }}
          >
            Réinitialisation du mot de passe
          </p>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(201, 169, 110, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <Mail
                size={28}
                color="var(--primary)"
              />
            </div>

            <h2
              style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: 20,
                color: 'var(--foreground)',
                marginBottom: 12,
              }}
            >
              Email envoyé !
            </h2>

            <p
              style={{
                color: 'var(--muted)',
                fontSize: 14,
                lineHeight: 1.6,
                marginBottom: 24,
              }}
            >
              Si un compte existe avec l'adresse{' '}
              <strong
                style={{
                  color: 'var(--foreground)',
                }}
              >
                {email}
              </strong>
              , vous recevrez un lien de réinitialisation valable 30 minutes.
            </p>

            <p
              style={{
                color: 'var(--muted)',
                fontSize: 13,
              }}
            >
              Vérifiez également vos spams.
            </p>

            <Link
              href="/auth/login"
              style={{
                display: 'block',
                marginTop: 24,
                color: 'var(--primary)',
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              ← Retour à la connexion
            </Link>
          </div>
        ) : (
          <>
            <p
              style={{
                color: 'var(--muted)',
                fontSize: 14,
                lineHeight: 1.6,
                marginBottom: 28,
              }}
            >
              Saisissez l'adresse email associée à votre compte. Nous vous
              enverrons un lien pour réinitialiser votre mot de passe.
            </p>

            {error && (
              <div
                style={{
                  background: 'rgba(220, 38, 38, 0.1)',
                  border: '1px solid rgba(220, 38, 38, 0.3)',
                  borderRadius: 8,
                  padding: '12px 16px',
                  color: '#ef4444',
                  fontSize: 14,
                  marginBottom: 20,
                }}
              >
                {error}
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--foreground)',
                  marginBottom: 8,
                }}
              >
                Adresse email
              </label>

              <input
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && handleSubmit()
                }
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  color: 'var(--foreground)',
                  fontSize: 15,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                background: loading
                  ? 'var(--primary-dark)'
                  : 'var(--primary)',
                border: 'none',
                borderRadius: 10,
                color: '#0a0a0f',
                fontWeight: 700,
                fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s',
              }}
            >
              {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
            </button>

            <div
              style={{
                textAlign: 'center',
                marginTop: 24,
              }}
            >
              <Link
                href="/auth/login"
                style={{
                  color: 'var(--muted)',
                  fontSize: 14,
                  textDecoration: 'none',
                }}
              >
                ← Retour à la connexion
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}