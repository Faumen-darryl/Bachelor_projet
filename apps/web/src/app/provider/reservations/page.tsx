'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Calendar, Users, CheckCircle, XCircle,
  Loader2, MapPin, Clock, MessageSquare, Briefcase
} from 'lucide-react';
import Link from 'next/link';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  EN_ATTENTE: { label: 'En attente', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  CONFIRMEE: { label: 'Confirmée', color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
  ANNULEE: { label: 'Annulée', color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  TERMINEE: { label: 'Terminée', color: 'var(--muted)', bg: 'var(--surface-2)' },
};

const categoryEmojis: Record<string, string> = {
  DJ: '🎵', Traiteur: '🍽️', Photographe: '📸',
  Décorateur: '🎨', Animateur: '🎤', Vidéaste: '🎬',
  Fleuriste: '💐', Sécurité: '🛡️', Transport: '🚌', Autre: '📦',
};

export default function ProviderReservationsPage() {
  const [venueReservations, setVenueReservations] = useState<any[]>([]);
  const [serviceReservations, setServiceReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'venues' | 'services'>('venues');
  const [messaging, setMessaging] = useState<number | null>(null);
  const [msgContent, setMsgContent] = useState<Record<number, string>>({});
  const [msgSent, setMsgSent] = useState<number[]>([]);

  useEffect(() => {
    Promise.all([
      api.get('/reservations/provider'),
      api.get('/service-bookings/provider'),
    ]).then(([v, s]) => {
      setVenueReservations(v.data || []);
      setServiceReservations(s.data || []);
    }).finally(() => setLoading(false));
  }, []);

  // ── Action sur réservation de LIEU ──
  const handleVenueAction = async (
    id: number,
    action: 'CONFIRMEE' | 'ANNULEE',
    reason?: string
  ) => {
    const key = `venue-${id}`;
    setProcessing(key);
    try {
      await api.post(`/reservations/${id}/provider-action`, { action, reason });
      setVenueReservations(prev => prev.map(r =>
        r.id === id ? { ...r, status: action } : r
      ));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur.');
    } finally { setProcessing(null); }
  };

  // ── Action sur réservation de SERVICE ──
  const handleServiceAction = async (
    id: number,
    action: 'CONFIRMEE' | 'ANNULEE',
    reason?: string
  ) => {
    const key = `service-${id}`;
    setProcessing(key);
    try {
      await api.post(`/service-bookings/${id}/action`, { action, reason });
      setServiceReservations(prev => prev.map(r =>
        r.id === id ? { ...r, status: action } : r
      ));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur.');
    } finally { setProcessing(null); }
  };

  const handleRefuseVenue = async (id: number) => {
    const reason = prompt('Motif du refus (optionnel) :');
    if (reason === null) return;
    await handleVenueAction(id, 'ANNULEE', reason);
  };

  const handleRefuseService = async (id: number) => {
    const reason = prompt('Motif du refus (optionnel) :');
    if (reason === null) return;
    await handleServiceAction(id, 'ANNULEE', reason);
  };

  const handleSendMessage = async (id: number, type: 'venue' | 'service') => {
    const content = msgContent[id];
    if (!content?.trim()) return;
    try {
      if (type === 'venue') {
        await api.post('/messages/send', { reservationId: id, content });
      } else {
        await api.post('/service-bookings/messages', { bookingId: id, content });
      }
      setMsgSent(prev => [...prev, id]);
      setMessaging(null);
      setMsgContent(prev => ({ ...prev, [id]: '' }));
      setTimeout(() => setMsgSent(prev => prev.filter(x => x !== id)), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur.');
    }
  };

  const filteredVenues = filter === 'ALL'
    ? venueReservations
    : venueReservations.filter(r => r.status === filter);

  const filteredServices = filter === 'ALL'
    ? serviceReservations
    : serviceReservations.filter(r => r.status === filter);

  const allReservations = [...venueReservations, ...serviceReservations];

  const counts = {
    ALL: allReservations.length,
    EN_ATTENTE: allReservations.filter(r => r.status === 'EN_ATTENTE').length,
    CONFIRMEE: allReservations.filter(r => r.status === 'CONFIRMEE').length,
    ANNULEE: allReservations.filter(r => r.status === 'ANNULEE').length,
  };

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

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: 32, fontWeight: 900,
          fontFamily: 'Playfair Display, serif', marginBottom: 8,
        }}>
          Réservations reçues
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          {venueReservations.length} lieu{venueReservations.length > 1 ? 'x' : ''} ·{' '}
          {serviceReservations.length} service{serviceReservations.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Alerte en attente */}
      {counts.EN_ATTENTE > 0 && (
        <div style={{
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 14, padding: '14px 20px',
          marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <Clock size={18} color="#f59e0b" />
          <p style={{ fontSize: 14, color: '#f59e0b', fontWeight: 600 }}>
            {counts.EN_ATTENTE} réservation{counts.EN_ATTENTE > 1 ? 's' : ''} en attente de votre validation
          </p>
        </div>
      )}

      {/* Filtres statut */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { key: 'ALL', label: 'Toutes' },
          { key: 'EN_ATTENTE', label: 'En attente' },
          { key: 'CONFIRMEE', label: 'Confirmées' },
          { key: 'ANNULEE', label: 'Annulées' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: '7px 16px', borderRadius: 100, cursor: 'pointer',
            border: filter === f.key
              ? '1px solid var(--primary)' : '1px solid var(--border)',
            background: filter === f.key
              ? 'rgba(201,169,110,0.1)' : 'var(--surface)',
            color: filter === f.key ? 'var(--primary)' : 'var(--muted)',
            fontSize: 13, fontWeight: filter === f.key ? 600 : 400,
            fontFamily: 'DM Sans, sans-serif',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {f.label}
            <span style={{
              background: filter === f.key
                ? 'rgba(201,169,110,0.2)' : 'var(--surface-2)',
              padding: '1px 7px', borderRadius: 100,
              fontSize: 11, fontWeight: 700,
            }}>
              {counts[f.key as keyof typeof counts]}
            </span>
          </button>
        ))}
      </div>

      {/* Tabs lieux / services */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 24,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, overflow: 'hidden', width: 'fit-content',
      }}>
        {[
          {
            key: 'venues', label: '🏛️ Lieux',
            count: filteredVenues.length,
            pending: filteredVenues.filter(r => r.status === 'EN_ATTENTE').length,
          },
          {
            key: 'services', label: '🎵 Services',
            count: filteredServices.length,
            pending: filteredServices.filter(r => r.status === 'EN_ATTENTE').length,
          },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)} style={{
            padding: '12px 24px', border: 'none', cursor: 'pointer',
            background: activeTab === t.key
              ? 'rgba(201,169,110,0.1)' : 'transparent',
            borderBottom: activeTab === t.key
              ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === t.key ? 'var(--primary)' : 'var(--muted)',
            fontSize: 14, fontWeight: activeTab === t.key ? 600 : 400,
            fontFamily: 'DM Sans, sans-serif',
            display: 'flex', alignItems: 'center', gap: 8,
            position: 'relative',
          }}>
            {t.label}
            <span style={{
              background: activeTab === t.key
                ? 'rgba(201,169,110,0.2)' : 'var(--surface-2)',
              padding: '1px 8px', borderRadius: 100,
              fontSize: 12, fontWeight: 700,
            }}>
              {t.count}
            </span>
            {/* Pastille rouge si en attente */}
            {t.pending > 0 && (
              <span style={{
                position: 'absolute', top: 6, right: 6,
                width: 16, height: 16, borderRadius: '50%',
                background: '#f59e0b', color: '#0a0a0f',
                fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {t.pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── LIEUX ── */}
      {activeTab === 'venues' && (
        filteredVenues.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 24px',
            background: 'var(--surface)', borderRadius: 16,
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏛️</div>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
              Aucune réservation de lieu
            </p>
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>
              {filter !== 'ALL' ? 'Aucune réservation avec ce statut.' : 'Personne n\'a encore réservé vos lieux.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredVenues.map(r => {
              const status = statusConfig[r.status] || statusConfig.EN_ATTENTE;
              const photo = r.venue?.photos?.[0]?.url;
              const key = `venue-${r.id}`;
              const isMessaging = messaging === r.id;
              const sent = msgSent.includes(r.id);

              return (
                <div key={r.id} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 16, overflow: 'hidden',
                  transition: 'border-color 0.2s',
                  borderLeft: r.status === 'EN_ATTENTE'
                    ? '4px solid #f59e0b' : '1px solid var(--border)',
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.3)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor =
                    r.status === 'EN_ATTENTE' ? '#f59e0b' : 'var(--border)')}>

                  <div style={{ display: 'flex' }}>
                    <div style={{
                      width: 120, flexShrink: 0,
                      background: photo
                        ? `url(${photo}) center/cover`
                        : 'linear-gradient(135deg, var(--surface-2), var(--surface))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {!photo && <span style={{ fontSize: 28, opacity: 0.2 }}>🏛️</span>}
                    </div>

                    <div style={{ flex: 1, padding: '20px 24px' }}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'flex-start', marginBottom: 10,
                      }}>
                        <div>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
                          }}>
                            <span style={{ fontSize: 11, color: 'var(--muted)' }}>#{r.id}</span>
                            <span style={{
                              background: status.bg, color: status.color,
                              padding: '2px 10px', borderRadius: 100,
                              fontSize: 11, fontWeight: 600,
                            }}>
                              {status.label}
                            </span>
                          </div>
                          <h3 style={{
                            fontSize: 17, fontWeight: 700,
                            fontFamily: 'Playfair Display, serif',
                          }}>
                            {r.venue?.name}
                          </h3>
                        </div>
                        <span style={{
                          fontSize: 20, fontWeight: 700, color: 'var(--primary)',
                          fontFamily: 'Playfair Display, serif',
                        }}>
                          {Number(r.totalAmount).toLocaleString('fr-FR')} €
                        </span>
                      </div>

                      {/* Client */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
                      }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: '50%',
                          background: 'rgba(96,165,250,0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, color: '#60a5fa',
                        }}>
                          {r.client?.firstName?.[0]}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>
                          {r.client?.firstName} {r.client?.lastName}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                          {r.client?.email}
                        </span>
                      </div>

                      {/* Dates */}
                      <div style={{
                        display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Calendar size={12} color="var(--muted)" />
                          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                            {new Date(r.startAt).toLocaleDateString('fr-FR', {
                              day: 'numeric', month: 'long', year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Clock size={12} color="var(--muted)" />
                          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                            {new Date(r.startAt).toLocaleTimeString('fr-FR', {
                              hour: '2-digit', minute: '2-digit',
                            })}
                            {' → '}
                            {new Date(r.endAt).toLocaleTimeString('fr-FR', {
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Users size={12} color="var(--muted)" />
                          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                            {r.guestCount} invités
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <MapPin size={12} color="var(--muted)" />
                          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                            {r.venue?.city}
                          </span>
                        </div>
                      </div>

                      {r.notes && (
                        <div style={{
                          background: 'var(--surface-2)',
                          border: '1px solid var(--border)',
                          borderRadius: 8, padding: '8px 12px', marginBottom: 12,
                        }}>
                          <p style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>
                            "{r.notes}"
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setMessaging(isMessaging ? null : r.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: isMessaging
                              ? 'rgba(201,169,110,0.2)' : 'rgba(201,169,110,0.1)',
                            border: '1px solid rgba(201,169,110,0.3)',
                            borderRadius: 10, padding: '8px 14px',
                            cursor: 'pointer', color: 'var(--primary)',
                            fontSize: 13, fontFamily: 'DM Sans, sans-serif',
                          }}>
                          <MessageSquare size={14} />
                          {isMessaging ? 'Fermer' : 'Écrire au client'}
                        </button>

                        {r.status === 'EN_ATTENTE' && (
                          <>
                            <button
                              onClick={() => handleVenueAction(r.id, 'CONFIRMEE')}
                              disabled={processing === key}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                background: 'rgba(74,222,128,0.1)',
                                border: '1px solid rgba(74,222,128,0.3)',
                                borderRadius: 10, padding: '8px 16px',
                                cursor: processing === key ? 'not-allowed' : 'pointer',
                                color: '#4ade80', fontSize: 13, fontWeight: 600,
                                fontFamily: 'DM Sans, sans-serif',
                                opacity: processing === key ? 0.6 : 1,
                              }}>
                              <CheckCircle size={14} />
                              {processing === key ? '...' : 'Accepter'}
                            </button>
                            <button
                              onClick={() => handleRefuseVenue(r.id)}
                              disabled={processing === key}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                background: 'rgba(248,113,113,0.1)',
                                border: '1px solid rgba(248,113,113,0.3)',
                                borderRadius: 10, padding: '8px 16px',
                                cursor: processing === key ? 'not-allowed' : 'pointer',
                                color: '#f87171', fontSize: 13, fontWeight: 600,
                                fontFamily: 'DM Sans, sans-serif',
                                opacity: processing === key ? 0.6 : 1,
                              }}>
                              <XCircle size={14} />
                              Refuser
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Zone message */}
                  {isMessaging && (
                    <div style={{
                      padding: '16px 24px',
                      borderTop: '1px solid var(--border)',
                      background: 'rgba(201,169,110,0.04)',
                    }}>
                      {sent ? (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          color: '#4ade80', fontSize: 13,
                          background: 'rgba(74,222,128,0.1)',
                          border: '1px solid rgba(74,222,128,0.3)',
                          borderRadius: 10, padding: '10px 14px',
                        }}>
                          ✅ Message envoyé à {r.client?.firstName} !
                          <Link href="/provider/messages" style={{
                            color: '#4ade80', marginLeft: 'auto',
                            fontSize: 12, textDecoration: 'underline',
                          }}>
                            Voir la conversation →
                          </Link>
                        </div>
                      ) : (
                        <div>
                          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                            Message à {r.client?.firstName} — {r.venue?.name}
                          </p>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input
                              style={{
                                flex: 1, padding: '10px 14px',
                                background: 'var(--surface)',
                                border: '1px solid var(--border)',
                                borderRadius: 10, color: 'var(--foreground)',
                                fontSize: 13, outline: 'none',
                                fontFamily: 'DM Sans, sans-serif',
                              }}
                              placeholder={`Écrire à ${r.client?.firstName}...`}
                              value={msgContent[r.id] || ''}
                              onChange={e => setMsgContent(prev => ({
                                ...prev, [r.id]: e.target.value,
                              }))}
                              onKeyDown={e => e.key === 'Enter' && handleSendMessage(r.id, 'venue')}
                              autoFocus
                            />
                            <button
                              onClick={() => handleSendMessage(r.id, 'venue')}
                              disabled={!msgContent[r.id]?.trim()}
                              style={{
                                background: 'var(--primary)', color: '#0a0a0f',
                                border: 'none', borderRadius: 10,
                                padding: '10px 20px', cursor: 'pointer',
                                fontSize: 13, fontWeight: 600,
                                fontFamily: 'DM Sans, sans-serif',
                                opacity: !msgContent[r.id]?.trim() ? 0.5 : 1,
                              }}>
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
        )
      )}

      {/* ── SERVICES ── */}
      {activeTab === 'services' && (
        filteredServices.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 24px',
            background: 'var(--surface)', borderRadius: 16,
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎵</div>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
              Aucune réservation de service
            </p>
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>
              {filter !== 'ALL'
                ? 'Aucune réservation avec ce statut.'
                : 'Personne n\'a encore réservé vos services.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredServices.map(b => {
              const status = statusConfig[b.status] || statusConfig.EN_ATTENTE;
              const sKey = `service-${b.id}`;
              const isMessaging = messaging === b.id;
              const sent = msgSent.includes(b.id);

              return (
                <div key={b.id} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 16, overflow: 'hidden',
                  transition: 'border-color 0.2s',
                  borderLeft: b.status === 'EN_ATTENTE'
                    ? '4px solid #f59e0b' : '1px solid var(--border)',
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.3)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor =
                    b.status === 'EN_ATTENTE' ? '#f59e0b' : 'var(--border)')}>

                  <div style={{ display: 'flex' }}>
                    {/* Icône service */}
                    <div style={{
                      width: 120, flexShrink: 0,
                      background: 'linear-gradient(135deg, var(--surface-2), var(--surface))',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 40,
                    }}>
                      {categoryEmojis[b.service?.category] || '📦'}
                    </div>

                    <div style={{ flex: 1, padding: '20px 24px' }}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'flex-start', marginBottom: 10,
                      }}>
                        <div>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
                          }}>
                            <span style={{ fontSize: 11, color: 'var(--muted)' }}>#{b.id}</span>
                            <span style={{
                              background: 'rgba(201,169,110,0.1)',
                              border: '1px solid rgba(201,169,110,0.2)',
                              borderRadius: 100, padding: '2px 8px',
                              fontSize: 10, color: 'var(--primary)', fontWeight: 500,
                            }}>
                              {b.service?.category}
                            </span>
                            <span style={{
                              background: status.bg, color: status.color,
                              padding: '2px 10px', borderRadius: 100,
                              fontSize: 11, fontWeight: 600,
                            }}>
                              {status.label}
                            </span>
                          </div>
                          <h3 style={{
                            fontSize: 17, fontWeight: 700,
                            fontFamily: 'Playfair Display, serif',
                          }}>
                            {b.service?.name}
                          </h3>
                        </div>
                        <span style={{
                          fontSize: 20, fontWeight: 700, color: 'var(--primary)',
                          fontFamily: 'Playfair Display, serif',
                        }}>
                          {Number(b.totalAmount).toLocaleString('fr-FR')} €
                        </span>
                      </div>

                      {/* Client */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
                      }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: '50%',
                          background: 'rgba(96,165,250,0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, color: '#60a5fa',
                        }}>
                          {b.client?.firstName?.[0]}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>
                          {b.client?.firstName} {b.client?.lastName}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                          {b.client?.email}
                        </span>
                      </div>

                      {/* Dates */}
                      <div style={{
                        display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Calendar size={12} color="var(--muted)" />
                          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                            {new Date(b.eventDate).toLocaleDateString('fr-FR', {
                              day: 'numeric', month: 'long', year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Clock size={12} color="var(--muted)" />
                          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                            {new Date(b.eventDate).toLocaleTimeString('fr-FR', {
                              hour: '2-digit', minute: '2-digit',
                            })}
                            {' → '}
                            {new Date(b.eventEndDate).toLocaleTimeString('fr-FR', {
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Users size={12} color="var(--muted)" />
                          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                            {b.guestCount} personne{b.guestCount > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {b.notes && (
                        <div style={{
                          background: 'var(--surface-2)',
                          border: '1px solid var(--border)',
                          borderRadius: 8, padding: '8px 12px', marginBottom: 12,
                        }}>
                          <p style={{
                            fontSize: 12, color: 'var(--muted)', fontStyle: 'italic',
                          }}>
                            "{b.notes}"
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setMessaging(isMessaging ? null : b.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: isMessaging
                              ? 'rgba(201,169,110,0.2)' : 'rgba(201,169,110,0.1)',
                            border: '1px solid rgba(201,169,110,0.3)',
                            borderRadius: 10, padding: '8px 14px',
                            cursor: 'pointer', color: 'var(--primary)',
                            fontSize: 13, fontFamily: 'DM Sans, sans-serif',
                          }}>
                          <MessageSquare size={14} />
                          {isMessaging ? 'Fermer' : 'Écrire au client'}
                        </button>

                        {b.status === 'EN_ATTENTE' && (
                          <>
                            <button
                              onClick={() => handleServiceAction(b.id, 'CONFIRMEE')}
                              disabled={processing === sKey}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                background: 'rgba(74,222,128,0.1)',
                                border: '1px solid rgba(74,222,128,0.3)',
                                borderRadius: 10, padding: '8px 16px',
                                cursor: processing === sKey ? 'not-allowed' : 'pointer',
                                color: '#4ade80', fontSize: 13, fontWeight: 600,
                                fontFamily: 'DM Sans, sans-serif',
                                opacity: processing === sKey ? 0.6 : 1,
                              }}>
                              <CheckCircle size={14} />
                              {processing === sKey ? '...' : 'Accepter le service'}
                            </button>
                            <button
                              onClick={() => handleRefuseService(b.id)}
                              disabled={processing === sKey}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                background: 'rgba(248,113,113,0.1)',
                                border: '1px solid rgba(248,113,113,0.3)',
                                borderRadius: 10, padding: '8px 16px',
                                cursor: processing === sKey ? 'not-allowed' : 'pointer',
                                color: '#f87171', fontSize: 13, fontWeight: 600,
                                fontFamily: 'DM Sans, sans-serif',
                                opacity: processing === sKey ? 0.6 : 1,
                              }}>
                              <XCircle size={14} />
                              Refuser
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Zone message */}
                  {isMessaging && (
                    <div style={{
                      padding: '16px 24px',
                      borderTop: '1px solid var(--border)',
                      background: 'rgba(201,169,110,0.04)',
                    }}>
                      {sent ? (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          color: '#4ade80', fontSize: 13,
                          background: 'rgba(74,222,128,0.1)',
                          border: '1px solid rgba(74,222,128,0.3)',
                          borderRadius: 10, padding: '10px 14px',
                        }}>
                          ✅ Message envoyé à {b.client?.firstName} !
                          <Link href="/provider/messages" style={{
                            color: '#4ade80', marginLeft: 'auto',
                            fontSize: 12, textDecoration: 'underline',
                          }}>
                            Voir la conversation →
                          </Link>
                        </div>
                      ) : (
                        <div>
                          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                            Message à {b.client?.firstName} — {b.service?.name}
                          </p>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input
                              style={{
                                flex: 1, padding: '10px 14px',
                                background: 'var(--surface)',
                                border: '1px solid var(--border)',
                                borderRadius: 10, color: 'var(--foreground)',
                                fontSize: 13, outline: 'none',
                                fontFamily: 'DM Sans, sans-serif',
                              }}
                              placeholder={`Écrire à ${b.client?.firstName}...`}
                              value={msgContent[b.id] || ''}
                              onChange={e => setMsgContent(prev => ({
                                ...prev, [b.id]: e.target.value,
                              }))}
                              onKeyDown={e => e.key === 'Enter' && handleSendMessage(b.id, 'service')}
                              autoFocus
                            />
                            <button
                              onClick={() => handleSendMessage(b.id, 'service')}
                              disabled={!msgContent[b.id]?.trim()}
                              style={{
                                background: 'var(--primary)', color: '#0a0a0f',
                                border: 'none', borderRadius: 10,
                                padding: '10px 20px', cursor: 'pointer',
                                fontSize: 13, fontWeight: 600,
                                fontFamily: 'DM Sans, sans-serif',
                                opacity: !msgContent[b.id]?.trim() ? 0.5 : 1,
                              }}>
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
        )
      )}
    </div>
  );
}