'use client';

import { useEffect, useState } from 'react';

import { api } from '@/lib/api';

import { Loader2, Search } from 'lucide-react';

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

// Affiche et permet de filtrer l'ensemble des réservations de la plateforme.
export default function AdminReservationsPage() {
  const [venueReservations, setVenueReservations] = useState<any[]>([]);
  const [serviceBookings, setServiceBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'venues' | 'services'>(
    'venues'
  );

  // Charge les réservations de lieux et de services au montage de la page.
  useEffect(() => {
    Promise.all([
      api.get('/admin/reservations'),
      api.get('/admin/service-bookings'),
    ])
      .then(([r, s]) => {
        setVenueReservations(r.data || []);
        setServiceBookings(s.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  // Filtre les réservations selon la recherche et le statut sélectionné.
  const filterList = (
    list: any[],
    nameKey: (r: any) => string
  ) => {
    let result = list;

    if (search) {
      result = result.filter((r) =>
        `${nameKey(r)} ${r.client?.firstName} ${r.client?.lastName}`
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    }

    if (statusFilter) {
      result = result.filter(
        (r) => r.status === statusFilter
      );
    }

    return result;
  };

  const filteredVenues = filterList(
    venueReservations,
    (r) => r.venue?.name || ''
  );

  const filteredServices = filterList(
    serviceBookings,
    (r) => r.service?.name || ''
  );

  // Calcule le revenu total des réservations actuellement affichées.
  const totalRevenue = (
    activeTab === 'venues'
      ? filteredVenues
      : filteredServices
  )
    .filter(
      (r) =>
        r.status === 'CONFIRMEE' ||
        r.status === 'TERMINEE'
    )
    .reduce(
      (acc, r) => acc + Number(r.totalAmount),
      0
    );

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
          {`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}
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
          Toutes les réservations
        </h1>

        <p
          style={{
            color: 'var(--muted)',
            fontSize: 14,
          }}
        >
          {venueReservations.length} lieux ·{' '}
          {serviceBookings.length} services · Revenus filtrés :{' '}
          <span
            style={{
              color: 'var(--primary)',
              fontWeight: 700,
            }}
          >
            {totalRevenue.toLocaleString('fr-FR')} €
          </span>
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 0,
          marginBottom: 20,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          overflow: 'hidden',
          width: 'fit-content',
        }}
      >
        {[
          {
            key: 'venues',
            label: 'Lieux',
            count: filteredVenues.length,
          },
          {
            key: 'services',
            label: 'Services',
            count: filteredServices.length,
          },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            style={{
              padding: '11px 24px',
              border: 'none',
              cursor: 'pointer',
              background:
                activeTab === t.key
                  ? 'rgba(245,158,11,0.1)'
                  : 'transparent',
              borderBottom:
                activeTab === t.key
                  ? '2px solid #f59e0b'
                  : '2px solid transparent',
              color:
                activeTab === t.key
                  ? '#f59e0b'
                  : 'var(--muted)',
              fontSize: 14,
              fontWeight:
                activeTab === t.key ? 600 : 400,
              fontFamily: 'DM Sans, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {t.label}

            <span
              style={{
                background:
                  activeTab === t.key
                    ? 'rgba(245,158,11,0.2)'
                    : 'var(--surface-2)',
                padding: '1px 8px',
                borderRadius: 100,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            position: 'relative',
            flex: 1,
          }}
        >
          <Search
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
              width: '100%',
              padding: '10px 14px 10px 36px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              color: 'var(--foreground)',
              fontSize: 13,
              outline: 'none',
              fontFamily: 'DM Sans, sans-serif',
              boxSizing: 'border-box',
            }}
            placeholder={
              activeTab === 'venues'
                ? 'Rechercher par lieu ou client...'
                : 'Rechercher par service ou client...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          style={{
            padding: '10px 14px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            color: 'var(--foreground)',
            fontSize: 13,
            outline: 'none',
            cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
          }}
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
        >
          <option value="">Tous les statuts</option>

          {Object.entries(statusConfig).map(
            ([k, v]) => (
              <option
                key={k}
                value={k}
                style={{
                  background: 'var(--surface)',
                }}
              >
                {v.label}
              </option>
            )
          )}
        </select>
      </div>

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              '60px 1fr 1fr 140px 120px 140px',
            padding: '12px 20px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface-2)',
          }}
        >
          {[
            '#',
            activeTab === 'venues'
              ? 'Lieu'
              : 'Service',
            'Client',
            'Dates',
            'Montant',
            'Statut',
          ].map((h) => (
            <span
              key={h}
              style={{
                fontSize: 11,
                color: 'var(--muted)',
                letterSpacing: 0.5,
                fontWeight: 600,
              }}
            >
              {h}
            </span>
          ))}
        </div>

        {(activeTab === 'venues'
          ? filteredVenues
          : filteredServices
        ).map((r, i) => {
          const status =
            statusConfig[r.status] ||
            statusConfig.EN_ATTENTE;

          const list =
            activeTab === 'venues'
              ? filteredVenues
              : filteredServices;

          return (
            <div
              key={r.id}
              style={{
                display: 'grid',
                gridTemplateColumns:
                  '60px 1fr 1fr 140px 120px 140px',
                padding: '14px 20px',
                alignItems: 'center',
                borderBottom:
                  i < list.length - 1
                    ? '1px solid var(--border)'
                    : 'none',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background =
                  'rgba(245,158,11,0.03)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background =
                  'none')
              }
            >
              <span
                style={{
                  fontSize: 13,
                  color: 'var(--muted)',
                  fontWeight: 600,
                }}
              >
                #{r.id}
              </span>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {activeTab === 'venues'
                      ? r.venue?.name
                      : r.service?.name}
                  </p>

                  {activeTab === 'services' && (
                    <p
                      style={{
                        fontSize: 11,
                        color: 'var(--muted)',
                      }}
                    >
                      {r.service?.category} · par{' '}
                      {r.service?.provider?.firstName}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {r.client?.firstName}{' '}
                  {r.client?.lastName}
                </p>

                <p
                  style={{
                    fontSize: 11,
                    color: 'var(--muted)',
                  }}
                >
                  {r.client?.email}
                </p>
              </div>

              <div>
                <p style={{ fontSize: 12 }}>
                  {new Date(
                    activeTab === 'venues'
                      ? r.startAt
                      : r.eventDate
                  ).toLocaleDateString('fr-FR')}
                </p>

                <p
                  style={{
                    fontSize: 11,
                    color: 'var(--muted)',
                  }}
                >
                  {new Date(
                    activeTab === 'venues'
                      ? r.endAt
                      : r.eventEndDate
                  ).toLocaleDateString('fr-FR')}
                </p>
              </div>

              <span
                style={{
                  fontSize: 15,
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
                  display: 'inline-block',
                  background: status.bg,
                  color: status.color,
                  padding: '4px 12px',
                  borderRadius: 100,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {status.label}
              </span>
            </div>
          );
        })}

        {(activeTab === 'venues'
          ? filteredVenues
          : filteredServices
        ).length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '48px',
              color: 'var(--muted)',
              fontSize: 14,
            }}
          >
            Aucune réservation trouvée
          </div>
        )}
      </div>
    </div>
  );
}