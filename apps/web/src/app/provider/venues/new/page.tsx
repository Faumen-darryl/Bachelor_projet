'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { api } from '@/lib/api';

import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  X,
  ImagePlus,
  Star,
} from 'lucide-react';

const venueTypes = [
  {
    value: 'SALLE',
    label: 'Salle',
  },
  {
    value: 'JARDIN',
    label: 'Jardin',
  },
  {
    value: 'RESTAURANT',
    label: 'Restaurant',
  },
  {
    value: 'BOITE_DE_NUIT',
    label: 'Boîte de nuit',
  },
  {
    value: 'PARC',
    label: 'Parc',
  },
  {
    value: 'ESPACE_PUBLIC',
    label: 'Espace public',
  },
  {
    value: 'AUTRE',
    label: 'Autre',
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

const MAX_IMAGES = 5;

// Affiche le formulaire de création d'un lieu.
export default function NewVenuePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'SALLE',
    capacity: '',
    pricePerHour: '',
    city: '',
    address: '',
    equipments: '',
    rules: '',
    hasActivity: false,
  });

  // Met à jour un champ du formulaire.
  const set =
    (key: string) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) =>
      setForm({
        ...form,
        [key]: e.target.value,
      });

  // Ajoute les images sélectionnées en respectant les limites définies.
  const handleImageSelect = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_IMAGES - images.length;
    const toAdd = files.slice(0, remaining);

    const oversized = toAdd.filter(
      (file) => file.size > 5 * 1024 * 1024
    );

    if (oversized.length > 0) {
      setError(
        'Certaines images dépassent 5MB. Veuillez les compresser.'
      );
      return;
    }

    setImages((prev) => [
      ...prev,
      ...toAdd,
    ]);

    toAdd.forEach((file) => {
      const reader = new FileReader();

      reader.onload = (ev) => {
        setPreviews((prev) => [
          ...prev,
          ev.target?.result as string,
        ]);
      };

      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  // Supprime une image de la sélection.
  const removeImage = (index: number) => {
    setImages((prev) =>
      prev.filter((_, i) => i !== index)
    );

    setPreviews((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  // Place l'image sélectionnée en première position.
  const setMainImage = (index: number) => {
    const newImages = [...images];
    const newPreviews = [...previews];

    const [imgToMove] = newImages.splice(index, 1);
    const [prevToMove] = newPreviews.splice(index, 1);

    newImages.unshift(imgToMove);
    newPreviews.unshift(prevToMove);

    setImages(newImages);
    setPreviews(newPreviews);
  };

  // Crée le lieu puis ajoute les photos sélectionnées.
  const handleSubmit = async () => {
    if (
      !form.name ||
      !form.description ||
      !form.city ||
      !form.address ||
      !form.capacity ||
      !form.pricePerHour
    ) {
      setError(
        'Veuillez remplir tous les champs obligatoires.'
      );
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/venues', {
        ...form,
        capacity: Number(form.capacity),
        pricePerHour: Number(form.pricePerHour),
      });

      const venueId = data.id;

      if (images.length > 0) {
        setUploadingImages(true);

        for (let i = 0; i < images.length; i++) {
          const formData = new FormData();

          formData.append('photo', images[i]);
          formData.append(
            'isMain',
            i === 0 ? 'true' : 'false'
          );

          await api.post(
            `/venues/${venueId}/photos`,
            formData,
            {
              headers: {
                'Content-Type':
                  'multipart/form-data',
              },
            }
          );
        }

        setUploadingImages(false);
      }

      router.push('/provider/venues');
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Erreur lors de la création.'
      );

      setUploadingImages(false);
    } finally {
      setLoading(false);
    }
  };

  const isLoading =
    loading || uploadingImages;

  const loadingText = uploadingImages
    ? `Upload des photos... (${images.length} image${
        images.length > 1 ? 's' : ''
      })`
    : 'Publication en cours...';

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
          href="/provider/venues"
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
          Ajouter un lieu
        </h1>
      </div>

      <div style={{ maxWidth: 720 }}>
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
            Informations générales
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
                NOM DU LIEU *
              </label>

              <input
                style={inputStyle}
                placeholder="ex: Salle Prestige Paris"
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
                TYPE *
              </label>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(4, 1fr)',
                  gap: 8,
                }}
              >
                {venueTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() =>
                      setForm({
                        ...form,
                        type: type.value,
                      })
                    }
                    style={{
                      padding: '10px 8px',
                      borderRadius: 10,
                      cursor: 'pointer',
                      border:
                        form.type === type.value
                          ? '1px solid var(--primary)'
                          : '1px solid var(--border)',
                      background:
                        form.type === type.value
                          ? 'rgba(201,169,110,0.1)'
                          : 'var(--surface-2)',
                      color:
                        form.type === type.value
                          ? 'var(--primary)'
                          : 'var(--muted)',
                      fontSize: 12,
                      fontFamily:
                        'DM Sans, sans-serif',
                      transition: 'all 0.2s',
                    }}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
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
                  height: 100,
                }}
                placeholder="Décrivez votre lieu..."
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

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
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
                  CAPACITÉ (personnes) *
                </label>

                <input
                  style={inputStyle}
                  type="number"
                  placeholder="ex: 100"
                  value={form.capacity}
                  onChange={set('capacity')}
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
                  PRIX / HEURE (€) *
                </label>

                <input
                  style={inputStyle}
                  type="number"
                  placeholder="ex: 150"
                  value={form.pricePerHour}
                  onChange={set('pricePerHour')}
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
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <button
                onClick={() =>
                  setForm({
                    ...form,
                    hasActivity:
                      !form.hasActivity,
                  })
                }
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  background:
                    form.hasActivity
                      ? 'var(--primary)'
                      : 'var(--surface-2)',
                  border:
                    '1px solid var(--border)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition:
                    'background 0.2s',
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#fff',
                    position: 'absolute',
                    top: 2,
                    left:
                      form.hasActivity
                        ? 22
                        : 2,
                    transition: 'left 0.2s',
                  }}
                />
              </button>

              <span
                style={{
                  fontSize: 14,
                  color: 'var(--foreground)',
                }}
              >
                Des activités sont incluses dans ce lieu
              </span>
            </div>
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                fontFamily:
                  'Playfair Display, serif',
              }}
            >
              Photos du lieu
            </h2>

            <span
              style={{
                fontSize: 12,
                color:
                  images.length >= MAX_IMAGES
                    ? 'var(--primary)'
                    : 'var(--muted)',
                fontWeight:
                  images.length >= MAX_IMAGES
                    ? 600
                    : 400,
              }}
            >
              {images.length} / {MAX_IMAGES} photos
            </span>
          </div>

          <p
            style={{
              fontSize: 13,
              color: 'var(--muted)',
              marginBottom: 20,
            }}
          >
            Ajoutez jusqu'à 5 photos de votre lieu. La première photo sera utilisée comme photo principale. Cliquez sur l'étoile pour définir une autre photo comme principale.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            style={{ display: 'none' }}
            onChange={handleImageSelect}
          />

          {images.length < MAX_IMAGES && (
            <button
              onClick={() =>
                fileInputRef.current?.click()
              }
              style={{
                width: '100%',
                padding: '28px 20px',
                border:
                  '2px dashed var(--border)',
                borderRadius: 12,
                background: 'var(--surface-2)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                transition: 'all 0.2s',
                marginBottom:
                  previews.length > 0
                    ? 20
                    : 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor =
                  'var(--primary)';

                e.currentTarget.style.background =
                  'rgba(201,169,110,0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor =
                  'var(--border)';

                e.currentTarget.style.background =
                  'var(--surface-2)';
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background:
                    'rgba(201,169,110,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ImagePlus
                  size={22}
                  color="var(--primary)"
                />
              </div>

              <div style={{ textAlign: 'center' }}>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--foreground)',
                    marginBottom: 4,
                  }}
                >
                  Cliquez pour ajouter des photos
                </p>

                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--muted)',
                  }}
                >
                  JPG, PNG, WebP — Max 5MB par image —{' '}
                  {MAX_IMAGES - images.length}{' '}
                  emplacement
                  {MAX_IMAGES - images.length > 1
                    ? 's'
                    : ''}{' '}
                  restant
                  {MAX_IMAGES - images.length > 1
                    ? 's'
                    : ''}
                </p>
              </div>
            </button>
          )}

          {previews.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 10,
              }}
            >
              {previews.map((src, i) => (
                <div
                  key={i}
                  style={{
                    position: 'relative',
                    borderRadius: 10,
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={src}
                    alt={`Photo ${i + 1}`}
                    style={{
                      width: '100%',
                      height: 120,
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />

                  {i === 0 ? (
                    <div
                      style={{
                        position: 'absolute',
                        top: 6,
                        left: 6,
                        background:
                          'var(--primary)',
                        color: '#0a0a0f',
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Star size={10} />
                      Principale
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        setMainImage(i)
                      }
                      title="Définir comme photo principale"
                      style={{
                        position: 'absolute',
                        top: 6,
                        left: 6,
                        background:
                          'rgba(0,0,0,0.6)',
                        border: 'none',
                        borderRadius: 6,
                        color: '#fff',
                        fontSize: 10,
                        padding: '3px 8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Star size={10} />
                      Principale
                    </button>
                  )}

                  <button
                    onClick={() =>
                      removeImage(i)
                    }
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      background:
                        'rgba(0,0,0,0.6)',
                      border: 'none',
                      borderRadius: '50%',
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#fff',
                    }}
                  >
                    <X size={12} />
                  </button>

                  <div
                    style={{
                      position: 'absolute',
                      bottom: 6,
                      right: 6,
                      background:
                        'rgba(0,0,0,0.5)',
                      color: '#fff',
                      fontSize: 10,
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}
                  >
                    {i + 1}/{images.length}
                  </div>
                </div>
              ))}
            </div>
          )}
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
              fontFamily:
                'Playfair Display, serif',
              marginBottom: 20,
            }}
          >
            Localisation
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
                VILLE *
              </label>

              <input
                style={inputStyle}
                placeholder="ex: Paris"
                value={form.city}
                onChange={set('city')}
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
                ADRESSE COMPLÈTE *
              </label>

              <input
                style={inputStyle}
                placeholder="ex: 12 rue de la Paix, 75001 Paris"
                value={form.address}
                onChange={set('address')}
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
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 28,
            marginBottom: 32,
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              fontFamily:
                'Playfair Display, serif',
              marginBottom: 20,
            }}
          >
            Équipements & Règles
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
                ÉQUIPEMENTS
              </label>

              <textarea
                style={{
                  ...inputStyle,
                  resize: 'none',
                  height: 80,
                }}
                placeholder="Parking, climatisation, sono, projecteur..."
                value={form.equipments}
                onChange={set('equipments')}
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
                RÈGLES DU LIEU
              </label>

              <textarea
                style={{
                  ...inputStyle,
                  resize: 'none',
                  height: 80,
                }}
                placeholder="Pas de fumée, musique jusqu'à 23h..."
                value={form.rules}
                onChange={set('rules')}
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          style={{
            width: '100%',
            background: 'var(--primary)',
            color: '#0a0a0f',
            border: 'none',
            borderRadius: 12,
            padding: '16px',
            fontSize: 16,
            fontWeight: 600,
            cursor: isLoading
              ? 'not-allowed'
              : 'pointer',
            opacity: isLoading ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            fontFamily:
              'DM Sans, sans-serif',
          }}
        >
          {isLoading ? (
            <>
              <Loader2
                size={18}
                style={{
                  animation:
                    'spin 1s linear infinite',
                }}
              />
              {loadingText}
            </>
          ) : (
            <>
              {images.length > 0
                ? `Publier le lieu avec ${
                    images.length
                  } photo${
                    images.length > 1
                      ? 's'
                      : ''
                  }`
                : 'Publier le lieu'}

              <ArrowRight size={18} />
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