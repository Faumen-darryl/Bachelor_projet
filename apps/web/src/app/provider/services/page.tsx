'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Plus, Edit, Trash2, Loader2, Star, Briefcase } from 'lucide-react';

const categoryEmojis: Record<string, string> = {
  DJ: '🎵', Traiteur: '🍽️', Photographe: '📸',
  Décorateur: '🎨', Animateur: '🎤', Vidéaste: '🎬',
  Fleuriste: '💐', Sécurité: '🛡️', Transport: '🚌', Autre: '📦',
};

export default function ProviderServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    api.get('/services/my').then(({ data }) => {
      setServices(data || []);
    }).catch(() => {
      // Fallback : récupérer tous les services du prestataire
      api.get('/services').then(({ data }) => {
        setServices(data.data || []);
      });
    }).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce service ?')) return;
    setDeleting(id);
    try {
      await api.delete(`/services/${id}`);
      setServices(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur.');
    } finally {
      setDeleting(null);
    }
  };

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
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 40,
      }}>
        <div>
          <h1 style={{
            fontSize: 32, fontWeight: 900,
            fontFamily: 'Playfair Display, serif', marginBottom: 8,
          }}>
            Mes services
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            {services.length} service{services.length > 1 ? 's' : ''} publié{services.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/provider/services/new" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--primary)', color: '#0a0a0f',
          textDecoration: 'none', padding: '10px 20px',
          borderRadius: 10, fontSize: 14, fontWeight: 600,
        }}>
          <Plus size={16} /> Ajouter un service
        </Link>
      </div>

      {services.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 24px',
          background: 'var(--surface)', borderRadius: 20,
          border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎵</div>
          <h3 style={{ fontSize: 22, marginBottom: 8 }}>Aucun service publié</h3>
          <p style={{ color: 'var(--muted)', marginBottom: 24, fontSize: 14 }}>
            Proposez vos services (DJ, traiteur, photographe...) aux clients.
          </p>
          <Link href="/provider/services/new" style={{
            background: 'var(--primary)', color: '#0a0a0f',
            textDecoration: 'none', padding: '12px 24px',
            borderRadius: 12, fontWeight: 600, fontSize: 14,
          }}>
            Ajouter mon premier service
          </Link>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 20,
        }}>
          {services.map(s => (
            <div key={s.id} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 16, overflow: 'hidden',
              transition: 'border-color 0.2s, transform 0.2s',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,169,110,0.4)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}>

              {/* Header carte */}
              <div style={{
                background: 'linear-gradient(135deg, var(--surface-2), var(--surface))',
                padding: '24px 20px',
                display: 'flex', alignItems: 'center', gap: 16,
                borderBottom: '1px solid var(--border)',
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: 'rgba(201,169,110,0.15)',
                  border: '1px solid rgba(201,169,110,0.3)',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 28, flexShrink: 0,
                }}>
                  {categoryEmojis[s.category] || '📦'}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <p style={{
                    fontSize: 11, color: 'var(--primary)',
                    letterSpacing: 0.5, marginBottom: 4, fontWeight: 500,
                  }}>
                    {s.category}
                  </p>
                  <h3 style={{
                    fontSize: 16, fontWeight: 700,
                    fontFamily: 'Playfair Display, serif',
                    whiteSpace: 'nowrap', overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {s.name}
                  </h3>
                </div>
              </div>

              {/* Contenu */}
              <div style={{ padding: '16px 20px' }}>
                <p style={{
                  fontSize: 13, color: 'var(--muted)',
                  lineHeight: 1.6, marginBottom: 16,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {s.description}
                </p>

                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 16,
                }}>
                  <span style={{
                    fontSize: 22, fontWeight: 700, color: 'var(--primary)',
                    fontFamily: 'Playfair Display, serif',
                  }}>
                    {Number(s.price).toLocaleString('fr-FR')} €
                  </span>
                  {s.totalReviews > 0 && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      background: 'rgba(201,169,110,0.1)',
                      border: '1px solid rgba(201,169,110,0.2)',
                      borderRadius: 100, padding: '3px 10px',
                    }}>
                      <Star size={12} fill="var(--primary)" color="var(--primary)" />
                      <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>
                        {s.rating.toFixed(1)}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                        ({s.totalReviews})
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link href={`/provider/services/${s.id}/edit`} style={{
                    flex: 1, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 6,
                    background: 'rgba(201,169,110,0.1)',
                    border: '1px solid rgba(201,169,110,0.3)',
                    borderRadius: 8, padding: '8px',
                    textDecoration: 'none', color: 'var(--primary)', fontSize: 13,
                  }}>
                    <Edit size={14} /> Modifier
                  </Link>
                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={deleting === s.id}
                    style={{
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: 6,
                      background: 'rgba(248,113,113,0.1)',
                      border: '1px solid rgba(248,113,113,0.3)',
                      borderRadius: 8, padding: '8px 12px',
                      cursor: 'pointer', color: '#f87171', fontSize: 13,
                      opacity: deleting === s.id ? 0.5 : 1,
                      fontFamily: 'DM Sans, sans-serif',
                    }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}