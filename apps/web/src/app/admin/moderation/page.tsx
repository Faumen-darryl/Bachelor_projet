'use client';
import { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function AdminModerationPage() {
  const [alerts, setAlerts] = useState([
    {
      id: 1, type: 'warning', resolved: false,
      icon: '⚠️', title: 'Avis suspect détecté',
      desc: 'Un avis avec une note de 1/5 a été signalé sur "Salle Prestige".',
      time: 'Il y a 2h',
    },
    {
      id: 2, type: 'info', resolved: false,
      icon: '📋', title: 'Nouveau prestataire KYC',
      desc: 'Un nouveau prestataire attend validation de son profil SIRET.',
      time: 'Il y a 4h',
    },
    {
      id: 3, type: 'error', resolved: false,
      icon: '🚨', title: 'Paiement échoué',
      desc: 'Un paiement a échoué pour la réservation #42.',
      time: 'Il y a 6h',
    },
    {
      id: 4, type: 'success', resolved: true,
      icon: '✅', title: 'Litige résolu',
      desc: 'Le litige sur la réservation #38 a été résolu avec succès.',
      time: 'Hier',
    },
  ]);

  const handleResolve = (id: number) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
  };

  const handleDismiss = (id: number) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const typeConfig: Record<string, { border: string; bg: string; color: string }> = {
    warning: { border: 'rgba(245,158,11,0.3)', bg: 'rgba(245,158,11,0.05)', color: '#f59e0b' },
    info: { border: 'rgba(96,165,250,0.3)', bg: 'rgba(96,165,250,0.05)', color: '#60a5fa' },
    error: { border: 'rgba(248,113,113,0.3)', bg: 'rgba(248,113,113,0.05)', color: '#f87171' },
    success: { border: 'rgba(74,222,128,0.3)', bg: 'rgba(74,222,128,0.05)', color: '#4ade80' },
  };

  const pending = alerts.filter(a => !a.resolved);
  const resolved = alerts.filter(a => a.resolved);

  return (
    <div>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{
          fontSize: 32, fontWeight: 900,
          fontFamily: 'Playfair Display, serif', marginBottom: 8,
        }}>
          Modération
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          Alertes et signalements de la plateforme
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16, marginBottom: 32,
      }}>
        {[
          {
            label: 'En attente',
            value: pending.length,
            color: '#f59e0b',
            icon: <Clock size={20} />,
          },
          {
            label: 'Résolus',
            value: resolved.length,
            color: '#4ade80',
            icon: <CheckCircle size={20} />,
          },
          {
            label: 'Total',
            value: alerts.length,
            color: '#60a5fa',
            icon: <AlertTriangle size={20} />,
          },
        ].map((s, i) => (
          <div key={i} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: 24,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: `${s.color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: s.color, marginBottom: 16,
            }}>
              {s.icon}
            </div>
            <p style={{
              fontSize: 28, fontWeight: 900,
              fontFamily: 'Playfair Display, serif', color: s.color,
            }}>
              {s.value}
            </p>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Alertes en attente */}
      {pending.length > 0 && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 24, marginBottom: 24,
        }}>
          <h2 style={{
            fontSize: 18, fontWeight: 700,
            fontFamily: 'Playfair Display, serif', marginBottom: 20,
          }}>
            Alertes en attente ({pending.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pending.map(a => {
              const config = typeConfig[a.type];
              return (
                <div key={a.id} style={{
                  display: 'flex', gap: 16, alignItems: 'flex-start',
                  padding: '16px 20px', borderRadius: 12,
                  background: config.bg, border: `1px solid ${config.border}`,
                }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{a.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', marginBottom: 4,
                    }}>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>{a.title}</p>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{a.time}</span>
                    </div>
                    <p style={{ color: 'var(--muted)', fontSize: 13 }}>{a.desc}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => handleResolve(a.id)}
                      style={{
                        background: 'rgba(74,222,128,0.1)',
                        border: '1px solid rgba(74,222,128,0.3)',
                        borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                        color: '#4ade80', fontSize: 12, fontWeight: 600,
                        fontFamily: 'DM Sans, sans-serif',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                      <CheckCircle size={12} /> Résoudre
                    </button>
                    <button
                      onClick={() => handleDismiss(a.id)}
                      style={{
                        background: 'rgba(248,113,113,0.1)',
                        border: '1px solid rgba(248,113,113,0.3)',
                        borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                        color: '#f87171', fontSize: 12, fontWeight: 600,
                        fontFamily: 'DM Sans, sans-serif',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                      <XCircle size={12} /> Ignorer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Alertes résolues */}
      {resolved.length > 0 && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 24,
        }}>
          <h2 style={{
            fontSize: 18, fontWeight: 700,
            fontFamily: 'Playfair Display, serif', marginBottom: 20,
          }}>
            Résolues ({resolved.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {resolved.map(a => (
              <div key={a.id} style={{
                display: 'flex', gap: 14, alignItems: 'center',
                padding: '12px 16px', borderRadius: 10,
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                opacity: 0.7,
              }}>
                <CheckCircle size={16} color="#4ade80" />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 1 }}>{a.title}</p>
                  <p style={{ fontSize: 11, color: 'var(--muted)' }}>{a.desc}</p>
                </div>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}