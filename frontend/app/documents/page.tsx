'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchDocuments, getSession, UserSession, DocumentInfo } from '@/services/api';
import DocumentList from '@/components/DocumentList';
import { BookOpen, Search, RefreshCw, Layers } from 'lucide-react';

export default function DocumentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');

  const loadDocs = async () => {
    setLoading(true);
    try {
      const res = await fetchDocuments();
      setDocuments(res.documents || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const session = getSession();
    if (!session || !session.authorized) {
      router.push('/login');
      return;
    }
    setUser(session);
    loadDocs();
  }, [router]);

  if (!user) return null;

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = !selectedType || doc.document_type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl shadow-sm"
        style={{ background: 'white', border: '1px solid var(--border)' }}>
        <div>
          <div className="flex items-center space-x-2 font-semibold text-xs uppercase tracking-wider mb-1"
            style={{ color: 'var(--primary)' }}>
            <BookOpen className="w-4 h-4" />
            <span>Hospital Repository</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
            Document Knowledge Base
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>
            Pre-loaded clinical protocols, drug interaction guidelines, and policy circulars.
          </p>
        </div>

        <button
          onClick={loadDocs}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:bg-slate-50 shrink-0"
          style={{ background: 'white', border: '1px solid var(--border)', color: 'var(--primary)' }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search document name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-none transition-all"
            style={{ background: 'white', border: '1.5px solid var(--border)', color: 'var(--text)' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Layers className="w-4 h-4" style={{ color: 'var(--text-3)' }} />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs rounded-xl px-3.5 py-2.5 focus:outline-none cursor-pointer transition-all"
            style={{ background: 'white', border: '1.5px solid var(--border)', color: 'var(--text)' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <option value="">All Document Types</option>
            <option value="clinical_protocol">Clinical Protocols</option>
            <option value="drug_interaction_guideline">Drug Guidelines</option>
            <option value="policy_circular">Policy Circulars</option>
          </select>
        </div>
      </div>

      {/* Document List */}
      <DocumentList documents={filteredDocs} loading={loading} />

    </div>
  );
}
