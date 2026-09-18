'use client';

import React from 'react';
import { SourceCitation, getDocumentFileUrl } from '@/services/api';
import { FileText, Hash, ExternalLink } from 'lucide-react';

interface CitationCardProps {
  sources: SourceCitation[];
}

export default function CitationCard({ sources }: CitationCardProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-4 pt-3.5 border-t border-slate-100">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-sky-700" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-900">
            Verified Sources ({sources.length})
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-medium">Click to view document in new tab ↗</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {sources.map((src, idx) => {
          const pdfUrl = getDocumentFileUrl(src.document, src.page);

          return (
            <a
              key={idx}
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={`Open ${src.document} (Page ${src.page}) in new tab`}
              className="group flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-all bg-sky-50/70 border border-sky-200/80 hover:border-sky-400 hover:bg-sky-100/70 hover:shadow-sm cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-bold text-sky-700 text-xs shrink-0 group-hover:scale-105 transition-transform">
                  [{idx + 1}]
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-slate-800 block truncate text-[11.5px] group-hover:text-sky-800 transition-colors">
                      {src.document}
                    </span>
                    <ExternalLink className="w-3 h-3 text-sky-600 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                  {src.section && (
                    <span className="block text-[10.5px] text-slate-500 truncate mt-0.5">
                      {src.section}
                    </span>
                  )}
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-0.5 font-bold text-sky-700 text-[10.5px] bg-white px-2 py-0.5 rounded-md border border-sky-200 group-hover:border-sky-400 group-hover:bg-sky-50 transition-colors shadow-2xs">
                <Hash className="w-2.5 h-2.5" />
                <span>Page {src.page}</span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
