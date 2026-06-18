'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';
import {
  MapPin, Star, Users, ArrowRight,
  Search, Loader2, Calendar, Briefcase
} from 'lucide-react';

const categoryEmojis: Record<string, string> = {
  DJ: '🎵', Traiteur: '🍽️', Photographe: '📸',
  Décorateur: '🎨', Animateur: '🎤', Vidéaste: '🎬',
  Fleuriste: '💐', Sécurité: '🛡️', Transport: '🚌', Autre: '📦',
};

const typeLabels: Record<string, string> = {
  SALLE: 'Salle', JARDIN: 'Jardin', RESTAURANT: 'Restaurant',
  BOITE_DE_NUIT: 'Boîte de nuit', PARC: 'Parc',
  ESPACE_PUBLIC: 'Espace public', AUTRE: 'Autre',
};

export default function HomePage() {
  const router = useRouter();
  const [venues, setVenues] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Charger les lieux en vedette
    api.get('/venues?limit=6')
      .then(({ data }) => setVenues(data.data || []))
      .catch(() => {})
      .finally(() => setLoadingVenues(false));

    // Charger les services en vedette
    api.get('/services?limit=6')
      .then(({ data }) => setServices(data.data || []))
      .catch(() => {})
      .finally(() => setLoadingServices(false));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/venues?city=${encodeURIComponent(search.trim())}`);
    } else {
      router.push('/venues');
    }
  };

  const stats = [
    { value: '500+', label: 'Lieux disponibles', icon: '🏛️' },
    { value: '200+', label: 'Prestataires certifiés', icon: '✅' },
    { value: '10k+', label: 'Événements organisés', icon: '🎉' },
    { value: '4.8/5', label: 'Note moyenne', icon: '⭐' },
  ];

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Navbar />

      {/* ── HERO ── */}
      <section style={{
        position: 'relative',
        minHeight: '92vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        paddingTop: 80,
      }}>
        {/* Fond décoratif */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,169,110,0.12), transparent)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '10%', left: '5%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,169,110,0.06), transparent)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '5%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(96,165,250,0.05), transparent)',
          pointerEvents: 'none',
        }} />

        <div style={{
          textAlign: 'center', maxWidth: 780,
          padding: '0 24px', position: 'relative', zIndex: 1,
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(201,169,110,0.1)',
            border: '1px solid rgba(201,169,110,0.25)',
            borderRadius: 100, padding: '6px 16px', marginBottom: 28,
          }}>
            <span style={{ fontSize: 14 }}>✨</span>
            <span style={{ fontSize: 13, color: 'var(--primary)', letterSpacing: 0.5 }}>
              La plateforme événementielle N°1 en France
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(42px, 7vw, 76px)',
            fontWeight: 900, lineHeight: 1.08,
            fontFamily: 'Playfair Display, serif',
            marginBottom: 24,
          }}>
            Créez des{' '}
            <span style={{
              color: 'var(--primary)',
              textDecoration: 'underline',
              textDecorationStyle: 'wavy',
              textUnderlineOffset: 6,
            }}>
              événements
            </span>
            <br />inoubliables
          </h1>

          <p style={{
            color: 'var(--muted)', fontSize: 20,
            lineHeight: 1.7, marginBottom: 40, maxWidth: 580, margin: '0 auto 40px',
          }}>
            Trouvez le lieu parfait, réservez les meilleurs prestataires et
            gérez tout votre événement sur une seule plateforme.
          </p>

          {/* Barre de recherche */}
          <form onSubmit={handleSearch} style={{
            display: 'flex', gap: 0, maxWidth: 560, margin: '0 auto 40px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} color="var(--muted)" style={{
                position: 'absolute', left: 18, top: '50%',
                transform: 'translateY(-50%)',
              }} />
              <input
                style={{
                  width: '100%', padding: '16px 16px 16px 46px',
                  background: 'none', border: 'none',
                  color: 'var(--foreground)', fontSize: 15,
                  outline: 'none', fontFamily: 'DM Sans, sans-serif',
                  boxSizing: 'border-box',
                }}
                placeholder="Paris, Lyon, Marseille..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" style={{
              background: 'var(--primary)', color: '#0a0a0f',
              border: 'none', padding: '16px 28px',
              fontSize: 15, fontWeight: 700,
              cursor: 'pointer', flexShrink: 0,
              fontFamily: 'DM Sans, sans-serif',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'opacity 0.2s',
            }}>
              Rechercher
            </button>
          </form>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/venues" style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--primary)', color: '#0a0a0f',
              textDecoration: 'none', padding: '14px 28px',
              borderRadius: 12, fontWeight: 700, fontSize: 15,
              transition: 'transform 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
              <MapPin size={18} /> Explorer les lieux
            </Link>
            <Link href="/services" style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--surface)', color: 'var(--foreground)',
              textDecoration: 'none', padding: '14px 28px',
              borderRadius: 12, fontWeight: 600, fontSize: 15,
              border: '1px solid var(--border)',
              transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
              <Briefcase size={18} /> Voir les services
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        padding: '40px 24px',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24,
        }}>
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{s.icon}</div>
              <p style={{
                fontSize: 32, fontWeight: 900, color: 'var(--primary)',
                fontFamily: 'Playfair Display, serif', marginBottom: 4,
              }}>
                {s.value}
              </p>
              <p style={{ fontSize: 14, color: 'var(--muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── LIEUX EN VEDETTE ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-end', marginBottom: 40,
        }}>
          <div>
            <p style={{
              fontSize: 13, color: 'var(--primary)', letterSpacing: 1,
              fontWeight: 600, marginBottom: 8,
            }}>
              NOS LIEUX
            </p>
            <h2 style={{
              fontSize: 40, fontWeight: 900,
              fontFamily: 'Playfair Display, serif',
              lineHeight: 1.1,
            }}>
              Lieux d'exception
            </h2>
          </div>
          <Link href="/venues" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: 'var(--primary)', textDecoration: 'none',
            fontSize: 14, fontWeight: 600,
            border: '1px solid rgba(201,169,110,0.3)',
            padding: '10px 18px', borderRadius: 10,
            transition: 'background 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(201,169,110,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
            Voir tous <ArrowRight size={14} />
          </Link>
        </div>

        {loadingVenues ? (
          <div style={{
            display: 'flex', justifyContent: 'center',
            alignItems: 'center', height: 200, gap: 12,
          }}>
            <Loader2 size={24} color="var(--primary)"
              style={{ animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
          </div>
        ) : venues.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 24px',
            background: 'var(--surface)', borderRadius: 20,
            border: '1px solid var(--border)',
          }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>🏛️</p>
            <p style={{ color: 'var(--muted)', fontSize: 16 }}>
              Aucun lieu publié pour le moment
            </p>
            <Link href="/venues" style={{
              display: 'inline-block', marginTop: 16,
              color: 'var(--primary)', textDecoration: 'underline', fontSize: 14,
            }}>
              Consulter le catalogue →
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
          }}>
            {venues.map(v => {
              const photo = v.photos?.[0]?.url;
              return (
                <Link key={v.id} href={`/venues/${v.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 18, overflow: 'hidden',
                    transition: 'transform 0.25s, border-color 0.25s, box-shadow 0.25s',
                    cursor: 'pointer',
                  }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.transform = 'translateY(-6px)';
                      el.style.borderColor = 'rgba(201,169,110,0.5)';
                      el.style.boxShadow = '0 16px 40px rgba(0,0,0,0.2)';
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.transform = 'translateY(0)';
                      el.style.borderColor = 'var(--border)';
                      el.style.boxShadow = 'none';
                    }}>

                    {/* Photo */}
                    <div style={{
                      height: 220,
                      background: photo
                        ? `url(${photo}) center/cover`
                        : 'linear-gradient(135deg, var(--surface-2), rgba(201,169,110,0.1))',
                      position: 'relative',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {!photo && <span style={{ fontSize: 52, opacity: 0.15 }}>🏛️</span>}

                      {/* Badge type */}
                      <div style={{
                        position: 'absolute', top: 14, left: 14,
                        background: 'rgba(10,10,15,0.75)',
                        backdropFilter: 'blur(6px)',
                        borderRadius: 100, padding: '4px 12px',
                        fontSize: 11, color: 'white', fontWeight: 500,
                      }}>
                        {typeLabels[v.type] || v.type}
                      </div>

                      {/* Rating */}
                      {v.totalReviews > 0 && (
                        <div style={{
                          position: 'absolute', top: 14, right: 14,
                          background: 'rgba(10,10,15,0.75)',
                          backdropFilter: 'blur(6px)',
                          borderRadius: 100, padding: '4px 10px',
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          <Star size={11} fill="#f59e0b" color="#f59e0b" />
                          <span style={{ fontSize: 12, color: 'white', fontWeight: 600 }}>
                            {v.rating?.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Infos */}
                    <div style={{ padding: '18px 20px' }}>
                      <h3 style={{
                        fontSize: 18, fontWeight: 700,
                        fontFamily: 'Playfair Display, serif',
                        marginBottom: 8, lineHeight: 1.2,
                      }}>
                        {v.name}
                      </h3>

                      <div style={{
                        display: 'flex', gap: 14, marginBottom: 14,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <MapPin size={13} color="var(--muted)" />
                          <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                            {v.city}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Users size={13} color="var(--muted)" />
                          <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                            {v.capacity} pers. max
                          </span>
                        </div>
                      </div>

                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: 14, borderTop: '1px solid var(--border)',
                      }}>
                        <div>
                          <span style={{
                            fontSize: 22, fontWeight: 900, color: 'var(--primary)',
                            fontFamily: 'Playfair Display, serif',
                          }}>
                            {Number(v.pricePerHour).toLocaleString('fr-FR')} €
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 4 }}>
                            / heure
                          </span>
                        </div>
                        <div style={{
                          background: 'rgba(201,169,110,0.1)',
                          border: '1px solid rgba(201,169,110,0.25)',
                          borderRadius: 8, padding: '6px 12px',
                          fontSize: 12, color: 'var(--primary)', fontWeight: 600,
                          display: 'flex', alignItems: 'center', gap: 5,
                        }}>
                          Réserver <ArrowRight size={12} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── SERVICES EN VEDETTE ── */}
      <section style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        padding: '80px 24px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-end', marginBottom: 40,
          }}>
            <div>
              <p style={{
                fontSize: 13, color: 'var(--primary)', letterSpacing: 1,
                fontWeight: 600, marginBottom: 8,
              }}>
                NOS PRESTATAIRES
              </p>
              <h2 style={{
                fontSize: 40, fontWeight: 900,
                fontFamily: 'Playfair Display, serif',
                lineHeight: 1.1,
              }}>
                Services événementiels
              </h2>
            </div>
            <Link href="/services" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              color: 'var(--primary)', textDecoration: 'none',
              fontSize: 14, fontWeight: 600,
              border: '1px solid rgba(201,169,110,0.3)',
              padding: '10px 18px', borderRadius: 10,
              transition: 'background 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(201,169,110,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
              Voir tous <ArrowRight size={14} />
            </Link>
          </div>

          {loadingServices ? (
            <div style={{
              display: 'flex', justifyContent: 'center',
              alignItems: 'center', height: 200, gap: 12,
            }}>
              <Loader2 size={24} color="var(--primary)"
                style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : services.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '60px 24px',
              background: 'var(--surface-2)', borderRadius: 20,
              border: '1px solid var(--border)',
            }}>
              <p style={{ fontSize: 48, marginBottom: 16 }}>🎵</p>
              <p style={{ color: 'var(--muted)', fontSize: 16 }}>
                Aucun service disponible pour le moment
              </p>
              <Link href="/services" style={{
                display: 'inline-block', marginTop: 16,
                color: 'var(--primary)', textDecoration: 'underline', fontSize: 14,
              }}>
                Consulter le catalogue →
              </Link>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 24,
            }}>
              {services.map(s => (
                <Link key={s.id} href={`/services/${s.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: 18, overflow: 'hidden',
                    transition: 'transform 0.25s, border-color 0.25s, box-shadow 0.25s',
                    cursor: 'pointer',
                  }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.transform = 'translateY(-6px)';
                      el.style.borderColor = 'rgba(201,169,110,0.5)';
                      el.style.boxShadow = '0 16px 40px rgba(0,0,0,0.2)';
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.transform = 'translateY(0)';
                      el.style.borderColor = 'var(--border)';
                      el.style.boxShadow = 'none';
                    }}>

                    {/* Header coloré */}
                    <div style={{
                      height: 140,
                      background: 'linear-gradient(135deg, rgba(201,169,110,0.12), rgba(201,169,110,0.04))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative',
                      borderBottom: '1px solid var(--border)',
                    }}>
                      <span style={{ fontSize: 56 }}>
                        {categoryEmojis[s.category] || '📦'}
                      </span>
                      <div style={{
                        position: 'absolute', top: 14, left: 14,
                        background: 'rgba(201,169,110,0.15)',
                        border: '1px solid rgba(201,169,110,0.25)',
                        borderRadius: 100, padding: '3px 10px',
                        fontSize: 11, color: 'var(--primary)', fontWeight: 500,
                      }}>
                        {s.category}
                      </div>
                      {s.totalReviews > 0 && (
                        <div style={{
                          position: 'absolute', top: 14, right: 14,
                          background: 'rgba(10,10,15,0.6)',
                          backdropFilter: 'blur(6px)',
                          borderRadius: 100, padding: '3px 8px',
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          <Star size={10} fill="#f59e0b" color="#f59e0b" />
                          <span style={{ fontSize: 11, color: 'white', fontWeight: 600 }}>
                            {s.rating?.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Infos */}
                    <div style={{ padding: '18px 20px' }}>
                      <h3 style={{
                        fontSize: 17, fontWeight: 700,
                        fontFamily: 'Playfair Display, serif',
                        marginBottom: 6, lineHeight: 1.2,
                      }}>
                        {s.name}
                      </h3>

                      <p style={{
                        fontSize: 13, color: 'var(--muted)',
                        lineHeight: 1.5, marginBottom: 14,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {s.description}
                      </p>

                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        marginBottom: 14,
                        fontSize: 12, color: 'var(--muted)',
                      }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%',
                          background: 'rgba(201,169,110,0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 700, color: 'var(--primary)',
                        }}>
                          {s.provider?.firstName?.[0]?.toUpperCase()}
                        </div>
                        {s.provider?.firstName} {s.provider?.lastName}
                      </div>

                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: 14, borderTop: '1px solid var(--border)',
                      }}>
                        <span style={{
                          fontSize: 22, fontWeight: 900, color: 'var(--primary)',
                          fontFamily: 'Playfair Display, serif',
                        }}>
                          {Number(s.price).toLocaleString('fr-FR')} €
                        </span>
                        <div style={{
                          background: 'rgba(201,169,110,0.1)',
                          border: '1px solid rgba(201,169,110,0.25)',
                          borderRadius: 8, padding: '6px 12px',
                          fontSize: 12, color: 'var(--primary)', fontWeight: 600,
                          display: 'flex', alignItems: 'center', gap: 5,
                        }}>
                          Réserver <ArrowRight size={12} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{
            fontSize: 13, color: 'var(--primary)', letterSpacing: 1,
            fontWeight: 600, marginBottom: 8,
          }}>
            SIMPLE ET RAPIDE
          </p>
          <h2 style={{
            fontSize: 40, fontWeight: 900,
            fontFamily: 'Playfair Display, serif',
          }}>
            Comment ça marche ?
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
          {[
            {
              step: '01', emoji: '🔍',
              title: 'Cherchez et filtrez',
              desc: 'Recherchez des lieux ou services selon votre ville, budget, capacité et type d\'événement.',
            },
            {
              step: '02', emoji: '📅',
              title: 'Réservez en ligne',
              desc: 'Sélectionnez vos dates, ajoutez des services additionnels et payez votre acompte en toute sécurité.',
            },
            {
              step: '03', emoji: '🎉',
              title: 'Vivez l\'événement',
              desc: 'Communiquez avec vos prestataires en temps réel et profitez de votre événement inoubliable.',
            },
          ].map((step, i) => (
            <div key={i} style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 20, padding: '32px 28px',
              textAlign: 'center',
              position: 'relative',
              transition: 'border-color 0.2s, transform 0.2s',
            }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = 'rgba(201,169,110,0.4)';
                el.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = 'var(--border)';
                el.style.transform = 'translateY(0)';
              }}>
              <div style={{
                position: 'absolute', top: 20, right: 20,
                fontSize: 11, fontWeight: 800, color: 'var(--border)',
                letterSpacing: 1,
              }}>
                {step.step}
              </div>
              <div style={{ fontSize: 52, marginBottom: 20 }}>{step.emoji}</div>
              <h3 style={{
                fontSize: 20, fontWeight: 700,
                fontFamily: 'Playfair Display, serif', marginBottom: 12,
              }}>
                {step.title}
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{
        background: 'linear-gradient(135deg, rgba(201,169,110,0.12), rgba(201,169,110,0.04))',
        borderTop: '1px solid var(--border)',
        padding: '80px 24px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 44, fontWeight: 900,
            fontFamily: 'Playfair Display, serif',
            marginBottom: 16,
          }}>
            Prêt à organiser votre événement ?
          </h2>
          <p style={{
            color: 'var(--muted)', fontSize: 18,
            lineHeight: 1.7, marginBottom: 36,
          }}>
            Rejoignez des milliers d'organisateurs qui font confiance à Evently
            pour leurs événements mémorables.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
            <Link href="/auth/register" style={{
              background: 'var(--primary)', color: '#0a0a0f',
              textDecoration: 'none', padding: '16px 32px',
              borderRadius: 12, fontWeight: 700, fontSize: 16,
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'transform 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
              Créer un compte gratuit <ArrowRight size={18} />
            </Link>
            <Link href="/venues" style={{
              background: 'none', color: 'var(--foreground)',
              textDecoration: 'none', padding: '16px 32px',
              borderRadius: 12, fontWeight: 600, fontSize: 16,
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
              Explorer sans compte
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        padding: '32px 24px',
        textAlign: 'center',
      }}>
        <p style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 20, fontWeight: 700,
          color: 'var(--primary)', marginBottom: 8,
        }}>
          Evently
        </p>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          © 2026 Evently — La plateforme événementielle de confiance
        </p>
      </footer>
    </main>
  );
}