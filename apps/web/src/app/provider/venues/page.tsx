'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, Loader2, MapPin, Users } from 'lucide-react';

export default function ProviderVenuesPage() {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    api.get('/venues').then(({ data }) => setVenues(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce lieu ?')) return;
    setDeleting(id);
    try {
      await api.delete(`/venues/${id}`);
      setVenues(prev => prev.filter(v => v.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur.');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <Loader2 size={28} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, fontFamily: 'Playfair Display, serif', marginBottom: 8 }}>
            Mes lieux
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>{venues.length} lieu{venues.length > 1 ? 'x' : ''}</p>
        </div>
        <Link href="/provider/venues/new" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--primary)', color: '#0a0a0f',
          textDecoration: 'none', padding: '10px 20px',
          borderRadius: 10, fontSize: 14, fontWeight: 600,
        }}>
          <Plus size={16} /> Ajouter un lieu
        </Link>
      </div>

      {venues.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 24px',
          background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🏛️</div>
          <h3 style={{ fontSize: 22, marginBottom: 8 }}>Aucun lieu publié</h3>
          <p style={{ color: 'var(--muted)', marginBottom: 24, fontSize: 14 }}>
            Commencez par ajouter votre premier lieu.
          </p>
          <Link href="/provider/venues/new" style={{
            background: 'var(--primary)', color: '#0a0a0f',
            textDecoration: 'none', padding: '12px 24px',
            borderRadius: 12, fontWeight: 600, fontSize: 14,
          }}>
            Ajouter un lieu
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {venues.map(v => (
            <div key={v.id} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 16, overflow: 'hidden', display: 'flex',
              transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.3)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>

              {/* Photo */}
              <div style={{
                width: 120, flexShrink: 0,
                background: v.photos?.[0]?.url
                  ? `url(${v.photos[0].url}) center/cover`
                  : 'linear-gradient(135deg, var(--surface-2), var(--surface))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {!v.photos?.[0]?.url && <span style={{ fontSize: 28, opacity: 0.2 }}>🏛️</span>}
              </div>

              {/* Info */}
              <div style={{ flex: 1, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Playfair Display, serif', marginBottom: 6 }}>
                    {v.name}
                  </h3>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <MapPin size={12} color="var(--muted)" />
                      <span style={{ fontSize: 13, color: 'var(--muted)' }}>{v.city}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Users size={12} color="var(--muted)" />
                      <span style={{ fontSize: 13, color: 'var(--muted)' }}>{v.capacity} pers.</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)', fontFamily: 'Playfair Display, serif' }}>
                    {Number(v.pricePerHour).toLocaleString('fr-FR')} €/h
                  </span>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link href={`/venues/${v.id}`} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: 'var(--surface-2)', border: '1px solid var(--border)',
                      borderRadius: 8, padding: '7px 12px',
                      textDecoration: 'none', color: 'var(--foreground)', fontSize: 13,
                    }}>
                      <Eye size={14} />
                    </Link>
                    <Link href={`/provider/venues/${v.id}/edit`} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.3)',
                      borderRadius: 8, padding: '7px 12px',
                      textDecoration: 'none', color: 'var(--primary)', fontSize: 13,
                    }}>
                      <Edit size={14} />
                    </Link>
                    <button onClick={() => handleDelete(v.id)} disabled={deleting === v.id} style={{
                      display: 'flex', alignItems: 'center',
                      background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
                      borderRadius: 8, padding: '7px 12px',
                      cursor: 'pointer', color: '#f87171', fontSize: 13,
                      opacity: deleting === v.id ? 0.5 : 1,
                    }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}