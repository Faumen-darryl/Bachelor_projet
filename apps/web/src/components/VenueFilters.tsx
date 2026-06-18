'use client';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface Filters {
  city: string;
  type: string;
  minPrice: string;
  maxPrice: string;
  capacity: string;
}

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onReset: () => void;
  total: number;
}

const venueTypes = [
  { value: '', label: 'Tous les types' },
  { value: 'SALLE', label: 'Salle' },
  { value: 'JARDIN', label: 'Jardin' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'BOITE_DE_NUIT', label: 'Boîte de nuit' },
  { value: 'PARC', label: 'Parc' },
  { value: 'ESPACE_PUBLIC', label: 'Espace public' },
  { value: 'AUTRE', label: 'Autre' },
];

const inputStyle = {
  width: '100%', padding: '10px 14px',
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 10, color: 'var(--foreground)',
  fontSize: 13, outline: 'none',
  fontFamily: 'DM Sans, sans-serif',
};

export default function VenueFilters({ filters, onChange, onReset, total }: Props) {
  const set = (key: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...filters, [key]: e.target.value });

  const hasFilters = Object.values(filters).some(v => v !== '');

  return (
    <aside style={{
      width: 280, flexShrink: 0,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 16, padding: 24,
      height: 'fit-content', position: 'sticky', top: 88,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SlidersHorizontal size={16} color="var(--primary)" />
          <span style={{ fontWeight: 600, fontSize: 15 }}>Filtres</span>
        </div>
        {hasFilters && (
          <button onClick={onReset} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--muted)', fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <X size={12} /> Réinitialiser
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Résultats */}
        <div style={{
          background: 'rgba(201,169,110,0.08)',
          border: '1px solid var(--border)',
          borderRadius: 10, padding: '10px 14px',
          fontSize: 13, color: 'var(--primary)', textAlign: 'center',
        }}>
          {total} lieu{total > 1 ? 'x' : ''} trouvé{total > 1 ? 's' : ''}
        </div>

        {/* Ville */}
        <div>
          <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, display: 'block', letterSpacing: 0.5 }}>
            VILLE
          </label>
          <div style={{ position: 'relative' }}>
            <Search size={14} color="var(--muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              style={{ ...inputStyle, paddingLeft: 34 }}
              placeholder="Paris, Lyon..."
              value={filters.city}
              onChange={set('city')}
            />
          </div>
        </div>

        {/* Type */}
        <div>
          <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, display: 'block', letterSpacing: 0.5 }}>
            TYPE DE LIEU
          </label>
          <select style={{ ...inputStyle, cursor: 'pointer' }} value={filters.type} onChange={set('type')}>
            {venueTypes.map(t => (
              <option key={t.value} value={t.value} style={{ background: 'var(--surface)' }}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Capacité */}
        <div>
          <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, display: 'block', letterSpacing: 0.5 }}>
            CAPACITÉ MINIMUM
          </label>
          <input
            style={inputStyle} type="number" placeholder="ex: 50"
            value={filters.capacity} onChange={set('capacity')}
          />
        </div>

        {/* Prix */}
        <div>
          <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, display: 'block', letterSpacing: 0.5 }}>
            PRIX / HEURE (€)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input style={inputStyle} type="number" placeholder="Min"
              value={filters.minPrice} onChange={set('minPrice')} />
            <input style={inputStyle} type="number" placeholder="Max"
              value={filters.maxPrice} onChange={set('maxPrice')} />
          </div>
        </div>
      </div>
    </aside>
  );
}