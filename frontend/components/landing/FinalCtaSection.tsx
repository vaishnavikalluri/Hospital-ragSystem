'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Lock, ShieldCheck, Activity } from 'lucide-react';

export default function FinalCtaSection() {
  return (
    <section className="py-16 md:py-20 bg-slate-50/70 border-t border-slate-200/70">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div
          className="p-8 sm:p-12 rounded-3xl text-center shadow-md relative overflow-hidden"
          style={{
            background: 'white',
            border: '1px solid var(--border)',
          }}
        >
          {/* Subtle icon badge */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm"
            style={{ background: '#e0f2fe', color: 'var(--primary)', border: '1px solid #bae6fd' }}
          >
            <Activity className="w-7 h-7" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4" style={{ color: 'var(--text)' }}>
            Find the Answer. Verify the Source.
          </h2>

          <p className="text-base sm:text-lg mb-8 max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--text-2)' }}>
            Access your hospital&apos;s verified knowledge base and get answers grounded in approved documents.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl font-semibold text-sm text-white shadow-md transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'var(--primary)' }}
            >
              <Lock className="w-4 h-4" />
              <span>Enter Hospital ID</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <p className="text-xs font-medium flex items-center justify-center gap-1.5" style={{ color: 'var(--text-3)' }}>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Authorized hospital staff only</span>
          </p>

        </div>

      </div>
    </section>
  );
}
