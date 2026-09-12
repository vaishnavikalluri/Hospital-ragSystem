'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ChevronDown,
  ShieldCheck,
  Sparkles,
  Database,
  FileCheck,
  FileText,
  Bot,
  User,
  CheckCircle2,
  Hash,
  ArrowRightCircle,
} from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative pt-8 pb-14 md:pt-12 md:pb-20 overflow-hidden bg-gradient-to-b from-slate-50/50 via-white to-white">
      
      {/* Subtle Background Glow & Medical Grid Pattern */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden" aria-hidden="true">
        {/* Subtle radial glow */}
        <div
          className="absolute -top-24 left-1/4 w-[500px] h-[350px] opacity-30 blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(3, 105, 161, 0.14) 0%, rgba(8, 145, 178, 0.05) 60%, transparent 80%)',
          }}
        />
        <div
          className="absolute top-1/2 -right-16 w-[400px] h-[400px] opacity-20 blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(14, 165, 233, 0.12) 0%, transparent 70%)',
          }}
        />
        {/* Very soft grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(#0369a1 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* ── Left Column: Value Proposition & CTAs (~50% width) ───── */}
          <div className="lg:col-span-6 flex flex-col text-left">
            
            {/* 3. Hero Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-5 border shadow-sm self-start"
              style={{ background: '#f0f9ff', borderColor: '#bae6fd', color: '#0369a1' }}>
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>AI-Powered · RAG · Grounded Answers</span>
            </div>

            {/* 4. Hero Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight leading-[1.15] mb-5 text-slate-900">
              Hospital Knowledge
              <span className="block mt-1" style={{ color: 'var(--primary)' }}>
                at Your Fingertips
              </span>
            </h1>

            {/* 5. Hero Description */}
            <p className="text-sm sm:text-base leading-relaxed mb-7 max-w-[560px] text-slate-600">
              Instantly access clinical protocols, drug interaction guidelines, and policy circulars.
              Every answer is grounded in verified hospital documents — with source citations.
            </p>

            {/* 6. Hero Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mb-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm text-white shadow-sm transition-all hover:shadow-md hover:bg-sky-800 active:scale-[0.98]"
                style={{ background: 'var(--primary)' }}
              >
                <span>Enter Hospital ID</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm transition-all hover:bg-slate-50 text-slate-700 bg-white border border-slate-200"
              >
                <span>Explore How It Works</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </a>
            </div>

            {/* 7. Security Message */}
            <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 mb-8">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Authorized hospital staff only · No signup required</span>
            </div>

            {/* 8. Hero Trust Indicators with Vertical Dividers */}
            <div className="grid grid-cols-3 max-w-lg py-4 px-2 rounded-xl bg-slate-50/80 border border-slate-200/80 divide-x divide-slate-200">
              
              <div className="flex items-center gap-2.5 px-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-sky-50 text-sky-700 border border-sky-200">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 leading-tight">Hospital Docs</div>
                  <div className="text-[10.5px] text-slate-500">Internal Base</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 px-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 leading-tight">Grounded Answers</div>
                  <div className="text-[10.5px] text-slate-500">Document-based</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 px-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-purple-50 text-purple-700 border border-purple-200">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 leading-tight">Exact Citations</div>
                  <div className="text-[10.5px] text-slate-500">Page & Section</div>
                </div>
              </div>

            </div>

          </div>

          {/* ── Right Column: Assistant Preview Snapshot (~50% width) ── */}
          <div id="preview" className="lg:col-span-6 scroll-mt-20">
            
            {/* 9. Main Visual Card Container */}
            <div className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-lg transition-all duration-300 hover:shadow-xl">
              
              {/* 10. Assistant Preview Header */}
              <div className="px-4 py-3 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-sky-700 text-white shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 leading-none">
                      <span>Clinical Knowledge Assistant</span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        RAG Active
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">Staff ID: H001</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/70">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Grounded Response</span>
                </div>
              </div>

              {/* Messages Area */}
              <div className="p-4 sm:p-5 space-y-4 bg-[#f8fafc]/40">
                
                {/* 11. User Question Bubble */}
                <div className="flex items-start justify-end gap-2.5">
                  <div className="max-w-md p-3.5 rounded-2xl rounded-tr-sm bg-sky-700 text-white text-xs leading-relaxed shadow-sm">
                    What are the emergency response priority levels and response time requirements in protocol TEST-ER-001?
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* 12. AI Grounded Answer Card */}
                <div className="flex items-start justify-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-sky-700 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex-1 p-4 rounded-2xl rounded-tl-sm bg-white border border-slate-200 text-xs leading-relaxed text-slate-800 shadow-sm space-y-3">
                    
                    {/* Verification Badge */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10.5px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Answer grounded in hospital documents (2 chunks retrieved)</span>
                    </div>

                    <div className="space-y-2 text-slate-700 text-[11.5px]">
                      <p>
                        According to <strong className="text-slate-900 font-semibold">TEST-ER-001 (Emergency Response Protocol)</strong>, emergency triage is structured into four response priority tiers:
                      </p>
                      
                      <div className="pl-3 border-l-2 border-sky-500 space-y-1 text-[11px] text-slate-700 bg-slate-50/80 py-1.5 rounded-r-md">
                        <p><strong className="text-slate-900 font-semibold">Level 1 (Immediate / Red):</strong> Resuscitation required in <strong className="text-slate-900">0 minutes</strong>.</p>
                        <p><strong className="text-slate-900 font-semibold">Level 2 (Urgent / Yellow):</strong> Evaluation required within <strong className="text-slate-900">15 minutes</strong>.</p>
                        <p><strong className="text-slate-900 font-semibold">Level 3 (Semi-Urgent / Green):</strong> Assessment within <strong className="text-slate-900">60 minutes</strong>.</p>
                        <p><strong className="text-slate-900 font-semibold">Level 4 (Non-Urgent / Blue):</strong> Evaluation within <strong className="text-slate-900">120 minutes</strong>.</p>
                      </div>
                    </div>

                    {/* 13. Citation Design */}
                    <div className="pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold text-sky-800 uppercase tracking-wider">
                        <FileText className="w-3 h-3 text-sky-600" />
                        <span>VERIFIED CITATIONS (2)</span>
                      </div>

                      <div className="space-y-1.5 text-[11px]">
                        
                        <div className="p-2 rounded-lg bg-sky-50/60 border border-sky-100 flex items-center justify-between gap-2">
                          <div className="min-w-0 flex items-start gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-800 block truncate">Emergency_Response_Protocol_Test.pdf</span>
                              <span className="text-[10px] text-slate-500 block truncate">Section 4.1: Triage Classification Tiers</span>
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center gap-0.5 text-sky-700 font-bold text-[10px] bg-white px-2 py-0.5 rounded border border-sky-200">
                            <Hash className="w-2.5 h-2.5" /> Page 2
                          </div>
                        </div>

                        <div className="p-2 rounded-lg bg-sky-50/60 border border-sky-100 flex items-center justify-between gap-2">
                          <div className="min-w-0 flex items-start gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-800 block truncate">Emergency_Response_Protocol_Test.pdf</span>
                              <span className="text-[10px] text-slate-500 block truncate">Section 4.3: Escalation Notification Matrix</span>
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center gap-0.5 text-sky-700 font-bold text-[10px] bg-white px-2 py-0.5 rounded border border-sky-200">
                            <Hash className="w-2.5 h-2.5" /> Page 3
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>
                </div>

              </div>

              {/* 14 & 15. Fixed Pipeline Footer (No LaTeX bug, real arrows) */}
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
                
                {/* Pipeline Stages */}
                <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="text-slate-800 font-semibold">Retrieve First</span>
                  <span className="text-sky-600 font-bold">→</span>
                  <span className="text-slate-800 font-semibold">Grounded Answer</span>
                  <span className="text-sky-600 font-bold">→</span>
                  <span className="text-slate-800 font-semibold">Exact Citations</span>
                </div>

                {/* Try Demo link */}
                <Link
                  href="/login"
                  className="font-semibold text-sky-700 hover:text-sky-800 flex items-center gap-1 transition-colors shrink-0"
                >
                  <span>Try Demo</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>

              </div>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}
