export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export async function generateMetadata(): Promise<Metadata> {
  const url = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return {
    metadataBase: new URL(url),
    title: 'Sistema OS - Assistência Técnica',
    description: 'Sistema de gestão de ordens de serviço para assistência técnica de notebooks e desktops',
    icons: { icon: '/favicon.svg', shortcut: '/favicon.svg' },
    openGraph: { images: ['/og-image.png'] },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="escuro" suppressHydrationWarning>
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
