'use client';

import { useEffect, useState } from 'react';

import ChatBox from '@/components/ChatBox';
import { api } from '@/lib/api';

import {
  Plus,
  X,
  Loader2,
  Search,
  Building2,
  Briefcase,
  CheckCircle,
} from 'lucide-react';

// Affiche les conversations du prestataire et permet d'en démarrer une nouvelle.
export default function ProviderMessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewConv, setShowNewConv] = useState(false);
  const [venueReservations, setVenueReservations] = useState<any[]>([]);
  const [serviceReservations, setServiceReservations] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [search, setSearch] = useState('');
  const [sendingNew, setSendingNew] = useState<string | null>(null);
  const [msgContent, setMsgContent] = useState<Record<string, string>>({});
  const [sent, setSent] = useState<string[]>([]);
  const [contactTab, setContactTab] = useState<'venues' | 'services'>('venues');

  // Charge les conversations liées aux lieux et aux services.
  useEffect(() => {
    Promise.all([
      api.get('/messages/conversations'),
      api.get('/service-bookings/conversations'),
    ])
      .then(([m, s]) => {
        const venueConvs = (m.data || []).map((c: any) => ({
          ...c,
          type: 'VENUE',
        }));

        const serviceConvs = (s.data || []).map((c: any) => ({
          ...c,
          type: 'SERVICE',
        }));

        setConversations([
          ...venueConvs,
          ...serviceConvs,
        ]);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Charge les réservations actives permettant de contacter un client.
  const handleOpenNewConv = async () => {
    setShowNewConv(true);
    setLoadingContacts(true);

    try {
      const [v, s] = await Promise.all([
        api.get('/reservations/provider'),
        api.get('/service-bookings/provider'),
      ]);

      setVenueReservations(
        (v.data || []).filter(
          (r: any) =>
            r.status === 'EN_ATTENTE' ||
            r.status === 'CONFIRMEE'
        )
      );

      setServiceReservations(
        (s.data || []).filter(
          (r: any) =>
            r.status === 'EN_ATTENTE' ||
            r.status === 'CONFIRMEE'
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingContacts(false);
    }
  };

  // Envoie un premier message puis recharge les conversations.
  const handleSend = async (
    id: number,
    type: 'venue' | 'service'
  ) => {
    const key = `${type}-${id}`;
    const content = msgContent[key];

    if (!content?.trim()) {
      return;
    }

    setSendingNew(key);

    try {
      if (type === 'venue') {
        await api.post('/messages/send', {
          reservationId: id,
          content,
        });
      } else {
        await api.post('/service-bookings/messages', {
          bookingId: id,
          content,
        });
      }

      setSent((prev) => [
        ...prev,
        key,
      ]);

      setMsgContent((prev) => ({
        ...prev,
        [key]: '',
      }));

      const [m, s] = await Promise.all([
        api.get('/messages/conversations'),
        api.get('/service-bookings/conversations'),
      ]);

      const venueConvs = (m.data || []).map((c: any) => ({
        ...c,
        type: 'VENUE',
      }));

      const serviceConvs = (s.data || []).map((c: any) => ({
        ...c,
        type: 'SERVICE',
      }));

      setConversations([
        ...venueConvs,
        ...serviceConvs,
      ]);

      setTimeout(() => {
        setShowNewConv(false);

        setSent((prev) =>
          prev.filter((k) => k !== key)
        );
      }, 1500);
    } catch (err: any) {
      alert(
        err.response?.data?.message ||
          'Erreur.'
      );
    } finally {
      setSendingNew(null);
    }
  };

  // Filtre les réservations de lieux selon la recherche.
  const filteredVenues = search
    ? venueReservations.filter((r) =>
        `${r.venue?.name} ${r.client?.firstName} ${r.client?.lastName}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : venueReservations;

  // Filtre les réservations de services selon la recherche.
  const filteredServices = search
    ? serviceReservations.filter((r) =>
        `${r.service?.name} ${r.client?.firstName} ${r.client?.lastName}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : serviceReservations;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
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
            Messages
          </h1>

          <p
            style={{
              color: 'var(--muted)',
              fontSize: 14,
            }}
          >
            Échangez avec vos clients
          </p>
        </div>

        <button
          onClick={handleOpenNewConv}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--primary)',
            color: '#0a0a0f',
            border: 'none',
            borderRadius: 12,
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          <Plus size={16} />
          Nouveau message
        </button>
      </div>

      {showNewConv && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowNewConv(false);
            }
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              width: '100%',
              maxWidth: 560,
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
            }}
          >
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  fontFamily: 'Playfair Display, serif',
                }}
              >
                Contacter un client
              </h2>

              <button
                onClick={() => setShowNewConv(false)}
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: 6,
                  cursor: 'pointer',
                  color: 'var(--muted)',
                  display: 'flex',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div
              style={{
                padding: '14px 24px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ position: 'relative' }}>
                <Search
                  size={14}
                  color="var(--muted)"
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                />

                <input
                  style={{
                    width: '100%',
                    padding: '9px 14px 9px 34px',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    color: 'var(--foreground)',
                    fontSize: 13,
                    outline: 'none',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                  placeholder="Rechercher un client..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  autoFocus
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--border)',
              }}
            >
              {[
                {
                  key: 'venues',
                  label: 'Via mes lieux',
                  count: filteredVenues.length,
                  icon: <Building2 size={14} />,
                },
                {
                  key: 'services',
                  label: 'Via mes services',
                  count: filteredServices.length,
                  icon: <Briefcase size={14} />,
                },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() =>
                    setContactTab(t.key as any)
                  }
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: 'none',
                    borderBottom:
                      contactTab === t.key
                        ? '2px solid var(--primary)'
                        : '2px solid transparent',
                    background: 'none',
                    cursor: 'pointer',
                    color:
                      contactTab === t.key
                        ? 'var(--primary)'
                        : 'var(--muted)',
                    fontSize: 13,
                    fontWeight:
                      contactTab === t.key
                        ? 600
                        : 400,
                    fontFamily: 'DM Sans, sans-serif',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  {t.icon}
                  {t.label}

                  <span
                    style={{
                      background: 'var(--surface-2)',
                      padding: '1px 7px',
                      borderRadius: 100,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {t.count}
                  </span>
                </button>
              ))}
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '8px 0',
              }}
            >
              {loadingContacts ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 40,
                    gap: 8,
                  }}
                >
                  <Loader2
                    size={20}
                    color="var(--primary)"
                    style={{
                      animation: 'spin 1s linear infinite',
                    }}
                  />

                  <style>
                    {`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
                  </style>
                </div>
              ) : contactTab === 'venues' ? (
                filteredVenues.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '40px 24px',
                      color: 'var(--muted)',
                    }}
                  >
                    <p style={{ fontSize: 14 }}>
                      Aucun client via vos lieux
                    </p>
                  </div>
                ) : (
                  filteredVenues.map((r) => {
                    const key = `venue-${r.id}`;
                    const isSent = sent.includes(key);
                    const isSending = sendingNew === key;

                    return (
                      <div
                        key={r.id}
                        style={{
                          padding: '14px 24px',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            marginBottom: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: '50%',
                              flexShrink: 0,
                              background: 'rgba(96,165,250,0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 18,
                              fontWeight: 700,
                              color: '#60a5fa',
                              border: '1px solid rgba(96,165,250,0.3)',
                            }}
                          >
                            {r.client?.firstName?.[0]?.toUpperCase()}
                          </div>

                          <div style={{ flex: 1 }}>
                            <p
                              style={{
                                fontWeight: 700,
                                fontSize: 14,
                                marginBottom: 2,
                              }}
                            >
                              {r.client?.firstName} {r.client?.lastName}
                            </p>

                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                              }}
                            >
                              <p
                                style={{
                                  fontSize: 12,
                                  color: 'var(--muted)',
                                }}
                              >
                                {r.venue?.name}
                              </p>

                              <span
                                style={{
                                  background:
                                    r.status === 'CONFIRMEE'
                                      ? 'rgba(74,222,128,0.1)'
                                      : 'rgba(245,158,11,0.1)',
                                  color:
                                    r.status === 'CONFIRMEE'
                                      ? '#4ade80'
                                      : '#f59e0b',
                                  padding: '1px 7px',
                                  borderRadius: 100,
                                  fontSize: 10,
                                  fontWeight: 600,
                                }}
                              >
                                {r.status === 'CONFIRMEE'
                                  ? 'Confirmée'
                                  : 'En attente'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {isSent ? (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              background: 'rgba(74,222,128,0.1)',
                              border: '1px solid rgba(74,222,128,0.3)',
                              borderRadius: 10,
                              padding: '10px 14px',
                              color: '#4ade80',
                              fontSize: 13,
                            }}
                          >
                            <CheckCircle size={14} />
                            Message envoyé à {r.client?.firstName} !
                          </div>
                        ) : (
                          <div
                            style={{
                              display: 'flex',
                              gap: 8,
                            }}
                          >
                            <input
                              style={{
                                flex: 1,
                                padding: '9px 14px',
                                background: 'var(--surface-2)',
                                border: '1px solid var(--border)',
                                borderRadius: 10,
                                color: 'var(--foreground)',
                                fontSize: 13,
                                outline: 'none',
                                fontFamily: 'DM Sans, sans-serif',
                              }}
                              placeholder={`Écrire à ${r.client?.firstName}...`}
                              value={msgContent[key] || ''}
                              onChange={(e) =>
                                setMsgContent((prev) => ({
                                  ...prev,
                                  [key]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) =>
                                e.key === 'Enter' &&
                                handleSend(r.id, 'venue')
                              }
                            />

                            <button
                              onClick={() =>
                                handleSend(r.id, 'venue')
                              }
                              disabled={
                                !msgContent[key]?.trim() ||
                                isSending
                              }
                              style={{
                                background: 'var(--primary)',
                                color: '#0a0a0f',
                                border: 'none',
                                borderRadius: 10,
                                padding: '9px 16px',
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: 600,
                                fontFamily: 'DM Sans, sans-serif',
                                opacity:
                                  !msgContent[key]?.trim() ||
                                  isSending
                                    ? 0.5
                                    : 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                              }}
                            >
                              {isSending ? (
                                <Loader2
                                  size={14}
                                  style={{
                                    animation:
                                      'spin 1s linear infinite',
                                  }}
                                />
                              ) : (
                                'Envoyer'
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )
              ) : filteredServices.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px 24px',
                    color: 'var(--muted)',
                  }}
                >
                  <p style={{ fontSize: 14 }}>
                    Aucun client via vos services
                  </p>
                </div>
              ) : (
                filteredServices.map((b) => {
                  const key = `service-${b.id}`;
                  const isSent = sent.includes(key);
                  const isSending = sendingNew === key;

                  return (
                    <div
                      key={b.id}
                      style={{
                        padding: '14px 24px',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          marginBottom: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            flexShrink: 0,
                            background: 'rgba(96,165,250,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 18,
                            fontWeight: 700,
                            color: '#60a5fa',
                            border: '1px solid rgba(96,165,250,0.3)',
                          }}
                        >
                          {b.client?.firstName?.[0]?.toUpperCase()}
                        </div>

                        <div style={{ flex: 1 }}>
                          <p
                            style={{
                              fontWeight: 700,
                              fontSize: 14,
                              marginBottom: 2,
                            }}
                          >
                            {b.client?.firstName} {b.client?.lastName}
                          </p>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <Briefcase
                              size={12}
                              color="var(--muted)"
                            />

                            <p
                              style={{
                                fontSize: 12,
                                color: 'var(--muted)',
                              }}
                            >
                              {b.service?.name}
                            </p>

                            <span
                              style={{
                                background:
                                  b.status === 'CONFIRMEE'
                                    ? 'rgba(74,222,128,0.1)'
                                    : 'rgba(245,158,11,0.1)',
                                color:
                                  b.status === 'CONFIRMEE'
                                    ? '#4ade80'
                                    : '#f59e0b',
                                padding: '1px 7px',
                                borderRadius: 100,
                                fontSize: 10,
                                fontWeight: 600,
                              }}
                            >
                              {b.status === 'CONFIRMEE'
                                ? 'Confirmée'
                                : 'En attente'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isSent ? (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            background: 'rgba(74,222,128,0.1)',
                            border: '1px solid rgba(74,222,128,0.3)',
                            borderRadius: 10,
                            padding: '10px 14px',
                            color: '#4ade80',
                            fontSize: 13,
                          }}
                        >
                          <CheckCircle size={14} />
                          Message envoyé à {b.client?.firstName} !
                        </div>
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            gap: 8,
                          }}
                        >
                          <input
                            style={{
                              flex: 1,
                              padding: '9px 14px',
                              background: 'var(--surface-2)',
                              border: '1px solid var(--border)',
                              borderRadius: 10,
                              color: 'var(--foreground)',
                              fontSize: 13,
                              outline: 'none',
                              fontFamily: 'DM Sans, sans-serif',
                            }}
                            placeholder={`Écrire à ${b.client?.firstName}...`}
                            value={msgContent[key] || ''}
                            onChange={(e) =>
                              setMsgContent((prev) => ({
                                ...prev,
                                [key]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) =>
                              e.key === 'Enter' &&
                              handleSend(b.id, 'service')
                            }
                          />

                          <button
                            onClick={() =>
                              handleSend(b.id, 'service')
                            }
                            disabled={
                              !msgContent[key]?.trim() ||
                              isSending
                            }
                            style={{
                              background: 'var(--primary)',
                              color: '#0a0a0f',
                              border: 'none',
                              borderRadius: 10,
                              padding: '9px 16px',
                              cursor: 'pointer',
                              fontSize: 13,
                              fontWeight: 600,
                              fontFamily: 'DM Sans, sans-serif',
                              opacity:
                                !msgContent[key]?.trim() ||
                                isSending
                                  ? 0.5
                                  : 1,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            {isSending ? (
                              <Loader2
                                size={14}
                                style={{
                                  animation:
                                    'spin 1s linear infinite',
                                }}
                              />
                            ) : (
                              'Envoyer'
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      <ChatBox
        conversations={conversations}
        loadingConvs={loading}
      />
    </div>
  );
}