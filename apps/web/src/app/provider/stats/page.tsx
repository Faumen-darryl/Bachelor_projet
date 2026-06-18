'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { TrendingUp, Calendar, Star, Users, Loader2, MapPin } from 'lucide-react';

export default function ProviderStatsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reservations/provider'),
      api.get('/venues'),
      api.get('/services/my'),
    ]).then(([r, v, s]) => {
      setReservations(r.data || []);
      setVenues(v.data.data || []);
      setServices(s.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const confirmed = reservations.filter(
    r => r.status === 'CONFIRMEE' || r.status === 'TERMINEE'
  );
  const totalRevenue = confirmed.reduce(
    (acc, r) => acc + Number(r.totalAmount), 0
  );
  const avgRevenue = confirmed.length ? totalRevenue / confirmed.length : 0;
  const cancelRate = reservations.length
    ? Math.round(
        (reservations.filter(r => r.status === 'ANNULEE').length
          / reservations.length) * 100
      )
    : 0;
  const pendingCount = reservations.filter(r => r.status === 'EN_ATTENTE').length;

  // Revenus par mois
  const monthlyData: Record<string, number> = {};
  confirmed.forEach(r => {
    const month = new Date(r.startAt).toLocaleDateString('fr-FR', {
      month: 'short', year: '2-digit',
    });
    monthlyData[month] = (monthlyData[month] || 0) + Number(r.totalAmount);
  });

  const maxRevenue = Math.max(...Object.values(monthlyData), 1);

  // Performance par lieu
  const venueStats = venues.map(v => {
    const vReservations = confirmed.filter(r => r.venueId === v.id);
    return {
      ...v,
      reservationCount: vReservations.length,
      revenue: vReservations.reduce((acc, r) => acc + Number(r.totalAmount), 0),
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const kpis = [
    {
      label: 'Revenus totaux',
      value: `${totalRevenue.toLocaleString('fr-FR')} €`,
      icon: <TrendingUp size={20} />, color: '#4ade80',
      sub: `${confirmed.length} réservation${confirmed.length > 1 ? 's' : ''} confirmée${confirmed.length > 1 ? 's' : ''}`,
    },
    {
      label: 'Revenu moyen',
      value: `${Math.round(avgRevenue).toLocaleString('fr-FR')} €`,
      icon: <Star size={20} />, color: '#c9a96e',
      sub: 'Par réservation confirmée',
    },
    {
      label: 'En attente',
      value: pendingCount,
      icon: <Calendar size={20} />, color: '#f59e0b',
      sub: `${reservations.length} réservation${reservations.length > 1 ? 's' : ''} au total`,
    },
    {
      label: "Taux d'annulation",
      value: `${cancelRate}%`,
      icon: <Users size={20} />, color: '#f87171',
      sub: `${reservations.filter(r => r.status === 'ANNULEE').length} annulation${reservations.filter(r => r.status === 'ANNULEE').length > 1 ? 's' : ''}`,
    },
  ];

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', height: '60vh', gap: 16,
    }}>
      <Loader2 size={28} color="var(--primary)"
        style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{
          fontSize: 32, fontWeight: 900,
          fontFamily: 'Playfair Display, serif', marginBottom: 8,
        }}>
          Statistiques
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          Aperçu complet de vos performances sur Evently
        </p>
      </div>

      {/* KPIs */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16, marginBottom: 32,
      }}>
        {kpis.map((k, i) => (
          <div key={i} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: 24,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: `${k.color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: k.color, marginBottom: 16,
            }}>
              {k.icon}
            </div>
            <p style={{
              fontSize: 28, fontWeight: 900,
              fontFamily: 'Playfair Display, serif', color: k.color,
              marginBottom: 4,
            }}>
              {k.value}
            </p>
            <p style={{ fontSize: 13, color: 'var(--foreground)', fontWeight: 600 }}>
              {k.label}
            </p>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
              {k.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Graphique revenus par mois */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 28, marginBottom: 24,
      }}>
        <h2 style={{
          fontSize: 18, fontWeight: 700,
          fontFamily: 'Playfair Display, serif', marginBottom: 24,
        }}>
          Revenus par mois
        </h2>

        {Object.keys(monthlyData).length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px 0',
            color: 'var(--muted)', fontSize: 14,
          }}>
            <TrendingUp size={40} color="var(--muted)"
              style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
            Pas encore de données de revenus.
            Les revenus apparaîtront ici après vos premières réservations confirmées.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <div style={{
              display: 'flex', alignItems: 'flex-end',
              gap: 12, height: 200, minWidth: 400,
            }}>
              {Object.entries(monthlyData).map(([month, revenue]) => (
                <div key={month} style={{
                  flex: 1, display: 'flex',
                  flexDirection: 'column', alignItems: 'center', gap: 8,
                  minWidth: 60,
                }}>
                  <span style={{
                    fontSize: 11, color: 'var(--primary)',
                    fontWeight: 600, textAlign: 'center',
                  }}>
                    {revenue.toLocaleString('fr-FR')} €
                  </span>
                  <div style={{
                    width: '100%', borderRadius: '6px 6px 0 0',
                    background: 'linear-gradient(to top, var(--primary), rgba(201,169,110,0.4))',
                    height: `${(revenue / maxRevenue) * 150}px`,
                    minHeight: 4, transition: 'height 0.5s ease',
                  }} />
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{month}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Résumé par statut */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24,
        marginBottom: 24,
      }}>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 24,
        }}>
          <h2 style={{
            fontSize: 18, fontWeight: 700,
            fontFamily: 'Playfair Display, serif', marginBottom: 20,
          }}>
            Répartition par statut
          </h2>
          {reservations.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
              Aucune réservation pour l'instant
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { key: 'EN_ATTENTE', label: 'En attente', color: '#f59e0b' },
                { key: 'CONFIRMEE', label: 'Confirmée', color: '#4ade80' },
                { key: 'ANNULEE', label: 'Annulée', color: '#f87171' },
                { key: 'TERMINEE', label: 'Terminée', color: 'var(--muted)' },
              ].map(s => {
                const count = reservations.filter(r => r.status === s.key).length;
                const pct = reservations.length
                  ? Math.round((count / reservations.length) * 100) : 0;
                return (
                  <div key={s.key}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      marginBottom: 6,
                    }}>
                      <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                        {s.label}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: s.color }}>
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div style={{
                      height: 6, background: 'var(--surface-2)',
                      borderRadius: 3,
                    }}>
                      <div style={{
                        height: '100%', borderRadius: 3,
                        background: s.color,
                        width: `${pct}%`,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Performance par lieu */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 24,
        }}>
          <h2 style={{
            fontSize: 18, fontWeight: 700,
            fontFamily: 'Playfair Display, serif', marginBottom: 20,
          }}>
            Performance par lieu
          </h2>
          {venueStats.length === 0 ? (
            <p style={{
              color: 'var(--muted)', fontSize: 13,
              textAlign: 'center', padding: '24px 0',
            }}>
              Aucun lieu publié
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {venueStats.map(v => (
                <div key={v.id} style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', padding: '12px 16px',
                  background: 'var(--surface-2)', borderRadius: 10,
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <MapPin size={14} color="var(--primary)" />
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
                        {v.name}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {v.reservationCount} réservation{v.reservationCount > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <span style={{
                    fontSize: 16, fontWeight: 700, color: 'var(--primary)',
                    fontFamily: 'Playfair Display, serif',
                  }}>
                    {v.revenue.toLocaleString('fr-FR')} €
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Services stats */}
      {services.length > 0 && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 24,
        }}>
          <h2 style={{
            fontSize: 18, fontWeight: 700,
            fontFamily: 'Playfair Display, serif', marginBottom: 20,
          }}>
            Mes services publiés
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 12,
          }}>
            {services.map(s => (
              <div key={s.id} style={{
                padding: '14px 16px',
                background: 'var(--surface-2)', borderRadius: 10,
                border: '1px solid var(--border)',
              }}>
                <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                  {s.name}
                </p>
                <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>
                  {s.category}
                </p>
                <p style={{
                  fontSize: 16, fontWeight: 700, color: 'var(--primary)',
                  fontFamily: 'Playfair Display, serif',
                }}>
                  {Number(s.price).toLocaleString('fr-FR')} €
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}