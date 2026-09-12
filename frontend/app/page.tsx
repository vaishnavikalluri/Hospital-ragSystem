'use client';

import React from 'react';
import LandingNav from '@/components/landing/LandingNav';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import KnowledgeCategoriesSection from '@/components/landing/KnowledgeCategoriesSection';
import AssistantPreviewSection from '@/components/landing/AssistantPreviewSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import TrustSection from '@/components/landing/TrustSection';
import FinalCtaSection from '@/components/landing/FinalCtaSection';
import LandingFooter from '@/components/landing/LandingFooter';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-sky-100 selection:text-sky-900">
      
      {/* Top Header & Navigation */}
      <LandingNav />

      {/* Main Landing Flow */}
      <main className="flex-1">
        {/* 1. Split Hero Section with Product Demonstration Preview beside copy */}
        <HeroSection />

        {/* 2. 6 Core Capabilities Feature Cards */}
        <FeaturesSection />

        {/* 3. Knowledge Base Scope: Clinical, Drug, and Policy */}
        <KnowledgeCategoriesSection />

        {/* 4. 3-Step Workflow & "Retrieve First. Answer Second." Principle */}
        <HowItWorksSection />

        {/* 5. Built for Reliable Hospital Knowledge & Traceability */}
        <TrustSection />

        {/* 6. Strong Bottom Action CTA */}
        <FinalCtaSection />
      </main>

      {/* Professional Footer */}
      <LandingFooter />

    </div>
  );
}
