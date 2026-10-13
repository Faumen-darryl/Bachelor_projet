'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';

import {
  Search,
  Star,
  ArrowRight,
  Loader2,
  SlidersHorizontal,
  X,
  Briefcase,
} from 'lucide-react';

const categories = [
  {
    value: '',
    label: 'Toutes les catégories',
  },
  {
    value: 'DJ',
    label: 'DJ',
  },
  {
    value: 'Traiteur',
    label: 'Traiteur',
  },
  {
    value: 'Photographe',
    label: 'Photographe',
  },
  {
    value: 'Décorateur',
    label: 'Décorateur',
  },
  {
    value: 'Animateur',
    label: 'Animateur',
  },
  {
    value: 'Vidéaste',
    label: 'Vidéaste',
  },
  {
    value: 'Fleuriste',
    label: 'Fleuriste',
  },
  {
    value: 'Sécurité',
    label: 'Sécurité',
  },
  {
    value: 'Transport',
    label: 'Transport',
  },
  {
    value: 'Autre',
    label: 'Autre',
  },
];

// Affiche la liste des services avec filtres et pagination.
export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    search: '',
  });

  const [page, setPage] = useState(1);

  // Charge les services selon les filtres et la page courante.
  const fetchServices = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      if (filters.category) {
        params.set('category', filters.category);
      }

      if (filters.minPrice) {
        params.set('minPrice', filters.minPrice);
      }

      if (filters.maxPrice) {
        params.set('maxPrice', filters.maxPrice);
      }

      params.set('page', String(page));
      params.set('limit', '12');

      const { data } = await api.get(
        `/services?${params.toString()}`
      );

      setServices(data.data || []);

      setMeta(
        data.meta || {
          total: 0,
          page: 1,
          totalPages: 1,
        }
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const hasFilters = Object.values(filters).some(
    (value) => value !== ''
  );

  // Réinitialise les filtres et revient à la première page.
  const resetFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      search: '',
    });

    setPage(1);
  };

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

  const filteredServices = filters.search
    ? services.filter(
        (service) =>
          service.name
            .toLowerCase()
            .includes(
              filters.search.toLowerCase()
            ) ||
          service.category
            .toLowerCase()
            .includes(
              filters.search.toLowerCase()
            )
      )
    : services;

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
            fontFamily:
              'Playfair Display, serif',
            marginBottom: 8,
          }}
        >
          Nos prestataires de services
        </h1>

        <p
          style={{
            color: 'var(--muted)',
            fontSize: 16,
          }}
        >
          Trouvez les meilleurs prestataires pour votre événement
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
        <aside
          style={{
            width: 280,
            flexShrink: 0,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 24,
            height: 'fit-content',
            position: 'sticky',
            top: 88,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <SlidersHorizontal
                size={16}
                color="var(--primary)"
              />

              <span
                style={{
                  fontWeight: 600,
                  fontSize: 15,
                }}
              >
                Filtres
              </span>
            </div>

            {hasFilters && (
              <button
                onClick={resetFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--muted)',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontFamily:
                    'DM Sans, sans-serif',
                }}
              >
                <X size={12} />
                Réinitialiser
              </button>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            <div
              style={{
                background:
                  'rgba(201,169,110,0.08)',
                border:
                  '1px solid var(--border)',
                borderRadius: 10,
                padding: '10px 14px',
                fontSize: 13,
                color: 'var(--primary)',
                textAlign: 'center',
              }}
            >
              {meta.total} service
              {meta.total > 1 ? 's' : ''} trouvé
              {meta.total > 1 ? 's' : ''}
            </div>

            <div>
              <label
                style={{
                  fontSize: 12,
                  color: 'var(--muted)',
                  marginBottom: 8,
                  display: 'block',
                  letterSpacing: 0.5,
                }}
              >
                RECHERCHE
              </label>

              <div
                style={{
                  position: 'relative',
                }}
              >
                <Search
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
                  style={{
                    ...inputStyle,
                    paddingLeft: 34,
                  }}
                  placeholder="DJ, traiteur..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      search: e.target.value,
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
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  fontSize: 12,
                  color: 'var(--muted)',
                  marginBottom: 8,
                  display: 'block',
                  letterSpacing: 0.5,
                }}
              >
                CATÉGORIE
              </label>

              <select
                style={{
                  ...inputStyle,
                  cursor: 'pointer',
                }}
                value={filters.category}
                onChange={(e) => {
                  setFilters({
                    ...filters,
                    category: e.target.value,
                  });

                  setPage(1);
                }}
              >
                {categories.map(
                  (category) => (
                    <option
                      key={category.value}
                      value={category.value}
                      style={{
                        background:
                          'var(--surface)',
                      }}
                    >
                      {category.label}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label
                style={{
                  fontSize: 12,
                  color: 'var(--muted)',
                  marginBottom: 8,
                  display: 'block',
                  letterSpacing: 0.5,
                }}
              >
                PRIX (€)
              </label>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    '1fr 1fr',
                  gap: 8,
                }}
              >
                <input
                  style={inputStyle}
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => {
                    setFilters({
                      ...filters,
                      minPrice:
                        e.target.value,
                    });

                    setPage(1);
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

                <input
                  style={inputStyle}
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => {
                    setFilters({
                      ...filters,
                      maxPrice:
                        e.target.value,
                    });

                    setPage(1);
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
          </div>
        </aside>

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
                Chargement des services...
              </p>

              <style>
                {`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
              </style>
            </div>
          ) : filteredServices.length === 0 ? (
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
              <Briefcase
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
                Aucun service trouvé
              </h3>

              <p
                style={{
                  color: 'var(--muted)',
                  fontSize: 14,
                }}
              >
                Essayez de modifier vos filtres.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 20,
              }}
            >
              {filteredServices.map(
                (service) => {
                  const photo =
                    service.photos?.[0]?.url;

                  return (
                    <Link
                      key={service.id}
                      href={`/services/${service.id}`}
                      style={{
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
                      <div
                        style={{
                          background:
                            'var(--surface)',
                          border:
                            '1px solid var(--border)',
                          borderRadius: 16,
                          overflow: 'hidden',
                          transition:
                            'transform 0.3s, border-color 0.3s',
                          cursor: 'pointer',
                          height: '100%',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform =
                            'translateY(-6px)';

                          e.currentTarget.style.borderColor =
                            'rgba(201,169,110,0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform =
                            'translateY(0)';

                          e.currentTarget.style.borderColor =
                            'var(--border)';
                        }}
                      >
                        <div
                          style={{
                            height: 160,
                            background: photo
                              ? `url(${photo}) center/cover no-repeat`
                              : 'linear-gradient(135deg, var(--surface-2), var(--surface))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent:
                              'center',
                            position: 'relative',
                          }}
                        >
                          <div
                            style={{
                              position:
                                'absolute',
                              top: 12,
                              left: 12,
                              background:
                                'rgba(10,10,15,0.85)',
                              backdropFilter:
                                'blur(8px)',
                              border:
                                '1px solid var(--border)',
                              borderRadius: 100,
                              padding:
                                '4px 12px',
                              fontSize: 11,
                              color:
                                'var(--primary)',
                              fontWeight: 500,
                              letterSpacing: 0.5,
                            }}
                          >
                            {service.category}
                          </div>

                          {service.totalReviews >
                            0 && (
                            <div
                              style={{
                                position:
                                  'absolute',
                                top: 12,
                                right: 12,
                                background:
                                  'rgba(10,10,15,0.85)',
                                backdropFilter:
                                  'blur(8px)',
                                border:
                                  '1px solid var(--border)',
                                borderRadius: 100,
                                padding:
                                  '4px 10px',
                                fontSize: 12,
                                color:
                                  'var(--foreground)',
                                display: 'flex',
                                alignItems:
                                  'center',
                                gap: 4,
                              }}
                            >
                              <Star
                                size={11}
                                fill="var(--primary)"
                                color="var(--primary)"
                              />

                              {service.rating.toFixed(
                                1
                              )}
                            </div>
                          )}

                          {!photo && (
                            <Briefcase
                              size={44}
                              color="var(--primary)"
                              style={{
                                opacity: 0.25,
                              }}
                            />
                          )}
                        </div>

                        <div
                          style={{
                            padding: 20,
                          }}
                        >
                          <h3
                            style={{
                              fontSize: 17,
                              fontWeight: 700,
                              marginBottom: 6,
                              fontFamily:
                                'Playfair Display, serif',
                              whiteSpace:
                                'nowrap',
                              overflow:
                                'hidden',
                              textOverflow:
                                'ellipsis',
                            }}
                          >
                            {service.name}
                          </h3>

                          <p
                            style={{
                              fontSize: 13,
                              color:
                                'var(--muted)',
                              marginBottom: 16,
                              lineHeight: 1.5,
                              display:
                                '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient:
                                'vertical' as const,
                              overflow:
                                'hidden',
                            }}
                          >
                            {service.description}
                          </p>

                          <div
                            style={{
                              display: 'flex',
                              justifyContent:
                                'space-between',
                              alignItems:
                                'center',
                              paddingTop: 14,
                              borderTop:
                                '1px solid var(--border)',
                            }}
                          >
                            <p
                              style={{
                                fontSize: 12,
                                color:
                                  'var(--muted)',
                              }}
                            >
                              {
                                service
                                  .provider
                                  ?.firstName
                              }{' '}
                              {
                                service
                                  .provider
                                  ?.lastName
                              }
                            </p>

                            <div
                              style={{
                                display: 'flex',
                                alignItems:
                                  'center',
                                gap: 8,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 18,
                                  fontWeight: 700,
                                  color:
                                    'var(--primary)',
                                  fontFamily:
                                    'Playfair Display, serif',
                                }}
                              >
                                {Number(
                                  service.price
                                ).toLocaleString(
                                  'fr-FR'
                                )}{' '}
                                €
                              </span>

                              <div
                                style={{
                                  background:
                                    'rgba(201,169,110,0.1)',
                                  border:
                                    '1px solid rgba(201,169,110,0.2)',
                                  borderRadius: 8,
                                  padding:
                                    '5px 8px',
                                  display:
                                    'flex',
                                  alignItems:
                                    'center',
                                  color:
                                    'var(--primary)',
                                }}
                              >
                                <ArrowRight
                                  size={14}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}