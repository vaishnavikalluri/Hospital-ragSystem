'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearSession, getSession, UserSession } from '@/services/api';
import { Activity, BookOpen, Bot, LayoutDashboard, LogOut, ShieldAlert } from 'lucide-react';

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    setUser(getSession());
  }, [pathname]);

  // Hide navbar on login and home page
  if (pathname === '/login' || pathname === '/') return null;

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Assistant', path: '/assistant', icon: Bot },
    { name: 'Documents', path: '/documents', icon: BookOpen },
  ];

  if (user?.is_admin) {
    navItems.push({ name: 'Admin', path: '/admin', icon: ShieldAlert });
  }

  return (
    <header className="sticky top-0 z-50" style={{
      background: 'white',
      borderBottom: '1px solid var(--border)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 group" id="nav-logo">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105"
              style={{ background: 'var(--primary)' }}>
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <span className="font-bold text-base block" style={{ color: 'var(--text)' }}>Hospital AI</span>
              <span className="text-xs font-medium block" style={{ color: 'var(--primary)' }}>Knowledge Assistant</span>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  id={`nav-${item.name.toLowerCase()}`}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info + logout */}
          {user && (
            <div className="flex items-center gap-4 pl-4" style={{ borderLeft: '1px solid var(--border)' }}>
              <div className="text-right hidden sm:block">
                <span className="text-sm font-semibold block" style={{ color: 'var(--text)' }}>{user.name}</span>
                <span className="text-xs font-mono flex items-center gap-1 justify-end" style={{ color: 'var(--text-3)' }}>
                  {user.hospital_id}
                  {user.is_admin && (
                    <span className="badge badge-amber ml-1">ADMIN</span>
                  )}
                </span>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                id="nav-logout-btn"
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--text-3)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fff1f2';
                  e.currentTarget.style.color = '#e11d48';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-3)';
                }}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
