'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/services/api';
import { Activity, ShieldCheck, ArrowRight, AlertCircle, Lock, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [hospitalId, setHospitalId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalId.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await login(hospitalId.trim().toUpperCase());
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Hospital ID not found. You are not authorized.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Back to home */}
        <div className="mb-6 text-center">
          <Link href="/" className="text-sm font-medium hover:underline" style={{ color: 'var(--primary)' }}>
            ← Back to Home
          </Link>
        </div>

        {/* Card */}
        <div className="card-flat p-8 sm:p-10 rounded-2xl shadow-lg" style={{ background: 'white' }}>

          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-md"
              style={{ background: 'var(--primary)' }}>
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>
              Staff Portal Login
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Enter your assigned <span className="font-semibold" style={{ color: 'var(--text)' }}>Hospital ID</span> to access the knowledge assistant.
            </p>
          </div>

          {/* No-signup notice */}
          <div className="mb-6 flex items-start gap-3 p-3.5 rounded-xl" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
            <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" style={{ color: '#0369a1' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: '#0369a1' }}>No signup required</p>
              <p className="text-xs mt-0.5" style={{ color: '#0c4a6e' }}>
                Your Hospital ID is issued by your administrator. Simply enter it below to continue.
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-3 p-3.5 rounded-xl" style={{ background: '#fff1f2', border: '1px solid #fecdd3' }}>
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: '#e11d48' }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#e11d48' }}>Access Denied</p>
                <p className="text-xs mt-0.5" style={{ color: '#9f1239' }}>{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="hospital-id" className="block text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: 'var(--text-2)' }}>
                Hospital Staff ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4" style={{ color: 'var(--text-3)' }} />
                </div>
                <input
                  id="hospital-id"
                  name="hospitalId"
                  type="text"
                  required
                  value={hospitalId}
                  onChange={(e) => setHospitalId(e.target.value.toUpperCase())}
                  placeholder="e.g. H001"
                  className="block w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-mono uppercase focus:outline-none transition-all"
                  style={{
                    border: error ? '1.5px solid #fca5a5' : '1.5px solid var(--border)',
                    background: '#f8fafc',
                    color: 'var(--text)',
                  }}
                  onFocus={(e) => {
                    if (!error) e.currentTarget.style.border = '1.5px solid var(--primary)';
                  }}
                  onBlur={(e) => {
                    if (!error) e.currentTarget.style.border = '1.5px solid var(--border)';
                  }}
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              id="login-submit-btn"
              disabled={loading || !hospitalId.trim()}
              className="w-full btn-primary justify-center py-3.5"
              style={{ opacity: loading || !hospitalId.trim() ? 0.6 : 1, cursor: loading || !hospitalId.trim() ? 'not-allowed' : 'pointer' }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-5 text-center" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--text-3)' }}>
              <ShieldCheck className="w-4 h-4" style={{ color: '#16a34a' }} />
              <span>Secure · Authorized Staff Portal Only</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
