'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import {
  MapPin, Users, Star, Shield,
  ChevronLeft, ArrowRight, Loader2, CheckCircle
} from 'lucide-react';

const typeLabels: Record<string, string> = {
  SALLE: 'Salle', JARDIN: 'Jardin', RESTAURANT: 'Restaurant',
  BOITE_DE_NUIT: 'Boîte de nuit', PARC: 'Parc',
  ESPACE_PUBLIC: 'Espace public', AUTRE: 'Autre',
};

export default function VenueDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const [venue, setVenue] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [booking, setBooking] = useState({
    startAt: '',
    endAt: '',
    guestCount: '',
    notes: '',
  });
  const [total, setTotal] = useState(0);
  const [hours, setHours] = useState(0);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get(`/venues/${id}`);
        setVenue(data);
        const srvRes = await api.get('/services');
        setServices(srvRes.data.data || []);
      } catch {
        router.push('/venues');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (!venue || !booking.startAt || !booking.endAt) {
      setTotal(0); setHours(0); return;
    }
    const start = new Date(booking.startAt);
    const end = new Date(booking.endAt);
    if (end <= start) { setTotal(0); setHours(0); return; }

    const h = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    let amount = Number(venue.pricePerHour) * h;
    selectedServices.forEach(sid => {
      const s = services.find(s => s.id === sid);
      if (s) amount += Number(s.price);
    });
    setHours(h);
    setTotal(amount);
  }, [booking, selectedServices, venue, services]);

  const toggleService = (sid: number) => {
    setSelectedServices(prev =>
      prev.includes(sid) ? prev.filter(s => s !== sid) : [...prev, sid]
    );
  };

  const handleBooking = async () => {
    if (!isAuthenticated()) { router.push('/auth/login'); return; }
    if (user?.role !== 'CLIENT') {
      setError('Seuls les clients peuvent effectuer une réservation.'); return;
    }
    if (!booking.startAt || !booking.endAt) {
      setError('Veuillez sélectionner les dates et heures.'); return;
    }
    const start = new Date(booking.startAt);
    const end = new Date(booking.endAt);
    if (end <= start) {
      setError('L\'heure de fin doit être après l\'heure de début.'); return;
    }
    const guests = Number(booking.guestCount);
    if (!guests || guests < 1) {
      setError('Veuillez indiquer le nombre d\'invités.'); return;
    }
    if (guests > venue.capacity) {
      setError(`Ce lieu accueille au maximum ${venue.capacity} personnes.`); return;
    }

    setBookingLoading(true); setError(''); setSuccess('');
    try {
      await api.post('/reservations', {
        venueId: Number(id),
        startAt: booking.startAt,
        endAt: booking.endAt,
        guestCount: guests,
        serviceIds: selectedServices,
        notes: booking.notes,
      });
      setSuccess('Réservation créée avec succès ! Consultez votre espace client.');
      setBooking({ startAt: '', endAt: '', guestCount: '', notes: '' });
      setSelectedServices([]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Une erreur est survenue.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return (
    <main style={{
      minHeight: '100vh', background: 'var(--background)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Navbar />
      <Loader2 size={40} color="var(--primary)"
        style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </main>
  );

  if (!venue) return null;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: 10, color: 'var(--foreground)',
    fontSize: 14, outline: 'none',
    fontFamily: 'DM Sans, sans-serif',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  };

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Navbar />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '96px 24px 80px' }}>

        {/* Retour */}
        <button onClick={() => router.back()} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--muted)', fontSize: 14, marginBottom: 32,
          fontFamily: 'DM Sans, sans-serif',
        }}>
          <ChevronLeft size={16} /> Retour aux lieux
        </button>

        <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start' }}>

          {/* LEFT */}
          <div style={{ flex: 1 }}>

            {/* Galerie */}
            <div style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 32 }}>
              <div style={{
                height: 420,
                background: venue.photos?.[activePhoto]?.url
                  ? `url(${venue.photos[activePhoto].url}) center/cover no-repeat`
                  : 'linear-gradient(135deg, var(--surface-2), var(--surface))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {!venue.photos?.[activePhoto]?.url && (
                  <span style={{ fontSize: 64, opacity: 0.2 }}>🏛️</span>
                )}
              </div>
              {venue.photos?.length > 1 && (
                <div style={{
                  display: 'flex', gap: 8, padding: 12,
                  background: 'var(--surface)',
                  borderTop: '1px solid var(--border)',
                }}>
                  {venue.photos.map((p: any, i: number) => (
                    <div key={i} onClick={() => setActivePhoto(i)} style={{
                      width: 64, height: 48, borderRadius: 8, flexShrink: 0,
                      background: `url(${p.url}) center/cover`,
                      cursor: 'pointer',
                      border: activePhoto === i
                        ? '2px solid var(--primary)' : '2px solid transparent',
                      transition: 'border-color 0.2s',
                    }} />
                  ))}
                </div>
              )}
            </div>

            {/* Titre */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{
                  background: 'rgba(201,169,110,0.1)',
                  border: '1px solid var(--border)',
                  borderRadius: 100, padding: '3px 12px',
                  fontSize: 11, color: 'var(--primary)', letterSpacing: 0.5,
                }}>
                  {typeLabels[venue.type] || venue.type}
                </span>
                {venue.hasActivity && (
                  <span style={{
                    background: 'rgba(34,197,94,0.1)',
                    border: '1px solid rgba(34,197,94,0.3)',
                    borderRadius: 100, padding: '3px 12px',
                    fontSize: 11, color: '#4ade80',
                  }}>
                    Activités incluses
                  </span>
                )}
              </div>
              <h1 style={{
                fontSize: 36, fontWeight: 900, marginBottom: 12,
                fontFamily: 'Playfair Display, serif', lineHeight: 1.1,
              }}>
                {venue.name}
              </h1>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={14} color="var(--muted)" />
                  <span style={{ fontSize: 14, color: 'var(--muted)' }}>
                    {venue.address}, {venue.city}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={14} color="var(--muted)" />
                  <span style={{ fontSize: 14, color: 'var(--muted)' }}>
                    Jusqu'à {venue.capacity} personnes
                  </span>
                </div>
                {venue.totalReviews > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Star size={14} fill="var(--primary)" color="var(--primary)" />
                    <span style={{ fontSize: 14, color: 'var(--muted)' }}>
                      {venue.rating?.toFixed(1)} ({venue.totalReviews} avis)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 16, padding: 24, marginBottom: 20,
            }}>
              <h2 style={{
                fontSize: 18, fontWeight: 700, marginBottom: 12,
                fontFamily: 'Playfair Display, serif',
              }}>Description</h2>
              <p style={{ color: 'var(--muted)', lineHeight: 1.8, fontSize: 14 }}>
                {venue.description}
              </p>
            </div>

            {/* Équipements */}
            {venue.equipments && (
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 16, padding: 24, marginBottom: 20,
              }}>
                <h2 style={{
                  fontSize: 18, fontWeight: 700, marginBottom: 12,
                  fontFamily: 'Playfair Display, serif',
                }}>Équipements</h2>
                <p style={{ color: 'var(--muted)', lineHeight: 1.8, fontSize: 14 }}>
                  {venue.equipments}
                </p>
              </div>
            )}

            {/* Règles */}
            {venue.rules && (
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 16, padding: 24, marginBottom: 20,
              }}>
                <h2 style={{
                  fontSize: 18, fontWeight: 700, marginBottom: 12,
                  fontFamily: 'Playfair Display, serif',
                }}>Règles du lieu</h2>
                <p style={{ color: 'var(--muted)', lineHeight: 1.8, fontSize: 14 }}>
                  {venue.rules}
                </p>
              </div>
            )}

            {/* Prestataire */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 16, padding: 24,
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'rgba(201,169,110,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 700, color: 'var(--primary)',
                fontFamily: 'Playfair Display, serif',
              }}>
                {venue.owner?.firstName?.[0]}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 2 }}>Géré par</p>
                <p style={{ fontWeight: 600, fontSize: 15 }}>
                  {venue.owner?.firstName} {venue.owner?.lastName}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Shield size={14} color="#4ade80" />
                <span style={{ fontSize: 12, color: '#4ade80' }}>Vérifié</span>
              </div>
            </div>
          </div>

          {/* RIGHT — Panneau réservation */}
          <div style={{ width: 380, flexShrink: 0, position: 'sticky', top: 88 }}>
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 20, overflow: 'hidden',
              boxShadow: '0 0 60px rgba(201,169,110,0.08)',
            }}>

              {/* En-tête prix */}
              <div style={{
                padding: '24px 24px 20px',
                borderBottom: '1px solid var(--border)',
                background: 'linear-gradient(135deg, rgba(201,169,110,0.06), transparent)',
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{
                    fontSize: 36, fontWeight: 900, color: 'var(--primary)',
                    fontFamily: 'Playfair Display, serif',
                  }}>
                    {Number(venue.pricePerHour).toLocaleString('fr-FR')} €
                  </span>
                  <span style={{ color: 'var(--muted)', fontSize: 14 }}>/ heure</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                  Capacité maximale : {venue.capacity} personnes
                </p>
              </div>

              <div style={{ padding: '20px 24px' }}>

                {/* Erreur */}
                {error && (
                  <div style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 10, padding: '10px 14px', marginBottom: 16,
                    color: '#f87171', fontSize: 13,
                  }}>
                    {error}
                  </div>
                )}

                {/* Succès */}
                {success && (
                  <div style={{
                    background: 'rgba(74,222,128,0.1)',
                    border: '1px solid rgba(74,222,128,0.3)',
                    borderRadius: 10, padding: '12px 14px', marginBottom: 16,
                    color: '#4ade80', fontSize: 13,
                    display: 'flex', flexDirection: 'column', gap: 8,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle size={16} />
                      <span style={{ fontWeight: 600 }}>Réservation créée !</span>
                    </div>
                    <button
                      onClick={() => router.push('/dashboard')}
                      style={{
                        background: 'rgba(74,222,128,0.2)',
                        border: '1px solid rgba(74,222,128,0.4)',
                        borderRadius: 8, padding: '7px 12px',
                        cursor: 'pointer', color: '#4ade80',
                        fontSize: 12, fontWeight: 600,
                        fontFamily: 'DM Sans, sans-serif',
                      }}>
                      Voir mes réservations →
                    </button>
                  </div>
                )}

                {!success && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                    {/* Section dates */}
                    <div>
                      <p style={{
                        fontSize: 12, fontWeight: 700, color: 'var(--foreground)',
                        marginBottom: 10, letterSpacing: 0.5,
                        textTransform: 'uppercase',
                      }}>
                        📅 Date et horaires
                      </p>
                      <div style={{
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        borderRadius: 12, overflow: 'hidden',
                      }}>
                        <div style={{
                          padding: '12px 14px',
                          borderBottom: '1px solid var(--border)',
                        }}>
                          <label style={{
                            fontSize: 10, color: 'var(--muted)',
                            display: 'block', marginBottom: 4,
                            letterSpacing: 0.5, textTransform: 'uppercase',
                          }}>
                            Début
                          </label>
                          <input
                            type="datetime-local"
                            style={{
                              background: 'none', border: 'none', outline: 'none',
                              color: 'var(--foreground)', fontSize: 14,
                              fontFamily: 'DM Sans, sans-serif',
                              width: '100%', cursor: 'pointer',
                            }}
                            value={booking.startAt}
                            onChange={e => setBooking({ ...booking, startAt: e.target.value })}
                            min={new Date().toISOString().slice(0, 16)}
                          />
                        </div>
                        <div style={{ padding: '12px 14px' }}>
                          <label style={{
                            fontSize: 10, color: 'var(--muted)',
                            display: 'block', marginBottom: 4,
                            letterSpacing: 0.5, textTransform: 'uppercase',
                          }}>
                            Fin
                          </label>
                          <input
                            type="datetime-local"
                            style={{
                              background: 'none', border: 'none', outline: 'none',
                              color: 'var(--foreground)', fontSize: 14,
                              fontFamily: 'DM Sans, sans-serif',
                              width: '100%', cursor: 'pointer',
                            }}
                            value={booking.endAt}
                            onChange={e => setBooking({ ...booking, endAt: e.target.value })}
                            min={booking.startAt || new Date().toISOString().slice(0, 16)}
                          />
                        </div>
                      </div>
                      {hours > 0 && (
                        <p style={{
                          fontSize: 12, color: 'var(--primary)',
                          marginTop: 6, fontWeight: 500,
                        }}>
                          ⏱ Durée : {hours} heure{hours > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>

                    {/* Nombre d'invités — saisie directe */}
                    <div>
                      <p style={{
                        fontSize: 12, fontWeight: 700, color: 'var(--foreground)',
                        marginBottom: 10, letterSpacing: 0.5,
                        textTransform: 'uppercase',
                      }}>
                        👥 Nombre d'invités
                      </p>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          min="1"
                          max={venue.capacity}
                          style={{
                            ...inputStyle,
                            paddingRight: 80,
                          }}
                          placeholder={`1 — ${venue.capacity}`}
                          value={booking.guestCount}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === '' || (Number(val) >= 1 && Number(val) <= venue.capacity)) {
                              setBooking({ ...booking, guestCount: val });
                            }
                          }}
                          onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                        />
                        <span style={{
                          position: 'absolute', right: 14, top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: 12, color: 'var(--muted)',
                        }}>
                          / {venue.capacity} max
                        </span>
                      </div>
                      {booking.guestCount && Number(booking.guestCount) > venue.capacity && (
                        <p style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>
                          Capacité maximale dépassée
                        </p>
                      )}
                    </div>

                    {/* Notes */}
                    <div>
                      <p style={{
                        fontSize: 12, fontWeight: 700, color: 'var(--foreground)',
                        marginBottom: 10, letterSpacing: 0.5,
                        textTransform: 'uppercase',
                      }}>
                        📝 Notes (optionnel)
                      </p>
                      <textarea
                        style={{ ...inputStyle, resize: 'none', height: 72 }}
                        placeholder="Précisions sur votre événement..."
                        value={booking.notes}
                        onChange={e => setBooking({ ...booking, notes: e.target.value })}
                      />
                    </div>

                    {/* Services additionnels */}
                    {services.length > 0 && (
                      <div>
                        <p style={{
                          fontSize: 12, fontWeight: 700, color: 'var(--foreground)',
                          marginBottom: 10, letterSpacing: 0.5,
                          textTransform: 'uppercase',
                        }}>
                          🎵 Services additionnels
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {services.slice(0, 4).map(s => (
                            <div
                              key={s.id}
                              onClick={() => toggleService(s.id)}
                              style={{
                                display: 'flex', justifyContent: 'space-between',
                                alignItems: 'center', padding: '10px 12px',
                                borderRadius: 10, cursor: 'pointer',
                                border: selectedServices.includes(s.id)
                                  ? '1px solid var(--primary)'
                                  : '1px solid var(--border)',
                                background: selectedServices.includes(s.id)
                                  ? 'rgba(201,169,110,0.08)' : 'var(--surface-2)',
                                transition: 'all 0.2s',
                              }}>
                              <div>
                                <p style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</p>
                                <p style={{ fontSize: 11, color: 'var(--muted)' }}>
                                  {s.category}
                                </p>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{
                                  fontSize: 13, color: 'var(--primary)', fontWeight: 600,
                                }}>
                                  +{Number(s.price).toLocaleString('fr-FR')} €
                                </span>
                                {selectedServices.includes(s.id) && (
                                  <CheckCircle size={14} color="var(--primary)" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Récapitulatif */}
                    {total > 0 && (
                      <div style={{
                        background: 'rgba(201,169,110,0.06)',
                        border: '1px solid rgba(201,169,110,0.2)',
                        borderRadius: 12, padding: '14px 16px',
                      }}>
                        <p style={{
                          fontSize: 12, fontWeight: 700, color: 'var(--primary)',
                          marginBottom: 10, letterSpacing: 0.5,
                        }}>
                          RÉCAPITULATIF
                        </p>

                        {hours > 0 && (
                          <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            marginBottom: 6,
                          }}>
                            <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                              Location ({hours}h × {Number(venue.pricePerHour).toLocaleString('fr-FR')} €)
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>
                              {(Number(venue.pricePerHour) * hours).toLocaleString('fr-FR')} €
                            </span>
                          </div>
                        )}

                        {selectedServices.map(sid => {
                          const s = services.find(s => s.id === sid);
                          return s ? (
                            <div key={sid} style={{
                              display: 'flex', justifyContent: 'space-between',
                              marginBottom: 6,
                            }}>
                              <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                                {s.name}
                              </span>
                              <span style={{ fontSize: 13, fontWeight: 600 }}>
                                {Number(s.price).toLocaleString('fr-FR')} €
                              </span>
                            </div>
                          ) : null;
                        })}

                        <div style={{
                          borderTop: '1px solid rgba(201,169,110,0.2)',
                          marginTop: 8, paddingTop: 8,
                        }}>
                          <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            marginBottom: 4,
                          }}>
                            <span style={{
                              fontSize: 14, fontWeight: 700, color: 'var(--foreground)',
                            }}>
                              Total
                            </span>
                            <span style={{
                              fontSize: 20, fontWeight: 900, color: 'var(--primary)',
                              fontFamily: 'Playfair Display, serif',
                            }}>
                              {total.toLocaleString('fr-FR')} €
                            </span>
                          </div>
                          <div style={{
                            display: 'flex', justifyContent: 'space-between',
                          }}>
                            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                              Acompte à régler (30%)
                            </span>
                            <span style={{
                              fontSize: 14, color: 'var(--primary)', fontWeight: 600,
                            }}>
                              {(total * 0.3).toLocaleString('fr-FR')} €
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bouton réserver */}
                    <button
                      onClick={handleBooking}
                      disabled={bookingLoading}
                      style={{
                        background: 'var(--primary)', color: '#0a0a0f',
                        border: 'none', borderRadius: 12, padding: '14px',
                        fontSize: 15, fontWeight: 600,
                        cursor: bookingLoading ? 'not-allowed' : 'pointer',
                        opacity: bookingLoading ? 0.7 : 1,
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: 8,
                        fontFamily: 'DM Sans, sans-serif',
                        marginTop: 4,
                      }}>
                      {bookingLoading ? (
                        <>
                          <Loader2 size={18}
                            style={{ animation: 'spin 1s linear infinite' }} />
                          Réservation en cours...
                        </>
                      ) : isAuthenticated() ? (
                        <> Réserver maintenant <ArrowRight size={16} /></>
                      ) : (
                        'Se connecter pour réserver'
                      )}
                      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
                    </button>

                    <p style={{
                      textAlign: 'center', fontSize: 11, color: 'var(--muted)',
                    }}>
                      🔒 Paiement sécurisé · Annulation possible avant confirmation
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}