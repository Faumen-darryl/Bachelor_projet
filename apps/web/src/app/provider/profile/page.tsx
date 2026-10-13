'use client';

import { useState } from 'react';

import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

import {
  Save,
  Eye,
  EyeOff,
  User,
  Phone,
  Lock,
  CheckCircle,
} from 'lucide-react';

// Affiche et permet de modifier le profil du prestataire.
export default function ProviderProfilePage() {
  const { user, setAuth } = useAuthStore();

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: '',
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);
  const [successInfo, setSuccessInfo] = useState(false);
  const [successPass, setSuccessPass] = useState(false);
  const [errorInfo, setErrorInfo] = useState('');
  const [errorPass, setErrorPass] = useState('');

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
  };

  // Met à jour les informations personnelles du prestataire.
  const handleUpdateInfo = async () => {
    setLoadingInfo(true);
    setErrorInfo('');
    setSuccessInfo(false);

    try {
      const { data } = await api.put('/auth/profile', {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
      });

      const stored = localStorage.getItem('evently_auth');

      if (stored) {
        const parsed = JSON.parse(stored);
        const token = parsed?.state?.token;

        if (token) {
          setAuth(
            {
              ...user!,
              ...data,
            },
            token
          );
        }
      }

      setSuccessInfo(true);

      setTimeout(() => {
        setSuccessInfo(false);
      }, 3000);
    } catch (err: any) {
      setErrorInfo(
        err.response?.data?.message ||
          'Erreur lors de la mise à jour.'
      );
    } finally {
      setLoadingInfo(false);
    }
  };

  // Valide puis met à jour le mot de passe.
  const handleUpdatePassword = async () => {
    setErrorPass('');
    setSuccessPass(false);

    if (
      !passwords.currentPassword ||
      !passwords.newPassword ||
      !passwords.confirmPassword
    ) {
      setErrorPass('Veuillez remplir tous les champs.');
      return;
    }

    if (
      passwords.newPassword !==
      passwords.confirmPassword
    ) {
      setErrorPass(
        'Les nouveaux mots de passe ne correspondent pas.'
      );
      return;
    }

    if (passwords.newPassword.length < 8) {
      setErrorPass(
        'Le nouveau mot de passe doit contenir au moins 8 caractères.'
      );
      return;
    }

    setLoadingPass(true);

    try {
      await api.put('/auth/profile', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });

      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      setSuccessPass(true);

      setTimeout(() => {
        setSuccessPass(false);
      }, 3000);
    } catch (err: any) {
      setErrorPass(
        err.response?.data?.message ||
          'Erreur lors du changement de mot de passe.'
      );
    } finally {
      setLoadingPass(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 40 }}>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 900,
            fontFamily: 'Playfair Display, serif',
            marginBottom: 8,
          }}
        >
          Mon profil
        </h1>

        <p
          style={{
            color: 'var(--muted)',
            fontSize: 14,
          }}
        >
          Gérez vos informations personnelles et votre mot de passe
        </p>
      </div>

      <div
        style={{
          maxWidth: 600,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: 28,
            display: 'flex',
            alignItems: 'center',
            gap: 24,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(201,169,110,0.15)',
              border: '2px solid rgba(201,169,110,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              fontWeight: 700,
              color: 'var(--primary)',
              fontFamily: 'Playfair Display, serif',
              flexShrink: 0,
            }}
          >
            {user?.firstName?.[0]?.toUpperCase()}
          </div>

          <div style={{ flex: 1 }}>
            <p
              style={{
                fontWeight: 700,
                fontSize: 22,
                fontFamily: 'Playfair Display, serif',
                marginBottom: 6,
              }}
            >
              {user?.firstName} {user?.lastName}
            </p>

            <p
              style={{
                color: 'var(--muted)',
                fontSize: 13,
                marginBottom: 10,
              }}
            >
              {user?.email}
            </p>

            <span
              style={{
                display: 'inline-block',
                background: 'rgba(201,169,110,0.1)',
                border: '1px solid rgba(201,169,110,0.3)',
                color: 'var(--primary)',
                borderRadius: 100,
                padding: '3px 12px',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 0.5,
              }}
            >
              PRESTATAIRE
            </span>
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: 28,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(201,169,110,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <User size={18} />
            </div>

            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                fontFamily: 'Playfair Display, serif',
              }}
            >
              Informations personnelles
            </h2>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: 'var(--muted)',
                    display: 'block',
                    marginBottom: 6,
                    letterSpacing: 0.5,
                  }}
                >
                  PRÉNOM
                </label>

                <input
                  style={inputStyle}
                  value={form.firstName}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      firstName: e.target.value,
                    })
                  }
                  onFocus={(e) =>
                    (e.target.style.borderColor =
                      'var(--primary)')
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor =
                      'var(--border)')
                  }
                  placeholder="Votre prénom"
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: 'var(--muted)',
                    display: 'block',
                    marginBottom: 6,
                    letterSpacing: 0.5,
                  }}
                >
                  NOM
                </label>

                <input
                  style={inputStyle}
                  value={form.lastName}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      lastName: e.target.value,
                    })
                  }
                  onFocus={(e) =>
                    (e.target.style.borderColor =
                      'var(--primary)')
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor =
                      'var(--border)')
                  }
                  placeholder="Votre nom"
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  fontSize: 11,
                  color: 'var(--muted)',
                  display: 'block',
                  marginBottom: 6,
                  letterSpacing: 0.5,
                }}
              >
                EMAIL
              </label>

              <input
                style={{
                  ...inputStyle,
                  opacity: 0.6,
                }}
                value={user?.email || ''}
                disabled
              />

              <p
                style={{
                  fontSize: 11,
                  color: 'var(--muted)',
                  marginTop: 4,
                }}
              >
                L'email ne peut pas être modifié
              </p>
            </div>

            <div>
              <label
                style={{
                  fontSize: 11,
                  color: 'var(--muted)',
                  display: 'block',
                  marginBottom: 6,
                  letterSpacing: 0.5,
                }}
              >
                TÉLÉPHONE
              </label>

              <div style={{ position: 'relative' }}>
                <Phone
                  size={14}
                  color="var(--muted)"
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                />

                <input
                  style={{
                    ...inputStyle,
                    paddingLeft: 36,
                  }}
                  value={form.phone}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phone: e.target.value,
                    })
                  }
                  onFocus={(e) =>
                    (e.target.style.borderColor =
                      'var(--primary)')
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor =
                      'var(--border)')
                  }
                  placeholder="+33 6 00 00 00 00"
                />
              </div>
            </div>

            {errorInfo && (
              <div
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 10,
                  padding: '10px 16px',
                  color: '#f87171',
                  fontSize: 13,
                }}
              >
                {errorInfo}
              </div>
            )}

            {successInfo && (
              <div
                style={{
                  background: 'rgba(74,222,128,0.1)',
                  border: '1px solid rgba(74,222,128,0.3)',
                  borderRadius: 10,
                  padding: '10px 16px',
                  color: '#4ade80',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <CheckCircle size={16} />
                Profil mis à jour avec succès !
              </div>
            )}

            <button
              onClick={handleUpdateInfo}
              disabled={loadingInfo}
              style={{
                background: 'var(--primary)',
                color: '#0a0a0f',
                border: 'none',
                borderRadius: 12,
                padding: '13px',
                fontSize: 14,
                fontWeight: 600,
                cursor: loadingInfo
                  ? 'not-allowed'
                  : 'pointer',
                opacity: loadingInfo ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              <Save size={16} />

              {loadingInfo
                ? 'Sauvegarde...'
                : 'Sauvegarder les modifications'}
            </button>
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: 28,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(248,113,113,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f87171',
              }}
            >
              <Lock size={18} />
            </div>

            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                fontFamily: 'Playfair Display, serif',
              }}
            >
              Changer le mot de passe
            </h2>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: 'var(--muted)',
                  display: 'block',
                  marginBottom: 6,
                  letterSpacing: 0.5,
                }}
              >
                MOT DE PASSE ACTUEL
              </label>

              <div style={{ position: 'relative' }}>
                <input
                  style={inputStyle}
                  type={showCurrent ? 'text' : 'password'}
                  value={passwords.currentPassword}
                  onChange={(e) =>
                    setPasswords({
                      ...passwords,
                      currentPassword: e.target.value,
                    })
                  }
                  onFocus={(e) =>
                    (e.target.style.borderColor =
                      'var(--primary)')
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor =
                      'var(--border)')
                  }
                  placeholder="Votre mot de passe actuel"
                />

                <button
                  onClick={() =>
                    setShowCurrent(!showCurrent)
                  }
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                  }}
                >
                  {showCurrent ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                style={{
                  fontSize: 11,
                  color: 'var(--muted)',
                  display: 'block',
                  marginBottom: 6,
                  letterSpacing: 0.5,
                }}
              >
                NOUVEAU MOT DE PASSE
              </label>

              <div style={{ position: 'relative' }}>
                <input
                  style={inputStyle}
                  type={showNew ? 'text' : 'password'}
                  value={passwords.newPassword}
                  onChange={(e) =>
                    setPasswords({
                      ...passwords,
                      newPassword: e.target.value,
                    })
                  }
                  onFocus={(e) =>
                    (e.target.style.borderColor =
                      'var(--primary)')
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor =
                      'var(--border)')
                  }
                  placeholder="Minimum 8 caractères"
                />

                <button
                  onClick={() =>
                    setShowNew(!showNew)
                  }
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                  }}
                >
                  {showNew ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>

              {passwords.newPassword && (
                <div style={{ marginTop: 8 }}>
                  <div
                    style={{
                      display: 'flex',
                      gap: 4,
                      marginBottom: 4,
                    }}
                  >
                    {[1, 2, 3, 4].map((level) => {
                      const strength =
                        passwords.newPassword.length >= 12
                          ? 4
                          : passwords.newPassword.length >= 10
                            ? 3
                            : passwords.newPassword.length >= 8
                              ? 2
                              : 1;

                      const colors = [
                        '#f87171',
                        '#f59e0b',
                        '#60a5fa',
                        '#4ade80',
                      ];

                      return (
                        <div
                          key={level}
                          style={{
                            flex: 1,
                            height: 3,
                            borderRadius: 2,
                            background:
                              level <= strength
                                ? colors[strength - 1]
                                : 'var(--border)',
                            transition: 'background 0.3s',
                          }}
                        />
                      );
                    })}
                  </div>

                  <p
                    style={{
                      fontSize: 11,
                      color: 'var(--muted)',
                    }}
                  >
                    {passwords.newPassword.length < 8
                      ? 'Trop court'
                      : passwords.newPassword.length < 10
                        ? 'Acceptable'
                        : passwords.newPassword.length < 12
                          ? 'Bon'
                          : 'Excellent'}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label
                style={{
                  fontSize: 11,
                  color: 'var(--muted)',
                  display: 'block',
                  marginBottom: 6,
                  letterSpacing: 0.5,
                }}
              >
                CONFIRMER LE NOUVEAU MOT DE PASSE
              </label>

              <div style={{ position: 'relative' }}>
                <input
                  style={{
                    ...inputStyle,
                    borderColor:
                      passwords.confirmPassword &&
                      passwords.newPassword !==
                        passwords.confirmPassword
                        ? 'rgba(248,113,113,0.5)'
                        : passwords.confirmPassword &&
                            passwords.newPassword ===
                              passwords.confirmPassword
                          ? 'rgba(74,222,128,0.5)'
                          : 'var(--border)',
                  }}
                  type={showConfirm ? 'text' : 'password'}
                  value={passwords.confirmPassword}
                  onChange={(e) =>
                    setPasswords({
                      ...passwords,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Répétez le nouveau mot de passe"
                />

                <button
                  onClick={() =>
                    setShowConfirm(!showConfirm)
                  }
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                  }}
                >
                  {showConfirm ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>

              {passwords.confirmPassword &&
                passwords.newPassword !==
                  passwords.confirmPassword && (
                  <p
                    style={{
                      fontSize: 11,
                      color: '#f87171',
                      marginTop: 4,
                    }}
                  >
                    Les mots de passe ne correspondent pas
                  </p>
                )}

              {passwords.confirmPassword &&
                passwords.newPassword ===
                  passwords.confirmPassword && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginTop: 4,
                      color: '#4ade80',
                      fontSize: 11,
                    }}
                  >
                    <CheckCircle size={13} />
                    <span>
                      Les mots de passe correspondent
                    </span>
                  </div>
                )}
            </div>

            {errorPass && (
              <div
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 10,
                  padding: '10px 16px',
                  color: '#f87171',
                  fontSize: 13,
                }}
              >
                {errorPass}
              </div>
            )}

            {successPass && (
              <div
                style={{
                  background: 'rgba(74,222,128,0.1)',
                  border: '1px solid rgba(74,222,128,0.3)',
                  borderRadius: 10,
                  padding: '10px 16px',
                  color: '#4ade80',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <CheckCircle size={16} />
                Mot de passe changé avec succès !
              </div>
            )}

            <button
              onClick={handleUpdatePassword}
              disabled={loadingPass}
              style={{
                background: 'rgba(248,113,113,0.1)',
                border: '1px solid rgba(248,113,113,0.3)',
                color: '#f87171',
                borderRadius: 12,
                padding: '13px',
                fontSize: 14,
                fontWeight: 600,
                cursor: loadingPass
                  ? 'not-allowed'
                  : 'pointer',
                opacity: loadingPass ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              <Lock size={16} />

              {loadingPass
                ? 'Changement...'
                : 'Changer le mot de passe'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}