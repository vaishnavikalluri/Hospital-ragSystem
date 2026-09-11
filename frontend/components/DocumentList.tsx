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
          <div key={i} className="h-16 rounded-xl bg-slate-800/40 animate-pulse border border-slate-800" />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="p-8 text-center glass-card rounded-2xl border border-slate-800">
        <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <h4 className="text-base font-semibold text-slate-200">No Documents Found</h4>
        <p className="text-sm text-slate-400 mt-1">
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
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Clinical Protocol</span>;
      case 'drug_interaction_guideline':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/30">Drug Guideline</span>;
      case 'policy_circular':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">Policy Circular</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/30">{type}</span>;
    }
  };

  return (
    <div className="space-y-3">
      {documents.map((doc, idx) => (
        <div
          key={idx}
          className="p-4 rounded-xl glass-card border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-all"
        >
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center space-x-3">
                <h4 className="text-sm font-semibold text-white tracking-tight">{doc.name}</h4>
                {getDocTypeBadge(doc.document_type)}
              </div>
              <div className="flex items-center space-x-4 mt-1 text-xs text-slate-400">
                <span className="flex items-center space-x-1">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  <span>{doc.chunk_count} Chunks</span>
                </span>
                <span className="flex items-center space-x-1">
                  <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                  <span>{formatBytes(doc.file_size_bytes)}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {doc.indexed ? (
              <span className="flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Indexed</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1.5 text-xs text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Not Indexed</span>
              </span>
            )}

            {isAdmin && onDelete && (
              <button
                onClick={() => onDelete(doc.name)}
                className="text-xs text-rose-400 hover:text-rose-300 p-2 rounded-lg hover:bg-rose-500/10 transition-colors"
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
