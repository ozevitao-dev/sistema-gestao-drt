'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard, Users, ClipboardList, BarChart3, DollarSign,
  LogOut, Wrench, Monitor, Menu, X, ChevronRight, Settings, FileText,
  ShoppingBag, Calendar, Sun, Moon
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/orcamentos', label: 'Orçamentos', icon: FileText },
  { href: '/ordens', label: 'Ordens de Serviço', icon: ClipboardList },
  { href: '/vendas/nova', label: 'Nova Venda', icon: ShoppingBag },
  { href: '/atendimentos-remotos', label: 'Atend. Remotos', icon: Monitor },
  { href: '/tecnicos', label: 'Técnicos', icon: Wrench },
  { href: '/financeiro', label: 'Financeiro', icon: DollarSign },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/configuracoes', label: 'Personalização', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession() || {};
  const [open, setOpen] = useState(false);
  const [empresa, setEmpresa] = useState({ nome: '', logo: '' });
  const [tema, setTema] = useState('escuro');

  const toggleTheme = () => {
    const next = tema === 'escuro' ? 'claro' : 'escuro';
    setTema(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('drt-theme', next);
    window.dispatchEvent(new CustomEvent('theme-change', { detail: next }));
  };

  useEffect(() => {
    // Load theme from localStorage first
    const saved = localStorage.getItem('drt-theme');
    if (saved) {
      setTema(saved);
      document.documentElement.setAttribute('data-theme', saved);
    }

    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        if (d && !d.error) {
          setEmpresa({ nome: d.nomeEmpresa || '', logo: d.logoUrl || '' });
        }
      })
      .catch(() => {});

    const handleSettingsChange = () => {
      fetch('/api/settings')
        .then(r => r.json())
        .then(d => {
          if (d && !d.error) {
            setEmpresa({ nome: d.nomeEmpresa || '', logo: d.logoUrl || '' });
          }
        })
        .catch(() => {});
    };
    window.addEventListener('settings-change', handleSettingsChange);
    return () => window.removeEventListener('settings-change', handleSettingsChange);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-bg-secondary rounded-lg shadow-lg"
      >
        <Menu className="w-5 h-5 text-text-primary" />
      </button>

      {open && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-bg-secondary border-r border-border flex flex-col transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-border">
          <button onClick={() => setOpen(false)} className="lg:hidden absolute top-4 right-4">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
          <div className="flex items-center gap-3">
            {empresa.logo ? (
              <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-bg-primary flex-shrink-0">
                <NextImage src={empresa.logo} alt="Logo DRT Informática" fill className="object-contain" unoptimized />
              </div>
            ) : (
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center flex-shrink-0">
                <Wrench className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-bold text-text-primary text-sm truncate">{empresa.nome || 'Sistema OS'}</h1>
              <p className="text-xs text-text-secondary truncate">Assistência Técnica</p>
            </div>
          </div>

        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-accent text-white shadow-lg shadow-accent/20'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-primary'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-4 py-2 mb-3">
            <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
              <Monitor className="w-4 h-4 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{session?.user?.name || 'Usuário'}</p>
              <p className="text-xs text-text-secondary truncate">{session?.user?.email || ''}</p>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-bg-primary transition-colors"
              title={tema === 'escuro' ? 'Modo claro' : 'Modo escuro'}
            >
              {tema === 'escuro' ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
            </button>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
