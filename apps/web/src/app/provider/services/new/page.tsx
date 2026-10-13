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
  Briefcase,
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

const MAX_IMAGES = 5;

// Affiche le formulaire de création d'un service.
export default function NewServicePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: '',
    category: 'DJ',
    description: '',
    price: '',
  });

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

  // Crée le service puis ajoute les photos sélectionnées.
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

    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/services', {
        name: form.name,
        category: form.category,
        description: form.description,
        price: Number(form.price),
      });

      const serviceId = data.id;

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
            `/services/${serviceId}/photos`,
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

      router.push('/provider/services');
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
          Ajouter un service
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
              gridTemplateColumns:
                'repeat(2, 1fr)',
              gap: 10,
            }}
          >
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() =>
                  setForm({
                    ...form,
                    category: category.value,
                  })
                }
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  border:
                    form.category ===
                    category.value
                      ? '1px solid var(--primary)'
                      : '1px solid var(--border)',
                  background:
                    form.category ===
                    category.value
                      ? 'rgba(201,169,110,0.1)'
                      : 'var(--surface-2)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  fontFamily:
                    'DM Sans, sans-serif',
                }}
              >
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color:
                      form.category ===
                      category.value
                        ? 'var(--primary)'
                        : 'var(--foreground)',
                    marginBottom: 2,
                  }}
                >
                  {category.label}
                </p>

                <p
                  style={{
                    fontSize: 11,
                    color: 'var(--muted)',
                  }}
                >
                  {category.desc}
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
              Photos du service
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
            Ajoutez jusqu'à 5 photos de votre service. La première photo sera utilisée comme photo principale.
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
                  JPG, PNG, WebP — Max 5MB —{' '}
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
                      justifyContent:
                        'center',
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
                DESCRIPTION DÉTAILLÉE *
              </label>

              <textarea
                style={{
                  ...inputStyle,
                  resize: 'none',
                  height: 140,
                }}
                placeholder="Décrivez votre service : expérience, matériel fourni, durée, conditions..."
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
                PRIX DE BASE (€) *
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
                    transform:
                      'translateY(-50%)',
                    color: 'var(--muted)',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  €
                </span>
              </div>

              <p
                style={{
                  fontSize: 11,
                  color: 'var(--muted)',
                  marginTop: 4,
                }}
              >
                Prix pour une prestation standard. Vous pourrez négocier avec le client.
              </p>
            </div>
          </div>
        </div>

        {(form.name || form.price) && (
          <div
            style={{
              background:
                'rgba(201,169,110,0.06)',
              border:
                '1px solid rgba(201,169,110,0.2)',
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
            }}
          >
            <p
              style={{
                fontSize: 12,
                color: 'var(--primary)',
                marginBottom: 12,
                fontWeight: 600,
                letterSpacing: 0.5,
              }}
            >
              APERÇU DE VOTRE SERVICE
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              {previews.length > 0 ? (
                <img
                  src={previews[0]}
                  alt="Aperçu"
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    objectFit: 'cover',
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    flexShrink: 0,
                    background:
                      'rgba(201,169,110,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                  }}
                >
                  <Briefcase size={24} />
                </div>
              )}

              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: 15,
                    marginBottom: 2,
                  }}
                >
                  {form.name ||
                    'Nom du service'}
                </p>

                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--muted)',
                  }}
                >
                  {form.category}
                </p>
              </div>

              {form.price && (
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: 'var(--primary)',
                    fontFamily:
                      'Playfair Display, serif',
                  }}
                >
                  {Number(
                    form.price
                  ).toLocaleString('fr-FR')}{' '}
                  €
                </span>
              )}
            </div>
          </div>
        )}

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
                ? `Publier avec ${
                    images.length
                  } photo${
                    images.length > 1
                      ? 's'
                      : ''
                  }`
                : 'Publier le service'}

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