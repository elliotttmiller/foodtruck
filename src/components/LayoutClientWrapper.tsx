'use client';

import React from 'react';
import { Analytics as VercelAnalytics } from '@vercel/analytics/react';
import Analytics from '@/components/Analytics';
import PageTransitionWrapper from '@/components/PageTransitionWrapper';

export default function LayoutClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <VercelAnalytics />
      <Analytics />
      <PageTransitionWrapper>{children}</PageTransitionWrapper>
    </>
  );
}
