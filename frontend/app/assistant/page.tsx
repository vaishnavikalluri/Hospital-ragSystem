'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, UserSession } from '@/services/api';
import ChatWindow from '@/components/ChatWindow';

export default function AssistantPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session || !session.authorized) {
      router.push('/login');
      return;
    }
    setUser(session);
  }, [router]);

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <ChatWindow />
    </div>
  );
}
