'use client';

import React from 'react';
import { Search, FileText, ShieldCheck, MessageSquareText, Layers, CheckCircle2 } from 'lucide-react';

const features = [
  {
    icon: Search,
    title: 'RAG-Powered Search',
    description:
      'Retrieves the most relevant document chunks before generating an answer. No hallucinations — only what is available in your hospital documents.',
    color: '#0369a1',
    bg: '#e0f2fe',
    border: '#bae6fd',
  },
  {
    icon: FileText,
    title: 'Source Citations',
    description:
      'Every grounded answer includes the source document, page number, and section when available, so staff can verify the information instantly.',
    color: '#0891b2',
    bg: '#cffafe',
    border: '#a5f3fc',
  },
  {
    icon: ShieldCheck,
    title: 'Authorized Access Only',
    description:
      'Only verified hospital staff with a valid Hospital ID can access the system.',
    color: '#047857',
    bg: '#d1fae5',
    border: '#a7f3d0',
  },
  {
    icon: MessageSquareText,
    title: 'Context-Aware Conversations',
    description:
      'Ask follow-up questions naturally while keeping responses grounded in relevant hospital documents.',
    color: '#6d28d9',
    bg: '#ede9fe',
    border: '#ddd6fe',
  },
  {
    icon: Layers,
    title: 'Multi-Category Knowledge',
    description:
      'Covers clinical protocols, drug interaction guidelines, and hospital policy circulars.',
    color: '#b45309',
    bg: '#fef3c7',
    border: '#fde68a',
  },
  {
    icon: CheckCircle2,
    title: 'Honest Refusals',
    description:
      'When sufficient evidence cannot be found in hospital documents, the assistant clearly says so instead of inventing information.',
    color: '#0284c7',
    bg: '#e0f2fe',
    border: '#bae6fd',
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-16 md:py-24 border-t border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 inline-block mb-3">
            Core Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4" style={{ color: 'var(--text)' }}>
            Why Hospital Knowledge Assistant?
          </h2>
          <p className="text-base sm:text-lg leading-relaxed" style={{ color: 'var(--text-2)' }}>
            Built specifically for hospital staff who need fast, reliable, evidence-backed answers.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="p-7 rounded-2xl transition-all duration-200 hover:shadow-md hover:-translate-y-1 flex flex-col justify-between"
                style={{
                  background: 'white',
                  border: '1px solid var(--border)',
                }}
              >
                <div>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{
                      background: feature.bg,
                      border: `1px solid ${feature.border}`,
                      color: feature.color,
                    }}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold tracking-tight mb-2.5" style={{ color: 'var(--text)' }}>
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
