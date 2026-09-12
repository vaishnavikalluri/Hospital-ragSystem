'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchDocuments, getSession, UserSession, DocumentListResponse } from '@/services/api';
import { Activity, Bot, BookOpen, ShieldAlert, ArrowRight, Layers, FileText, Sparkles, CheckCircle2 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [docSummary, setDocSummary] = useState<DocumentListResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (!session || !session.authorized) {
      router.push('/login');
      return;
    }
    setUser(session);
    fetchDocuments()
      .then((data) => setDocSummary(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">

      {/* Welcome Banner */}
      <div className="rounded-2xl p-8 relative overflow-hidden shadow-sm"
        style={{ background: 'linear-gradient(135deg, #0369a1 0%, #0891b2 100%)', color: 'white' }}>
        {/* Background circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'rgba(255,255,255,0.07)' }} />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: 'rgba(255,255,255,0.05)' }} />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              Authorized Hospital Session
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">
              Welcome back, {user.name}
            </h1>
            <p className="text-sm font-mono opacity-80">
              Hospital ID: <span className="font-bold opacity-100">{user.hospital_id}</span>
              {user.is_admin && (
                <span className="ml-2 px-2 py-0.5 rounded text-xs font-bold"
                  style={{ background: '#fbbf24', color: '#78350f' }}>
                  Administrator
                </span>
              )}
            </p>
          </div>

          <Link href="/assistant"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm shrink-0 transition-all hover:scale-105"
            style={{ background: 'white', color: 'var(--primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <Bot className="w-5 h-5" />
            Launch AI Assistant
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          {
            icon: BookOpen,
            label: 'Total Documents',
            value: loading ? '...' : docSummary?.total ?? 0,
            sub: 'Clinical protocols, guidelines & circulars',
            color: '#0369a1', bg: '#dbeafe',
          },
          {
            icon: Layers,
            label: 'Categories',
            value: loading ? '...' : Object.keys(docSummary?.by_type || {}).length || 3,
            sub: 'Clinical · Drug · Policy',
            color: '#7c3aed', bg: '#ede9fe',
          },
          {
            icon: Sparkles,
            label: 'RAG Status',
            value: 'Active',
            sub: 'Retrieval & grounding operational',
            color: '#15803d', bg: '#dcfce7',
            isStatus: true,
          },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="card p-6 space-y-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                <Icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-2)' }}>{s.label}</p>
                <div className="text-2xl font-bold flex items-center gap-2" style={{ color: s.isStatus ? s.color : 'var(--text)' }}>
                  {s.isStatus && <span className="w-2.5 h-2.5 rounded-full animate-pulse-dot" style={{ background: s.color }} />}
                  {s.value}
                </div>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>{s.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Navigation */}
      <div>
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text)' }}>Quick Navigation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

          <Link href="/assistant" id="dashboard-assistant-card"
            className="card p-6 block group">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
              style={{ background: '#dbeafe' }}>
              <Bot className="w-6 h-6" style={{ color: 'var(--primary)' }} />
            </div>
            <h3 className="font-bold text-base mb-1 group-hover:underline" style={{ color: 'var(--text)' }}>Ask AI Assistant</h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
              Get grounded answers from clinical protocols and guidelines with source citations.
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--primary)' }}>
              Open Assistant <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link href="/documents" id="dashboard-documents-card"
            className="card p-6 block group">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
              style={{ background: '#dcfce7' }}>
              <FileText className="w-6 h-6" style={{ color: '#15803d' }} />
            </div>
            <h3 className="font-bold text-base mb-1 group-hover:underline" style={{ color: 'var(--text)' }}>View Knowledge Base</h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
              Browse all indexed hospital documents by category.
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold" style={{ color: '#15803d' }}>
              View Documents <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {user.is_admin && (
            <Link href="/admin" id="dashboard-admin-card"
              className="card p-6 block group" style={{ border: '1px solid #fde68a' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                style={{ background: '#fef3c7' }}>
                <ShieldAlert className="w-6 h-6" style={{ color: '#b45309' }} />
              </div>
              <h3 className="font-bold text-base mb-1 group-hover:underline" style={{ color: '#b45309' }}>Admin Management</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
                Upload PDFs, trigger indexing, monitor usage metrics.
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold" style={{ color: '#b45309' }}>
                Open Admin <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          )}

        </div>
      </div>
    </div>
  );
}
