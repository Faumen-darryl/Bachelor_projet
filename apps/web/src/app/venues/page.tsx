'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import Navbar from '@/components/Navbar';
import VenueCard from '@/components/VenueCard';
import VenueFilters from '@/components/VenueFilters';
import { api } from '@/lib/api';

import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';

interface Filters {
  city: string;
  type: string;
  minPrice: string;
  maxPrice: string;
  capacity: string;
}

const defaultFilters: Filters = {
  city: '',
  type: '',
  minPrice: '',
  maxPrice: '',
  capacity: '',
};

// Affiche la liste des lieux avec filtres et pagination.
function VenuesContent() {
  const searchParams = useSearchParams();

  const [venues, setVenues] = useState<any[]>([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    ...defaultFilters,
    city: searchParams.get('city') || '',
  });
  const [page, setPage] = useState(1);

  // Charge les lieux selon les filtres et la page courante.
  const fetchVenues = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      if (filters.city) {
        params.set('city', filters.city);
      }

      if (filters.type) {
        params.set('type', filters.type);
      }

      if (filters.minPrice) {
        params.set('minPrice', filters.minPrice);
      }

      if (filters.maxPrice) {
        params.set('maxPrice', filters.maxPrice);
      }

      if (filters.capacity) {
        params.set('capacity', filters.capacity);
      }

      params.set('page', String(page));
      params.set('limit', '12');

      const { data } = await api.get(
        `/venues?${params.toString()}`
      );

      setVenues(data.data);
      setMeta(data.meta);
    } catch (err) {
      console.error(
        'Erreur lors du chargement des lieux :',
        err
      );
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const handleFiltersChange = (
    newFilters: Filters
  ) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleReset = () => {
    setFilters(defaultFilters);
    setPage(1);
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
          paddingTop: 96,
          paddingBottom: 40,
          paddingLeft: 24,
          paddingRight: 24,
          maxWidth: 1280,
          margin: '0 auto',
        }}
      >
        <h1
          style={{
            fontSize: 40,
            fontWeight: 900,
            fontFamily: 'Playfair Display, serif',
            marginBottom: 8,
          }}
        >
          Nos lieux d&apos;exception
        </h1>

        <p
          style={{
            color: 'var(--muted)',
            fontSize: 16,
          }}
        >
          Découvrez notre sélection de lieux pour vos événements
        </p>
      </div>

      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 24px 80px',
          display: 'flex',
          gap: 32,
          alignItems: 'flex-start',
        }}
      >
        <VenueFilters
          filters={filters}
          onChange={handleFiltersChange}
          onReset={handleReset}
          total={meta.total}
        />

        <div style={{ flex: 1 }}>
          {loading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 400,
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <Loader2
                size={32}
                color="var(--primary)"
                style={{
                  animation:
                    'spin 1s linear infinite',
                }}
              />

              <p
                style={{
                  color: 'var(--muted)',
                }}
              >
                Chargement des lieux...
              </p>

              <style>
                {`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
              </style>
            </div>
          ) : venues.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '80px 24px',
                background: 'var(--surface)',
                borderRadius: 16,
                border:
                  '1px solid var(--border)',
              }}
            >
              <Building2
                size={44}
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
                Aucun lieu trouvé
              </h3>

              <p
                style={{
                  color: 'var(--muted)',
                  fontSize: 14,
                }}
              >
                Essayez de modifier vos filtres pour trouver des lieux disponibles.
              </p>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 20,
                  marginBottom: 40,
                }}
              >
                {venues.map((venue) => (
                  <VenueCard
                    key={venue.id}
                    venue={venue}
                  />
                ))}
              </div>

              {meta.totalPages > 1 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <button
                    onClick={() =>
                      setPage((currentPage) =>
                        Math.max(
                          1,
                          currentPage - 1
                        )
                      )
                    }
                    disabled={page === 1}
                    style={{
                      background: 'var(--surface)',
                      border:
                        '1px solid var(--border)',
                      borderRadius: 10,
                      padding: '8px 14px',
                      cursor:
                        page === 1
                          ? 'not-allowed'
                          : 'pointer',
                      opacity:
                        page === 1 ? 0.4 : 1,
                      color: 'var(--foreground)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from(
                    {
                      length:
                        meta.totalPages,
                    },
                    (_, index) =>
                      index + 1
                  ).map((pageNumber) => (
                    <button
                      key={pageNumber}
                      onClick={() =>
                        setPage(pageNumber)
                      }
                      style={{
                        background:
                          page === pageNumber
                            ? 'var(--primary)'
                            : 'var(--surface)',
                        border:
                          '1px solid var(--border)',
                        borderRadius: 10,
                        padding: '8px 14px',
                        cursor: 'pointer',
                        fontWeight:
                          page === pageNumber
                            ? 700
                            : 400,
                        color:
                          page === pageNumber
                            ? '#0a0a0f'
                            : 'var(--foreground)',
                        minWidth: 40,
                        fontFamily:
                          'DM Sans, sans-serif',
                      }}
                    >
                      {pageNumber}
                    </button>
                  ))}

                  <button
                    onClick={() =>
                      setPage((currentPage) =>
                        Math.min(
                          meta.totalPages,
                          currentPage + 1
                        )
                      )
                    }
                    disabled={
                      page ===
                      meta.totalPages
                    }
                    style={{
                      background: 'var(--surface)',
                      border:
                        '1px solid var(--border)',
                      borderRadius: 10,
                      padding: '8px 14px',
                      cursor:
                        page ===
                        meta.totalPages
                          ? 'not-allowed'
                          : 'pointer',
                      opacity:
                        page ===
                        meta.totalPages
                          ? 0.4
                          : 1,
                      color: 'var(--foreground)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

// Affiche l'état de chargement utilisé par Suspense.
function VenuesLoading() {
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
          minHeight: '80vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <Loader2
          size={32}
          color="var(--primary)"
          style={{
            animation: 'spin 1s linear infinite',
          }}
        />

        <p
          style={{
            color: 'var(--muted)',
          }}
        >
          Chargement des lieux...
        </p>

        <style>
          {`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
        </style>
      </div>
    </main>
  );
}

export default function VenuesPage() {
  return (
    <Suspense fallback={<VenuesLoading />}>
      <VenuesContent />
    </Suspense>
  );
}