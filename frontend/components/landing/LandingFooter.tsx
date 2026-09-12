'use client';

import React from 'react';
import { Activity } from 'lucide-react';

export default function LandingFooter() {
  return (
    <footer className="py-10 border-t border-slate-200 bg-white text-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-sky-700 text-white">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-sm tracking-tight" style={{ color: 'var(--text)' }}>
            Hospital Knowledge Assistant
          </span>
        </div>

        <p className="text-xs mb-3 font-medium" style={{ color: 'var(--text-2)' }}>
          Authorized Staff Portal · RAG-Powered · Evidence-Grounded · Source-Cited
        </p>

        <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>
          © 2026 Hospital Knowledge Assistant. For authorized healthcare personnel only.
        </p>

      </div>
    </footer>
  );
}
