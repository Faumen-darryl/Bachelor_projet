'use client';
import { useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

export default function VerifyOtpPage() {
  const router = useRouter();
  const params = useSearchParams();
  const userId = params.get('userId');
  const email = params.get('email');
  const { setAuth } = useAuthStore();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputs.current[index + 1]?.focus();
    if (newOtp.every(d => d !== '')) handleVerify(newOtp.join(''));
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code?: string) => {
    const finalOtp = code || otp.join('');
    if (finalOtp.length !== 6) return;
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/verify-otp', {
        userId: Number(userId), otp: finalOtp,
      });
      setAuth(data.user, data.token);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Code incorrect.');
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      padding: 24, background: 'var(--background)',
    }}>
      <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
        <Link href="/" style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 28, fontWeight: 700,
          color: 'var(--primary)', textDecoration: 'none',
          display: 'block', marginBottom: 40,
        }}>
          Evently
        </Link>

        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20, padding: 40,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>
            Vérifiez votre email
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
            Nous avons envoyé un code à 6 chiffres à<br />
            <strong style={{ color: 'var(--foreground)' }}>{email}</strong>
          </p>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10, padding: '12px 16px', marginBottom: 20,
              color: '#f87171', fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {/* OTP inputs */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 32 }}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputs.current[i] = el; }}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                maxLength={1}
                style={{
                  width: 52, height: 60,
                  textAlign: 'center', fontSize: 24, fontWeight: 700,
                  background: 'var(--surface-2)',
                  border: digit ? '1px solid var(--primary)' : '1px solid var(--border)',
                  borderRadius: 12, color: 'var(--foreground)',
                  outline: 'none', fontFamily: 'DM Sans, sans-serif',
                  transition: 'border-color 0.2s',
                }}
              />
            ))}
          </div>

          <button onClick={() => handleVerify()} disabled={loading || otp.some(d => !d)} style={{
            width: '100%', background: 'var(--primary)', color: '#0a0a0f',
            border: 'none', borderRadius: 12, padding: '14px',
            fontSize: 15, fontWeight: 600,
            cursor: loading || otp.some(d => !d) ? 'not-allowed' : 'pointer',
            opacity: loading || otp.some(d => !d) ? 0.6 : 1,
            fontFamily: 'DM Sans, sans-serif',
          }}>
            {loading ? 'Vérification...' : 'Confirmer'}
          </button>
        </div>
      </div>
    </main>
  );
}