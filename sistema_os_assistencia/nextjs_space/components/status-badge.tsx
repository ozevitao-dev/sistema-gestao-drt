'use client';
import { Clock, PlayCircle, Pause, CheckCircle, XCircle } from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  aberta: { label: 'Aberta', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Clock },
  em_andamento: { label: 'Em Andamento', color: 'text-amber-600 dark:text-yellow-400', bg: 'bg-yellow-500/10', icon: PlayCircle },
  aguardando_peca: { label: 'Aguardando Peça', color: 'text-orange-400', bg: 'bg-orange-500/10', icon: Pause },
  concluida: { label: 'Concluída', color: 'text-green-700', bg: 'bg-green-500/15', icon: CheckCircle },
  cancelada: { label: 'Cancelada', color: 'text-red-400', bg: 'bg-red-500/10', icon: XCircle },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig?.[status] ?? statusConfig['aberta'] ?? { label: status, color: 'text-gray-400', bg: 'bg-gray-500/10', icon: Clock };
  const Icon = config?.icon ?? Clock;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config?.color ?? ''} ${config?.bg ?? ''}`}>
      <Icon className="w-3 h-3" />
      {config?.label ?? status}
    </span>
  );
}

export { statusConfig };
