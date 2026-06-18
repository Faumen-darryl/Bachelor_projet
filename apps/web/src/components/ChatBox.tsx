'use client';
import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Send, MessageSquare, Loader2, Wifi, WifiOff, Check, CheckCheck } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface Props {
  conversations: any[];
  loadingConvs: boolean;
}

export default function ChatBox({ conversations, loadingConvs }: Props) {
  const { user, token } = useAuthStore();
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [socketStatus, setSocketStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [localConvs, setLocalConvs] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalConvs(conversations);
  }, [conversations]);

  useEffect(() => {
    let storedToken = token;
    if (!storedToken) {
      try {
        const s = localStorage.getItem('evently_auth');
        storedToken = s ? JSON.parse(s)?.state?.token : null;
      } catch { storedToken = null; }
    }

    if (!storedToken) { setSocketStatus('error'); return; }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

    const socket = io(socketUrl, {
      auth: { token: storedToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => setSocketStatus('connected'));
    socket.on('connect_error', () => setSocketStatus('error'));
    socket.on('disconnect', () => setSocketStatus('error'));
    socket.on('reconnect', () => setSocketStatus('connected'));

    socket.on('message:received', (msg: any) => {
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setLocalConvs(prev => prev.map(c => {
        const rid = c.reservationId || c.bookingId;
        if (rid === msg.reservationId || rid === msg.serviceBookingId) {
          return {
            ...c,
            lastMessage: {
              content: msg.content,
              sentAt: msg.sentAt,
              senderId: msg.senderId,
              isRead: msg.senderId === user?.id,
              isMine: msg.senderId === user?.id,
            },
            unreadCount: msg.senderId !== user?.id ? (c.unreadCount || 0) + 1 : (c.unreadCount || 0),
          };
        }
        return c;
      }));
    });

    return () => { socket.disconnect(); };
  }, [token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Récupérer le nom à afficher pour la conversation
  const getConvTitle = (conv: any) => {
    if (conv.type === 'SERVICE') {
      return conv.serviceName || conv.service?.name || 'Service';
    }
    return conv.venue?.name || conv.reservation?.venue?.name || `Réservation #${conv.reservationId}`;
  };

  // Récupérer l'autre utilisateur
  const getOtherUser = (conv: any) => {
    return conv.otherUser || conv.receiver || conv.sender;
  };

  const openConversation = async (conv: any) => {
    setActiveConv(conv);
    setLoadingMsgs(true);

    setLocalConvs(prev => prev.map(c => {
      const cId = c.reservationId || c.bookingId;
      const convId = conv.reservationId || conv.bookingId;
      return cId === convId ? { ...c, unreadCount: 0 } : c;
    }));

    try {
      let data;
      if (conv.type === 'SERVICE') {
        // Messages de service booking
        const res = await api.get(`/service-bookings/${conv.bookingId}/messages`);
        data = res.data;
      } else {
        // Messages de réservation de lieu
        const rid = conv.reservationId;
        const res = await api.get(`/messages/${rid}`);
        data = res.data;
        socketRef.current?.emit('join:reservation', rid);
      }
      setMessages(data || []);
    } catch (err) {
      console.error(err);
      setMessages([]);
    } finally {
      setLoadingMsgs(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !activeConv) return;
    setSending(true);
    const content = newMsg.trim();
    setNewMsg('');

    try {
      if (activeConv.type === 'SERVICE') {
        // Envoyer via HTTP pour les services
        const { data } = await api.post('/service-bookings/messages', {
          bookingId: activeConv.bookingId,
          content,
        });
        const newMessage = {
          ...data,
          sentAt: data.sentAt || new Date().toISOString(),
          sender: {
            id: user?.id,
            firstName: user?.firstName,
            lastName: user?.lastName,
          },
        };
        setMessages(prev => [...prev, newMessage]);
      } else {
        // Envoyer via Socket ou HTTP pour les lieux
        if (socketRef.current?.connected) {
          const other = getOtherUser(activeConv);
          socketRef.current.emit('message:send', {
            reservationId: activeConv.reservationId,
            receiverId: other?.id,
            content,
          });
        } else {
          const { data } = await api.post('/messages/send', {
            reservationId: activeConv.reservationId,
            content,
          });
          const newMessage = {
            ...data,
            sentAt: data.sentAt || new Date().toISOString(),
            sender: {
              id: user?.id,
              firstName: user?.firstName,
              lastName: user?.lastName,
            },
          };
          setMessages(prev => [...prev, newMessage]);
        }
      }

      // Mettre à jour dernier message dans la liste
      setLocalConvs(prev => prev.map(c => {
        const cId = c.reservationId || c.bookingId;
        const convId = activeConv.reservationId || activeConv.bookingId;
        return cId === convId ? {
          ...c,
          lastMessage: {
            content,
            sentAt: new Date().toISOString(),
            senderId: user?.id || 0,
            isRead: false,
            isMine: true,
          },
        } : c;
      }));
    } catch (err: any) {
      console.error(err);
      setNewMsg(content);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date: string) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return d.toLocaleDateString('fr-FR', { weekday: 'short' });
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const totalUnread = localConvs.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  return (
    <div>
      {/* Statut socket */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        marginBottom: 16, padding: '5px 12px',
        background: socketStatus === 'connected'
          ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
        border: `1px solid ${socketStatus === 'connected'
          ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`,
        borderRadius: 100,
      }}>
        {socketStatus === 'connected' ? (
          <><Wifi size={12} color="#4ade80" />
          <span style={{ fontSize: 11, color: '#4ade80' }}>Temps réel actif</span></>
        ) : socketStatus === 'error' ? (
          <><WifiOff size={12} color="#f87171" />
          <span style={{ fontSize: 11, color: '#f87171' }}>Mode HTTP</span></>
        ) : (
          <><Loader2 size={12} color="#f59e0b"
            style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 11, color: '#f59e0b' }}>Connexion...</span>
          <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
          </>
        )}
      </div>

      <div style={{
        display: 'flex',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 20, overflow: 'hidden', height: '72vh',
      }}>

        {/* ── Liste conversations ── */}
        <div style={{
          width: 320, flexShrink: 0,
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            padding: '18px 20px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <p style={{ fontWeight: 700, fontSize: 15 }}>Messages</p>
            {totalUnread > 0 && (
              <span style={{
                background: 'var(--primary)', color: '#0a0a0f',
                borderRadius: 100, padding: '2px 8px',
                fontSize: 11, fontWeight: 700,
              }}>
                {totalUnread}
              </span>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingConvs ? (
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', height: '100%', gap: 8,
              }}>
                <Loader2 size={20} color="var(--primary)"
                  style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            ) : localConvs.length === 0 ? (
              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                height: '100%', gap: 12, padding: 24, textAlign: 'center',
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'rgba(201,169,110,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <MessageSquare size={24} color="var(--primary)" style={{ opacity: 0.4 }} />
                </div>
                <p style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 600 }}>
                  Aucune conversation
                </p>
                <p style={{ color: 'var(--muted)', fontSize: 11, lineHeight: 1.5 }}>
                  Envoyez un message depuis vos réservations pour démarrer
                </p>
              </div>
            ) : (
              localConvs.map((conv, index) => {
                const convId = conv.reservationId || conv.bookingId;
                const activeId = activeConv
                  ? (activeConv.reservationId || activeConv.bookingId)
                  : null;
                const active = convId === activeId;
                const hasUnread = (conv.unreadCount || 0) > 0;
                const other = getOtherUser(conv);
                const title = getConvTitle(conv);

                return (
                  <div
                    key={`${conv.type || 'VENUE'}-${convId}-${index}`}
                    onClick={() => openConversation(conv)}
                    style={{
                      padding: '14px 20px', cursor: 'pointer',
                      borderBottom: '1px solid var(--border)',
                      background: active
                        ? 'rgba(201,169,110,0.1)'
                        : hasUnread ? 'rgba(201,169,110,0.04)' : 'transparent',
                      borderLeft: active
                        ? '3px solid var(--primary)'
                        : hasUnread ? '3px solid rgba(201,169,110,0.4)' : '3px solid transparent',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                      if (!active)
                        (e.currentTarget as HTMLElement).style.background =
                          'rgba(201,169,110,0.06)';
                    }}
                    onMouseLeave={e => {
                      if (!active)
                        (e.currentTarget as HTMLElement).style.background =
                          hasUnread ? 'rgba(201,169,110,0.04)' : 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      {/* Avatar */}
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: '50%',
                          background: active
                            ? 'rgba(201,169,110,0.3)' : 'rgba(201,169,110,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 17, fontWeight: 700, color: 'var(--primary)',
                          fontFamily: 'Playfair Display, serif',
                          border: active ? '2px solid var(--primary)' : '2px solid transparent',
                        }}>
                          {other?.firstName?.[0]?.toUpperCase() || '?'}
                        </div>
                        {hasUnread && !active && (
                          <div style={{
                            position: 'absolute', top: -2, right: -2,
                            width: 18, height: 18, borderRadius: '50%',
                            background: 'var(--primary)', color: '#0a0a0f',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, fontWeight: 700,
                            border: '2px solid var(--surface)',
                          }}>
                            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                          </div>
                        )}
                      </div>

                      {/* Infos */}
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{
                          display: 'flex', justifyContent: 'space-between',
                          alignItems: 'center', marginBottom: 2,
                        }}>
                          <p style={{
                            fontWeight: hasUnread ? 700 : 600, fontSize: 14,
                            color: active ? 'var(--primary)' : 'var(--foreground)',
                          }}>
                            {other?.firstName || '?'} {other?.lastName || ''}
                          </p>
                          {conv.lastMessage?.sentAt && (
                            <span style={{
                              fontSize: 10,
                              color: hasUnread ? 'var(--primary)' : 'var(--muted)',
                              fontWeight: hasUnread ? 600 : 400,
                              flexShrink: 0, marginLeft: 4,
                            }}>
                              {formatTime(conv.lastMessage.sentAt)}
                            </span>
                          )}
                        </div>

                        {/* Type + titre */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3,
                        }}>
                          <span style={{ fontSize: 11 }}>
                            {conv.type === 'SERVICE' ? '🎵' : '🏛️'}
                          </span>
                          <p style={{
                            fontSize: 11, color: 'var(--muted)',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {title}
                          </p>
                        </div>

                        {/* Dernier message */}
                        {conv.lastMessage ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {conv.lastMessage.isMine && (
                              conv.lastMessage.isRead
                                ? <CheckCheck size={12} color="#4ade80" style={{ flexShrink: 0 }} />
                                : <Check size={12} color="var(--muted)" style={{ flexShrink: 0 }} />
                            )}
                            <p style={{
                              fontSize: 12,
                              color: hasUnread ? 'var(--foreground)' : 'var(--muted)',
                              fontWeight: hasUnread ? 600 : 400,
                              whiteSpace: 'nowrap', overflow: 'hidden',
                              textOverflow: 'ellipsis', flex: 1,
                            }}>
                              {conv.lastMessage.isMine ? 'Vous : ' : ''}
                              {conv.lastMessage.content}
                            </p>
                          </div>
                        ) : (
                          <p style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>
                            Aucun message
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Zone de chat ── */}
        {activeConv ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{
              padding: '16px 24px', borderBottom: '1px solid var(--border)',
              background: 'var(--surface-2)',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'rgba(201,169,110,0.2)',
                border: '2px solid rgba(201,169,110,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, fontWeight: 700, color: 'var(--primary)',
                fontFamily: 'Playfair Display, serif', flexShrink: 0,
              }}>
                {getOtherUser(activeConv)?.firstName?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 15 }}>
                  {getOtherUser(activeConv)?.firstName}{' '}
                  {getOtherUser(activeConv)?.lastName}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11 }}>
                    {activeConv.type === 'SERVICE' ? '🎵' : '🏛️'}
                  </span>
                  <p style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {getConvTitle(activeConv)}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: 'auto',
              padding: '24px',
              display: 'flex', flexDirection: 'column', gap: 8,
              background: 'var(--background)',
            }}>
              {loadingMsgs ? (
                <div style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flex: 1, gap: 8,
                }}>
                  <Loader2 size={20} color="var(--primary)"
                    style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              ) : messages.length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  flex: 1, gap: 12,
                }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: 'rgba(201,169,110,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <MessageSquare size={28} color="var(--primary)" style={{ opacity: 0.4 }} />
                  </div>
                  <p style={{ color: 'var(--muted)', fontSize: 14, fontWeight: 600 }}>
                    Démarrez la conversation
                  </p>
                  <p style={{ color: 'var(--muted)', fontSize: 12, textAlign: 'center' }}>
                    Envoyez votre premier message à{' '}
                    {getOtherUser(activeConv)?.firstName}
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => {
                    const isMine = msg.senderId === user?.id;
                    const prevMsg = i > 0 ? messages[i - 1] : null;
                    const showDate = !prevMsg ||
                      new Date(msg.sentAt).toDateString() !==
                      new Date(prevMsg.sentAt).toDateString();
                    const showSender = !prevMsg ||
                      prevMsg.senderId !== msg.senderId || showDate;

                    return (
                      <div key={msg.id || i}>
                        {showDate && (
                          <div style={{
                            display: 'flex', alignItems: 'center',
                            gap: 12, margin: '16px 0 8px',
                          }}>
                            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                            <span style={{
                              fontSize: 11, color: 'var(--muted)',
                              background: 'var(--background)',
                              padding: '2px 10px', borderRadius: 100,
                              border: '1px solid var(--border)',
                            }}>
                              {new Date(msg.sentAt).toLocaleDateString('fr-FR', {
                                weekday: 'long', day: 'numeric', month: 'long',
                              })}
                            </span>
                            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                          </div>
                        )}

                        <div style={{
                          display: 'flex',
                          justifyContent: isMine ? 'flex-end' : 'flex-start',
                          alignItems: 'flex-end', gap: 8,
                          marginTop: showSender ? 12 : 2,
                        }}>
                          {!isMine && (
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: 'rgba(201,169,110,0.15)',
                              display: 'flex', alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12, fontWeight: 700, color: 'var(--primary)',
                              fontFamily: 'Playfair Display, serif', flexShrink: 0,
                              opacity: showSender ? 1 : 0,
                            }}>
                              {msg.sender?.firstName?.[0]?.toUpperCase() || '?'}
                            </div>
                          )}

                          <div style={{ maxWidth: '65%' }}>
                            {showSender && !isMine && (
                              <p style={{
                                fontSize: 11, color: 'var(--muted)',
                                marginBottom: 4, marginLeft: 4,
                              }}>
                                {msg.sender?.firstName}
                              </p>
                            )}
                            <div style={{
                              background: isMine ? 'var(--primary)' : 'var(--surface)',
                              color: isMine ? '#0a0a0f' : 'var(--foreground)',
                              padding: '10px 14px',
                              borderRadius: isMine
                                ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                              fontSize: 14, lineHeight: 1.5,
                              border: isMine ? 'none' : '1px solid var(--border)',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                            }}>
                              <p>{msg.content}</p>
                            </div>
                            <div style={{
                              display: 'flex', alignItems: 'center',
                              justifyContent: isMine ? 'flex-end' : 'flex-start',
                              gap: 4, marginTop: 3,
                            }}>
                              <span style={{ fontSize: 10, color: 'var(--muted)' }}>
                                {new Date(msg.sentAt).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit', minute: '2-digit',
                                })}
                              </span>
                              {isMine && (
                                msg.isRead
                                  ? <CheckCheck size={11} color="#4ade80" />
                                  : <Check size={11} color="var(--muted)" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div style={{
              padding: '16px 24px', borderTop: '1px solid var(--border)',
              background: 'var(--surface)',
              display: 'flex', gap: 12, alignItems: 'flex-end',
            }}>
              <input
                ref={inputRef}
                style={{
                  flex: 1, padding: '12px 16px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 24, color: 'var(--foreground)',
                  fontSize: 14, outline: 'none',
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'border-color 0.2s',
                }}
                placeholder={`Message à ${getOtherUser(activeConv)?.firstName || ''}...`}
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
              <button
                onClick={sendMessage}
                disabled={!newMsg.trim() || sending}
                style={{
                  width: 44, height: 44,
                  background: newMsg.trim() ? 'var(--primary)' : 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: '50%', cursor: !newMsg.trim() ? 'not-allowed' : 'pointer',
                  opacity: !newMsg.trim() ? 0.5 : 1,
                  color: newMsg.trim() ? '#0a0a0f' : 'var(--muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', flexShrink: 0,
                }}>
                <Send size={18} />
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 20, padding: 40, textAlign: 'center',
            background: 'var(--background)',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(201,169,110,0.1)',
              border: '2px solid rgba(201,169,110,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MessageSquare size={36} color="var(--primary)" style={{ opacity: 0.5 }} />
            </div>
            <div>
              <p style={{
                fontSize: 20, fontWeight: 700, marginBottom: 8,
                fontFamily: 'Playfair Display, serif',
              }}>
                Vos conversations
              </p>
              <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
                Sélectionnez une conversation à gauche<br />
                pour lire et répondre aux messages
              </p>
            </div>
            {localConvs.length === 0 && (
              <p style={{
                fontSize: 12, color: 'var(--muted)',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '10px 16px',
              }}>
                💡 Envoyez un message depuis vos réservations pour démarrer une conversation
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}