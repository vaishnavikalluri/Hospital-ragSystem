'use client';

import React from 'react';
import { Stethoscope, Pill, FileBadge, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const categories = [
  {
    title: 'Clinical Protocols',
    tag: 'Standard Operating Procedures',
    icon: Stethoscope,
    color: '#047857',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    description:
      'Search authorized procedural guidelines, triage pathways, and treatment workflows verified by the hospital medical board.',
    examples: [
      'Emergency triage code definitions & response timelines',
      'Infection prevention & control operating standards',
      'ICU patient transfer & admission criteria',
    ],
  },
  {
    title: 'Drug Interaction Guidelines',
    tag: 'Pharmacology Safety',
    icon: Pill,
    color: '#6d28d9',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    description:
      'Quickly cross-check medication compatibility, interaction alerts, high-risk compound pairs, and dosage cautions.',
    examples: [
      'Compound-X and Compound-Y interaction severity',
      'High-risk drug contraindications & precautions',
      'Weight-adjusted dosage safety thresholds',
    ],
  },
  {
    title: 'Hospital Policies',
    tag: 'Governance & Circulars',
    icon: FileBadge,
    color: '#b45309',
    bg: '#fffbeb',
    border: '#fde68a',
    description:
      'Access internal administrative circulars, clinical compliance mandates, data confidentiality policies, and staff protocols.',
    examples: [
      'Patient health data privacy & disclosure circulars',
      'On-call handover & emergency staffing rotations',
      'Critical incident reporting & escalation pathways',
    ],
  },
];

export default function KnowledgeCategoriesSection() {
  return (
    <section id="scope" className="py-16 md:py-24 bg-slate-50/60 border-t border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 inline-block mb-3">
            Document Repository
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4" style={{ color: 'var(--text)' }}>
            What Can You Ask?
          </h2>
          <p className="text-base sm:text-lg leading-relaxed" style={{ color: 'var(--text-2)' }}>
            Search across your hospital&apos;s verified knowledge base.
          </p>
        </div>

        {/* 3 Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {categories.map((cat, index) => {
            const Icon = cat.icon;
            return (
              <div
                key={index}
                className="rounded-2xl p-7 flex flex-col justify-between shadow-sm transition-all duration-200 hover:shadow-md"
                style={{
                  background: 'white',
                  border: '1px solid var(--border)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{
                        background: cat.bg,
                        border: `1px solid ${cat.border}`,
                        color: cat.color,
                      }}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={{
                        background: cat.bg,
                        color: cat.color,
                        border: `1px solid ${cat.border}`,
                      }}
                    >
                      {cat.tag}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold mb-2.5" style={{ color: 'var(--text)' }}>
                    {cat.title}
                  </h3>
                  <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-2)' }}>
                    {cat.description}
                  </p>

                  <div className="space-y-2.5 pt-4 border-t border-slate-100 mb-6">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Example queries:
                    </div>
                    {cat.examples.map((ex, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-2)' }}>
                        <CheckCircle className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                        <span>&ldquo;{ex}&rdquo;</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href="/login"
                  className="inline-flex items-center justify-between w-full pt-4 text-xs font-semibold border-t border-slate-100 hover:text-sky-700 transition-colors"
                  style={{ color: 'var(--primary)' }}
                >
                  <span>Query this category</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Boundary Notice */}
        <div className="mt-12 p-4 rounded-xl max-w-3xl mx-auto text-center border border-slate-200 bg-white/70 text-xs"
          style={{ color: 'var(--text-3)' }}>
          <span className="font-semibold text-slate-700">Note:</span> Hospital Knowledge Assistant searches and summarizes approved hospital documents. It is designed to assist authorized staff with policy and guideline retrieval.
        </div>

      </div>
    </section>
  );
}
