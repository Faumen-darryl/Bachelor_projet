'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Users, MapPin, Calendar, TrendingUp,
  Loader2, ArrowRight, Clock, Shield,
  CheckCircle, Briefcase, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [pendingKycUsers, setPendingKycUsers] = useState<any[]>([]);
  const [recentReservations, setRecentReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/users'),
      api.get('/admin/reservations'),
    ]).then(([s, u, r]) => {
      setStats(s.data);
      setPendingKycUsers(
        (u.data || []).filter((user: any) =>
          user.role === 'PRESTATAIRE' && user.kycStatus === 'EN_ATTENTE'
        )
      );
      setRecentReservations((r.data || []).slice(0, 5));
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', height: '60vh', gap: 16,
    }}>
      <Loader2 size={28} color="var(--primary)"
        style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );

  const kpiCards = [
    {
      label: 'Utilisateurs', value: stats?.totalUsers || 0,
      icon: <Users size={20} />, color: '#60a5fa', href: '/admin/users',
      sub: `${stats?.usersByRole?.PRESTATAIRE || 0} prestataires`,
    },
    {
      label: 'Lieux publiés', value: stats?.totalVenues || 0,
      icon: <MapPin size={20} />, color: '#c9a96e', href: '/admin/venues',
      sub: `${stats?.totalServices || 0} services`,
    },
    {
      label: 'Réservations', value: stats?.totalReservations || 0,
      icon: <Calendar size={20} />, color: '#4ade80', href: '/admin/reservations',
      sub: 'Lieux + services',
    },
    {
      label: 'Revenus totaux',
      value: `${Number(stats?.totalRevenue || 0).toLocaleString('fr-FR')} €`,
      icon: <TrendingUp size={20} />, color: '#f59e0b', href: '/admin',
      sub: 'Paiements confirmés',
    },
  ];

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    EN_ATTENTE: { label: 'En attente', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    CONFIRMEE: { label: 'Confirmée', color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
    ANNULEE: { label: 'Annulée', color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
    TERMINEE: { label: 'Terminée', color: 'var(--muted)', bg: 'var(--surface-2)' },
  };

  return (
    <div>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{
          fontSize: 32, fontWeight: 900,
          fontFamily: 'Playfair Display, serif', marginBottom: 8,
        }}>
          Back-office Evently
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          Tableau de bord de supervision de la plateforme
        </p>
      </div>

      {/* Alerte KYC en attente */}
      {pendingKycUsers.length > 0 && (
        <div style={{
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 14, padding: '16px 20px', marginBottom: 28,
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(245,158,11,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield size={18} color="#f59e0b" />
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: 14, color: '#f59e0b' }}>
                {pendingKycUsers.length} prestataire{pendingKycUsers.length > 1 ? 's' : ''} en attente de validation KYC
              </p>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                SIRET et informations d'entreprise à vérifier
              </p>
            </div>
          </div>
          <Link href="/admin/users?filter=kyc" style={{
            background: '#f59e0b', color: '#0a0a0f',
            textDecoration: 'none', padding: '8px 16px',
            borderRadius: 8, fontSize: 13, fontWeight: 600,
            whiteSpace: 'nowrap',
          }}>
            Valider les comptes
          </Link>
        </div>
      )}

      {/* KPIs */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16, marginBottom: 32,
      }}>
        {kpiCards.map((k, i) => (
          <Link key={i} href={k.href} style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 16, padding: 24, cursor: 'pointer',
              transition: 'border-color 0.2s, transform 0.2s',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = k.color;
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
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
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                {k.sub}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* Répartition utilisateurs */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 24,
        }}>
          <h2 style={{
            fontSize: 18, fontWeight: 700,
            fontFamily: 'Playfair Display, serif', marginBottom: 20,
          }}>
            Répartition des utilisateurs
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { role: 'CLIENT', color: '#60a5fa', label: 'Clients' },
              { role: 'PRESTATAIRE', color: '#c9a96e', label: 'Prestataires' },
              { role: 'ADMIN', color: '#f59e0b', label: 'Administrateurs' },
              { role: 'SUPPORT', color: '#a78bfa', label: 'Support' },
            ].map(r => {
              const count = stats?.usersByRole?.[r.role] || 0;
              const total = stats?.totalUsers || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={r.role}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', marginBottom: 6,
                  }}>
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                      {r.label}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: r.color }}>
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div style={{
                    height: 6, background: 'var(--surface-2)', borderRadius: 3,
                  }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      background: r.color, width: `${pct}%`,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activité récente */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 24,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 20,
          }}>
            <h2 style={{
              fontSize: 18, fontWeight: 700,
              fontFamily: 'Playfair Display, serif',
            }}>
              Dernières réservations
            </h2>
            <Link href="/admin/reservations" style={{
              fontSize: 12, color: '#f59e0b', textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              Voir tout <ArrowRight size={12} />
            </Link>
          </div>
          {recentReservations.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
              Aucune réservation récente
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentReservations.map(r => {
                const status = statusConfig[r.status] || statusConfig.EN_ATTENTE;
                return (
                  <div key={r.id} style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', padding: '10px 14px',
                    background: 'var(--surface-2)',
                    borderRadius: 10, border: '1px solid var(--border)',
                  }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                        {r.venue?.name}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {r.client?.firstName} {r.client?.lastName} ·{' '}
                        {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        background: status.bg, color: status.color,
                        padding: '2px 8px', borderRadius: 100,
                        fontSize: 10, fontWeight: 600,
                      }}>
                        {status.label}
                      </span>
                      <span style={{
                        fontSize: 14, color: 'var(--primary)', fontWeight: 700,
                        fontFamily: 'Playfair Display, serif',
                      }}>
                        {Number(r.totalAmount).toLocaleString('fr-FR')} €
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Statut réservations */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 24,
        }}>
          <h2 style={{
            fontSize: 18, fontWeight: 700,
            fontFamily: 'Playfair Display, serif', marginBottom: 20,
          }}>
            Répartition des réservations
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { key: 'EN_ATTENTE', label: 'En attente', color: '#f59e0b' },
              { key: 'CONFIRMEE', label: 'Confirmée', color: '#4ade80' },
              { key: 'ANNULEE', label: 'Annulée', color: '#f87171' },
              { key: 'TERMINEE', label: 'Terminée', color: 'var(--muted)' },
            ].map(s => {
              const count = stats?.reservationsByStatus?.[s.key] || 0;
              const total = stats?.totalReservations || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={s.key}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', marginBottom: 6,
                  }}>
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>{s.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: s.color }}>
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div style={{
                    height: 6, background: 'var(--surface-2)', borderRadius: 3,
                  }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      background: s.color, width: `${pct}%`,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions rapides */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 24,
        }}>
          <h2 style={{
            fontSize: 18, fontWeight: 700,
            fontFamily: 'Playfair Display, serif', marginBottom: 20,
          }}>
            Actions rapides
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              {
                href: '/admin/users?filter=kyc',
                icon: <Shield size={16} />,
                label: 'Valider les KYC prestataires',
                count: pendingKycUsers.length,
                color: '#f59e0b',
                bg: 'rgba(245,158,11,0.1)',
                border: 'rgba(245,158,11,0.3)',
              },
              {
                href: '/admin/users',
                icon: <Users size={16} />,
                label: 'Gérer les utilisateurs',
                count: stats?.totalUsers || 0,
                color: '#60a5fa',
                bg: 'rgba(96,165,250,0.1)',
                border: 'rgba(96,165,250,0.3)',
              },
              {
                href: '/admin/venues',
                icon: <MapPin size={16} />,
                label: 'Modérer les lieux',
                count: stats?.totalVenues || 0,
                color: '#c9a96e',
                bg: 'rgba(201,169,110,0.1)',
                border: 'rgba(201,169,110,0.3)',
              },
              {
                href: '/admin/reservations',
                icon: <Calendar size={16} />,
                label: 'Voir toutes les réservations',
                count: stats?.totalReservations || 0,
                color: '#4ade80',
                bg: 'rgba(74,222,128,0.1)',
                border: 'rgba(74,222,128,0.3)',
              },
              {
                href: '/admin/moderation',
                icon: <AlertTriangle size={16} />,
                label: 'Modération et signalements',
                count: 0,
                color: '#f87171',
                bg: 'rgba(248,113,113,0.1)',
                border: 'rgba(248,113,113,0.3)',
              },
            ].map((action, i) => (
              <Link key={i} href={action.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px', borderRadius: 10,
                  background: action.bg,
                  border: `1px solid ${action.border}`,
                  transition: 'transform 0.2s',
                  cursor: 'pointer',
                }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateX(4px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'translateX(0)')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: action.color }}>{action.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: action.color }}>
                      {action.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {action.count > 0 && (
                      <span style={{
                        background: action.color, color: '#0a0a0f',
                        borderRadius: 100, padding: '1px 8px',
                        fontSize: 11, fontWeight: 700,
                      }}>
                        {action.count}
                      </span>
                    )}
                    <ArrowRight size={14} color={action.color} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}