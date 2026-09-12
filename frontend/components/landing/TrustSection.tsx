'use client';

import React from 'react';
import { ShieldCheck, FileCheck2, AlertOctagon, HelpCircle } from 'lucide-react';

const trustItems = [
  {
    icon: ShieldCheck,
    title: 'Grounded in Hospital Documents',
    desc: 'Every response is strictly synthesized from your repository documents rather than general internet data.',
    color: '#0369a1',
  },
  {
    icon: FileCheck2,
    title: 'Source-Cited Answers',
    desc: 'Exact citations with document names, section titles, and page numbers allow for instant verification.',
    color: '#0891b2',
  },
  {
    icon: AlertOctagon,
    title: 'No Unsupported Claims',
    desc: 'Strict retrieval thresholds prevent speculative assertions and maintain clinical fidelity.',
    color: '#047857',
  },
  {
    icon: HelpCircle,
    title: 'Honest When Evidence Is Missing',
    desc: 'Explicitly declares when relevant guidelines are missing instead of inventing answers.',
    color: '#b45309',
  },
];

export default function TrustSection() {
  return (
    <section className="py-16 md:py-20 border-t border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block mb-3">
            Integrity & Traceability
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3" style={{ color: 'var(--text)' }}>
            Built for Reliable Hospital Knowledge
          </h2>
          <p className="text-sm sm:text-base" style={{ color: 'var(--text-2)' }}>
            Engineered with strict verification guardrails for high-reliability clinical environments.
          </p>
        </div>

        {/* 4 Trust Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all hover:shadow-md text-left"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-slate-50 border border-slate-100"
                  style={{ color: item.color }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold mb-2 leading-snug" style={{ color: 'var(--text)' }}>
                  {item.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
