'use client';

import React from 'react';
import { DocumentInfo, getDocumentFileUrl } from '@/services/api';
import { FileText, CheckCircle2, AlertCircle, HardDrive, Layers, ExternalLink, Clock, Sparkles } from 'lucide-react';

interface DocumentListProps {
  documents: DocumentInfo[];
  loading: boolean;
  onDelete?: (name: string) => void;
  isAdmin?: boolean;
}

export default function DocumentList({ documents, loading, onDelete, isAdmin }: DocumentListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl animate-pulse"
            style={{ background: 'white', border: '1px solid var(--border)' }} />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl"
        style={{ background: 'white', border: '1px solid var(--border)' }}>
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h4 className="text-base font-semibold" style={{ color: 'var(--text)' }}>No Documents Found</h4>
        <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
          No documents have been added to the knowledge base yet.
        </p>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(date);
    } catch {
      return null;
    }
  };

  const isRecent = (dateStr?: string) => {
    if (!dateStr) return false;
    try {
      const diffHours = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60);
      return diffHours >= 0 && diffHours < 48;
    } catch {
      return false;
    }
  };

  const getDocTypeBadge = (type: string) => {
    switch (type) {
      case 'clinical_protocol':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Clinical Protocol</span>;
      case 'drug_interaction_guideline':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">Drug Guideline</span>;
      case 'policy_circular':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Policy Circular</span>;
      default: {
        const label = (type || 'General')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">{label}</span>;
      }
    }
  };

  // Sort newly uploaded documents at the top
  const sortedDocuments = [...documents].sort((a, b) => {
    const timeA = new Date(a.uploaded_at || a.created_at || a.indexed_at || 0).getTime();
    const timeB = new Date(b.uploaded_at || b.created_at || b.indexed_at || 0).getTime();
    return timeB - timeA;
  });

  return (
    <div className="space-y-3">
      {sortedDocuments.map((doc, idx) => {
        const uploadTimeFormatted = formatDateTime(doc.uploaded_at || doc.created_at || doc.indexed_at);
        const recentlyAdded = isRecent(doc.uploaded_at || doc.created_at || doc.indexed_at);

        return (
          <div
            key={idx}
            className={`p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:shadow-sm ${
              recentlyAdded ? 'bg-white border-l-4 border-l-sky-500 shadow-2xs' : 'bg-white'
            }`}
            style={{ borderTop: '1px solid var(--border)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', borderLeftColor: recentlyAdded ? 'var(--primary)' : 'var(--border)' }}
          >
            <div className="flex items-start space-x-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: '#e0f2fe', color: 'var(--primary)', border: '1px solid #bae6fd' }}>
                <FileText className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-semibold tracking-tight text-slate-900 truncate" title={doc.name}>
                    {doc.name}
                  </h4>
                  {getDocTypeBadge(doc.document_type)}
                  {recentlyAdded && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300 animate-pulse">
                      <Sparkles className="w-2.5 h-2.5" />
                      NEW
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500">
                  {uploadTimeFormatted && (
                    <span className="flex items-center space-x-1 font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/70">
                      <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>Uploaded {uploadTimeFormatted}</span>
                    </span>
                  )}
                  <span className="flex items-center space-x-1">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>{doc.chunk_count} Chunks</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatBytes(doc.file_size_bytes)}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 shrink-0 self-end sm:self-center">
              {doc.indexed ? (
                <span className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Indexed</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Not Indexed</span>
                </span>
              )}

              <a
                href={getDocumentFileUrl(doc.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-xs text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-lg transition-colors font-medium"
                title={`View ${doc.name} in new tab`}
              >
                <span>View PDF</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>

              {isAdmin && onDelete && (
                <button
                  onClick={() => onDelete(doc.name)}
                  className="text-xs text-rose-600 hover:text-rose-700 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 border border-rose-200 transition-colors font-medium"
                  title="Delete Document"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
