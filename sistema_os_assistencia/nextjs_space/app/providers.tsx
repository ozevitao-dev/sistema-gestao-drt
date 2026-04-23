'use client';
import { SessionProvider } from 'next-auth/react';
import { useState, useEffect, ReactNode, useCallback } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [tema, setTema] = useState('escuro');

  const applyTheme = useCallback((t: string) => {
    setTema(t);
    document.documentElement.setAttribute('data-theme', t);
  }, []);

  useEffect(() => {
    // Load theme from localStorage first, then fallback to API
    const saved = typeof window !== 'undefined' ? localStorage.getItem('drt-theme') : null;
    if (saved) {
      applyTheme(saved);
      setMounted(true);
    }

    fetch('/api/settings')
      .then(r => {
        if (!r.ok) return null;
        return r.json();
      })
      .then(d => {
        // Only use API theme if no localStorage override
        if (d?.tema && !localStorage.getItem('drt-theme')) applyTheme(d.tema);
      })
      .catch(() => {
        // fallback silently
      })
      .finally(() => setMounted(true));

    // Listen for theme changes from settings page
    const handleThemeChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) applyTheme(detail);
    };
    window.addEventListener('theme-change', handleThemeChange);
    return () => window.removeEventListener('theme-change', handleThemeChange);
  }, [applyTheme]);

  // Set initial data-theme to avoid flash
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);
  }, [tema]);

  return (
    <SessionProvider>
      <div style={mounted ? undefined : { visibility: 'hidden' }}>
        {children}
      </div>
    </SessionProvider>
  );
}
