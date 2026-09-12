'use client';

import React from 'react';
import { Lock, Search, FileCheck, ArrowRight } from 'lucide-react';

const steps = [
  {
    step: '01',
    title: 'Enter Hospital ID',
    description: 'Use your assigned Hospital ID to securely access the hospital knowledge assistant.',
    icon: Lock,
    color: '#0369a1',
    bg: '#e0f2fe',
    border: '#bae6fd',
  },
  {
    step: '02',
    title: 'Retrieve Relevant Evidence',
    description:
      'Your question is matched against relevant hospital documents and the most useful information is retrieved and ranked.',
    icon: Search,
    color: '#0891b2',
    bg: '#cffafe',
    border: '#a5f3fc',
  },
  {
    step: '03',
    title: 'Get a Grounded Answer',
    description:
      'Receive an evidence-backed answer with citations showing the document, page, and section where available.',
    icon: FileCheck,
    color: '#047857',
    bg: '#d1fae5',
    border: '#a7f3d0',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-slate-50/70 border-t border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 inline-block mb-3">
            Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4" style={{ color: 'var(--text)' }}>
            How It Works
          </h2>
          <p className="text-base sm:text-lg leading-relaxed" style={{ color: 'var(--text-2)' }}>
            Three simple steps to get grounded answers from hospital documents.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 mb-16">
          
          {/* Connector line for desktop */}
          <div className="hidden md:block absolute top-1/3 left-[18%] right-[18%] h-[2px] bg-slate-200 -z-0" />

          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="relative z-10 flex flex-col items-center text-center p-8 rounded-2xl transition-all duration-200 hover:shadow-md"
                style={{
                  background: 'white',
                  border: '1px solid var(--border)',
                }}
              >
                {/* Step badge */}
                <span
                  className="absolute -top-3.5 px-3 py-0.5 rounded-full text-xs font-bold shadow-sm"
                  style={{
                    background: item.color,
                    color: 'white',
                  }}
                >
                  Step {item.step}
                </span>

                {/* Icon */}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mt-2"
                  style={{
                    background: item.bg,
                    border: `1px solid ${item.border}`,
                    color: item.color,
                  }}
                >
                  <Icon className="w-7 h-7" />
                </div>

                <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Core Principle Banner: Retrieve First. Answer Second. */}
        <div className="max-w-3xl mx-auto rounded-2xl p-8 text-center shadow-sm relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0369a1 0%, #0891b2 100%)',
            color: 'white',
          }}>
          <div className="relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-widest text-sky-200 block mb-2">
              Foundational Product Principle
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              &ldquo;Retrieve First. Answer Second.&rdquo;
            </div>
            <p className="text-xs sm:text-sm text-sky-100 mt-3 max-w-xl mx-auto leading-relaxed">
              The AI never fabricates or hallucinates clinical information. It extracts knowledge directly from approved hospital documents before formulating any response.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
