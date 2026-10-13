'use client';

import { useEffect, useState } from 'react';

import { api } from '@/lib/api';

import {
  Bell,
  Check,
  Loader2,
  CheckCircle,
  Clock,
  CreditCard,
  MessageSquare,
  XCircle,
  Star,
} from 'lucide-react';

// Affiche les notifications de l'utilisateur et permet de les marquer comme lues.
export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Charge les notifications au montage de la page.
  useEffect(() => {
    api
      .get('/notifications')
      .then(({ data }) => {
        setNotifications(data);
      })
      .finally(() => setLoading(false));
  }, []);

  // Marque toutes les notifications comme lues.
  const markAllRead = async () => {
    await api.put('/notifications/read-all');

    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        isRead: true,
      }))
    );
  };

  // Marque une notification précise comme lue.
  const markOneRead = async (id: number) => {
    await api.put(`/notifications/${id}/read`);

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              isRead: true,
            }
          : n
      )
    );
  };

  // Retourne l'icône correspondant au type de notification.
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CONFIRMATION':
        return <CheckCircle size={22} />;

      case 'RAPPEL':
        return <Clock size={22} />;

      case 'PAIEMENT':
        return <CreditCard size={22} />;

      case 'MESSAGE':
        return <MessageSquare size={22} />;

      case 'ANNULATION':
        return <XCircle size={22} />;

      case 'AVIS':
        return <Star size={22} />;

      default:
        return <Bell size={22} />;
    }
  };

  const unreadCount = notifications.filter(
    (n) => !n.isRead
  ).length;

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
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 32,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 900,
              fontFamily: 'Playfair Display, serif',
              marginBottom: 4,
            }}
          >
            Notifications
          </h1>

          <p
            style={{
              color: 'var(--muted)',
              fontSize: 14,
            }}
          >
            {unreadCount} non lue
            {unreadCount > 1 ? 's' : ''}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '8px 16px',
              cursor: 'pointer',
              color: 'var(--foreground)',
              fontSize: 13,
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            <Check size={14} />
            Tout marquer comme lu
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '80px 24px',
            background: 'var(--surface)',
            borderRadius: 20,
            border: '1px solid var(--border)',
          }}
        >
          <Bell
            size={48}
            color="var(--muted)"
            style={{
              margin: '0 auto 16px',
              opacity: 0.3,
            }}
          />

          <h3
            style={{
              fontSize: 20,
              marginBottom: 8,
            }}
          >
            Aucune notification
          </h3>

          <p
            style={{
              color: 'var(--muted)',
              fontSize: 14,
            }}
          >
            Vous êtes à jour !
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() =>
                !n.isRead &&
                markOneRead(n.id)
              }
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
                cursor: !n.isRead
                  ? 'pointer'
                  : 'default',
                opacity: n.isRead ? 0.6 : 1,
                transition: 'all 0.2s',
                borderLeft: !n.isRead
                  ? '3px solid var(--primary)'
                  : '3px solid transparent',
              }}
            >
              <div
                style={{
                  color: 'var(--primary)',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {getTypeIcon(n.type)}
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                  }}
                >
                  <p
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    {n.title}
                  </p>

                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--muted)',
                    }}
                  >
                    {new Date(
                      n.createdAt
                    ).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p
                  style={{
                    color: 'var(--muted)',
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  {n.content}
                </p>
              </div>

              {!n.isRead && (
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    flexShrink: 0,
                    marginTop: 4,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}