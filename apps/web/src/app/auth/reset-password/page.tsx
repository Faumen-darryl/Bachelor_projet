'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { CheckCircle, Eye, EyeOff, XCircle } from 'lucide-react';

import { api } from '@/lib/api';

// Gère le formulaire de réinitialisation du mot de passe.
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Vérifie qu'un token de réinitialisation est présent dans l'URL.
  useEffect(() => {
    if (!token) {
      setError('Lien de réinitialisation invalide ou manquant.');
    }
  }, [token]);

  // Valide les mots de passe puis envoie la demande de réinitialisation.
  const handleSubmit = async () => {
    setError('');

    if (!newPassword || !confirm) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    if (newPassword !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword,
      });

      setSuccess(true);

      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        'Une erreur est survenue.';

      if (
        msg.includes('invalide') ||
        msg.includes('expiré')
      ) {
        setError(
          'Ce lien de réinitialisation est invalide ou a expiré. Veuillez faire une nouvelle demande.'
        );
      } else {
        setError(msg);
      }
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
            Nouveau mot de passe
          </p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(34, 197, 94, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <CheckCircle
                size={28}
                color="#22c55e"
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
              Mot de passe modifié !
            </h2>

            <p
              style={{
                color: 'var(--muted)',
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              Votre mot de passe a été réinitialisé avec succès.
              Vous allez être redirigé vers la page de connexion...
            </p>
          </div>
        ) : (
          <>
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
                  lineHeight: 1.5,
                }}
              >
                {error}

                {error.includes('expiré') && (
                  <div style={{ marginTop: 8 }}>
                    <Link
                      href="/auth/forgot-password"
                      style={{
                        color: 'var(--primary)',
                        fontWeight: 600,
                      }}
                    >
                      Faire une nouvelle demande →
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--foreground)',
                  marginBottom: 8,
                }}
              >
                Nouveau mot de passe
              </label>

              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Minimum 8 caractères"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(e.target.value)
                  }
                  style={{
                    width: '100%',
                    padding: '12px 44px 12px 16px',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    color: 'var(--foreground)',
                    fontSize: 15,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />

                <button
                  onClick={() =>
                    setShowPass(!showPass)
                  }
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--muted)',
                    cursor: 'pointer',
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

            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--foreground)',
                  marginBottom: 8,
                }}
              >
                Confirmer le mot de passe
              </label>

              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Répétez le mot de passe"
                value={confirm}
                onChange={(e) =>
                  setConfirm(e.target.value)
                }
                onKeyDown={(e) =>
                  e.key === 'Enter' &&
                  handleSubmit()
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

            {confirm && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  marginBottom: 16,
                  marginTop: -16,
                  color:
                    newPassword === confirm
                      ? '#22c55e'
                      : '#ef4444',
                }}
              >
                {newPassword === confirm ? (
                  <CheckCircle size={13} />
                ) : (
                  <XCircle size={13} />
                )}

                <span>
                  {newPassword === confirm
                    ? 'Les mots de passe correspondent'
                    : 'Les mots de passe ne correspondent pas'}
                </span>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !token}
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
                cursor: loading
                  ? 'not-allowed'
                  : 'pointer',
              }}
            >
              {loading
                ? 'Réinitialisation...'
                : 'Réinitialiser mon mot de passe'}
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

// Encapsule le formulaire pour permettre l'utilisation des paramètres de recherche.
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            background: 'var(--background)',
          }}
        />
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}