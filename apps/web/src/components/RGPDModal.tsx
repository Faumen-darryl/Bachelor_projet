'use client';

import { useState } from 'react';

import {
  ShieldCheck,
  ClipboardList,
  User,
  CalendarDays,
  CreditCard,
  MessageSquare,
  Target,
  Scale,
  Check,
  ArrowRight,
} from 'lucide-react';

interface RGPDModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  type?: 'lieu' | 'service';
}

// Affiche les informations RGPD avant la confirmation d'une réservation.
export default function RGPDModal({
  isOpen,
  onConfirm,
  onCancel,
  loading = false,
  type = 'lieu',
}: RGPDModalProps) {
  const [checkedConditions, setCheckedConditions] = useState(false);
  const [checkedDonnees, setCheckedDonnees] = useState(false);
  const [checkedContact, setCheckedContact] = useState(false);

  const canConfirm =
    checkedConditions &&
    checkedDonnees &&
    checkedContact;

  if (!isOpen) {
    return null;
  }

  const collectedData = [
    {
      icon: <User size={14} />,
      label:
        'Vos informations personnelles (nom, prénom, email, téléphone)',
    },
    {
      icon: <CalendarDays size={14} />,
      label:
        type === 'lieu'
          ? "Les dates, horaires et nombre d'invités de votre événement"
          : 'La date et les détails de votre événement',
    },
    {
      icon: <CreditCard size={14} />,
      label:
        'Les informations de paiement (traitées par Stripe — jamais stockées chez Evently)',
    },
    {
      icon: <MessageSquare size={14} />,
      label:
        'Les messages échangés avec le prestataire dans le cadre de cette réservation',
    },
  ];

  const purposes = [
    'Traiter et confirmer votre réservation',
    'Permettre la communication avec le prestataire',
    'Émettre votre facture et gérer le paiement sécurisé',
    'Vous envoyer les confirmations et rappels par email',
    "Résoudre d'éventuels litiges",
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '32px 28px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              flexShrink: 0,
              background: 'rgba(201, 169, 110, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}
          >
            <ShieldCheck size={20} />
          </div>

          <div>
            <h2
              style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: 20,
                color: 'var(--foreground)',
                margin: '0 0 4px',
              }}
            >
              Confirmation et protection des données
            </h2>

            <p
              style={{
                fontSize: 13,
                color: 'var(--muted)',
                margin: 0,
              }}
            >
              Avant de finaliser votre réservation{' '}
              {type === 'lieu'
                ? 'de lieu'
                : 'de service'}
              , veuillez prendre connaissance des informations suivantes.
            </p>
          </div>
        </div>

        <div
          style={{
            height: 1,
            background: 'var(--border)',
            marginBottom: 24,
          }}
        />

        <div
          style={{
            background: 'rgba(201, 169, 110, 0.06)',
            border: '1px solid rgba(201, 169, 110, 0.2)',
            borderRadius: 12,
            padding: '16px 18px',
            marginBottom: 24,
          }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--primary)',
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <ClipboardList size={15} />
            Données collectées lors de cette réservation
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            {collectedData.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    marginTop: 2,
                    color: 'var(--primary)',
                    display: 'flex',
                  }}
                >
                  {item.icon}
                </span>

                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--muted)',
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '14px 18px',
            marginBottom: 24,
          }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--foreground)',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <Target size={15} />
            Pourquoi collectons-nous ces données ?
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 5,
            }}
          >
            {purposes.map((item, index) => (
              <p
                key={index}
                style={{
                  fontSize: 13,
                  color: 'var(--muted)',
                  margin: 0,
                  lineHeight: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <ArrowRight
                  size={12}
                  style={{ flexShrink: 0 }}
                />
                {item}
              </p>
            ))}
          </div>
        </div>

        <div
          style={{
            background: 'rgba(59, 130, 246, 0.05)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: 12,
            padding: '14px 18px',
            marginBottom: 28,
          }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#60a5fa',
              marginBottom: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <Scale size={15} />
            Vos droits (RGPD — Règlement Européen 2016/679)
          </p>

          <p
            style={{
              fontSize: 13,
              color: 'var(--muted)',
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            Conformément au RGPD, vous disposez d'un droit d'accès, de rectification,
            d'effacement et de portabilité de vos données. Vous pouvez exercer ces droits
            à tout moment en contactant{' '}
            <strong
              style={{
                color: 'var(--foreground)',
              }}
            >
              contact@evently.fr
            </strong>
            . Vos données sont conservées pour la durée légale applicable et ne sont jamais
            revendues à des tiers.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            marginBottom: 28,
          }}
        >
          <label
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
              cursor: 'pointer',
            }}
          >
            <div
              onClick={() =>
                setCheckedConditions(
                  !checkedConditions
                )
              }
              style={{
                width: 20,
                height: 20,
                borderRadius: 5,
                flexShrink: 0,
                border: `2px solid ${
                  checkedConditions
                    ? 'var(--primary)'
                    : 'var(--border)'
                }`,
                background: checkedConditions
                  ? 'var(--primary)'
                  : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s',
                marginTop: 1,
              }}
            >
              {checkedConditions && (
                <Check
                  size={13}
                  color="#0a0a0f"
                  strokeWidth={3}
                />
              )}
            </div>

            <p
              style={{
                fontSize: 13,
                color: 'var(--foreground)',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              J'ai lu et j'accepte les{' '}
              <span
                style={{
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                conditions générales d'utilisation
              </span>{' '}
              et la{' '}
              <span
                style={{
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                politique de confidentialité
              </span>{' '}
              d'Evently.{' '}
              <span style={{ color: '#ef4444' }}>
                *
              </span>
            </p>
          </label>

          <label
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
              cursor: 'pointer',
            }}
          >
            <div
              onClick={() =>
                setCheckedDonnees(
                  !checkedDonnees
                )
              }
              style={{
                width: 20,
                height: 20,
                borderRadius: 5,
                flexShrink: 0,
                border: `2px solid ${
                  checkedDonnees
                    ? 'var(--primary)'
                    : 'var(--border)'
                }`,
                background: checkedDonnees
                  ? 'var(--primary)'
                  : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s',
                marginTop: 1,
              }}
            >
              {checkedDonnees && (
                <Check
                  size={13}
                  color="#0a0a0f"
                  strokeWidth={3}
                />
              )}
            </div>

            <p
              style={{
                fontSize: 13,
                color: 'var(--foreground)',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Je consens au traitement de mes données personnelles dans le but de traiter
              ma réservation, conformément au RGPD.{' '}
              <span style={{ color: '#ef4444' }}>
                *
              </span>
            </p>
          </label>

          <label
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
              cursor: 'pointer',
            }}
          >
            <div
              onClick={() =>
                setCheckedContact(
                  !checkedContact
                )
              }
              style={{
                width: 20,
                height: 20,
                borderRadius: 5,
                flexShrink: 0,
                border: `2px solid ${
                  checkedContact
                    ? 'var(--primary)'
                    : 'var(--border)'
                }`,
                background: checkedContact
                  ? 'var(--primary)'
                  : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s',
                marginTop: 1,
              }}
            >
              {checkedContact && (
                <Check
                  size={13}
                  color="#0a0a0f"
                  strokeWidth={3}
                />
              )}
            </div>

            <p
              style={{
                fontSize: 13,
                color: 'var(--foreground)',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              J'autorise Evently à transmettre mes coordonnées au prestataire concerné
              uniquement dans le cadre de cette réservation.{' '}
              <span style={{ color: '#ef4444' }}>
                *
              </span>
            </p>
          </label>
        </div>

        {!canConfirm && (
          <p
            style={{
              fontSize: 12,
              color: 'var(--muted)',
              textAlign: 'center',
              marginBottom: 16,
            }}
          >
            Veuillez cocher les 3 cases obligatoires{' '}
            <span style={{ color: '#ef4444' }}>
              *
            </span>{' '}
            pour continuer.
          </p>
        )}

        <div
          style={{
            display: 'flex',
            gap: 12,
          }}
        >
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 10,
              color: 'var(--muted)',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Annuler
          </button>

          <button
            onClick={onConfirm}
            disabled={!canConfirm || loading}
            style={{
              flex: 2,
              padding: '12px',
              background: canConfirm
                ? 'var(--primary)'
                : 'var(--surface-2)',
              border: `1px solid ${
                canConfirm
                  ? 'var(--primary)'
                  : 'var(--border)'
              }`,
              borderRadius: 10,
              color: canConfirm
                ? '#0a0a0f'
                : 'var(--muted)',
              fontSize: 14,
              fontWeight: 700,
              cursor: canConfirm
                ? 'pointer'
                : 'not-allowed',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {loading ? (
              'Envoi en cours...'
            ) : (
              <>
                <Check size={15} />
                Confirmer et réserver
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}