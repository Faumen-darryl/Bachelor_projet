'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

const venueTypes = [
  { value: 'SALLE', label: '🏛️ Salle' },
  { value: 'JARDIN', label: '🌿 Jardin' },
  { value: 'RESTAURANT', label: '🍽️ Restaurant' },
  { value: 'BOITE_DE_NUIT', label: '🎵 Boîte de nuit' },
  { value: 'PARC', label: '🌳 Parc' },
  { value: 'ESPACE_PUBLIC', label: '🏙️ Espace public' },
  { value: 'AUTRE', label: '📍 Autre' },
];

const inputStyle = {
  width: '100%', padding: '12px 16px',
  background: 'var(--surface-2)', border: '1px solid var(--border)',
  borderRadius: 10, color: 'var(--foreground)',
  fontSize: 14, outline: 'none', fontFamily: 'DM Sans, sans-serif',
  transition: 'border-color 0.2s',
};

export default function NewVenuePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', description: '', type: 'SALLE',
    capacity: '', pricePerHour: '',
    city: '', address: '',
    equipments: '', rules: '',
    hasActivity: false,
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async () => {
    if (!form.name || !form.description || !form.city || !form.address || !form.capacity || !form.pricePerHour) {
      setError('Veuillez remplir tous les champs obligatoires.'); return;
    }
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/venues', {
        ...form,
        capacity: Number(form.capacity),
        pricePerHour: Number(form.pricePerHour),
      });
      router.push(`/provider/venues`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
        <Link href="/provider/venues" style={{
          display: 'flex', alignItems: 'center', gap: 6,
          color: 'var(--muted)', textDecoration: 'none', fontSize: 14,
        }}>
          <ArrowLeft size={16} /> Retour
        </Link>
        <h1 style={{ fontSize: 32, fontWeight: 900, fontFamily: 'Playfair Display, serif' }}>
          Ajouter un lieu
        </h1>
      </div>

      <div style={{ maxWidth: 720 }}>
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 10, padding: '12px 16px', marginBottom: 24,
            color: '#f87171', fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {/* Section 1 — Infos générales */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 28, marginBottom: 20,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Playfair Display, serif', marginBottom: 20 }}>
            Informations générales
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 6, letterSpacing: 0.5 }}>NOM DU LIEU *</label>
              <input style={inputStyle} placeholder="ex: Salle Prestige Paris" value={form.name} onChange={set('name')}
                onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            </div>

            <div>
              <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 6, letterSpacing: 0.5 }}>TYPE *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {venueTypes.map(t => (
                  <button key={t.value} onClick={() => setForm({ ...form, type: t.value })} style={{
                    padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
                    border: form.type === t.value ? '1px solid var(--primary)' : '1px solid var(--border)',
                    background: form.type === t.value ? 'rgba(201,169,110,0.1)' : 'var(--surface-2)',
                    color: form.type === t.value ? 'var(--primary)' : 'var(--muted)',
                    fontSize: 12, fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s',
                  }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 6, letterSpacing: 0.5 }}>DESCRIPTION *</label>
              <textarea style={{ ...inputStyle, resize: 'none', height: 100 }}
                placeholder="Décrivez votre lieu..."
                value={form.description} onChange={set('description')}
                onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 6, letterSpacing: 0.5 }}>CAPACITÉ (personnes) *</label>
                <input style={inputStyle} type="number" placeholder="ex: 100" value={form.capacity} onChange={set('capacity')}
                  onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 6, letterSpacing: 0.5 }}>PRIX / HEURE (€) *</label>
                <input style={inputStyle} type="number" placeholder="ex: 150" value={form.pricePerHour} onChange={set('pricePerHour')}
                  onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
              </div>
            </div>

            {/* Activités */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setForm({ ...form, hasActivity: !form.hasActivity })} style={{
                width: 44, height: 24, borderRadius: 12,
                background: form.hasActivity ? 'var(--primary)' : 'var(--surface-2)',
                border: '1px solid var(--border)', cursor: 'pointer',
                position: 'relative', transition: 'background 0.2s',
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 2,
                  left: form.hasActivity ? 22 : 2,
                  transition: 'left 0.2s',
                }} />
              </button>
              <span style={{ fontSize: 14, color: 'var(--foreground)' }}>
                Des activités sont incluses dans ce lieu
              </span>
            </div>
          </div>
        </div>

        {/* Section 2 — Localisation */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 28, marginBottom: 20,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Playfair Display, serif', marginBottom: 20 }}>
            Localisation
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 6, letterSpacing: 0.5 }}>VILLE *</label>
              <input style={inputStyle} placeholder="ex: Paris" value={form.city} onChange={set('city')}
                onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 6, letterSpacing: 0.5 }}>ADRESSE COMPLÈTE *</label>
              <input style={inputStyle} placeholder="ex: 12 rue de la Paix, 75001 Paris" value={form.address} onChange={set('address')}
                onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            </div>
          </div>
        </div>

        {/* Section 3 — Détails */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 28, marginBottom: 32,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Playfair Display, serif', marginBottom: 20 }}>
            Équipements & Règles
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 6, letterSpacing: 0.5 }}>ÉQUIPEMENTS</label>
              <textarea style={{ ...inputStyle, resize: 'none', height: 80 }}
                placeholder="Parking, climatisation, sono, projecteur..."
                value={form.equipments} onChange={set('equipments')} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 6, letterSpacing: 0.5 }}>RÈGLES DU LIEU</label>
              <textarea style={{ ...inputStyle, resize: 'none', height: 80 }}
                placeholder="Pas de fumée, musique jusqu'à 23h..."
                value={form.rules} onChange={set('rules')} />
            </div>
          </div>
        </div>

        {/* Submit */}
        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', background: 'var(--primary)', color: '#0a0a0f',
          border: 'none', borderRadius: 12, padding: '16px',
          fontSize: 16, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          fontFamily: 'DM Sans, sans-serif',
        }}>
          {loading ? (
            <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Publication en cours...</>
          ) : (
            <>Publier le lieu <ArrowRight size={18} /></>
          )}
        </button>
      </div>
    </div>
  );
}