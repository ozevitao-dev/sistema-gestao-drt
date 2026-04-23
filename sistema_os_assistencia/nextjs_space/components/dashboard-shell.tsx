'use client';
import { ReactNode } from 'react';
import Sidebar from '@/components/sidebar';

export default function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg-primary">
      <Sidebar />
      <main className="flex-1 lg:ml-0 overflow-auto">
        <div className="max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
