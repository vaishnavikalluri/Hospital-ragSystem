'use client';

import React from 'react';
import { Bot, User, CheckCircle2, FileText, Hash, ShieldCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AssistantPreviewSection() {
  return (
    <section id="demo" className="py-16 md:py-24 border-t border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 inline-block mb-3">
            Product Demonstration
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4" style={{ color: 'var(--text)' }}>
            See Grounded Answers in Action
          </h2>
          <p className="text-base sm:text-lg leading-relaxed" style={{ color: 'var(--text-2)' }}>
            Ask a question. Retrieve the right evidence. Get an answer you can verify.
          </p>
        </div>

        {/* Pipeline Bar */}
        <div className="max-w-4xl mx-auto mb-8 p-3 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-semibold">
            <div className="py-2 px-3 rounded-xl bg-slate-50 text-slate-700 border border-slate-200/70 flex items-center justify-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-800 text-[10px] font-bold flex items-center justify-center">1</span>
              <span>Question</span>
            </div>
            <div className="py-2 px-3 rounded-xl bg-sky-50 text-sky-800 border border-sky-200 flex items-center justify-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-sky-200 text-sky-800 text-[10px] font-bold flex items-center justify-center">2</span>
              <span>RAG Retrieval</span>
            </div>
            <div className="py-2 px-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-800 text-[10px] font-bold flex items-center justify-center">3</span>
              <span>Grounded Answer</span>
            </div>
            <div className="py-2 px-3 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 flex items-center justify-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-purple-200 text-purple-800 text-[10px] font-bold flex items-center justify-center">4</span>
              <span>Exact Citations</span>
            </div>
          </div>
        </div>

        {/* Interactive-looking Chat UI Window Preview */}
        <div className="max-w-4xl mx-auto rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-xl">
          
          {/* Mock Window Top Bar */}
          <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-sky-600 text-white shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span>Hospital Knowledge Assistant</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    RAG Active
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">Authenticated Session · Staff ID: H001 (Dr. Rahul Sharma)</div>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Grounded in Hospital Docs</span>
            </div>
          </div>

          {/* Mock Messages Content */}
          <div className="p-6 sm:p-8 space-y-6 bg-[#f8fafc]/50">
            
            {/* User Message */}
            <div className="flex items-start justify-end gap-3">
              <div className="max-w-xl p-4 rounded-2xl rounded-tr-sm bg-sky-700 text-white text-xs sm:text-sm leading-relaxed shadow-sm">
                What are the emergency response priority levels and response time requirements in protocol TEST-ER-001?
              </div>
              <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            </div>

            {/* Assistant Grounded Response */}
            <div className="flex items-start justify-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>

              <div className="max-w-2xl p-5 rounded-2xl rounded-tl-sm bg-white border border-slate-200 text-xs sm:text-sm leading-relaxed text-slate-800 shadow-sm space-y-4">
                
                {/* Evidence Tag */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Answer grounded in hospital documentation (2 relevant chunks retrieved)</span>
                </div>

                <div className="space-y-2.5 text-slate-700">
                  <p>
                    According to <strong className="text-slate-900 font-semibold">TEST-ER-001 (Emergency Response Protocol)</strong>, the hospital classifies emergency priority into four standardized triage alert tiers:
                  </p>
                  
                  <div className="pl-3 border-l-2 border-sky-500 space-y-1.5 text-xs text-slate-700 bg-slate-50/60 py-2 rounded-r-lg">
                    <p><strong className="text-slate-900 font-semibold">1. Level 1 (Immediate / Red):</strong> Critical life-threatening emergencies requiring resuscitation within <strong className="text-slate-900">0 minutes</strong>.</p>
                    <p><strong className="text-slate-900 font-semibold">2. Level 2 (Urgent / Yellow):</strong> Severe instability or high-risk conditions requiring evaluation within <strong className="text-slate-900">15 minutes</strong>.</p>
                    <p><strong className="text-slate-900 font-semibold">3. Level 3 (Semi-Urgent / Green):</strong> Clinically stable patients requiring assessment within <strong className="text-slate-900">60 minutes</strong>.</p>
                    <p><strong className="text-slate-900 font-semibold">4. Level 4 (Non-Urgent / Blue):</strong> Routine or minor presentations evaluated within <strong className="text-slate-900">120 minutes</strong>.</p>
                  </div>

                  <p className="text-xs text-slate-600">
                    All emergency priority assignments must be recorded in the charge nurse registry upon admission.
                  </p>
                </div>

                {/* Source Citations Box */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold text-sky-800 uppercase tracking-wider">
                    <FileText className="w-3.5 h-3.5 text-sky-600" />
                    <span>Verified Source Citations (2)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-sky-50/70 border border-sky-100 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-sky-700 mr-1.5">[1]</span>
                        <span className="font-medium text-slate-800 truncate block">Emergency_Response_Protocol_Test.pdf</span>
                        <span className="text-[11px] text-slate-500 block">Section 4.1: Triage Tiers</span>
                      </div>
                      <div className="shrink-0 flex items-center text-sky-700 font-bold text-[11px]">
                        <Hash className="w-3 h-3" /> Page 2
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-sky-50/70 border border-sky-100 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-sky-700 mr-1.5">[2]</span>
                        <span className="font-medium text-slate-800 truncate block">Emergency_Response_Protocol_Test.pdf</span>
                        <span className="text-[11px] text-slate-500 block">Section 4.3: Response Escalation</span>
                      </div>
                      <div className="shrink-0 flex items-center text-sky-700 font-bold text-[11px]">
                        <Hash className="w-3 h-3" /> Page 3
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Bottom Bar CTA inside Mockup */}
          <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 text-center sm:text-left">
              Try querying actual clinical protocols and drug guidelines with your staff account.
            </span>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-white bg-sky-700 hover:bg-sky-800 transition-colors shrink-0"
            >
              <span>Try with Hospital ID</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
}
