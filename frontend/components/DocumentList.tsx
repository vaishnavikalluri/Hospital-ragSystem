'use client';

import React from 'react';
import { DocumentInfo } from '@/services/api';
import { FileText, CheckCircle2, AlertCircle, HardDrive, Layers } from 'lucide-react';

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
          <div key={i} className="h-16 rounded-xl animate-pulse"
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

  const getDocTypeBadge = (type: string) => {
    switch (type) {
      case 'clinical_protocol':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Clinical Protocol</span>;
      case 'drug_interaction_guideline':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">Drug Guideline</span>;
      case 'policy_circular':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Policy Circular</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">{type}</span>;
    }
  };

  return (
    <div className="space-y-3">
      {documents.map((doc, idx) => (
        <div
          key={idx}
          className="p-4 rounded-xl flex items-center justify-between transition-all hover:shadow-sm"
          style={{ background: 'white', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: '#e0f2fe', color: 'var(--primary)', border: '1px solid #bae6fd' }}>
              <FileText className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center space-x-3">
                <h4 className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
                  {doc.name}
                </h4>
                {getDocTypeBadge(doc.document_type)}
              </div>
              <div className="flex items-center space-x-4 mt-1 text-xs" style={{ color: 'var(--text-2)' }}>
                <span className="flex items-center space-x-1">
                  <Layers className="w-3.5 h-3.5" style={{ color: 'var(--text-3)' }} />
                  <span>{doc.chunk_count} Chunks</span>
                </span>
                <span className="flex items-center space-x-1">
                  <HardDrive className="w-3.5 h-3.5" style={{ color: 'var(--text-3)' }} />
                  <span>{formatBytes(doc.file_size_bytes)}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
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
      ))}
    </div>
  );
}
