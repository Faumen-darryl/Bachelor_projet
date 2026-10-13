'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import Navbar from '@/components/Navbar';
import RGPDModal from '@/components/RGPDModal';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

import {
  Star,
  Shield,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Loader2,
  Users,
  CheckCircle,
  Briefcase,
  CalendarDays,
  FileText,
  LockKeyhole,
  ImageOff,
} from 'lucide-react';

export default function ServiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const [booking, setBooking] = useState({
    eventDate: '',
    eventEndDate: '',
    guestCount: '',
    notes: '',
  });

  const [bookingLoading, setBookingLoading] = useState(false);
  const [showRGPD, setShowRGPD] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api
      .get(`/services/${id}`)
      .then(({ data }) => setService(data))
      .catch(() => router.push('/services'))
      .finally(() => setLoading(false));
  }, [id]);

  // Navigation carrousel
  const photos = service?.photos || [];
  const hasPhotos = photos.length > 0;

  const prevPhoto = () =>
    setCurrentPhoto(p => (p === 0 ? photos.length - 1 : p - 1));

  const nextPhoto = () =>
    setCurrentPhoto(p => (p === photos.length - 1 ? 0 : p + 1));

  // Clavier pour lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxOpen, photos.length]);

  const handleBooking = async () => {
    if (!isAuthenticated()) { router.push('/auth/login'); return; }
    if (user?.role !== 'CLIENT') {
      setError('Seuls les clients peuvent réserver un service.'); return;
    }
    if (!booking.eventDate) {
      setError("Veuillez sélectionner la date de l'événement."); return;
    }
    if (!booking.guestCount || Number(booking.guestCount) < 1) {
      setError('Veuillez indiquer le nombre de personnes.'); return;
    }
    setBookingLoading(true); setError(''); setSuccess('');
    try {
      await api.post('/service-bookings', {
        serviceId: Number(id),
        eventDate: booking.eventDate,
        eventEndDate: booking.eventEndDate || booking.eventDate,
        guestCount: Number(booking.guestCount),
        notes: booking.notes,
      });
      setSuccess('Demande envoyée ! Le prestataire va confirmer votre réservation.');
      setBooking({ eventDate: '', eventEndDate: '', guestCount: '', notes: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Une erreur est survenue.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Navbar />
        <Loader2 size={40} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </main>
    );
  }

  if (!service) return null;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    borderRadius: 10, color: 'var(--foreground)', fontSize: 14,
    outline: 'none', fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box',
  };

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Navbar />

      {/* ── LIGHTBOX ─────────────────────────────────────── */}
      {lightboxOpen && hasPhotos && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.95)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* Fermer */}
          <button
            onClick={() => setLightboxOpen(false)}
            style={{
              position: 'absolute', top: 20, right: 20,
              background: 'rgba(255,255,255,0.1)', border: 'none',
              borderRadius: '50%', width: 44, height: 44,
              color: '#fff', fontSize: 22, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ✕
          </button>

          {/* Compteur */}
          <div style={{
            position: 'absolute', top: 24, left: '50%',
            transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,0.7)', fontSize: 14,
          }}>
            {currentPhoto + 1} / {photos.length}
          </div>

          {/* Flèche gauche */}
          {photos.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); prevPhoto(); }}
              style={{
                position: 'absolute', left: 20, top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.1)', border: 'none',
                borderRadius: '50%', width: 52, height: 52,
                color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ChevronLeft size={26} />
            </button>
          )}

          {/* Image */}
          <img
            src={photos[currentPhoto]?.url}
            alt={`Photo ${currentPhoto + 1}`}
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '88vw', maxHeight: '88vh',
              objectFit: 'contain', borderRadius: 12,
            }}
          />

          {/* Flèche droite */}
          {photos.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); nextPhoto(); }}
              style={{
                position: 'absolute', right: 20, top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.1)', border: 'none',
                borderRadius: '50%', width: 52, height: 52,
                color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ChevronRight size={26} />
            </button>
          )}

          {/* Miniatures */}
          {photos.length > 1 && (
            <div style={{
              position: 'absolute', bottom: 24, left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex', gap: 8,
            }}>
              {photos.map((_: any, i: number) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setCurrentPhoto(i); }}
                  style={{
                    width: i === currentPhoto ? 28 : 8,
                    height: 8, borderRadius: 4,
                    background: i === currentPhoto ? 'var(--primary)' : 'rgba(255,255,255,0.35)',
                    border: 'none', cursor: 'pointer',
                    transition: 'all 0.25s',
                    padding: 0,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '96px 24px 80px' }}>
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--muted)', fontSize: 14, marginBottom: 32,
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          <ChevronLeft size={16} /> Retour aux services
        </button>

        <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start' }}>
          {/* ── COLONNE GAUCHE ────────────────────────────── */}
          <div style={{ flex: 1 }}>

            {/* ── CARROUSEL ─────────────────────────────── */}
            {hasPhotos ? (
              <div style={{
                borderRadius: 20, overflow: 'hidden',
                border: '1px solid var(--border)',
                marginBottom: 24, position: 'relative',
              }}>
                {/* Image principale */}
                <div
                  style={{ position: 'relative', cursor: 'zoom-in' }}
                  onClick={() => setLightboxOpen(true)}
                >
                  <img
                    src={photos[currentPhoto]?.url}
                    alt={`Photo ${currentPhoto + 1}`}
                    style={{
                      width: '100%', height: 420,
                      objectFit: 'cover', display: 'block',
                      transition: 'transform 0.3s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.01)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  />

                  {/* Overlay loupe */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0)',
                    transition: 'background 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.15)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0)')}
                  >
                    <span style={{
                      background: 'rgba(0,0,0,0.5)', borderRadius: 100,
                      padding: '8px 16px', color: '#fff', fontSize: 12,
                      opacity: 0, transition: 'opacity 0.2s',
                    }}
                      className="zoom-hint"
                    >
                      🔍 Agrandir
                    </span>
                  </div>

                  {/* Compteur photos */}
                  <div style={{
                    position: 'absolute', top: 14, right: 14,
                    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
                    borderRadius: 100, padding: '5px 12px',
                    color: '#fff', fontSize: 12, fontWeight: 500,
                  }}>
                    {currentPhoto + 1} / {photos.length}
                  </div>

                  {/* Badge principale */}
                  {photos[currentPhoto]?.isMain && (
                    <div style={{
                      position: 'absolute', top: 14, left: 14,
                      background: 'var(--primary)', color: '#0a0a0f',
                      borderRadius: 100, padding: '4px 12px',
                      fontSize: 11, fontWeight: 700,
                    }}>
                      ⭐ Photo principale
                    </div>
                  )}
                </div>

                {/* Flèches navigation */}
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={prevPhoto}
                      style={{
                        position: 'absolute', left: 12, top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(0,0,0,0.55)', border: 'none',
                        borderRadius: '50%', width: 40, height: 40,
                        color: '#fff', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.2s',
                        marginTop: -20,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.8)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.55)')}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={nextPhoto}
                      style={{
                        position: 'absolute', right: 12, top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(0,0,0,0.55)', border: 'none',
                        borderRadius: '50%', width: 40, height: 40,
                        color: '#fff', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.2s',
                        marginTop: -20,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.8)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.55)')}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}

                {/* Miniatures */}
                {photos.length > 1 && (
                  <div style={{
                    display: 'flex', gap: 8, padding: '12px 16px',
                    background: 'var(--surface)', overflowX: 'auto',
                  }}>
                    {photos.map((photo: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPhoto(i)}
                        style={{
                          width: 72, height: 52, flexShrink: 0,
                          borderRadius: 8, overflow: 'hidden',
                          border: i === currentPhoto
                            ? '2px solid var(--primary)'
                            : '2px solid transparent',
                          cursor: 'pointer', padding: 0,
                          transition: 'border-color 0.2s',
                          opacity: i === currentPhoto ? 1 : 0.6,
                        }}
                      >
                        <img
                          src={photo.url}
                          alt={`Miniature ${i + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Points indicateurs */}
                {photos.length > 1 && (
                  <div style={{
                    position: 'absolute', bottom: photos.length > 1 ? 76 : 14,
                    left: '50%', transform: 'translateX(-50%)',
                    display: 'flex', gap: 6,
                  }}>
                    {photos.map((_: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPhoto(i)}
                        style={{
                          width: i === currentPhoto ? 20 : 7, height: 7,
                          borderRadius: 4,
                          background: i === currentPhoto ? 'var(--primary)' : 'rgba(255,255,255,0.5)',
                          border: 'none', cursor: 'pointer', padding: 0,
                          transition: 'all 0.25s',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Pas de photos */
              <div style={{
                height: 280, borderRadius: 20,
                background: 'var(--surface)', border: '1px solid var(--border)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 12, marginBottom: 24,
              }}>
                <ImageOff size={40} color="var(--muted)" />
                <p style={{ color: 'var(--muted)', fontSize: 14 }}>
                  Aucune photo disponible
                </p>
              </div>
            )}

            {/* ── EN-TÊTE SERVICE ──────────────────────── */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 20, padding: 32, marginBottom: 24,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 16, flexShrink: 0,
                  background: 'rgba(201,169,110,0.15)',
                  border: '1px solid rgba(201,169,110,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--primary)',
                }}>
                  <Briefcase size={32} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{
                      background: 'rgba(201,169,110,0.1)',
                      border: '1px solid var(--border)',
                      borderRadius: 100, padding: '3px 12px',
                      fontSize: 11, color: 'var(--primary)',
                      letterSpacing: 0.5, fontWeight: 500,
                    }}>
                      {service.category}
                    </span>
                    {service.totalReviews > 0 && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        background: 'rgba(201,169,110,0.08)',
                        borderRadius: 100, padding: '3px 10px',
                        border: '1px solid var(--border)',
                      }}>
                        <Star size={12} fill="var(--primary)" color="var(--primary)" />
                        <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>
                          {service.rating?.toFixed(1)}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                          ({service.totalReviews})
                        </span>
                      </div>
                    )}
                  </div>
                  <h1 style={{
                    fontSize: 32, fontWeight: 900, marginBottom: 8,
                    fontFamily: 'Playfair Display, serif', lineHeight: 1.1,
                    color: 'var(--foreground)',
                  }}>
                    {service.name}
                  </h1>
                </div>
              </div>
            </div>

            {/* ── DESCRIPTION ─────────────────────────── */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 16, padding: 24, marginBottom: 24,
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, fontFamily: 'Playfair Display, serif' }}>
                Description du service
              </h2>
              <p style={{ color: 'var(--muted)', lineHeight: 1.8, fontSize: 14 }}>
                {service.description}
              </p>
            </div>

            {/* ── CE QUI EST INCLUS ───────────────────── */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 16, padding: 24, marginBottom: 24,
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, fontFamily: 'Playfair Display, serif' }}>
                Ce qui est inclus
              </h2>
              {[
                'Prestation complète selon description',
                'Matériel et équipement professionnel',
                'Communication directe avec le prestataire',
                'Paiement sécurisé avec acompte de 30%',
                'Confirmation par le prestataire sous 24-48h',
              ].map((item, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <CheckCircle size={16} color="#4ade80" />
                  <span style={{ fontSize: 14, color: 'var(--muted)' }}>{item}</span>
                </div>
              ))}
            </div>

            {/* ── PRESTATAIRE ─────────────────────────── */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 16, padding: 24,
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'rgba(201,169,110,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 700, color: 'var(--primary)',
                fontFamily: 'Playfair Display, serif', flexShrink: 0,
              }}>
                {service.provider?.firstName?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 2 }}>Proposé par</p>
                <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--foreground)' }}>
                  {service.provider?.firstName} {service.provider?.lastName}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Shield size={14} color="#4ade80" />
                <span style={{ fontSize: 12, color: '#4ade80' }}>Vérifié</span>
              </div>
            </div>
          </div>

          {/* ── COLONNE DROITE — Formulaire ───────────── */}
          <div style={{ width: 360, flexShrink: 0, position: 'sticky', top: 88 }}>
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 20, overflow: 'hidden',
              boxShadow: '0 0 60px rgba(201,169,110,0.08)',
            }}>
              {/* Prix */}
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
                    {Number(service.price).toLocaleString('fr-FR')} €
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                  Acompte : {(Number(service.price) * 0.3).toLocaleString('fr-FR')} € à la confirmation
                </p>
              </div>

              <div style={{ padding: '20px 24px' }}>
                {error && (
                  <div style={{
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 10, padding: '10px 14px', marginBottom: 16,
                    color: '#f87171', fontSize: 13,
                  }}>
                    {error}
                  </div>
                )}
                {success && (
                  <div style={{
                    background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)',
                    borderRadius: 10, padding: '12px 14px', marginBottom: 16,
                    color: '#4ade80', fontSize: 13,
                    display: 'flex', flexDirection: 'column', gap: 8,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle size={16} />
                      <span style={{ fontWeight: 600 }}>Demande envoyée !</span>
                    </div>
                    <p style={{ fontSize: 12, opacity: 0.9 }}>
                      Confirmation sous 24-48h par le prestataire.
                    </p>
                    <button
                      onClick={() => router.push('/dashboard')}
                      style={{
                        background: 'rgba(74,222,128,0.2)',
                        border: '1px solid rgba(74,222,128,0.4)',
                        borderRadius: 8, padding: '7px 12px',
                        cursor: 'pointer', color: '#4ade80',
                        fontSize: 12, fontWeight: 600,
                        fontFamily: 'DM Sans, sans-serif',
                      }}
                    >
                      Voir mes réservations →
                    </button>
                  </div>
                )}

                {!success && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Date */}
                    <div>
                      <p style={{
                        fontSize: 12, fontWeight: 700, color: 'var(--foreground)',
                        marginBottom: 10, letterSpacing: 0.5, textTransform: 'uppercase',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        <CalendarDays size={14} /> Date de l'événement
                      </p>
                      <div style={{
                        background: 'var(--surface-2)', border: '1px solid var(--border)',
                        borderRadius: 12, overflow: 'hidden',
                      }}>
                        <div style={{ padding: '12px 14px' }}>
                          <label style={{
                            fontSize: 10, color: 'var(--muted)',
                            display: 'block', marginBottom: 4,
                            letterSpacing: 0.5, textTransform: 'uppercase',
                          }}>
                            Jour de l'événement
                          </label>
                          <input
                            type="date"
                            style={{
                              background: 'none', border: 'none', outline: 'none',
                              color: '#ffffff', fontSize: 14,
                              fontFamily: 'DM Sans, sans-serif',
                              width: '100%', cursor: 'pointer', colorScheme: 'dark',
                            }}
                            value={booking.eventDate}
                            onChange={e => setBooking({ ...booking, eventDate: e.target.value })}
                            min={new Date().toISOString().slice(0, 10)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Nb personnes */}
                    <div>
                      <p style={{
                        fontSize: 12, fontWeight: 700, color: 'var(--foreground)',
                        marginBottom: 10, letterSpacing: 0.5, textTransform: 'uppercase',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        <Users size={14} /> Nombre de personnes
                      </p>
                      <input
                        type="number" min="1" style={inputStyle} placeholder="ex: 50"
                        value={booking.guestCount}
                        onChange={e => setBooking({ ...booking, guestCount: e.target.value })}
                        onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                        onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <p style={{
                        fontSize: 12, fontWeight: 700, color: 'var(--foreground)',
                        marginBottom: 10, letterSpacing: 0.5, textTransform: 'uppercase',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        <FileText size={14} /> Précisions (optionnel)
                      </p>
                      <textarea
                        style={{ ...inputStyle, resize: 'none', height: 80 }}
                        placeholder="Type d'événement, lieu, demandes spéciales..."
                        value={booking.notes}
                        onChange={e => setBooking({ ...booking, notes: e.target.value })}
                      />
                    </div>

                    {/* Récap prix */}
                    <div style={{
                      background: 'rgba(201,169,110,0.06)',
                      border: '1px solid rgba(201,169,110,0.2)',
                      borderRadius: 12, padding: '14px 16px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: 'var(--muted)' }}>Prix du service</span>
                        <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--primary)', fontFamily: 'Playfair Display, serif' }}>
                          {Number(service.price).toLocaleString('fr-FR')} €
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>Acompte à payer (30%)</span>
                        <span style={{ fontSize: 14, color: 'var(--primary)', fontWeight: 600 }}>
                          {(Number(service.price) * 0.3).toLocaleString('fr-FR')} €
                        </span>
                      </div>
                    </div>

                    {/* Bouton réserver */}
                    <button
                      onClick={() => setShowRGPD(true)}
                      disabled={bookingLoading}
                      style={{
                        background: 'var(--primary)', color: '#0a0a0f',
                        border: 'none', borderRadius: 12, padding: '14px',
                        fontSize: 15, fontWeight: 600,
                        cursor: bookingLoading ? 'not-allowed' : 'pointer',
                        opacity: bookingLoading ? 0.7 : 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        fontFamily: 'DM Sans, sans-serif',
                      }}
                    >
                      {bookingLoading ? (
                        <>
                          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                          Envoi...
                        </>
                      ) : isAuthenticated() ? (
                        <>Réserver ce service <ArrowRight size={16} /></>
                      ) : (
                        'Se connecter pour réserver'
                      )}
                      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                    </button>

                    <p style={{
                      textAlign: 'center', fontSize: 11, color: 'var(--muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    }}>
                      <LockKeyhole size={12} />
                      Paiement sécurisé · Confirmation sous 24-48h
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <RGPDModal
        isOpen={showRGPD}
        type="service"
        loading={loading}
        onCancel={() => setShowRGPD(false)}
        onConfirm={async () => {
          setShowRGPD(false);
          await handleBooking();
        }}
      />
    </main>
  );
}