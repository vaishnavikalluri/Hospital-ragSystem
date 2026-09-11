'use client';

import Link from 'next/link';
import { Activity, ShieldCheck, BookOpen, Bot, ArrowRight, Search, FileText, CheckCircle2, Zap, Lock } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 md:py-28">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div style={{
            position: 'absolute', top: '-80px', right: '-120px',
            width: '600px', height: '600px',
            background: 'radial-gradient(circle, rgba(3,105,161,0.07) 0%, transparent 70%)',
            borderRadius: '50%',
          }} />
          <div style={{
            position: 'absolute', bottom: '-60px', left: '-80px',
            width: '400px', height: '400px',
            background: 'radial-gradient(circle, rgba(8,145,178,0.05) 0%, transparent 70%)',
            borderRadius: '50%',
          }} />
        </div>

        <div className="relative text-center max-w-4xl mx-auto px-4 animate-fade-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 badge badge-blue mb-6 py-1.5 px-4">
            <Zap className="w-3.5 h-3.5" />
            <span>AI-Powered · RAG · Grounded Answers</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6" style={{ color: 'var(--text)' }}>
            Hospital Knowledge
            <span className="block" style={{ color: 'var(--primary)' }}>
              at Your Fingertips
            </span>
          </h1>

          <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto" style={{ color: 'var(--text-2)' }}>
            Instantly access clinical protocols, drug interaction guidelines, and policy circulars.
            Every answer is grounded in verified hospital documents — with source citations.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login" className="btn-primary text-base px-8 py-3.5">
              Staff Login
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="btn-outline text-base px-8 py-3.5">
              <Lock className="w-4 h-4" />
              Enter Hospital ID
            </Link>
          </div>

          {/* Auth note */}
          <p className="mt-5 text-sm" style={{ color: 'var(--text-3)' }}>
            <ShieldCheck className="w-4 h-4 inline mr-1 text-green-500" />
            No signup needed — just enter your assigned Hospital ID to continue.
          </p>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 animate-fade-up-1">
            <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: 'var(--text)' }}>
              Why Hospital Knowledge Assistant?
            </h2>
            <p className="text-base" style={{ color: 'var(--text-2)' }}>
              Built specifically for hospital staff who need fast, reliable, evidence-backed answers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-up-2">
            {[
              {
                icon: Search,
                color: '#0369a1',
                bg: '#dbeafe',
                title: 'RAG-Powered Search',
                desc: 'Retrieves the most relevant document chunks before generating any answer. No hallucinations — only what is in your documents.',
              },
              {
                icon: FileText,
                color: '#0891b2',
                bg: '#cffafe',
                title: 'Source Citations',
                desc: 'Every answer comes with exact source citations — document name, page number, and section — so staff can verify instantly.',
              },
              {
                icon: ShieldCheck,
                color: '#15803d',
                bg: '#dcfce7',
                title: 'Authorized Access Only',
                desc: 'Only verified hospital staff with a valid Hospital ID can access the system. No public access, no data leakage.',
              },
              {
                icon: Bot,
                color: '#7c3aed',
                bg: '#ede9fe',
                title: 'Conversational AI',
                desc: 'Ask follow-up questions in natural language. The assistant remembers your conversation context automatically.',
              },
              {
                icon: BookOpen,
                color: '#b45309',
                bg: '#fef3c7',
                title: 'Multi-Category Knowledge',
                desc: 'Covers clinical protocols, drug interaction guidelines, and policy circulars. Filter by category for precise results.',
              },
              {
                icon: CheckCircle2,
                color: '#0369a1',
                bg: '#dbeafe',
                title: 'Honest Refusals',
                desc: 'When the answer cannot be found in hospital documents, the assistant clearly says so — never invents information.',
              },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="card p-6">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: f.bg }}>
                    <Icon className="w-5 h-5" style={{ color: f.color }} />
                  </div>
                  <h3 className="font-bold text-base mb-2" style={{ color: 'var(--text)' }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: 'white', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-4xl mx-auto text-center animate-fade-up-3">
          <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: 'var(--text)' }}>How It Works</h2>
          <p className="text-base mb-12" style={{ color: 'var(--text-2)' }}>Three simple steps to get grounded clinical answers.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: Lock, title: 'Enter Hospital ID', desc: 'Type your assigned Hospital ID. No password or signup required — the system verifies your ID from the staff registry.' },
              { step: '02', icon: Bot, title: 'Ask a Question', desc: 'Type any clinical question in natural language — about protocols, drug interactions, or hospital policies.' },
              { step: '03', icon: CheckCircle2, title: 'Get Grounded Answer', desc: 'Receive a precise, evidence-backed answer with citations showing exactly which document and page it came from.' },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className="relative mb-5">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md"
                      style={{ background: 'var(--primary)', color: 'white' }}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center"
                      style={{ background: '#0ea5e9', color: 'white' }}>{s.step}</span>
                  </div>
                  <h3 className="font-bold text-base mb-2" style={{ color: 'var(--text)' }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center card p-10">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: '#dbeafe' }}>
            <Activity className="w-7 h-7" style={{ color: 'var(--primary)' }} />
          </div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text)' }}>
            Ready to access the knowledge base?
          </h2>
          <p className="mb-8" style={{ color: 'var(--text-2)' }}>
            Authorized hospital staff can log in instantly with their Hospital ID.
          </p>
          <Link href="/login" className="btn-primary text-base px-8 py-3.5">
            Go to Staff Login
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="py-8 px-4 text-center" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-3)', fontSize: '0.85rem' }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Activity className="w-4 h-4" style={{ color: 'var(--primary)' }} />
          <span className="font-semibold" style={{ color: 'var(--text-2)' }}>Hospital Knowledge Assistant</span>
        </div>
        <p>Authorized staff portal · Grounded AI · Source-cited answers</p>
      </footer>

    </div>
  );
}
