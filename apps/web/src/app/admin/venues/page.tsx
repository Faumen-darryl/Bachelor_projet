'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Loader2, Eye, Trash2, Search, MapPin, Users, Star } from 'lucide-react';
import Link from 'next/link';

export default function AdminVenuesPage() {
  const [venues, setVenues] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    api.get('/admin/venues').then(({ data }) => {
      setVenues(data || []);
      setFiltered(data || []);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!search) { setFiltered(venues); return; }
    setFiltered(venues.filter(v =>
      `${v.name} ${v.city} ${v.owner?.firstName} ${v.owner?.lastName}`
        .toLowerCase().includes(search.toLowerCase())
    ));
  }, [search, venues]);

  const handleDelete = async (id: number) => {
    if (!confirm('Désactiver ce lieu ?')) return;
    setDeleting(id);
    try {
      await api.delete(`/venues/${id}`);
      setVenues(prev => prev.filter(v => v.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur.');
    } finally { setDeleting(null); }
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
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: 32, fontWeight: 900,
          fontFamily: 'Playfair Display, serif', marginBottom: 8,
        }}>
          Gestion des lieux
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          {filtered.length} lieu{filtered.length > 1 ? 'x' : ''}
        </p>
      </div>

      <div style={{ position: 'relative', maxWidth: 400, marginBottom: 24 }}>
        <Search size={14} color="var(--muted)" style={{
          position: 'absolute', left: 14, top: '50%',
          transform: 'translateY(-50%)',
        }} />
        <input
          style={{
            width: '100%', padding: '10px 14px 10px 36px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, color: 'var(--foreground)', fontSize: 13,
            outline: 'none', fontFamily: 'DM Sans, sans-serif',
            boxSizing: 'border-box',
          }}
          placeholder="Rechercher un lieu..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(v => (
          <div key={v.id} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 14, overflow: 'hidden', display: 'flex',
            transition: 'border-color 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>

            <div style={{
              width: 100, flexShrink: 0,
              background: v.photos?.[0]?.url
                ? `url(${v.photos[0].url}) center/cover`
                : 'var(--surface-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {!v.photos?.[0]?.url && <span style={{ fontSize: 24, opacity: 0.2 }}>🏛️</span>}
            </div>

            <div style={{
              flex: 1, padding: '16px 20px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <h3 style={{
                  fontSize: 16, fontWeight: 700,
                  fontFamily: 'Playfair Display, serif', marginBottom: 6,
                }}>
                  {v.name}
                </h3>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <MapPin size={12} color="var(--muted)" />
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>{v.city}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Users size={12} color="var(--muted)" />
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {v.capacity} pers.
                    </span>
                  </div>
                  {v.rating > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Star size={12} color="var(--primary)" fill="var(--primary)" />
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {v.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    Par {v.owner?.firstName} {v.owner?.lastName}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  fontSize: 18, fontWeight: 700,
                  color: 'var(--primary)', fontFamily: 'Playfair Display, serif',
                }}>
                  {Number(v.pricePerHour).toLocaleString('fr-FR')} €/h
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link href={`/venues/${v.id}`} style={{
                    display: 'flex', alignItems: 'center',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 8, padding: '6px 10px',
                    textDecoration: 'none', color: 'var(--foreground)',
                  }}>
                    <Eye size={14} />
                  </Link>
                  <button
                    onClick={() => handleDelete(v.id)}
                    disabled={deleting === v.id}
                    style={{
                      display: 'flex', alignItems: 'center',
                      background: 'rgba(248,113,113,0.1)',
                      border: '1px solid rgba(248,113,113,0.3)',
                      borderRadius: 8, padding: '6px 10px',
                      cursor: 'pointer', color: '#f87171',
                      opacity: deleting === v.id ? 0.5 : 1,
                    }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '48px',
            color: 'var(--muted)', fontSize: 14,
          }}>
            Aucun lieu trouvé
          </div>
        )}
      </div>
    </div>
  );
}