'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Loader2, Trash2, Search, Shield,
  CheckCircle, XCircle, Building2, ChevronDown, ChevronUp
} from 'lucide-react';

const roles = ['CLIENT', 'PRESTATAIRE', 'ADMIN', 'SUPPORT'];

const roleColors: Record<string, { color: string; bg: string }> = {
  CLIENT: { color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
  PRESTATAIRE: { color: '#c9a96e', bg: 'rgba(201,169,110,0.15)' },
  ADMIN: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  SUPPORT: { color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
};

const kycConfig: Record<string, { label: string; color: string; bg: string }> = {
  NON_SOUMIS: { label: 'Non soumis', color: 'var(--muted)', bg: 'var(--surface-2)' },
  EN_ATTENTE: { label: 'En attente', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  VALIDE: { label: 'Validé', color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
  REJETE: { label: 'Rejeté', color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
};

export default function AdminUsersPage() {
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');

  const [users, setUsers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [kycFilter, setKycFilter] = useState(filterParam === 'kyc' ? 'EN_ATTENTE' : '');
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [expandedKyc, setExpandedKyc] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    api.get('/admin/users').then(({ data }) => {
      setUsers(data); setFiltered(data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = users;
    if (search) result = result.filter(u =>
      `${u.firstName} ${u.lastName} ${u.email} ${u.companyName || ''}`
        .toLowerCase().includes(search.toLowerCase())
    );
    if (roleFilter) result = result.filter(u => u.role === roleFilter);
    if (kycFilter) result = result.filter(u => u.kycStatus === kycFilter);
    setFiltered(result);
  }, [search, roleFilter, kycFilter, users]);

  const handleRoleChange = async (userId: number, role: string) => {
    setUpdating(`role-${userId}`);
    try {
      await api.put(`/admin/users/${userId}/role`, { role });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur.');
    } finally { setUpdating(null); }
  };

  const handleKyc = async (userId: number, action: 'VALIDE' | 'REJETE') => {
    const reason = action === 'REJETE' ? rejectReason : undefined;
    setUpdating(`kyc-${userId}`);
    try {
      await api.put(`/admin/users/${userId}/kyc`, { action, reason });
      setUsers(prev => prev.map(u =>
        u.id === userId ? {
          ...u,
          kycStatus: action,
          ...(action === 'VALIDE' && { kycValidatedAt: new Date() }),
        } : u
      ));
      setExpandedKyc(null);
      setRejectReason('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur.');
    } finally { setUpdating(null); }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('Supprimer cet utilisateur définitivement ?')) return;
    setDeleting(userId);
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur.');
    } finally { setDeleting(null); }
  };

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', height: '60vh', gap: 16,
    }}>
      <Loader2 size={28} color="var(--primary)"
        style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: 32, fontWeight: 900,
          fontFamily: 'Playfair Display, serif', marginBottom: 8,
        }}>
          Gestion des utilisateurs
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          {filtered.length} utilisateur{filtered.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} color="var(--muted)" style={{
            position: 'absolute', left: 14, top: '50%',
            transform: 'translateY(-50%)',
          }} />
          <input
            style={{
              width: '100%', padding: '10px 14px 10px 36px',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 10, color: 'var(--foreground)', fontSize: 13,
              outline: 'none', fontFamily: 'DM Sans, sans-serif',
              boxSizing: 'border-box',
            }}
            placeholder="Rechercher nom, email, entreprise..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select
          style={{
            padding: '10px 14px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, color: 'var(--foreground)',
            fontSize: 13, outline: 'none', cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
          }}
          value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">Tous les rôles</option>
          {roles.map(r => (
            <option key={r} value={r} style={{ background: 'var(--surface)' }}>{r}</option>
          ))}
        </select>

        <select
          style={{
            padding: '10px 14px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, color: 'var(--foreground)',
            fontSize: 13, outline: 'none', cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
          }}
          value={kycFilter} onChange={e => setKycFilter(e.target.value)}>
          <option value="">Tous les KYC</option>
          <option value="EN_ATTENTE">KYC En attente</option>
          <option value="VALIDE">KYC Validé</option>
          <option value="REJETE">KYC Rejeté</option>
          <option value="NON_SOUMIS">KYC Non soumis</option>
        </select>
      </div>

      {/* Liste utilisateurs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(u => {
          const roleStyle = roleColors[u.role] || roleColors.CLIENT;
          const kycStyle = kycConfig[u.kycStatus || 'NON_SOUMIS'] || kycConfig.NON_SOUMIS;
          const isExpanded = expandedKyc === u.id;

          return (
            <div key={u.id} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 14, overflow: 'hidden',
              transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>

              <div style={{
                display: 'flex', alignItems: 'center',
                gap: 16, padding: '16px 20px',
              }}>
                {/* Avatar */}
                <div style={{
                  width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                  background: roleStyle.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, color: roleStyle.color,
                  fontFamily: 'Playfair Display, serif',
                }}>
                  {u.firstName?.[0]?.toUpperCase()}
                </div>

                {/* Infos */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <p style={{ fontWeight: 700, fontSize: 14 }}>
                      {u.firstName} {u.lastName}
                    </p>
                    <span style={{
                      background: roleStyle.bg, color: roleStyle.color,
                      padding: '1px 8px', borderRadius: 100,
                      fontSize: 10, fontWeight: 600,
                    }}>
                      {u.role}
                    </span>
                    {u.kycStatus && u.role === 'PRESTATAIRE' && (
                      <span style={{
                        background: kycStyle.bg, color: kycStyle.color,
                        padding: '1px 8px', borderRadius: 100,
                        fontSize: 10, fontWeight: 600,
                        border: `1px solid ${kycStyle.color}40`,
                      }}>
                        KYC : {kycStyle.label}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {u.email}
                    {u.companyName && ` · ${u.companyName}`}
                    {u.siret && ` · SIRET: ${u.siret}`}
                  </p>
                </div>

                {/* Vérification */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 12, fontWeight: 600,
                  color: u.isVerified ? '#4ade80' : '#f87171',
                }}>
                  {u.isVerified ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  {u.isVerified ? 'Vérifié' : 'Non vérifié'}
                </div>

                {/* Changer rôle */}
                <select
                  value={u.role}
                  onChange={e => handleRoleChange(u.id, e.target.value)}
                  disabled={updating === `role-${u.id}`}
                  style={{
                    padding: '5px 10px', borderRadius: 8,
                    background: roleStyle.bg,
                    border: `1px solid ${roleStyle.color}40`,
                    color: roleStyle.color, fontSize: 12,
                    fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif', outline: 'none',
                    opacity: updating === `role-${u.id}` ? 0.5 : 1,
                  }}>
                  {roles.map(r => (
                    <option key={r} value={r} style={{
                      background: 'var(--surface)', color: 'var(--foreground)',
                    }}>
                      {r}
                    </option>
                  ))}
                </select>

                {/* Bouton KYC si prestataire en attente */}
                {u.role === 'PRESTATAIRE' && u.kycStatus === 'EN_ATTENTE' && (
                  <button
                    onClick={() => setExpandedKyc(isExpanded ? null : u.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: 'rgba(245,158,11,0.1)',
                      border: '1px solid rgba(245,158,11,0.3)',
                      borderRadius: 8, padding: '6px 12px',
                      cursor: 'pointer', color: '#f59e0b',
                      fontSize: 12, fontWeight: 600,
                      fontFamily: 'DM Sans, sans-serif',
                    }}>
                    <Shield size={12} />
                    Valider KYC
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                )}

                {/* Supprimer */}
                <button
                  onClick={() => handleDelete(u.id)}
                  disabled={deleting === u.id}
                  style={{
                    display: 'flex', alignItems: 'center',
                    background: 'rgba(248,113,113,0.1)',
                    border: '1px solid rgba(248,113,113,0.3)',
                    borderRadius: 8, padding: '7px',
                    cursor: 'pointer', color: '#f87171',
                    opacity: deleting === u.id ? 0.5 : 1,
                  }}>
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Panel KYC étendu */}
              {isExpanded && u.kycStatus === 'EN_ATTENTE' && (
                <div style={{
                  padding: '16px 20px',
                  borderTop: '1px solid var(--border)',
                  background: 'rgba(245,158,11,0.04)',
                }}>
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 16, marginBottom: 16,
                  }}>
                    <div>
                      <p style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 0.5, marginBottom: 4 }}>
                        RAISON SOCIALE
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Building2 size={14} color="var(--primary)" />
                        <p style={{ fontSize: 13, fontWeight: 600 }}>
                          {u.companyName || 'Non renseigné'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 0.5, marginBottom: 4 }}>
                        NUMÉRO SIRET
                      </p>
                      <p style={{ fontSize: 13, fontWeight: 600, fontFamily: 'Courier New, monospace' }}>
                        {u.siret || 'Non renseigné'}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 0.5, marginBottom: 4 }}>
                        ADRESSE SIÈGE
                      </p>
                      <p style={{ fontSize: 13 }}>
                        {u.companyAddress ? `${u.companyAddress}, ${u.companyZip} ${u.companyCity}` : 'Non renseigné'}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 0.5, marginBottom: 4 }}>
                        TÉLÉPHONE
                      </p>
                      <p style={{ fontSize: 13 }}>{u.phone || 'Non renseigné'}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 0.5, marginBottom: 4 }}>
                        EMAIL
                      </p>
                      <p style={{ fontSize: 13 }}>{u.email}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 0.5, marginBottom: 4 }}>
                        DATE SOUMISSION
                      </p>
                      <p style={{ fontSize: 13 }}>
                        {u.kycSubmittedAt
                          ? new Date(u.kycSubmittedAt).toLocaleDateString('fr-FR')
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <p style={{
                      fontSize: 11, color: 'var(--muted)',
                      marginBottom: 6, letterSpacing: 0.5,
                    }}>
                      MOTIF DE REFUS (si applicable)
                    </p>
                    <input
                      style={{
                        width: '100%', padding: '9px 14px',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 8, color: 'var(--foreground)',
                        fontSize: 13, outline: 'none',
                        fontFamily: 'DM Sans, sans-serif',
                        boxSizing: 'border-box',
                      }}
                      placeholder="Motif du refus (optionnel)..."
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => handleKyc(u.id, 'VALIDE')}
                      disabled={updating === `kyc-${u.id}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: 'rgba(74,222,128,0.1)',
                        border: '1px solid rgba(74,222,128,0.3)',
                        borderRadius: 10, padding: '9px 18px',
                        cursor: 'pointer', color: '#4ade80',
                        fontSize: 13, fontWeight: 600,
                        fontFamily: 'DM Sans, sans-serif',
                        opacity: updating === `kyc-${u.id}` ? 0.6 : 1,
                      }}>
                      <CheckCircle size={14} />
                      {updating === `kyc-${u.id}` ? 'Traitement...' : 'Valider le compte prestataire'}
                    </button>
                    <button
                      onClick={() => handleKyc(u.id, 'REJETE')}
                      disabled={updating === `kyc-${u.id}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: 'rgba(248,113,113,0.1)',
                        border: '1px solid rgba(248,113,113,0.3)',
                        borderRadius: 10, padding: '9px 18px',
                        cursor: 'pointer', color: '#f87171',
                        fontSize: 13, fontWeight: 600,
                        fontFamily: 'DM Sans, sans-serif',
                        opacity: updating === `kyc-${u.id}` ? 0.6 : 1,
                      }}>
                      <XCircle size={14} />
                      Refuser
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 24px',
            background: 'var(--surface)', borderRadius: 16,
            border: '1px solid var(--border)',
            color: 'var(--muted)', fontSize: 14,
          }}>
            Aucun utilisateur trouvé
          </div>
        )}
      </div>
    </div>
  );
}