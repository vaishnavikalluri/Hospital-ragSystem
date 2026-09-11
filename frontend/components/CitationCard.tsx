'use client';

import React from 'react';
import { SourceCitation } from '@/services/api';
import { FileText, Hash } from 'lucide-react';

interface CitationCardProps {
  sources: SourceCitation[];
}

export default function CitationCard({ sources }: CitationCardProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>
          Source Citations ({sources.length})
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {sources.map((src, idx) => (
          <div
            key={idx}
            className="flex items-start justify-between gap-3 px-3 py-2.5 rounded-lg text-xs transition-colors"
            style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
            }}
          >
            <div className="flex items-start gap-2 min-w-0">
              <span className="font-bold shrink-0 mt-0.5" style={{ color: 'var(--primary)' }}>
                [{idx + 1}]
              </span>
              <div className="min-w-0">
                <span className="font-semibold block truncate" style={{ color: 'var(--text)' }}>
                  {src.document}
                </span>
                {src.section && (
                  <span className="block mt-0.5 truncate" style={{ color: 'var(--text-2)' }}>
                    {src.section}
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-1 font-semibold" style={{ color: 'var(--primary)' }}>
              <Hash className="w-3 h-3" />
              <span>Page {src.page}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
