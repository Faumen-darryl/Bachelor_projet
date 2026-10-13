'use client';

import Link from 'next/link';

import {
  MapPin,
  Users,
  Star,
  Building2,
} from 'lucide-react';

interface Venue {
  id: number;
  name: string;
  city: string;
  type: string;
  capacity: number;
  pricePerHour: number;
  rating: number;
  totalReviews: number;
  photos: { url: string }[];
  owner: {
    firstName: string;
    lastName: string;
  };
}

const typeLabels: Record<string, string> = {
  SALLE: 'Salle',
  JARDIN: 'Jardin',
  RESTAURANT: 'Restaurant',
  BOITE_DE_NUIT: 'Boîte de nuit',
  PARC: 'Parc',
  ESPACE_PUBLIC: 'Espace public',
  AUTRE: 'Autre',
};

// Affiche un aperçu d'un lieu dans le catalogue.
export default function VenueCard({
  venue,
}: {
  venue: Venue;
}) {
  const photo = venue.photos?.[0]?.url;

  return (
    <Link
      href={`/venues/${venue.id}`}
      style={{
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          overflow: 'hidden',
          transition:
            'transform 0.3s, border-color 0.3s',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform =
            'translateY(-6px)';
          e.currentTarget.style.borderColor =
            'rgba(201,169,110,0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform =
            'translateY(0)';
          e.currentTarget.style.borderColor =
            'var(--border)';
        }}
      >
        <div
          style={{
            height: 200,
            background: photo
              ? `url(${photo}) center/cover no-repeat`
              : 'linear-gradient(135deg, var(--surface-2), var(--surface))',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              background: 'rgba(10,10,15,0.8)',
              backdropFilter: 'blur(8px)',
              border: '1px solid var(--border)',
              borderRadius: 100,
              padding: '4px 12px',
              fontSize: 11,
              color: 'var(--primary)',
              fontWeight: 500,
              letterSpacing: 0.5,
            }}
          >
            {typeLabels[venue.type] || venue.type}
          </div>

          {venue.totalReviews > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'rgba(10,10,15,0.8)',
                backdropFilter: 'blur(8px)',
                border: '1px solid var(--border)',
                borderRadius: 100,
                padding: '4px 10px',
                fontSize: 12,
                color: 'var(--foreground)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Star
                size={11}
                fill="var(--primary)"
                color="var(--primary)"
              />
              {venue.rating.toFixed(1)}
            </div>
          )}

          {!photo && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                opacity: 0.2,
              }}
            >
              <Building2 size={40} />
            </div>
          )}
        </div>

        <div style={{ padding: 20 }}>
          <h3
            style={{
              fontSize: 17,
              fontWeight: 700,
              marginBottom: 6,
              fontFamily:
                'Playfair Display, serif',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {venue.name}
          </h3>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 12,
            }}
          >
            <MapPin
              size={13}
              color="var(--muted)"
            />

            <span
              style={{
                fontSize: 13,
                color: 'var(--muted)',
              }}
            >
              {venue.city}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 12,
              borderTop:
                '1px solid var(--border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Users
                size={13}
                color="var(--muted)"
              />

              <span
                style={{
                  fontSize: 13,
                  color: 'var(--muted)',
                }}
              >
                {venue.capacity} pers.
              </span>
            </div>

            <div
              style={{
                textAlign: 'right',
              }}
            >
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--primary)',
                  fontFamily:
                    'Playfair Display, serif',
                }}
              >
                {Number(
                  venue.pricePerHour
                ).toLocaleString('fr-FR')}{' '}
                €
              </span>

              <span
                style={{
                  fontSize: 11,
                  color: 'var(--muted)',
                  marginLeft: 4,
                }}
              >
                /h
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}