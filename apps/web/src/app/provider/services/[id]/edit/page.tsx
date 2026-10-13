'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import { api } from '@/lib/api';

import {
  ArrowLeft,
  Save,
  Loader2,
} from 'lucide-react';

const categories = [
  {
    value: 'DJ',
    label: 'DJ',
    desc: 'Animation musicale, soirées, événements',
  },
  {
    value: 'Traiteur',
    label: 'Traiteur',
    desc: 'Restauration, buffets, cocktails',
  },
  {
    value: 'Photographe',
    label: 'Photographe',
    desc: 'Photos professionnelles',
  },
  {
    value: 'Décorateur',
    label: 'Décorateur',
    desc: 'Décoration florale et thématique',
  },
  {
    value: 'Animateur',
    label: 'Animateur',
    desc: 'Animation, spectacles, shows',
  },
  {
    value: 'Vidéaste',
    label: 'Vidéaste',
    desc: 'Captation et montage vidéo',
  },
  {
    value: 'Fleuriste',
    label: 'Fleuriste',
    desc: 'Compositions florales',
  },
  {
    value: 'Sécurité',
    label: 'Sécurité',
    desc: 'Agents de sécurité événementielle',
  },
  {
    value: 'Transport',
    label: 'Transport',
    desc: 'Navettes, limousines, bus',
  },
  {
    value: 'Autre',
    label: 'Autre',
    desc: 'Autres prestations événementielles',
  },
];

// Définit le style commun des champs du formulaire.
const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  color: 'var(--foreground)',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'DM Sans, sans-serif',
  transition: 'border-color 0.2s',
};

// Affiche le formulaire de modification d'un service.
export default function EditServicePage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    category: 'DJ',
    description: '',
    price: '',
  });

  // Charge les informations du service à modifier.
  useEffect(() => {
    api
      .get(`/services/${id}`)
      .then(({ data }) => {
        setForm({
          name: data.name || '',
          category: data.category || 'DJ',
          description: data.description || '',
          price: String(data.price) || '',
        });
      })
      .catch(() =>
        router.push('/provider/services')
      )
      .finally(() => setLoading(false));
  }, [id]);

  // Met à jour un champ du formulaire.
  const set =
    (key: string) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement
      >
    ) =>
      setForm({
        ...form,
        [key]: e.target.value,
      });

  // Valide les informations puis enregistre les modifications.
  const handleSubmit = async () => {
    if (
      !form.name ||
      !form.description ||
      !form.price
    ) {
      setError(
        'Veuillez remplir tous les champs obligatoires.'
      );
      return;
    }

    if (Number(form.price) <= 0) {
      setError(
        'Le prix doit être supérieur à 0.'
      );
      return;
    }

    setSaving(true);
    setError('');

    try {
      await api.put(`/services/${id}`, {
        name: form.name,
        category: form.category,
        description: form.description,
        price: Number(form.price),
      });

      router.push('/provider/services');
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Erreur lors de la modification.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
          gap: 16,
        }}
      >
        <Loader2
          size={28}
          color="var(--primary)"
          style={{
            animation: 'spin 1s linear infinite',
          }}
        />

        <style>
          {`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
        </style>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 40,
        }}
      >
        <Link
          href="/provider/services"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--muted)',
            textDecoration: 'none',
            fontSize: 14,
          }}
        >
          <ArrowLeft size={16} />
          Retour
        </Link>

        <h1
          style={{
            fontSize: 32,
            fontWeight: 900,
            fontFamily: 'Playfair Display, serif',
          }}
        >
          Modifier le service
        </h1>
      </div>

      <div style={{ maxWidth: 640 }}>
        {error && (
          <div
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10,
              padding: '12px 16px',
              marginBottom: 24,
              color: '#f87171',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 28,
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              fontFamily: 'Playfair Display, serif',
              marginBottom: 20,
            }}
          >
            Type de service
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 10,
            }}
          >
            {categories.map((c) => (
              <button
                key={c.value}
                onClick={() =>
                  setForm({
                    ...form,
                    category: c.value,
                  })
                }
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  border:
                    form.category === c.value
                      ? '1px solid var(--primary)'
                      : '1px solid var(--border)',
                  background:
                    form.category === c.value
                      ? 'rgba(201,169,110,0.1)'
                      : 'var(--surface-2)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color:
                      form.category === c.value
                        ? 'var(--primary)'
                        : 'var(--foreground)',
                    marginBottom: 2,
                  }}
                >
                  {c.label}
                </p>

                <p
                  style={{
                    fontSize: 11,
                    color: 'var(--muted)',
                  }}
                >
                  {c.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 28,
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              fontFamily: 'Playfair Display, serif',
              marginBottom: 20,
            }}
          >
            Informations du service
          </h2>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: 'var(--muted)',
                  display: 'block',
                  marginBottom: 6,
                  letterSpacing: 0.5,
                }}
              >
                NOM DU SERVICE *
              </label>

              <input
                style={inputStyle}
                placeholder="ex: DJ Résidence — Mix électro & house"
                value={form.name}
                onChange={set('name')}
                onFocus={(e) =>
                  (e.target.style.borderColor =
                    'var(--primary)')
                }
                onBlur={(e) =>
                  (e.target.style.borderColor =
                    'var(--border)')
                }
              />
            </div>

            <div>
              <label
                style={{
                  fontSize: 11,
                  color: 'var(--muted)',
                  display: 'block',
                  marginBottom: 6,
                  letterSpacing: 0.5,
                }}
              >
                DESCRIPTION *
              </label>

              <textarea
                style={{
                  ...inputStyle,
                  resize: 'none',
                  height: 140,
                }}
                placeholder="Décrivez votre service..."
                value={form.description}
                onChange={set('description')}
                onFocus={(e) =>
                  (e.target.style.borderColor =
                    'var(--primary)')
                }
                onBlur={(e) =>
                  (e.target.style.borderColor =
                    'var(--border)')
                }
              />
            </div>

            <div>
              <label
                style={{
                  fontSize: 11,
                  color: 'var(--muted)',
                  display: 'block',
                  marginBottom: 6,
                  letterSpacing: 0.5,
                }}
              >
                PRIX (€) *
              </label>

              <div style={{ position: 'relative' }}>
                <input
                  style={{
                    ...inputStyle,
                    paddingRight: 40,
                  }}
                  type="number"
                  min="0"
                  placeholder="ex: 500"
                  value={form.price}
                  onChange={set('price')}
                  onFocus={(e) =>
                    (e.target.style.borderColor =
                      'var(--primary)')
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor =
                      'var(--border)')
                  }
                />

                <span
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--muted)',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  €
                </span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            width: '100%',
            background: 'var(--primary)',
            color: '#0a0a0f',
            border: 'none',
            borderRadius: 12,
            padding: '16px',
            fontSize: 16,
            fontWeight: 600,
            cursor: saving
              ? 'not-allowed'
              : 'pointer',
            opacity: saving ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          {saving ? (
            <>
              <Loader2
                size={18}
                style={{
                  animation:
                    'spin 1s linear infinite',
                }}
              />
              Sauvegarde...
            </>
          ) : (
            <>
              <Save size={18} />
              Sauvegarder les modifications
            </>
          )}

          <style>
            {`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
          </style>
        </button>
      </div>
    </div>
  );
}