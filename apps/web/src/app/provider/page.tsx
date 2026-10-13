'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

import {
  MapPin,
  Calendar,
  TrendingUp,
  Loader2,
  ArrowRight,
  Clock,
  Briefcase,
  Building2,
  CheckCircle,
} from 'lucide-react';

// Affiche une vue d'ensemble de l'activité du prestataire.
export default function ProviderDashboard() {
  const { user } = useAuthStore();

  const [venues, setVenues] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [venueReservations, setVenueReservations] = useState<any[]>([]);
  const [serviceReservations, setServiceReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Charge les lieux, services et réservations du prestataire.
  useEffect(() => {
    Promise.all([
      api.get('/venues'),
      api.get('/services/my'),
      api.get('/reservations/provider'),
      api.get('/service-bookings/provider'),
    ])
      .then(([v, s, r, sb]) => {
        setVenues(v.data.data || []);
        setServices(s.data || []);
        setVenueReservations(r.data || []);
        setServiceReservations(sb.data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Regroupe les réservations en attente de lieux et de services.
  const allPending = [
    ...venueReservations
      .filter((reservation) => reservation.status === 'EN_ATTENTE')
      .map((reservation) => ({
        ...reservation,
        _type: 'venue',
      })),
    ...serviceReservations
      .filter((reservation) => reservation.status === 'EN_ATTENTE')
      .map((reservation) => ({
        ...reservation,
        _type: 'service',
      })),
  ].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
  );

  // Regroupe les réservations confirmées de lieux et de services.
  const allConfirmed = [
    ...venueReservations
      .filter((reservation) => reservation.status === 'CONFIRMEE')
      .map((reservation) => ({
        ...reservation,
        _type: 'venue',
      })),
    ...serviceReservations
      .filter((reservation) => reservation.status === 'CONFIRMEE')
      .map((reservation) => ({
        ...reservation,
        _type: 'service',
      })),
  ].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
  );

  const totalRevenue = allConfirmed.reduce(
    (acc, reservation) =>
      acc + Number(reservation.totalAmount),
    0
  );

  const stats = [
    {
      label: 'Lieux publiés',
      value: venues.length,
      icon: <MapPin size={20} />,
      color: '#c9a96e',
      href: '/provider/venues',
    },
    {
      label: 'Services publiés',
      value: services.length,
      icon: <Briefcase size={20} />,
      color: '#a78bfa',
      href: '/provider/services',
    },
    {
      label: 'Total réservations',
      value:
        venueReservations.length +
        serviceReservations.length,
      icon: <Calendar size={20} />,
      color: '#60a5fa',
      href: '/provider/reservations',
    },
    {
      label: 'Revenus confirmés',
      value: `${totalRevenue.toLocaleString('fr-FR')} €`,
      icon: <TrendingUp size={20} />,
      color: '#4ade80',
      href: '/provider/stats',
    },
  ];

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
      <div style={{ marginBottom: 40 }}>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 900,
            fontFamily: 'Playfair Display, serif',
            marginBottom: 8,
          }}
        >
          Bonjour, {user?.firstName}
        </h1>

        <p
          style={{
            color: 'var(--muted)',
            fontSize: 14,
          }}
        >
          Voici un aperçu de votre activité sur Evently
        </p>
      </div>

      {allPending.length > 0 && (
        <div
          style={{
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 14,
            padding: '16px 20px',
            marginBottom: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
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
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(245,158,11,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Clock
                size={18}
                color="#f59e0b"
              />
            </div>

            <div>
              <p
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: '#f59e0b',
                }}
              >
                {allPending.length} réservation
                {allPending.length > 1 ? 's' : ''} en attente de validation
              </p>

              <p
                style={{
                  fontSize: 12,
                  color: 'var(--muted)',
                  marginTop: 2,
                }}
              >
                {allPending.filter(
                  (reservation) =>
                    reservation._type === 'venue'
                ).length > 0 &&
                  `${
                    allPending.filter(
                      (reservation) =>
                        reservation._type === 'venue'
                    ).length
                  } lieu${
                    allPending.filter(
                      (reservation) =>
                        reservation._type === 'venue'
                    ).length > 1
                      ? 'x'
                      : ''
                  }`}

                {allPending.filter(
                  (reservation) =>
                    reservation._type === 'venue'
                ).length > 0 &&
                  allPending.filter(
                    (reservation) =>
                      reservation._type === 'service'
                  ).length > 0 &&
                  ' · '}

                {allPending.filter(
                  (reservation) =>
                    reservation._type === 'service'
                ).length > 0 &&
                  `${
                    allPending.filter(
                      (reservation) =>
                        reservation._type === 'service'
                    ).length
                  } service${
                    allPending.filter(
                      (reservation) =>
                        reservation._type === 'service'
                    ).length > 1
                      ? 's'
                      : ''
                  }`}
              </p>
            </div>
          </div>

          <Link
            href="/provider/reservations"
            style={{
              background: '#f59e0b',
              color: '#0a0a0f',
              textDecoration: 'none',
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            Voir les demandes
          </Link>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 32,
        }}
      >
        {stats.map((stat, index) => (
          <Link
            key={index}
            href={stat.href}
            style={{
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: 24,
                cursor: 'pointer',
                transition:
                  'border-color 0.2s, transform 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor =
                  stat.color;

                e.currentTarget.style.transform =
                  'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor =
                  'var(--border)';

                e.currentTarget.style.transform =
                  'translateY(0)';
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: `${stat.color}18`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: stat.color,
                  marginBottom: 16,
                }}
              >
                {stat.icon}
              </div>

              <p
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  fontFamily:
                    'Playfair Display, serif',
                  color: stat.color,
                }}
              >
                {stat.value}
              </p>

              <p
                style={{
                  fontSize: 13,
                  color: 'var(--muted)',
                  marginTop: 4,
                }}
              >
                {stat.label}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
        }}
      >
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 24,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                fontFamily:
                  'Playfair Display, serif',
              }}
            >
              En attente ({allPending.length})
            </h2>

            <Link
              href="/provider/reservations"
              style={{
                fontSize: 12,
                color: 'var(--primary)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              Tout voir
              <ArrowRight size={12} />
            </Link>
          </div>

          {allPending.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '28px 0',
                color: 'var(--muted)',
                fontSize: 13,
              }}
            >
              <CheckCircle
                size={30}
                color="#4ade80"
                style={{
                  margin: '0 auto 8px',
                  display: 'block',
                  opacity: 0.8,
                }}
              />
              Aucune réservation en attente
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {allPending
                .slice(0, 5)
                .map((reservation) => (
                  <div
                    key={`${reservation._type}-${reservation.id}`}
                    style={{
                      padding: '12px 14px',
                      background:
                        'rgba(245,158,11,0.05)',
                      borderRadius: 10,
                      border:
                        '1px solid rgba(245,158,11,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        flexShrink: 0,
                        background:
                          'rgba(245,158,11,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#f59e0b',
                      }}
                    >
                      {reservation._type === 'venue' ? (
                        <Building2 size={17} />
                      ) : (
                        <Briefcase size={17} />
                      )}
                    </div>

                    <div
                      style={{
                        flex: 1,
                        overflow: 'hidden',
                      }}
                    >
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          marginBottom: 2,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {reservation._type === 'venue'
                          ? reservation.venue?.name
                          : reservation.service?.name}
                      </p>

                      <p
                        style={{
                          fontSize: 11,
                          color: 'var(--muted)',
                        }}
                      >
                        {reservation.client?.firstName}{' '}
                        {reservation.client?.lastName} ·{' '}
                        {new Date(
                          reservation._type === 'venue'
                            ? reservation.startAt
                            : reservation.eventDate
                        ).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    </div>

                    <span
                      style={{
                        fontSize: 13,
                        color: 'var(--primary)',
                        fontWeight: 700,
                        fontFamily:
                          'Playfair Display, serif',
                        flexShrink: 0,
                      }}
                    >
                      {Number(
                        reservation.totalAmount
                      ).toLocaleString('fr-FR')}{' '}
                      €
                    </span>
                  </div>
                ))}

              {allPending.length > 5 && (
                <Link
                  href="/provider/reservations"
                  style={{
                    textAlign: 'center',
                    fontSize: 12,
                    color: 'var(--primary)',
                    textDecoration: 'none',
                    padding: '8px',
                    display: 'block',
                  }}
                >
                  +{allPending.length - 5} autre
                  {allPending.length - 5 > 1
                    ? 's'
                    : ''}{' '}
                  en attente →
                </Link>
              )}
            </div>
          )}
        </div>

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 24,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                fontFamily:
                  'Playfair Display, serif',
              }}
            >
              Confirmées ({allConfirmed.length})
            </h2>

            <Link
              href="/provider/reservations"
              style={{
                fontSize: 12,
                color: '#4ade80',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              Tout voir
              <ArrowRight size={12} />
            </Link>
          </div>

          {allConfirmed.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '28px 0',
                color: 'var(--muted)',
                fontSize: 13,
              }}
            >
              Aucune réservation confirmée pour l'instant
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {allConfirmed
                .slice(0, 5)
                .map((reservation) => (
                  <div
                    key={`${reservation._type}-${reservation.id}`}
                    style={{
                      padding: '12px 14px',
                      background:
                        'rgba(74,222,128,0.05)',
                      borderRadius: 10,
                      border:
                        '1px solid rgba(74,222,128,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        flexShrink: 0,
                        background:
                          'rgba(74,222,128,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#4ade80',
                      }}
                    >
                      {reservation._type === 'venue' ? (
                        <Building2 size={17} />
                      ) : (
                        <Briefcase size={17} />
                      )}
                    </div>

                    <div
                      style={{
                        flex: 1,
                        overflow: 'hidden',
                      }}
                    >
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          marginBottom: 2,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {reservation._type === 'venue'
                          ? reservation.venue?.name
                          : reservation.service?.name}
                      </p>

                      <p
                        style={{
                          fontSize: 11,
                          color: 'var(--muted)',
                        }}
                      >
                        {reservation.client?.firstName}{' '}
                        {reservation.client?.lastName} ·{' '}
                        {new Date(
                          reservation._type === 'venue'
                            ? reservation.startAt
                            : reservation.eventDate
                        ).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    </div>

                    <span
                      style={{
                        fontSize: 13,
                        color: '#4ade80',
                        fontWeight: 700,
                        fontFamily:
                          'Playfair Display, serif',
                        flexShrink: 0,
                      }}
                    >
                      {Number(
                        reservation.totalAmount
                      ).toLocaleString('fr-FR')}{' '}
                      €
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 24,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                fontFamily:
                  'Playfair Display, serif',
              }}
            >
              Mes lieux ({venues.length})
            </h2>

            <Link
              href="/provider/venues"
              style={{
                fontSize: 12,
                color: 'var(--primary)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              Voir tout
              <ArrowRight size={12} />
            </Link>
          </div>

          {venues.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '28px 0',
              }}
            >
              <p
                style={{
                  color: 'var(--muted)',
                  fontSize: 13,
                  marginBottom: 14,
                }}
              >
                Aucun lieu publié
              </p>

              <Link
                href="/provider/venues/new"
                style={{
                  background: 'var(--primary)',
                  color: '#0a0a0f',
                  textDecoration: 'none',
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Ajouter un lieu
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {venues.slice(0, 4).map((venue) => (
                <div
                  key={venue.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    background: 'var(--surface-2)',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      flexShrink: 0,
                      background:
                        venue.photos?.[0]?.url
                          ? `url(${venue.photos[0].url}) center/cover`
                          : 'rgba(201,169,110,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary)',
                    }}
                  >
                    {!venue.photos?.[0]?.url && (
                      <Building2 size={18} />
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        marginBottom: 2,
                      }}
                    >
                      {venue.name}
                    </p>

                    <p
                      style={{
                        fontSize: 11,
                        color: 'var(--muted)',
                      }}
                    >
                      {venue.city} · {venue.capacity} pers.
                    </p>
                  </div>

                  <span
                    style={{
                      fontSize: 13,
                      color: 'var(--primary)',
                      fontWeight: 700,
                    }}
                  >
                    {Number(
                      venue.pricePerHour
                    ).toLocaleString('fr-FR')}{' '}
                    €/h
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 24,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                fontFamily:
                  'Playfair Display, serif',
              }}
            >
              Mes services ({services.length})
            </h2>

            <Link
              href="/provider/services"
              style={{
                fontSize: 12,
                color: 'var(--primary)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              Voir tout
              <ArrowRight size={12} />
            </Link>
          </div>

          {services.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '28px 0',
              }}
            >
              <p
                style={{
                  color: 'var(--muted)',
                  fontSize: 13,
                  marginBottom: 14,
                }}
              >
                Aucun service publié
              </p>

              <Link
                href="/provider/services/new"
                style={{
                  background: 'var(--primary)',
                  color: '#0a0a0f',
                  textDecoration: 'none',
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Ajouter un service
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {services.slice(0, 4).map((service) => (
                <div
                  key={service.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    background: 'var(--surface-2)',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      flexShrink: 0,
                      background:
                        'rgba(201,169,110,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary)',
                    }}
                  >
                    <Briefcase size={17} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        marginBottom: 2,
                      }}
                    >
                      {service.name}
                    </p>

                    <p
                      style={{
                        fontSize: 11,
                        color: 'var(--muted)',
                      }}
                    >
                      {service.category}
                    </p>
                  </div>

                  <span
                    style={{
                      fontSize: 13,
                      color: 'var(--primary)',
                      fontWeight: 700,
                    }}
                  >
                    {Number(
                      service.price
                    ).toLocaleString('fr-FR')}{' '}
                    €
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}