'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';

const venueTypes = [
  { value: 'SALLE', label: '🏛️ Salle', desc: 'Salle de réception, conférence' },
  { value: 'JARDIN', label: '🌿 Jardin', desc: 'Espace extérieur, jardin privé' },
  { value: 'RESTAURANT', label: '🍽️ Restaurant', desc: 'Restauration sur place' },
  { value: 'BOITE_DE_NUIT', label: '🎵 Boîte de nuit', desc: 'Club, discothèque' },
  { value: 'PARC', label: '🌳 Parc', desc: 'Espace vert, parc public ou privé' },
  { value: 'ESPACE_PUBLIC', label: '🏙️ Espace public', desc: 'Place, esplanade' },
  { value: 'AUTRE', label: '📦 Autre', desc: 'Autre type de lieu' },
];

const inputStyle = {
  width: '100%', padding: '12px 16px',
  background: 'var(--surface-2)', border: '1px solid var(--border)',
  borderRadius: 10, color: 'var(--foreground)',
  fontSize: 14, outline: 'none', fontFamily: 'DM Sans, sans-serif',
  transition: 'border-color 0.2s',
};

export default function EditVenuePage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    type: 'SALLE',
    description: '',
    capacity: '',
    pricePerHour: '',
    city: '',
    address: '',
    equipments: '',
    rules: '',
    hasActivity: false,
  });

  useEffect(() => {
    api.get(`/venues/${id}`)
      .then(({ data }) => {
        setForm({
          name: data.name || '',
          type: data.type || 'SALLE',
          description: data.description || '',
          capacity: String(data.capacity) || '',
          pricePerHour: String(data.pricePerHour) || '',
          city: data.city || '',
          address: data.address || '',
          equipments: data.equipments || '',
          rules: data.rules || '',
          hasActivity: data.hasActivity || false,
        });
      })
      .catch(() => router.push('/provider/venues'))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (key: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async () => {
    if (!form.name || !form.description || !form.capacity ||
        !form.pricePerHour || !form.city || !form.address) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setSaving(true); setError('');
    try {
      await api.put(`/venues/${id}`, {
        name: form.name,
        type: form.type,
        description: form.description,
        capacity: Number(form.capacity),
        pricePerHour: Number(form.pricePerHour),
        city: form.city,
        address: form.address,
        equipments: form.equipments,
        rules: form.rules,
        hasActivity: form.hasActivity,
      });
      router.push('/provider/venues');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la modification.');
    } finally {
      setSaving(false);
    }
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
        <Link href="/provider/venues" style={{
          display: 'flex', alignItems: 'center', gap: 6,
          color: 'var(--muted)', textDecoration: 'none', fontSize: 14,
        }}>
          <ArrowLeft size={16} /> Retour
        </Link>
        <h1 style={{
          fontSize: 32, fontWeight: 900,
          fontFamily: 'Playfair Display, serif',
        }}>
          Modifier le lieu
        </h1>
      </div>

      <div style={{ maxWidth: 640 }}>
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 10, padding: '12px 16px', marginBottom: 24,
            color: '#f87171', fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {/* Type */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 28, marginBottom: 20,
        }}>
          <h2 style={{
            fontSize: 18, fontWeight: 700,
            fontFamily: 'Playfair Display, serif', marginBottom: 20,
          }}>
            Type de lieu
          </h2>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10,
          }}>
            {venueTypes.map(t => (
              <button key={t.value} onClick={() => setForm({ ...form, type: t.value })} style={{
                padding: '12px 14px', borderRadius: 12,
                border: form.type === t.value
                  ? '1px solid var(--primary)'
                  : '1px solid var(--border)',
                background: form.type === t.value
                  ? 'rgba(201,169,110,0.1)' : 'var(--surface-2)',
                cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.2s', fontFamily: 'DM Sans, sans-serif',
              }}>
                <p style={{
                  fontSize: 14, fontWeight: 600,
                  color: form.type === t.value ? 'var(--primary)' : 'var(--foreground)',
                  marginBottom: 2,
                }}>
                  {t.label}
                </p>
                <p style={{ fontSize: 11, color: 'var(--muted)' }}>{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Informations */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 28, marginBottom: 20,
        }}>
          <h2 style={{
            fontSize: 18, fontWeight: 700,
            fontFamily: 'Playfair Display, serif', marginBottom: 20,
          }}>
            Informations du lieu
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{
                fontSize: 11, color: 'var(--muted)',
                display: 'block', marginBottom: 6, letterSpacing: 0.5,
              }}>NOM DU LIEU *</label>
              <input
                style={inputStyle}
                placeholder="ex: Villa des Jardins"
                value={form.name}
                onChange={set('name')}
                onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            <div>
              <label style={{
                fontSize: 11, color: 'var(--muted)',
                display: 'block', marginBottom: 6, letterSpacing: 0.5,
              }}>DESCRIPTION *</label>
              <textarea
                style={{ ...inputStyle, resize: 'none', height: 120 }}
                placeholder="Décrivez votre lieu..."
                value={form.description}
                onChange={set('description')}
                onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{
                  fontSize: 11, color: 'var(--muted)',
                  display: 'block', marginBottom: 6, letterSpacing: 0.5,
                }}>CAPACITÉ (personnes) *</label>
                <input
                  style={inputStyle}
                  type="number" min="1"
                  placeholder="ex: 100"
                  value={form.capacity}
                  onChange={set('capacity')}
                  onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
              <div>
                <label style={{
                  fontSize: 11, color: 'var(--muted)',
                  display: 'block', marginBottom: 6, letterSpacing: 0.5,
                }}>PRIX PAR HEURE (€) *</label>
                <input
                  style={inputStyle}
                  type="number" min="0"
                  placeholder="ex: 150"
                  value={form.pricePerHour}
                  onChange={set('pricePerHour')}
                  onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{
                  fontSize: 11, color: 'var(--muted)',
                  display: 'block', marginBottom: 6, letterSpacing: 0.5,
                }}>VILLE *</label>
                <input
                  style={inputStyle}
                  placeholder="ex: Paris"
                  value={form.city}
                  onChange={set('city')}
                  onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
              <div>
                <label style={{
                  fontSize: 11, color: 'var(--muted)',
                  display: 'block', marginBottom: 6, letterSpacing: 0.5,
                }}>ADRESSE *</label>
                <input
                  style={inputStyle}
                  placeholder="ex: 12 rue de la Paix"
                  value={form.address}
                  onChange={set('address')}
                  onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
            </div>

            <div>
              <label style={{
                fontSize: 11, color: 'var(--muted)',
                display: 'block', marginBottom: 6, letterSpacing: 0.5,
              }}>ÉQUIPEMENTS</label>
              <textarea
                style={{ ...inputStyle, resize: 'none', height: 80 }}
                placeholder="ex: Sono, tables, chaises, climatisation..."
                value={form.equipments}
                onChange={set('equipments')}
                onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            <div>
              <label style={{
                fontSize: 11, color: 'var(--muted)',
                display: 'block', marginBottom: 6, letterSpacing: 0.5,
              }}>RÈGLES DU LIEU</label>
              <textarea
                style={{ ...inputStyle, resize: 'none', height: 80 }}
                placeholder="ex: Non-fumeur, pas d'animaux..."
                value={form.rules}
                onChange={set('rules')}
                onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            {/* Toggle activités */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 10,
            }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                  Activités incluses
                </p>
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                  Le lieu propose des services intégrés (boissons, repas...)
                </p>
              </div>
              <button
                onClick={() => setForm({ ...form, hasActivity: !form.hasActivity })}
                style={{
                  width: 48, height: 26, borderRadius: 100,
                  background: form.hasActivity ? 'var(--primary)' : 'var(--border)',
                  border: 'none', cursor: 'pointer',
                  position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                }}>
                <div style={{
                  position: 'absolute', top: 3,
                  left: form.hasActivity ? 24 : 4,
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'white',
                  transition: 'left 0.2s',
                }} />
              </button>
            </div>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={saving} style={{
          width: '100%', background: 'var(--primary)', color: '#0a0a0f',
          border: 'none', borderRadius: 12, padding: '16px',
          fontSize: 16, fontWeight: 600,
          cursor: saving ? 'not-allowed' : 'pointer',
          opacity: saving ? 0.7 : 1,
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 10,
          fontFamily: 'DM Sans, sans-serif',
        }}>
          {saving ? (
            <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Sauvegarde...</>
          ) : (
            <><Save size={18} /> Sauvegarder les modifications</>
          )}
          <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
        </button>
      </div>
    </div>
  );
}