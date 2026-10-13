'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { api } from '@/lib/api';

import {
  Eye,
  EyeOff,
  ArrowRight,
  User,
  Briefcase,
  Building2,
  MapPin,
  CreditCard,
  Phone,
  Info,
} from 'lucide-react';

type Step = 'role' | 'personal' | 'company' | 'password';

// Affiche le formulaire d'inscription en plusieurs étapes.
export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>('role');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [form, setForm] = useState({
    role: '' as 'CLIENT' | 'PRESTATAIRE' | '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    siret: '',
    companyAddress: '',
    companyCity: '',
    companyZip: '',
    rib: '',
  });

  // Met à jour un champ du formulaire à partir de son nom.
  const set =
    (key: string) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm({
        ...form,
        [key]: e.target.value,
      });

  // Définit le style commun des champs du formulaire.
  const inputStyle: React.CSSProperties = {
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
    boxSizing: 'border-box',
  };

  // Valide les informations puis crée le compte utilisateur.
  const handleSubmit = async () => {
    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    if (form.role === 'PRESTATAIRE') {
      if (
        !form.companyName ||
        !form.siret ||
        !form.companyAddress ||
        !form.companyCity ||
        !form.companyZip
      ) {
        setError(
          'Veuillez remplir toutes les informations d\'entreprise.'
        );
        return;
      }

      if (!/^\d{14}$/.test(form.siret.replace(/\s/g, ''))) {
        setError('Le numéro SIRET doit contenir 14 chiffres.');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/auth/register', {
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        role: form.role,
        ...(form.role === 'PRESTATAIRE' && {
          companyName: form.companyName,
          siret: form.siret.replace(/\s/g, ''),
          companyAddress: form.companyAddress,
          companyCity: form.companyCity,
          companyZip: form.companyZip,
          rib: form.rib,
        }),
      });

      router.push(
        `/auth/verify-otp?userId=${data.userId}`
      );
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Une erreur est survenue.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Vérifie si les informations personnelles permettent de continuer.
  const canGoToCompany =
    form.firstName &&
    form.lastName &&
    form.email &&
    form.phone;

  // Vérifie si toutes les informations nécessaires ont été renseignées.
  const canGoToPassword =
    form.role === 'CLIENT'
      ? canGoToCompany
      : canGoToCompany &&
        form.companyName &&
        form.siret &&
        form.companyAddress &&
        form.companyCity &&
        form.companyZip;

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
          maxWidth: 520,
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 32,
            }}
          >
            {(
              [
                'role',
                'personal',
                ...(form.role === 'PRESTATAIRE'
                  ? ['company']
                  : []),
                'password',
              ] as Step[]
            ).map((s, i, arr) => (
              <div
                key={s}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background:
                      step === s
                        ? 'var(--primary)'
                        : arr.indexOf(step) > i
                          ? 'rgba(201,169,110,0.3)'
                          : 'var(--surface-2)',
                    border:
                      step === s
                        ? 'none'
                        : arr.indexOf(step) > i
                          ? '1px solid var(--primary)'
                          : '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    color:
                      step === s
                        ? '#0a0a0f'
                        : arr.indexOf(step) > i
                          ? 'var(--primary)'
                          : 'var(--muted)',
                    transition: 'all 0.3s',
                  }}
                >
                  {arr.indexOf(step) > i ? '✓' : i + 1}
                </div>

                {i < arr.length - 1 && (
                  <div
                    style={{
                      width: 32,
                      height: 1,
                      background:
                        arr.indexOf(step) > i
                          ? 'var(--primary)'
                          : 'var(--border)',
                      transition: 'background 0.3s',
                    }}
                  />
                )}
              </div>
            ))}
          </div>

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

          {step === 'role' && (
            <div>
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  marginBottom: 8,
                  textAlign: 'center',
                }}
              >
                Créer un compte
              </h1>

              <p
                style={{
                  color: 'var(--muted)',
                  textAlign: 'center',
                  marginBottom: 28,
                  fontSize: 14,
                }}
              >
                Qui êtes-vous sur Evently ?
              </p>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {[
                  {
                    value: 'CLIENT' as const,
                    icon: <User size={24} />,
                    title: 'Client particulier',
                    desc: 'Je cherche des lieux et services pour organiser mon événement',
                    color: '#60a5fa',
                    bg: 'rgba(96,165,250,0.1)',
                    border: 'rgba(96,165,250,0.3)',
                  },
                  {
                    value: 'PRESTATAIRE' as const,
                    icon: <Briefcase size={24} />,
                    title: 'Prestataire / Entreprise',
                    desc: 'Je propose des lieux ou des services événementiels',
                    color: '#c9a96e',
                    bg: 'rgba(201,169,110,0.1)',
                    border: 'rgba(201,169,110,0.3)',
                  },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setForm({
                        ...form,
                        role: opt.value,
                      });
                      setStep('personal');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '20px 20px',
                      background:
                        form.role === opt.value
                          ? opt.bg
                          : 'var(--surface-2)',
                      border: `1px solid ${
                        form.role === opt.value
                          ? opt.border
                          : 'var(--border)'
                      }`,
                      borderRadius: 14,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                    onMouseEnter={(e) => {
                      (
                        e.currentTarget as HTMLElement
                      ).style.borderColor = opt.border;

                      (
                        e.currentTarget as HTMLElement
                      ).style.background = opt.bg;
                    }}
                    onMouseLeave={(e) => {
                      if (form.role !== opt.value) {
                        (
                          e.currentTarget as HTMLElement
                        ).style.borderColor =
                          'var(--border)';

                        (
                          e.currentTarget as HTMLElement
                        ).style.background =
                          'var(--surface-2)';
                      }
                    }}
                  >
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 14,
                        flexShrink: 0,
                        background: opt.bg,
                        color: opt.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `1px solid ${opt.border}`,
                      }}
                    >
                      {opt.icon}
                    </div>

                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontWeight: 700,
                          fontSize: 16,
                          marginBottom: 4,
                          color: 'var(--foreground)',
                        }}
                      >
                        {opt.title}
                      </p>

                      <p
                        style={{
                          fontSize: 13,
                          color: 'var(--muted)',
                          lineHeight: 1.4,
                        }}
                      >
                        {opt.desc}
                      </p>
                    </div>

                    <ArrowRight
                      size={18}
                      color="var(--muted)"
                    />
                  </button>
                ))}
              </div>

              <p
                style={{
                  textAlign: 'center',
                  marginTop: 24,
                  fontSize: 14,
                  color: 'var(--muted)',
                }}
              >
                Déjà un compte ?{' '}
                <Link
                  href="/auth/login"
                  style={{
                    color: 'var(--primary)',
                    textDecoration: 'none',
                  }}
                >
                  Se connecter
                </Link>
              </p>
            </div>
          )}

          {step === 'personal' && (
            <div>
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  marginBottom: 8,
                  textAlign: 'center',
                }}
              >
                Informations personnelles
              </h1>

              <p
                style={{
                  color: 'var(--muted)',
                  textAlign: 'center',
                  marginBottom: 24,
                  fontSize: 14,
                }}
              >
                {form.role === 'PRESTATAIRE'
                  ? 'Vos informations en tant que représentant'
                  : 'Vos informations de connexion'}
              </p>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
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
                      PRÉNOM *
                    </label>

                    <input
                      style={inputStyle}
                      placeholder="Jean"
                      value={form.firstName}
                      onChange={set('firstName')}
                      onFocus={(e) =>
                        (e.target.style.borderColor =
                          'var(--primary)')
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor =
                          'var(--border)')
                      }
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
                      NOM *
                    </label>

                    <input
                      style={inputStyle}
                      placeholder="Dupont"
                      value={form.lastName}
                      onChange={set('lastName')}
                      onFocus={(e) =>
                        (e.target.style.borderColor =
                          'var(--primary)')
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor =
                          'var(--border)')
                      }
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
                    EMAIL *
                  </label>

                  <input
                    style={inputStyle}
                    type="email"
                    placeholder="jean.dupont@email.com"
                    value={form.email}
                    onChange={set('email')}
                    onFocus={(e) =>
                      (e.target.style.borderColor =
                        'var(--primary)')
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor =
                        'var(--border)')
                    }
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
                    TÉLÉPHONE *
                  </label>

                  <div style={{ position: 'relative' }}>
                    <Phone
                      size={14}
                      color="var(--muted)"
                      style={{
                        position: 'absolute',
                        left: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                      }}
                    />

                    <input
                      style={{
                        ...inputStyle,
                        paddingLeft: 36,
                      }}
                      type="tel"
                      placeholder="+33 6 00 00 00 00"
                      value={form.phone}
                      onChange={set('phone')}
                      onFocus={(e) =>
                        (e.target.style.borderColor =
                          'var(--primary)')
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor =
                          'var(--border)')
                      }
                    />
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  marginTop: 24,
                }}
              >
                <button
                  onClick={() => setStep('role')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    cursor: 'pointer',
                    color: 'var(--muted)',
                    fontSize: 14,
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  Retour
                </button>

                <button
                  onClick={() => {
                    if (
                      !form.firstName ||
                      !form.lastName ||
                      !form.email ||
                      !form.phone
                    ) {
                      setError(
                        'Veuillez remplir tous les champs.'
                      );
                      return;
                    }

                    setError('');

                    setStep(
                      form.role === 'PRESTATAIRE'
                        ? 'company'
                        : 'password'
                    );
                  }}
                  disabled={!canGoToCompany}
                  style={{
                    flex: 2,
                    padding: '12px',
                    background: 'var(--primary)',
                    color: '#0a0a0f',
                    border: 'none',
                    borderRadius: 12,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: 'DM Sans, sans-serif',
                    opacity: !canGoToCompany ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  Continuer
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 'company' &&
            form.role === 'PRESTATAIRE' && (
              <div>
                <h1
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    marginBottom: 8,
                    textAlign: 'center',
                  }}
                >
                  Informations entreprise
                </h1>

                <p
                  style={{
                    color: 'var(--muted)',
                    textAlign: 'center',
                    marginBottom: 8,
                    fontSize: 14,
                  }}
                >
                  Conformément à la réglementation française
                </p>

                <div
                  style={{
                    background: 'rgba(201,169,110,0.08)',
                    border: '1px solid rgba(201,169,110,0.2)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    marginBottom: 20,
                    display: 'flex',
                    gap: 8,
                    alignItems: 'flex-start',
                  }}
                >
                  <Info
                    size={14}
                    color="var(--primary)"
                    style={{
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  />

                  <p
                    style={{
                      fontSize: 12,
                      color: 'var(--muted)',
                      lineHeight: 1.5,
                    }}
                  >
                    Ces informations seront vérifiées par notre équipe avant
                    l'activation de votre compte prestataire. Elles permettent
                    de garantir la sécurité des clients.
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
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
                      RAISON SOCIALE *
                    </label>

                    <div style={{ position: 'relative' }}>
                      <Building2
                        size={14}
                        color="var(--muted)"
                        style={{
                          position: 'absolute',
                          left: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                        }}
                      />

                      <input
                        style={{
                          ...inputStyle,
                          paddingLeft: 36,
                        }}
                        placeholder="ex: Evently Events SARL"
                        value={form.companyName}
                        onChange={set('companyName')}
                        onFocus={(e) =>
                          (e.target.style.borderColor =
                            'var(--primary)')
                        }
                        onBlur={(e) =>
                          (e.target.style.borderColor =
                            'var(--border)')
                        }
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
                      NUMÉRO SIRET *
                    </label>

                    <div style={{ position: 'relative' }}>
                      <CreditCard
                        size={14}
                        color="var(--muted)"
                        style={{
                          position: 'absolute',
                          left: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                        }}
                      />

                      <input
                        style={{
                          ...inputStyle,
                          paddingLeft: 36,
                        }}
                        placeholder="ex: 123 456 789 00012"
                        value={form.siret}
                        onChange={(e) => {
                          // Formate automatiquement le SIRET pendant la saisie.
                          const raw = e.target.value
                            .replace(/\D/g, '')
                            .slice(0, 14);

                          const formatted = raw
                            .replace(
                              /(\d{3})(\d{0,3})/,
                              '$1 $2'
                            )
                            .replace(
                              /(\d{3} \d{3})(\d{0,3})/,
                              '$1 $2'
                            )
                            .replace(
                              /(\d{3} \d{3} \d{3})(\d{0,5})/,
                              '$1 $2'
                            )
                            .trim();

                          setForm({
                            ...form,
                            siret: formatted,
                          });
                        }}
                        onFocus={(e) =>
                          (e.target.style.borderColor =
                            'var(--primary)')
                        }
                        onBlur={(e) => {
                          e.target.style.borderColor =
                            'var(--border)';

                          const raw =
                            form.siret.replace(/\s/g, '');

                          if (
                            raw.length > 0 &&
                            raw.length !== 14
                          ) {
                            setError(
                              'Le SIRET doit contenir exactement 14 chiffres.'
                            );
                          } else {
                            setError('');
                          }
                        }}
                      />
                    </div>

                    <p
                      style={{
                        fontSize: 11,
                        color: 'var(--muted)',
                        marginTop: 4,
                      }}
                    >
                      14 chiffres — identifiant unique de votre établissement
                    </p>

                    {form.siret.replace(/\s/g, '').length >
                      0 &&
                      form.siret.replace(/\s/g, '').length <
                        14 && (
                        <p
                          style={{
                            fontSize: 11,
                            color: '#f59e0b',
                            marginTop: 2,
                          }}
                        >
                          {14 -
                            form.siret.replace(/\s/g, '')
                              .length}{' '}
                          chiffre(s) manquant(s)
                        </p>
                      )}

                    {form.siret.replace(/\s/g, '').length ===
                      14 && (
                      <p
                        style={{
                          fontSize: 11,
                          color: '#4ade80',
                          marginTop: 2,
                        }}
                      >
                        ✓ Format SIRET valide
                      </p>
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
                      ADRESSE DU SIÈGE *
                    </label>

                    <div style={{ position: 'relative' }}>
                      <MapPin
                        size={14}
                        color="var(--muted)"
                        style={{
                          position: 'absolute',
                          left: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                        }}
                      />

                      <input
                        style={{
                          ...inputStyle,
                          paddingLeft: 36,
                        }}
                        placeholder="ex: 12 rue de la Paix"
                        value={form.companyAddress}
                        onChange={set('companyAddress')}
                        onFocus={(e) =>
                          (e.target.style.borderColor =
                            'var(--primary)')
                        }
                        onBlur={(e) =>
                          (e.target.style.borderColor =
                            'var(--border)')
                        }
                      />
                    </div>
                  </div>

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
                        VILLE *
                      </label>

                      <input
                        style={inputStyle}
                        placeholder="ex: Paris"
                        value={form.companyCity}
                        onChange={set('companyCity')}
                        onFocus={(e) =>
                          (e.target.style.borderColor =
                            'var(--primary)')
                        }
                        onBlur={(e) =>
                          (e.target.style.borderColor =
                            'var(--border)')
                        }
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
                        CODE POSTAL *
                      </label>

                      <input
                        style={inputStyle}
                        placeholder="ex: 75001"
                        value={form.companyZip}
                        maxLength={5}
                        onChange={(e) => {
                          const val = e.target.value
                            .replace(/\D/g, '')
                            .slice(0, 5);

                          setForm({
                            ...form,
                            companyZip: val,
                          });
                        }}
                        onFocus={(e) =>
                          (e.target.style.borderColor =
                            'var(--primary)')
                        }
                        onBlur={(e) =>
                          (e.target.style.borderColor =
                            'var(--border)')
                        }
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
                      IBAN / RIB (optionnel)
                    </label>

                    <input
                      style={inputStyle}
                      placeholder="ex: FR76 1234 5678 9012 3456 7890 123"
                      value={form.rib}
                      onChange={set('rib')}
                      onFocus={(e) =>
                        (e.target.style.borderColor =
                          'var(--primary)')
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor =
                          'var(--border)')
                      }
                    />

                    <p
                      style={{
                        fontSize: 11,
                        color: 'var(--muted)',
                        marginTop: 4,
                      }}
                    >
                      Nécessaire pour recevoir vos paiements
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    marginTop: 24,
                  }}
                >
                  <button
                    onClick={() => setStep('personal')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      cursor: 'pointer',
                      color: 'var(--muted)',
                      fontSize: 14,
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                  >
                    Retour
                  </button>

                  <button
                    onClick={() => {
                      if (
                        !form.companyName ||
                        !form.siret ||
                        !form.companyAddress ||
                        !form.companyCity ||
                        !form.companyZip
                      ) {
                        setError(
                          'Veuillez remplir tous les champs obligatoires.'
                        );
                        return;
                      }

                      if (
                        !/^\d{14}$/.test(
                          form.siret.replace(/\s/g, '')
                        )
                      ) {
                        setError(
                          'Le numéro SIRET doit contenir 14 chiffres.'
                        );
                        return;
                      }

                      setError('');
                      setStep('password');
                    }}
                    style={{
                      flex: 2,
                      padding: '12px',
                      background: 'var(--primary)',
                      color: '#0a0a0f',
                      border: 'none',
                      borderRadius: 12,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 600,
                      fontFamily: 'DM Sans, sans-serif',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    Continuer
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

          {step === 'password' && (
            <div>
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  marginBottom: 8,
                  textAlign: 'center',
                }}
              >
                Créer votre mot de passe
              </h1>

              <p
                style={{
                  color: 'var(--muted)',
                  textAlign: 'center',
                  marginBottom: 24,
                  fontSize: 14,
                }}
              >
                Dernière étape avant la confirmation par email
              </p>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
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
                    MOT DE PASSE *
                  </label>

                  <div style={{ position: 'relative' }}>
                    <input
                      style={inputStyle}
                      type={showPass ? 'text' : 'password'}
                      placeholder="Minimum 8 caractères"
                      value={form.password}
                      onChange={set('password')}
                      onFocus={(e) =>
                        (e.target.style.borderColor =
                          'var(--primary)')
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor =
                          'var(--border)')
                      }
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
                        cursor: 'pointer',
                        color: 'var(--muted)',
                      }}
                    >
                      {showPass ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>

                  {form.password && (
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
                            form.password.length >= 12
                              ? 4
                              : form.password.length >= 10
                                ? 3
                                : form.password.length >= 8
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
                                transition:
                                  'background 0.3s',
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
                        {form.password.length < 8
                          ? 'Trop court'
                          : form.password.length < 10
                            ? 'Acceptable'
                            : form.password.length < 12
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
                    CONFIRMER LE MOT DE PASSE *
                  </label>

                  <input
                    style={{
                      ...inputStyle,
                      borderColor:
                        form.confirmPassword &&
                        form.password !==
                          form.confirmPassword
                          ? 'rgba(248,113,113,0.5)'
                          : form.confirmPassword &&
                              form.password ===
                                form.confirmPassword
                            ? 'rgba(74,222,128,0.5)'
                            : 'var(--border)',
                    }}
                    type="password"
                    placeholder="Répétez votre mot de passe"
                    value={form.confirmPassword}
                    onChange={set('confirmPassword')}
                  />

                  {form.confirmPassword &&
                    form.password !==
                      form.confirmPassword && (
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

                  {form.confirmPassword &&
                    form.password ===
                      form.confirmPassword && (
                      <p
                        style={{
                          fontSize: 11,
                          color: '#4ade80',
                          marginTop: 4,
                        }}
                      >
                        ✓ Les mots de passe correspondent
                      </p>
                    )}
                </div>

                <div
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: '12px 14px',
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      color: 'var(--muted)',
                      marginBottom: 6,
                      letterSpacing: 0.5,
                    }}
                  >
                    RÉCAPITULATIF
                  </p>

                  <p
                    style={{
                      fontSize: 13,
                      marginBottom: 2,
                    }}
                  >
                    <span
                      style={{
                        color: 'var(--muted)',
                      }}
                    >
                      Nom :{' '}
                    </span>
                    {form.firstName} {form.lastName}
                  </p>

                  <p
                    style={{
                      fontSize: 13,
                      marginBottom: 2,
                    }}
                  >
                    <span
                      style={{
                        color: 'var(--muted)',
                      }}
                    >
                      Email :{' '}
                    </span>
                    {form.email}
                  </p>

                  <p
                    style={{
                      fontSize: 13,
                      marginBottom: 2,
                    }}
                  >
                    <span
                      style={{
                        color: 'var(--muted)',
                      }}
                    >
                      Rôle :{' '}
                    </span>

                    <span
                      style={{
                        color:
                          form.role === 'PRESTATAIRE'
                            ? 'var(--primary)'
                            : '#60a5fa',
                        fontWeight: 600,
                      }}
                    >
                      {form.role === 'PRESTATAIRE'
                        ? 'Prestataire'
                        : 'Client'}
                    </span>
                  </p>

                  {form.role === 'PRESTATAIRE' && (
                    <p style={{ fontSize: 13 }}>
                      <span
                        style={{
                          color: 'var(--muted)',
                        }}
                      >
                        Entreprise :{' '}
                      </span>
                      {form.companyName}
                    </p>
                  )}
                </div>

                {form.role === 'PRESTATAIRE' && (
                  <div
                    style={{
                      background: 'rgba(245,158,11,0.08)',
                      border:
                        '1px solid rgba(245,158,11,0.2)',
                      borderRadius: 10,
                      padding: '10px 14px',
                      display: 'flex',
                      gap: 8,
                      alignItems: 'flex-start',
                    }}
                  >
                    <Info
                      size={14}
                      color="#f59e0b"
                      style={{
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    />

                    <p
                      style={{
                        fontSize: 12,
                        color: 'var(--muted)',
                        lineHeight: 1.5,
                      }}
                    >
                      Votre compte sera en attente de vérification KYC après
                      inscription. Notre équipe validera vos informations sous
                      24-48h.
                    </p>
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  marginTop: 24,
                }}
              >
                <button
                  onClick={() =>
                    setStep(
                      form.role === 'PRESTATAIRE'
                        ? 'company'
                        : 'personal'
                    )
                  }
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    cursor: 'pointer',
                    color: 'var(--muted)',
                    fontSize: 14,
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  Retour
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={
                    loading ||
                    !form.password ||
                    !form.confirmPassword
                  }
                  style={{
                    flex: 2,
                    padding: '12px',
                    background: 'var(--primary)',
                    color: '#0a0a0f',
                    border: 'none',
                    borderRadius: 12,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: 'DM Sans, sans-serif',
                    opacity: loading ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {loading ? (
                    'Création...'
                  ) : (
                    <>
                      Créer mon compte
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}