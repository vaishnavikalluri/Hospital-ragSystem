'use client';

import React from 'react';
import Link from 'next/link';
import { Activity, Lock, ArrowRight } from 'lucide-react';

export default function LandingNav() {
  return (
    <header className="w-full bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Brand */}
        <Link href="/" className="flex items-center gap-3 group focus:outline-none">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105"
            style={{ background: 'var(--primary)' }}
          >
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm sm:text-base tracking-tight leading-none text-slate-900">
              Hospital Knowledge Assistant
            </span>
            <span className="text-[10px] font-bold tracking-wider uppercase mt-1 text-sky-700">
              ENTERPRISE CLINICAL RAG
            </span>
          </div>
        </Link>

        {/* Right: Navigation Links & Staff Login */}
        <div className="flex items-center gap-3 sm:gap-6">
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#how-it-works" className="hover:text-sky-700 transition-colors">
              How It Works
            </a>
            <a href="#features" className="hover:text-sky-700 transition-colors">
              Features
            </a>
            <a href="#scope" className="hover:text-sky-700 transition-colors">
              Knowledge Scope
            </a>
            <a href="#preview" className="hover:text-sky-700 transition-colors">
              Live Preview
            </a>
          </nav>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition-all hover:shadow-md hover:bg-sky-800 active:scale-[0.98]"
            style={{ background: 'var(--primary)' }}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Staff Login</span>
            <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
          </Link>
        </div>

      </div>
    </header>
  );
}
