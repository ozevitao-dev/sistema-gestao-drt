'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ClipboardList, Plus, Search, Loader2, Monitor, Laptop, Filter, X, Trash2, Download, FileSpreadsheet } from 'lucide-react';
import StatusBadge from '@/components/status-badge';
import { exportToCSV, exportListToPDF, Column } from '@/lib/list-export';

export default function OrdensPage() {
  const [ordens, setOrdens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchOrdens = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (dataInicio) params.set('dataInicio', dataInicio);
      if (dataFim) params.set('dataFim', dataFim);
      const res = await fetch(`/api/ordens?${params.toString()}`);
      const data = await res.json();
      setOrdens(Array.isArray(data) ? data : []);
    } catch (e: any) { console.error(e); }
    setLoading(false);
  }, [search, statusFilter, dataInicio, dataFim]);

  useEffect(() => { fetchOrdens(); }, [fetchOrdens]);

  const clearFilters = () => {
    setStatusFilter('');
    setDataInicio('');
    setDataFim('');
  };

  const handleDelete = async (osId: string) => {
    setDeletingId(osId);
    try {
      const res = await fetch(`/api/ordens/${osId}`, { method: 'DELETE' });
      if (res.ok) {
        setOrdens(prev => prev.filter(o => o.id !== osId));
      }
    } catch (e) { console.error(e); }
    setDeletingId(null);
    setConfirmDeleteId(null);
  };

  const statusLabels: Record<string, string> = { aberta: 'Aberta', em_andamento: 'Em Andamento', aguardando_peca: 'Aguardando Peça', concluida: 'Concluída', cancelada: 'Cancelada' };
  const exportColumns: Column[] = [
    { key: 'numero', label: 'Nº OS' },
    { key: 'cliente.nome', label: 'Cliente' },
    { key: 'tipoEquipamento', label: 'Tipo' },
    { key: 'marca', label: 'Marca', format: v => v || '' },
    { key: 'modelo', label: 'Modelo', format: v => v || '' },
    { key: 'status', label: 'Status', format: v => statusLabels[v] || v },
    { key: 'valorTotal', label: 'Valor (R$)', format: v => (v ?? 0).toFixed(2).replace('.', ',') },
    { key: 'tecnico.name', label: 'Técnico', format: v => v || 'N/A' },
    { key: 'createdAt', label: 'Data', format: v => v ? new Date(v).toLocaleDateString('pt-BR') : '' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-accent" /> Ordens de Serviço
          </h1>
          <p className="text-text-secondary mt-1">Gerencie todas as ordens de serviço</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {ordens.length > 0 && (
            <>
              <button onClick={() => exportToCSV(ordens, exportColumns, 'ordens-servico')} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-all">
                <FileSpreadsheet className="w-3.5 h-3.5" /> CSV
              </button>
              <button onClick={() => exportListToPDF('Ordens de Serviço', ordens, exportColumns, 'ordens-servico')} className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-all">
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
            </>
          )}
          <Link href="/ordens/nova" className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-light text-white rounded-xl font-medium transition-all shadow-lg shadow-accent/20">
            <Plus className="w-4 h-4" /> Nova OS
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Buscar por número, cliente, marca, modelo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm bg-bg-secondary"
          />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm transition-all ${showFilters ? 'bg-accent text-white border-accent' : 'bg-bg-secondary text-text-secondary border-border hover:border-accent'}`}>
          <Filter className="w-4 h-4" /> Filtros
        </button>
      </div>

      {showFilters && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-bg-secondary rounded-xl p-4 shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border text-sm">
                <option value="">Todos</option>
                <option value="aberta">Aberta</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="aguardando_peca">Aguardando Peça</option>
                <option value="concluida">Concluída</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Data Início</label>
              <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border text-sm" />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Data Fim</label>
              <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border text-sm" />
            </div>
          </div>
          {(statusFilter || dataInicio || dataFim) && (
            <button onClick={clearFilters} className="mt-3 text-sm text-red-400 hover:text-red-300 flex items-center gap-1">
              <X className="w-3 h-3" /> Limpar filtros
            </button>
          )}
        </motion.div>
      )}

      {/* Delete confirmation */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDeleteId(null)}>
          <div className="bg-bg-secondary rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-text-primary mb-2">Confirmar Exclusão</h3>
            <p className="text-text-secondary text-sm mb-6">
              Tem certeza que deseja excluir a <strong>OS #{ordens.find(o => o.id === confirmDeleteId)?.numero}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:bg-bg-primary transition-colors">
                Cancelar
              </button>
              <button onClick={() => handleDelete(confirmDeleteId)} disabled={!!deletingId} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50">
                {deletingId === confirmDeleteId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
      ) : (ordens?.length ?? 0) === 0 ? (
        <div className="text-center py-12 text-text-secondary">Nenhuma OS encontrada</div>
      ) : (
        <div className="grid gap-3">
          {(ordens ?? [])?.map?.((os: any, i: number) => (
            <motion.div
              key={os?.id ?? i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <div className="bg-bg-secondary rounded-xl p-4 shadow-lg shadow-black/10 hover:shadow-xl hover:bg-bg-card transition-all flex items-center gap-3">
                <Link href={`/ordens/${os?.id ?? ''}`} className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      {os?.tipoEquipamento === 'desktop' ? <Monitor className="w-5 h-5 text-accent" /> : <Laptop className="w-5 h-5 text-accent" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-text-primary">OS #{os?.numero ?? ''}</span>
                        <span className="text-sm text-text-secondary">- {os?.cliente?.nome ?? 'N/A'}</span>
                      </div>
                      <p className="text-sm text-text-secondary truncate mt-0.5">
                        {os?.marca ?? ''} {os?.modelo ?? ''} {os?.marca || os?.modelo ? '|' : ''} {os?.descricaoProblema ?? ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium text-text-primary">R$ {(os?.valorTotal ?? 0)?.toFixed?.(2)?.replace('.', ',') ?? '0,00'}</p>
                      <p className="text-xs text-text-secondary">{os?.tecnico?.name ?? 'Sem técnico'}</p>
                    </div>
                    <StatusBadge status={os?.status ?? 'aberta'} />
                  </div>
                </Link>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDeleteId(os?.id); }}
                  className="p-2 rounded-lg text-text-secondary hover:bg-red-500/10 hover:text-red-400 transition-colors flex-shrink-0"
                  title="Excluir OS"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )) ?? []}
        </div>
      )}
    </div>
  );
}
