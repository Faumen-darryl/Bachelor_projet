'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { api } from '@/lib/api';

import {
  Calendar,
  MapPin,
  Clock,
  FileText,
  X,
  Loader2,
  MessageSquare,
  Briefcase,
  Building2,
  CheckCircle,
} from 'lucide-react';

// Définit l'affichage associé à chaque statut de réservation.
const statusConfig: Record<
  string,
  {
    label: string;
    color: string;
    bg: string;
  }
> = {
  EN_ATTENTE: {
    label: 'En attente',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
  },
  CONFIRMEE: {
    label: 'Confirmée',
    color: '#4ade80',
    bg: 'rgba(74,222,128,0.1)',
  },
  ANNULEE: {
    label: 'Annulée',
    color: '#f87171',
    bg: 'rgba(248,113,113,0.1)',
  },
  TERMINEE: {
    label: 'Terminée',
    color: 'var(--muted)',
    bg: 'var(--surface-2)',
  },
  REMBOURSEE: {
    label: 'Remboursée',
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.1)',
  },
};

// Affiche les réservations de lieux et de services du client.
export default function DashboardPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [serviceBookings, setServiceBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [cancellingService, setCancellingService] = useState<number | null>(
    null
  );
  const [messaging, setMessaging] = useState<{
    id: number;
    type: 'venue' | 'service';
  } | null>(null);
  const [msgContent, setMsgContent] = useState<Record<string, string>>({});
  const [msgSent, setMsgSent] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'venues' | 'services'>('venues');

  // Charge les réservations de lieux et de services.
  useEffect(() => {
    Promise.all([
      api.get('/reservations'),
      api.get('/service-bookings/client'),
    ])
      .then(([r, s]) => {
        setReservations(r.data || []);
        setServiceBookings(s.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  // Annule une réservation de lieu après confirmation.
  const handleCancelVenue = async (id: number) => {
    if (!confirm('Annuler cette réservation ?')) {
      return;
    }

    setCancelling(id);

    try {
      await api.put(`/reservations/${id}/cancel`);

      setReservations((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: 'ANNULEE',
              }
            : r
        )
      );
    } catch (err: any) {
      alert(
        err.response?.data?.message ||
          'Erreur.'
      );
    } finally {
      setCancelling(null);
    }
  };

  // Annule une réservation de service après confirmation.
  const handleCancelService = async (id: number) => {
    if (!confirm('Annuler cette réservation de service ?')) {
      return;
    }

    setCancellingService(id);

    try {
      await api.put(`/service-bookings/${id}/cancel`);

      setServiceBookings((prev) =>
        prev.map((b) =>
          b.id === id
            ? {
                ...b,
                status: 'ANNULEE',
              }
            : b
        )
      );
    } catch (err: any) {
      alert(
        err.response?.data?.message ||
          'Erreur.'
      );
    } finally {
      setCancellingService(null);
    }
  };

  // Télécharge la facture associée à une réservation de lieu.
  const handleDownloadInvoice = async (id: number) => {
    try {
      const response = await api.get(
        `/reservations/${id}/invoice`,
        {
          responseType: 'blob',
        }
      );

      const url = URL.createObjectURL(
        new Blob([response.data])
      );

      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-${id}.pdf`;
      a.click();

      URL.revokeObjectURL(url);
    } catch {
      alert('Facture non disponible.');
    }
  };

  // Envoie un message lié à une réservation.
  const handleSendMessage = async (
    id: number,
    type: 'venue' | 'service'
  ) => {
    const key = `${type}-${id}`;
    const content = msgContent[key];

    if (!content?.trim()) {
      return;
    }

    try {
      if (type === 'venue') {
        await api.post('/messages/send', {
          reservationId: id,
          content,
        });
      } else {
        await api.post('/service-bookings/messages', {
          bookingId: id,
          content,
        });
      }

      setMsgSent((prev) => [
        ...prev,
        key,
      ]);

      setMessaging(null);

      setMsgContent((prev) => ({
        ...prev,
        [key]: '',
      }));

      setTimeout(() => {
        setMsgSent((prev) =>
          prev.filter((k) => k !== key)
        );
      }, 3000);
    } catch (err: any) {
      alert(
        err.response?.data?.message ||
          'Erreur.'
      );
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
          gap: 16,
        }}
      >
        <Loader2
          size={28}
          color="var(--primary)"
          style={{
            animation: 'spin 1s linear infinite',
          }}
        />

        <style>
          {`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
        </style>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 900,
            fontFamily: 'Playfair Display, serif',
            marginBottom: 8,
          }}
        >
          Mes réservations
        </h1>

        <p
          style={{
            color: 'var(--muted)',
            fontSize: 14,
          }}
        >
          {reservations.length} lieu
          {reservations.length > 1 ? 'x' : ''} ·{' '}
          {serviceBookings.length} service
          {serviceBookings.length > 1 ? 's' : ''}
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 28,
        }}
      >
        {[
          {
            key: 'venues',
            label: 'Lieux réservés',
            count: reservations.length,
            icon: <Building2 size={15} />,
          },
          {
            key: 'services',
            label: 'Services réservés',
            count: serviceBookings.length,
            icon: <Briefcase size={15} />,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() =>
              setActiveTab(tab.key as any)
            }
            style={{
              padding: '10px 20px',
              borderRadius: 12,
              cursor: 'pointer',
              border:
                activeTab === tab.key
                  ? '1px solid var(--primary)'
                  : '1px solid var(--border)',
              background:
                activeTab === tab.key
                  ? 'rgba(201,169,110,0.1)'
                  : 'var(--surface)',
              color:
                activeTab === tab.key
                  ? 'var(--primary)'
                  : 'var(--muted)',
              fontSize: 14,
              fontWeight:
                activeTab === tab.key ? 600 : 400,
              fontFamily: 'DM Sans, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {tab.icon}
            {tab.label}

            <span
              style={{
                background:
                  activeTab === tab.key
                    ? 'rgba(201,169,110,0.2)'
                    : 'var(--surface-2)',
                padding: '1px 8px',
                borderRadius: 100,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {activeTab === 'venues' &&
        (reservations.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 24px',
              background: 'var(--surface)',
              borderRadius: 20,
              border: '1px solid var(--border)',
            }}
          >
            <Building2
              size={48}
              color="var(--muted)"
              style={{
                margin: '0 auto 16px',
                opacity: 0.3,
              }}
            />

            <h3
              style={{
                fontSize: 22,
                marginBottom: 8,
              }}
            >
              Aucun lieu réservé
            </h3>

            <p
              style={{
                color: 'var(--muted)',
                marginBottom: 24,
                fontSize: 14,
              }}
            >
              Explorez notre catalogue pour trouver votre lieu idéal.
            </p>

            <Link
              href="/venues"
              style={{
                background: 'var(--primary)',
                color: '#0a0a0f',
                textDecoration: 'none',
                padding: '12px 24px',
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Explorer les lieux
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {reservations.map((r) => {
              const status =
                statusConfig[r.status] ||
                statusConfig.EN_ATTENTE;

              const photo = r.venue?.photos?.[0]?.url;
              const key = `venue-${r.id}`;

              const isMsg =
                messaging?.id === r.id &&
                messaging?.type === 'venue';

              const isSent = msgSent.includes(key);

              return (
                <div
                  key={r.id}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 16,
                    overflow: 'hidden',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor =
                      'rgba(201,169,110,0.3)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor =
                      'var(--border)')
                  }
                >
                  <div style={{ display: 'flex' }}>
                    <div
                      style={{
                        width: 140,
                        flexShrink: 0,
                        background: photo
                          ? `url(${photo}) center/cover`
                          : 'linear-gradient(135deg, var(--surface-2), var(--surface))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {!photo && (
                        <Building2
                          size={32}
                          color="var(--muted)"
                          style={{ opacity: 0.3 }}
                        />
                      )}
                    </div>

                    <div
                      style={{
                        flex: 1,
                        padding: '20px 24px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: 12,
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              fontSize: 18,
                              fontWeight: 700,
                              fontFamily:
                                'Playfair Display, serif',
                              marginBottom: 4,
                            }}
                          >
                            {r.venue?.name}
                          </h3>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <MapPin
                              size={12}
                              color="var(--muted)"
                            />

                            <span
                              style={{
                                fontSize: 13,
                                color: 'var(--muted)',
                              }}
                            >
                              {r.venue?.city}
                            </span>
                          </div>
                        </div>

                        <span
                          style={{
                            background: status.bg,
                            color: status.color,
                            padding: '4px 12px',
                            borderRadius: 100,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {status.label}
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          gap: 20,
                          marginBottom: 16,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <Calendar
                            size={13}
                            color="var(--muted)"
                          />

                          <span
                            style={{
                              fontSize: 13,
                              color: 'var(--muted)',
                            }}
                          >
                            {new Date(
                              r.startAt
                            ).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <Clock
                            size={13}
                            color="var(--muted)"
                          />

                          <span
                            style={{
                              fontSize: 13,
                              color: 'var(--muted)',
                            }}
                          >
                            {new Date(
                              r.startAt
                            ).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {' → '}
                            {new Date(
                              r.endAt
                            ).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <span
                            style={{
                              fontSize: 20,
                              fontWeight: 700,
                              color: 'var(--primary)',
                              fontFamily:
                                'Playfair Display, serif',
                            }}
                          >
                            {Number(
                              r.totalAmount
                            ).toLocaleString('fr-FR')}{' '}
                            €
                          </span>

                          <span
                            style={{
                              fontSize: 12,
                              color: 'var(--muted)',
                              marginLeft: 6,
                            }}
                          >
                            (acompte :{' '}
                            {Number(
                              r.deposit
                            ).toLocaleString('fr-FR')}{' '}
                            €)
                          </span>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            gap: 8,
                          }}
                        >
                          <button
                            onClick={() =>
                              setMessaging(
                                isMsg
                                  ? null
                                  : {
                                      id: r.id,
                                      type: 'venue',
                                    }
                              )
                            }
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              background: isMsg
                                ? 'rgba(201,169,110,0.2)'
                                : 'rgba(201,169,110,0.1)',
                              border:
                                '1px solid rgba(201,169,110,0.3)',
                              borderRadius: 8,
                              padding: '7px 14px',
                              cursor: 'pointer',
                              color: 'var(--primary)',
                              fontSize: 13,
                              fontFamily:
                                'DM Sans, sans-serif',
                            }}
                          >
                            <MessageSquare size={14} />
                            {isMsg
                              ? 'Fermer'
                              : 'Contacter'}
                          </button>

                          {(r.status === 'CONFIRMEE' ||
                            r.status === 'TERMINEE') && (
                            <button
                              onClick={() =>
                                handleDownloadInvoice(
                                  r.id
                                )
                              }
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                background:
                                  'var(--surface-2)',
                                border:
                                  '1px solid var(--border)',
                                borderRadius: 8,
                                padding: '7px 14px',
                                cursor: 'pointer',
                                color:
                                  'var(--foreground)',
                                fontSize: 13,
                                fontFamily:
                                  'DM Sans, sans-serif',
                              }}
                            >
                              <FileText size={14} />
                              Facture
                            </button>
                          )}

                          {r.status === 'EN_ATTENTE' && (
                            <button
                              onClick={() =>
                                handleCancelVenue(r.id)
                              }
                              disabled={
                                cancelling === r.id
                              }
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                background:
                                  'rgba(248,113,113,0.1)',
                                border:
                                  '1px solid rgba(248,113,113,0.3)',
                                borderRadius: 8,
                                padding: '7px 14px',
                                cursor: 'pointer',
                                color: '#f87171',
                                fontSize: 13,
                                fontFamily:
                                  'DM Sans, sans-serif',
                                opacity:
                                  cancelling === r.id
                                    ? 0.6
                                    : 1,
                              }}
                            >
                              <X size={14} />
                              {cancelling === r.id
                                ? '...'
                                : 'Annuler'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {isMsg && (
                    <div
                      style={{
                        padding: '16px 24px',
                        borderTop:
                          '1px solid var(--border)',
                        background:
                          'rgba(201,169,110,0.04)',
                      }}
                    >
                      {isSent ? (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            color: '#4ade80',
                            fontSize: 13,
                            background:
                              'rgba(74,222,128,0.1)',
                            border:
                              '1px solid rgba(74,222,128,0.3)',
                            borderRadius: 10,
                            padding: '10px 14px',
                          }}
                        >
                          <CheckCircle size={14} />
                          Message envoyé !

                          <Link
                            href="/dashboard/messages"
                            style={{
                              color: '#4ade80',
                              marginLeft: 'auto',
                              fontSize: 12,
                              textDecoration:
                                'underline',
                            }}
                          >
                            Voir la conversation →
                          </Link>
                        </div>
                      ) : (
                        <div>
                          <p
                            style={{
                              fontSize: 12,
                              color: 'var(--muted)',
                              marginBottom: 8,
                            }}
                          >
                            Message au prestataire —{' '}
                            {r.venue?.name}
                          </p>

                          <div
                            style={{
                              display: 'flex',
                              gap: 10,
                            }}
                          >
                            <input
                              style={{
                                flex: 1,
                                padding: '10px 14px',
                                background:
                                  'var(--surface)',
                                border:
                                  '1px solid var(--border)',
                                borderRadius: 10,
                                color:
                                  'var(--foreground)',
                                fontSize: 13,
                                outline: 'none',
                                fontFamily:
                                  'DM Sans, sans-serif',
                              }}
                              placeholder="Votre message..."
                              value={
                                msgContent[key] || ''
                              }
                              onChange={(e) =>
                                setMsgContent(
                                  (prev) => ({
                                    ...prev,
                                    [key]:
                                      e.target.value,
                                  })
                                )
                              }
                              onKeyDown={(e) =>
                                e.key === 'Enter' &&
                                handleSendMessage(
                                  r.id,
                                  'venue'
                                )
                              }
                              autoFocus
                            />

                            <button
                              onClick={() =>
                                handleSendMessage(
                                  r.id,
                                  'venue'
                                )
                              }
                              disabled={
                                !msgContent[
                                  key
                                ]?.trim()
                              }
                              style={{
                                background:
                                  'var(--primary)',
                                color: '#0a0a0f',
                                border: 'none',
                                borderRadius: 10,
                                padding:
                                  '10px 20px',
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: 600,
                                fontFamily:
                                  'DM Sans, sans-serif',
                                opacity:
                                  !msgContent[
                                    key
                                  ]?.trim()
                                    ? 0.5
                                    : 1,
                              }}
                            >
                              Envoyer
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

      {activeTab === 'services' &&
        (serviceBookings.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 24px',
              background: 'var(--surface)',
              borderRadius: 20,
              border: '1px solid var(--border)',
            }}
          >
            <Briefcase
              size={48}
              color="var(--muted)"
              style={{
                margin: '0 auto 16px',
                opacity: 0.3,
              }}
            />

            <h3
              style={{
                fontSize: 22,
                marginBottom: 8,
              }}
            >
              Aucun service réservé
            </h3>

            <p
              style={{
                color: 'var(--muted)',
                marginBottom: 24,
                fontSize: 14,
              }}
            >
              Explorez nos services événementiels.
            </p>

            <Link
              href="/services"
              style={{
                background: 'var(--primary)',
                color: '#0a0a0f',
                textDecoration: 'none',
                padding: '12px 24px',
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Explorer les services
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {serviceBookings.map((b) => {
              const status =
                statusConfig[b.status] ||
                statusConfig.EN_ATTENTE;

              const key = `service-${b.id}`;

              const isMsg =
                messaging?.id === b.id &&
                messaging?.type === 'service';

              const isSent = msgSent.includes(key);

              return (
                <div
                  key={b.id}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 16,
                    overflow: 'hidden',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor =
                      'rgba(201,169,110,0.3)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor =
                      'var(--border)')
                  }
                >
                  <div style={{ display: 'flex' }}>
                    <div
                      style={{
                        width: 140,
                        flexShrink: 0,
                        background:
                          'linear-gradient(135deg, var(--surface-2), var(--surface))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Briefcase
                        size={44}
                        color="var(--primary)"
                        style={{ opacity: 0.7 }}
                      />
                    </div>

                    <div
                      style={{
                        flex: 1,
                        padding: '20px 24px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: 12,
                        }}
                      >
                        <div>
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
                                background:
                                  'rgba(201,169,110,0.1)',
                                border:
                                  '1px solid rgba(201,169,110,0.2)',
                                borderRadius: 100,
                                padding: '2px 10px',
                                fontSize: 11,
                                color:
                                  'var(--primary)',
                                fontWeight: 500,
                              }}
                            >
                              {b.service?.category}
                            </span>
                          </div>

                          <h3
                            style={{
                              fontSize: 18,
                              fontWeight: 700,
                              fontFamily:
                                'Playfair Display, serif',
                              marginBottom: 4,
                            }}
                          >
                            {b.service?.name}
                          </h3>

                          <p
                            style={{
                              fontSize: 13,
                              color: 'var(--muted)',
                            }}
                          >
                            Prestataire :{' '}
                            {
                              b.service?.provider
                                ?.firstName
                            }{' '}
                            {
                              b.service?.provider
                                ?.lastName
                            }
                          </p>
                        </div>

                        <span
                          style={{
                            background: status.bg,
                            color: status.color,
                            padding: '4px 12px',
                            borderRadius: 100,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {status.label}
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          gap: 20,
                          marginBottom: 16,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <Calendar
                            size={13}
                            color="var(--muted)"
                          />

                          <span
                            style={{
                              fontSize: 13,
                              color: 'var(--muted)',
                            }}
                          >
                            {new Date(
                              b.eventDate
                            ).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <Clock
                            size={13}
                            color="var(--muted)"
                          />

                          <span
                            style={{
                              fontSize: 13,
                              color: 'var(--muted)',
                            }}
                          >
                            {new Date(
                              b.eventDate
                            ).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {' → '}
                            {new Date(
                              b.eventEndDate
                            ).toLocaleTimeString(
                              'fr-FR',
                              {
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <span
                            style={{
                              fontSize: 20,
                              fontWeight: 700,
                              color: 'var(--primary)',
                              fontFamily:
                                'Playfair Display, serif',
                            }}
                          >
                            {Number(
                              b.totalAmount
                            ).toLocaleString('fr-FR')}{' '}
                            €
                          </span>

                          <span
                            style={{
                              fontSize: 12,
                              color: 'var(--muted)',
                              marginLeft: 6,
                            }}
                          >
                            (acompte :{' '}
                            {Number(
                              b.deposit
                            ).toLocaleString('fr-FR')}{' '}
                            €)
                          </span>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            gap: 8,
                          }}
                        >
                          <button
                            onClick={() =>
                              setMessaging(
                                isMsg
                                  ? null
                                  : {
                                      id: b.id,
                                      type: 'service',
                                    }
                              )
                            }
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              background: isMsg
                                ? 'rgba(201,169,110,0.2)'
                                : 'rgba(201,169,110,0.1)',
                              border:
                                '1px solid rgba(201,169,110,0.3)',
                              borderRadius: 8,
                              padding: '7px 14px',
                              cursor: 'pointer',
                              color: 'var(--primary)',
                              fontSize: 13,
                              fontFamily:
                                'DM Sans, sans-serif',
                            }}
                          >
                            <MessageSquare size={14} />
                            {isMsg
                              ? 'Fermer'
                              : 'Contacter'}
                          </button>

                          {b.status === 'EN_ATTENTE' && (
                            <button
                              onClick={() =>
                                handleCancelService(
                                  b.id
                                )
                              }
                              disabled={
                                cancellingService ===
                                b.id
                              }
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                background:
                                  'rgba(248,113,113,0.1)',
                                border:
                                  '1px solid rgba(248,113,113,0.3)',
                                borderRadius: 8,
                                padding: '7px 14px',
                                cursor: 'pointer',
                                color: '#f87171',
                                fontSize: 13,
                                fontFamily:
                                  'DM Sans, sans-serif',
                                opacity:
                                  cancellingService ===
                                  b.id
                                    ? 0.6
                                    : 1,
                              }}
                            >
                              <X size={14} />
                              {cancellingService === b.id
                                ? '...'
                                : 'Annuler'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {isMsg && (
                    <div
                      style={{
                        padding: '16px 24px',
                        borderTop:
                          '1px solid var(--border)',
                        background:
                          'rgba(201,169,110,0.04)',
                      }}
                    >
                      {isSent ? (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            color: '#4ade80',
                            fontSize: 13,
                            background:
                              'rgba(74,222,128,0.1)',
                            border:
                              '1px solid rgba(74,222,128,0.3)',
                            borderRadius: 10,
                            padding: '10px 14px',
                          }}
                        >
                          <CheckCircle size={14} />
                          Message envoyé au prestataire !

                          <Link
                            href="/dashboard/messages"
                            style={{
                              color: '#4ade80',
                              marginLeft: 'auto',
                              fontSize: 12,
                              textDecoration:
                                'underline',
                            }}
                          >
                            Voir la conversation →
                          </Link>
                        </div>
                      ) : (
                        <div>
                          <p
                            style={{
                              fontSize: 12,
                              color: 'var(--muted)',
                              marginBottom: 8,
                            }}
                          >
                            Message à{' '}
                            {
                              b.service?.provider
                                ?.firstName
                            }{' '}
                            — {b.service?.name}
                          </p>

                          <div
                            style={{
                              display: 'flex',
                              gap: 10,
                            }}
                          >
                            <input
                              style={{
                                flex: 1,
                                padding: '10px 14px',
                                background:
                                  'var(--surface)',
                                border:
                                  '1px solid var(--border)',
                                borderRadius: 10,
                                color:
                                  'var(--foreground)',
                                fontSize: 13,
                                outline: 'none',
                                fontFamily:
                                  'DM Sans, sans-serif',
                              }}
                              placeholder={`Votre message à ${b.service?.provider?.firstName}...`}
                              value={
                                msgContent[key] || ''
                              }
                              onChange={(e) =>
                                setMsgContent(
                                  (prev) => ({
                                    ...prev,
                                    [key]:
                                      e.target.value,
                                  })
                                )
                              }
                              onKeyDown={(e) =>
                                e.key === 'Enter' &&
                                handleSendMessage(
                                  b.id,
                                  'service'
                                )
                              }
                              autoFocus
                            />

                            <button
                              onClick={() =>
                                handleSendMessage(
                                  b.id,
                                  'service'
                                )
                              }
                              disabled={
                                !msgContent[
                                  key
                                ]?.trim()
                              }
                              style={{
                                background:
                                  'var(--primary)',
                                color: '#0a0a0f',
                                border: 'none',
                                borderRadius: 10,
                                padding:
                                  '10px 20px',
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: 600,
                                fontFamily:
                                  'DM Sans, sans-serif',
                                opacity:
                                  !msgContent[
                                    key
                                  ]?.trim()
                                    ? 0.5
                                    : 1,
                              }}
                            >
                              Envoyer
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
    </div>
  );
}