'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

import {
  Star,
  Shield,
  ChevronLeft,
  ArrowRight,
  Loader2,
  Users,
  CheckCircle,
  Briefcase,
  LockKeyhole,
} from 'lucide-react';

// Affiche les informations d'un service et permet au client de le réserver.
export default function ServiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [booking, setBooking] = useState({
    eventDate: '',
    eventEndDate: '',
    guestCount: 1,
    notes: '',
  });

  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Charge les informations du service demandé.
  useEffect(() => {
    api
      .get(`/services/${id}`)
      .then(({ data }) => setService(data))
      .catch(() => router.push('/services'))
      .finally(() => setLoading(false));
  }, [id]);

  // Valide les informations puis envoie la demande de réservation.
  const handleBooking = async () => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    if (
      user?.role === 'PRESTATAIRE' ||
      user?.role === 'ADMIN'
    ) {
      setError(
        'Seuls les clients peuvent réserver un service.'
      );
      return;
    }

    if (
      !booking.eventDate ||
      !booking.eventEndDate
    ) {
      setError(
        'Veuillez sélectionner les dates de votre événement.'
      );
      return;
    }

    if (
      new Date(booking.eventEndDate) <=
      new Date(booking.eventDate)
    ) {
      setError(
        'La date de fin doit être après la date de début.'
      );
      return;
    }

    if (booking.guestCount < 1) {
      setError(
        'Le nombre de personnes doit être supérieur à 0.'
      );
      return;
    }

    setBookingLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await api.post('/service-bookings', {
        serviceId: Number(id),
        eventDate: booking.eventDate,
        eventEndDate: booking.eventEndDate,
        guestCount: booking.guestCount,
        notes: booking.notes,
      });

      console.log(
        'Service réservé avec succès :',
        data
      );

      setSuccess(
        'Demande envoyée ! Le prestataire va confirmer votre réservation. Consultez vos réservations dans votre espace client.'
      );

      setBooking({
        eventDate: '',
        eventEndDate: '',
        guestCount: 1,
        notes: '',
      });
    } catch (err: any) {
      console.error(
        'Erreur lors de la réservation du service :',
        err
      );

      setError(
        err.response?.data?.message ||
          'Une erreur est survenue.'
      );
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: 'var(--background)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Navbar />

        <Loader2
          size={40}
          color="var(--primary)"
          style={{
            animation: 'spin 1s linear infinite',
          }}
        />

        <style>
          {`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
        </style>
      </main>
    );
  }

  if (!service) {
    return null;
  }

  // Définit le style commun des champs du formulaire.
  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    color: 'var(--foreground)',
    fontSize: 13,
    outline: 'none',
    fontFamily: 'DM Sans, sans-serif',
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--background)',
      }}
    >
      <Navbar />

      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '96px 24px 80px',
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--muted)',
            fontSize: 14,
            marginBottom: 32,
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          <ChevronLeft size={16} />
          Retour aux services
        </button>

        <div
          style={{
            display: 'flex',
            gap: 40,
            alignItems: 'flex-start',
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                padding: 32,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 20,
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 16,
                    flexShrink: 0,
                    background:
                      'rgba(201,169,110,0.15)',
                    border:
                      '1px solid rgba(201,169,110,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                  }}
                >
                  <Briefcase size={32} />
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        background:
                          'rgba(201,169,110,0.1)',
                        border:
                          '1px solid var(--border)',
                        borderRadius: 100,
                        padding: '3px 12px',
                        fontSize: 11,
                        color: 'var(--primary)',
                        letterSpacing: 0.5,
                        fontWeight: 500,
                      }}
                    >
                      {service.category}
                    </span>

                    {service.totalReviews > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          background:
                            'rgba(201,169,110,0.08)',
                          borderRadius: 100,
                          padding: '3px 10px',
                          border:
                            '1px solid var(--border)',
                        }}
                      >
                        <Star
                          size={12}
                          fill="var(--primary)"
                          color="var(--primary)"
                        />

                        <span
                          style={{
                            fontSize: 12,
                            color: 'var(--primary)',
                            fontWeight: 600,
                          }}
                        >
                          {service.rating?.toFixed(1)}
                        </span>

                        <span
                          style={{
                            fontSize: 11,
                            color: 'var(--muted)',
                          }}
                        >
                          ({service.totalReviews})
                        </span>
                      </div>
                    )}
                  </div>

                  <h1
                    style={{
                      fontSize: 32,
                      fontWeight: 900,
                      marginBottom: 8,
                      fontFamily:
                        'Playfair Display, serif',
                      lineHeight: 1.1,
                    }}
                  >
                    {service.name}
                  </h1>
                </div>
              </div>
            </div>

            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: 24,
                marginBottom: 24,
              }}
            >
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  marginBottom: 12,
                  fontFamily:
                    'Playfair Display, serif',
                }}
              >
                Description
              </h2>

              <p
                style={{
                  color: 'var(--muted)',
                  lineHeight: 1.8,
                  fontSize: 14,
                }}
              >
                {service.description}
              </p>
            </div>

            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: 24,
                marginBottom: 24,
              }}
            >
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  marginBottom: 16,
                  fontFamily:
                    'Playfair Display, serif',
                }}
              >
                Ce qui est inclus
              </h2>

              {[
                'Prestation complète selon description',
                'Matériel et équipement professionnel',
                'Communication directe avec le prestataire',
                'Paiement sécurisé avec acompte de 30%',
                'Confirmation par le prestataire sous 24-48h',
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <CheckCircle
                    size={16}
                    color="#4ade80"
                  />

                  <span
                    style={{
                      fontSize: 14,
                      color: 'var(--muted)',
                    }}
                  >
                    {item}
                  </span>
                </div>
              ))}
            </div>

            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background:
                    'rgba(201,169,110,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  fontWeight: 700,
                  color: 'var(--primary)',
                  fontFamily:
                    'Playfair Display, serif',
                  flexShrink: 0,
                }}
              >
                {service.provider?.firstName?.[0]?.toUpperCase()}
              </div>

              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--muted)',
                    marginBottom: 2,
                  }}
                >
                  Proposé par
                </p>

                <p
                  style={{
                    fontWeight: 700,
                    fontSize: 16,
                  }}
                >
                  {service.provider?.firstName}{' '}
                  {service.provider?.lastName}
                </p>

                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--muted)',
                    marginTop: 2,
                  }}
                >
                  Prestataire vérifié Evently
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Shield
                  size={14}
                  color="#4ade80"
                />

                <span
                  style={{
                    fontSize: 12,
                    color: '#4ade80',
                  }}
                >
                  Vérifié
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              width: 340,
              flexShrink: 0,
              position: 'sticky',
              top: 88,
            }}
          >
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                padding: 28,
                boxShadow:
                  '0 0 60px rgba(201,169,110,0.08)',
              }}
            >
              <div
                style={{
                  marginBottom: 24,
                  paddingBottom: 20,
                  borderBottom:
                    '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--muted)',
                      letterSpacing: 0.5,
                    }}
                  >
                    SERVICE ÉVÉNEMENTIEL
                  </span>
                </div>

                <span
                  style={{
                    fontSize: 36,
                    fontWeight: 900,
                    color: 'var(--primary)',
                    fontFamily:
                      'Playfair Display, serif',
                  }}
                >
                  {Number(
                    service.price
                  ).toLocaleString('fr-FR')}{' '}
                  €
                </span>

                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--muted)',
                    marginTop: 4,
                  }}
                >
                  Acompte :{' '}
                  {(
                    Number(service.price) * 0.3
                  ).toLocaleString('fr-FR')}{' '}
                  € à la confirmation
                </p>
              </div>

              {error && (
                <div
                  style={{
                    background:
                      'rgba(239,68,68,0.1)',
                    border:
                      '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    marginBottom: 16,
                    color: '#f87171',
                    fontSize: 13,
                  }}
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  style={{
                    background:
                      'rgba(74,222,128,0.1)',
                    border:
                      '1px solid rgba(74,222,128,0.3)',
                    borderRadius: 10,
                    padding: '12px 14px',
                    marginBottom: 16,
                    color: '#4ade80',
                    fontSize: 13,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <CheckCircle size={16} />

                    <span
                      style={{
                        fontWeight: 600,
                      }}
                    >
                      Demande envoyée !
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: 12,
                      opacity: 0.9,
                    }}
                  >
                    Le prestataire va confirmer votre réservation sous 24-48h.
                  </p>

                  <button
                    onClick={() =>
                      router.push('/dashboard')
                    }
                    style={{
                      background:
                        'rgba(74,222,128,0.2)',
                      border:
                        '1px solid rgba(74,222,128,0.4)',
                      borderRadius: 8,
                      padding: '8px 12px',
                      cursor: 'pointer',
                      color: '#4ade80',
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily:
                        'DM Sans, sans-serif',
                    }}
                  >
                    Voir mes réservations →
                  </button>
                </div>
              )}

              {!success && (
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
                      DATE DE L'ÉVÉNEMENT *
                    </label>

                    <input
                      type="datetime-local"
                      style={inputStyle}
                      value={booking.eventDate}
                      onChange={(e) =>
                        setBooking({
                          ...booking,
                          eventDate:
                            e.target.value,
                        })
                      }
                      min={new Date()
                        .toISOString()
                        .slice(0, 16)}
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
                      FIN DE L'ÉVÉNEMENT *
                    </label>

                    <input
                      type="datetime-local"
                      style={inputStyle}
                      value={booking.eventEndDate}
                      onChange={(e) =>
                        setBooking({
                          ...booking,
                          eventEndDate:
                            e.target.value,
                        })
                      }
                      min={
                        booking.eventDate ||
                        new Date()
                          .toISOString()
                          .slice(0, 16)
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
                      NOMBRE DE PERSONNES
                    </label>

                    <div
                      style={{
                        position: 'relative',
                      }}
                    >
                      <Users
                        size={14}
                        color="var(--muted)"
                        style={{
                          position: 'absolute',
                          left: 12,
                          top: '50%',
                          transform:
                            'translateY(-50%)',
                        }}
                      />

                      <input
                        type="number"
                        min="1"
                        style={{
                          ...inputStyle,
                          paddingLeft: 34,
                        }}
                        value={
                          booking.guestCount
                        }
                        onChange={(e) =>
                          setBooking({
                            ...booking,
                            guestCount: Number(
                              e.target.value
                            ),
                          })
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
                      PRÉCISIONS (optionnel)
                    </label>

                    <textarea
                      style={{
                        ...inputStyle,
                        resize: 'none',
                        height: 80,
                      }}
                      placeholder="Type d'événement, lieu, demandes spéciales..."
                      value={booking.notes}
                      onChange={(e) =>
                        setBooking({
                          ...booking,
                          notes: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div
                    style={{
                      background:
                        'rgba(201,169,110,0.08)',
                      border:
                        '1px solid var(--border)',
                      borderRadius: 12,
                      padding: '12px 16px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent:
                          'space-between',
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          color: 'var(--muted)',
                        }}
                      >
                        Prix du service
                      </span>

                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                        }}
                      >
                        {Number(
                          service.price
                        ).toLocaleString(
                          'fr-FR'
                        )}{' '}
                        €
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent:
                          'space-between',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color: 'var(--muted)',
                        }}
                      >
                        Acompte à payer (30%)
                      </span>

                      <span
                        style={{
                          fontSize: 13,
                          color: 'var(--primary)',
                          fontWeight: 600,
                        }}
                      >
                        {(
                          Number(
                            service.price
                          ) * 0.3
                        ).toLocaleString(
                          'fr-FR'
                        )}{' '}
                        €
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleBooking}
                    disabled={bookingLoading}
                    style={{
                      background: 'var(--primary)',
                      color: '#0a0a0f',
                      border: 'none',
                      borderRadius: 12,
                      padding: '14px',
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: bookingLoading
                        ? 'not-allowed'
                        : 'pointer',
                      opacity: bookingLoading
                        ? 0.7
                        : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      fontFamily:
                        'DM Sans, sans-serif',
                    }}
                  >
                    {bookingLoading ? (
                      <>
                        <Loader2
                          size={18}
                          style={{
                            animation:
                              'spin 1s linear infinite',
                          }}
                        />
                        Envoi en cours...
                      </>
                    ) : isAuthenticated() ? (
                      <>
                        Réserver ce service
                        <ArrowRight size={16} />
                      </>
                    ) : (
                      'Se connecter pour réserver'
                    )}

                    <style>
                      {`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
                    </style>
                  </button>

                  <p
                    style={{
                      textAlign: 'center',
                      fontSize: 11,
                      color: 'var(--muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                    }}
                  >
                    <LockKeyhole size={12} />
                    Paiement sécurisé · Le prestataire confirmera votre demande
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}